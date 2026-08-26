// Ops notification relay for the gen8r.ai signup + contact forms.
//
// This endpoint used to be an unauthenticated public relay into the ops
// Telegram. In Aug 2026 a form-spam bot driving a real headless browser used it
// — and, via the signup form's second request, app.gen8r.ai/api/signup — to
// fire brand-activation emails at scraped third-party addresses. That is a
// subscription-bombing pattern: the victims are the mailbox owners, and the
// cost to us is sending-domain reputation.
//
// Defence layers, in order of how load-bearing they actually are:
//   1. Cloudflare Turnstile — the real one. Hard 403 on failure.
//   2. Honeypot            — silent drop, effectively zero false-positive risk.
//   3. Heuristic score     — catches an adapted bot. Scored, never absolute.
//
// Anything caught by (2) or (3) gets a normal 200 with no Telegram ping, so the
// operator can't tell which signal caught them and tune around it. Only a
// genuine challenge failure returns an error, because a real user whose
// challenge expired needs to know to retry.

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const ALLOWED_ORIGINS = ['https://gen8r.ai', 'https://www.gen8r.ai'];

// Score at or above which a submission is treated as spam. Calibrated against
// the observed attack, which scores 7 (gibberish name + company + website, plus
// geo mismatch) — comfortably over. A single odd-looking signal on an otherwise
// real lead scores 2 and passes. See scoreSubmission() for the weights.
const SPAM_THRESHOLD = 4;

// Backend signup endpoint. The browser must NOT call this directly — it only
// accepts requests carrying X-Signup-Proxy-Secret (instagrammer#409).
const SIGNUP_BACKEND_URL = process.env.SIGNUP_BACKEND_URL || 'https://app.gen8r.ai/api/signup';

// The backend forward is on the customer's critical path, so it gets a real
// timeout. The ops notification is not, so it gets a short one — ops visibility
// is never worth making a customer wait.
const BACKEND_TIMEOUT_MS = 10000;
const TELEGRAM_TIMEOUT_MS = 5000;

// Fallback channel when Telegram is unreachable. The from-address must be on a
// domain verified in Resend — gen8r.ai is verified (DKIM selector `resend`,
// with send.gen8r.ai as the return path).
const SUPPORT_ALERT_TO = process.env.SUPPORT_ALERT_TO || 'support@gen8r.ai';
const SUPPORT_ALERT_FROM = process.env.SUPPORT_ALERT_FROM || 'gen8r alerts <noreply@gen8r.ai>';

// ── Detection helpers ────────────────────────────────────────────────────────

// Crude detector for machine-generated strings: "Jkfcklcg Ynkqbhf",
// "Dxkptogkxc LLC", "rpyxvye.com".
//
// IMPORTANT: this is a score input and must never block on its own. Consonant-
// dense names are perfectly legitimate in Polish, Czech, Welsh and others —
// "Krzysztof Wrzeszcz" trips this. At +2 against a threshold of 4 that's
// harmless; promoted to a hard rule it would reject real people by ethnicity.
function looksLikeMash(str) {
  const w = String(str || '').toLowerCase().replace(/[^a-z]/g, '');
  if (w.length < 5) return false;
  const vowels = (w.match(/[aeiouy]/g) || []).length;
  return vowels / w.length < 0.25 || /[bcdfghjklmnpqrstvwxz]{5,}/.test(w);
}

// Real enquiries contain whitespace. The observed spam posts single unbroken
// tokens ("CrFJRFMzfrZiKYWpkXS") or bare digit strings ("5227342580").
function junkMessage(message) {
  const m = String(message || '').trim();
  if (m.length < 12) return false;   // genuinely terse messages are fine
  if (/\s/.test(m)) return false;
  // A bare URL or email address pasted as the entire message is legitimate —
  // people do exactly this when asking "can you look at my site".
  if (/^(https?:\/\/|www\.)\S+$/i.test(m)) return false;
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(m)) return false;
  return true;
}

// Random-string detector for single-token messages, independent of language:
// machine noise like "wVdXFXjLWReVqewKCde" flips case constantly, real words
// and URLs don't. Bare digit strings ("5227342580") count too.
function randomToken(message) {
  const m = String(message || '').trim();
  if (m.length < 10 || /\s/.test(m)) return false;
  if (/^\d+$/.test(m)) return true;
  let transitions = 0;
  for (let i = 1; i < m.length; i++) {
    const prev = m[i - 1];
    const cur = m[i];
    if ((/[a-z]/.test(prev) && /[A-Z]/.test(cur)) || (/[A-Z]/.test(prev) && /[a-z]/.test(cur))) {
      transitions++;
    }
  }
  return transitions >= 4;
}

// Do two strings share a meaningful root? Used to tell a coherent identity
// ("Krzysztof Wrzeszcz" / "Wrzeszcz Consulting" / wrzeszcz.pl) apart from
// randomly-generated fields that have nothing to do with each other
// ("Davgz Canmgoxh" / "Vftbmzyqkg LLC" / swrtspjxq.com).
//
// This is the fix for the linguistic checks below being biased: a real person
// whose name looks consonant-dense to an English-tuned heuristic almost always
// has that same name in their company and domain. Random spam never does.
function sharesRoot(a, b, min = 4) {
  const A = String(a || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const B = String(b || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (A.length < min || B.length < min) return false;
  for (let i = 0; i + min <= A.length; i++) {
    if (B.includes(A.slice(i, i + min))) return true;
  }
  return false;
}

function domainLabel(url) {
  if (!url) return '';
  try {
    const host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
    return host.replace(/^www\./, '').split('.')[0];
  } catch {
    return '';
  }
}

function junkDomain(url) {
  if (!url) return false;
  let host;
  try {
    host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return false;
  }
  return looksLikeMash(host.replace(/^www\./, '').split('.')[0]);
}

// Gmail ignores dots and anything after '+', so k.ca.r.d1.223@gmail.com and
// kcard1223@gmail.com are the same inbox — two of the observed spam addresses
// use exactly this trick. Normalise before any dedupe or per-email limit,
// otherwise one account defeats the counting for free.
function normalizeEmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  local = local.split('+')[0];
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : String(fwd || '')).split(',')[0].trim();
}

function scoreSubmission(data, req) {
  const reasons = [];
  let score = 0;
  const add = (n, why) => { score += n; reasons.push(`${why}(+${n})`); };

  if (junkMessage(data.message)) add(3, 'message-no-whitespace');
  if (randomToken(data.message)) add(2, 'message-random-token');

  // Strip the legal suffix first — every observed company was "<mash> LLC",
  // and "LLC" on its own is vowel-poor enough to skew the ratio.
  const company = String(data.companyName || '').replace(/\b(llc|inc|ltd|pty|gmbh|bv|srl)\b/gi, '');
  const label = domainLabel(data.companyUrl);

  // If name, company and domain hang together, this is a real identity and the
  // English-tuned gibberish checks below would just be punishing a non-English
  // name. Suppress them entirely rather than trying to tune the language model.
  const coherent = sharesRoot(data.name, company)
    || sharesRoot(data.name, label)
    || sharesRoot(company, label);

  if (!coherent) {
    if (looksLikeMash(data.name)) add(2, 'name-gibberish');
    if (looksLikeMash(company)) add(2, 'company-gibberish');
    if (junkDomain(data.companyUrl)) add(2, 'website-gibberish');

    // Language-neutral structural signal: a real small business's domain
    // usually resembles its name, and every observed spam signup paired an
    // unrelated company with an unrelated domain.
    //
    // Only +2, deliberately. Plenty of legitimate signups mismatch here — a
    // personal domain that redirects, a parent-company domain, a Facebook page
    // or Linktree URL, or simply trading under a different name to the legal
    // entity. A real "Lift Logic AI" / vishwam.info signup scored 3 of 4 when
    // this was +3, which is far too close for a signal this common.
    if (company && label) add(2, 'brand-domain-mismatch');
  }

  // Vercel injects geo headers derived from the client IP. Every observed spam
  // submission claimed AU — the signup form's default option, which the bot
  // never changes — while routing through a US edge region. VPNs and travelling
  // customers make this weak on its own, hence only +1.
  const ipCountry = String(req.headers['x-vercel-ip-country'] || '').toUpperCase();
  const claimed = String(data.country || '').toUpperCase();
  if (ipCountry && claimed && claimed !== 'OTHER' && ipCountry !== claimed) {
    add(1, `geo-mismatch:${claimed}!=${ipCountry}`);
  }

  // Client-supplied and therefore trivially fakeable — worth +2 only because
  // it costs nothing and lazy bots don't bother.
  const elapsed = Number(data.elapsedMs);
  if (Number.isFinite(elapsed) && elapsed > 0 && elapsed < 3000) add(2, 'submitted-under-3s');

  // A browser sends Origin on cross-origin POSTs and (in current Chrome/Safari)
  // on same-origin non-GET too. Referer is the fallback for anything that
  // strips Origin. Both missing is a script, not a browser — but privacy tools
  // do strip these, so it's scored rather than rejected.
  const origin = String(req.headers.origin || '');
  const referer = String(req.headers.referer || '');
  if (!ALLOWED_ORIGINS.includes(origin) && !ALLOWED_ORIGINS.some((o) => referer.startsWith(o))) {
    add(2, 'origin-mismatch');
  }

  return { score, reasons };
}

// ── Turnstile ────────────────────────────────────────────────────────────────

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET;

  if (!secret) {
    // Deliberate fail-open: deploying this file must never be able to take the
    // forms down before the env var exists. Loud on purpose — seeing this in
    // production logs means the site is running with its main defence off.
    console.error('[notify] TURNSTILE_SECRET is not set — challenge verification SKIPPED');
    return { ok: true, skipped: true };
  }

  if (!token) return { ok: false, reason: 'missing-token' };

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const out = await res.json();
    if (out.success) return { ok: true };
    return { ok: false, reason: (out['error-codes'] || []).join(',') || 'rejected' };
  } catch (err) {
    // Cloudflare unreachable. Fail OPEN and let the heuristics carry it: losing
    // real leads for the duration of a Cloudflare outage is a worse trade than
    // passing some spam through.
    console.error('[notify] Turnstile verify request failed:', err);
    return { ok: true, degraded: true };
  }
}

// ── Signup forward (server-to-server) ────────────────────────────────────────

// The browser no longer calls app.gen8r.ai/api/signup directly — this function
// is the only caller, authenticated with a shared secret. That's what lets the
// backend refuse anonymous POSTs (see md-vishwam/instagrammer#409). The spam
// gates in the handler run BEFORE this, so nothing flagged ever creates a Brand
// or triggers a confirmation email.
async function forwardSignup(data, req, ip) {
  const secret = process.env.SIGNUP_PROXY_SECRET;
  if (!secret) {
    console.error('[notify] SIGNUP_PROXY_SECRET is not set — cannot forward signup');
    return { ok: false, status: 0, reason: 'proxy-secret-missing' };
  }

  const body = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    country: data.country,
    companyName: data.companyName,
    companyUrl: data.companyUrl,
    industry: data.industry,
    notificationPreference: data.notificationPreference,

    // Trusted values only. These MUST come from Vercel's headers, never from
    // the request body — echoing a client-supplied clientIp would let anyone
    // calling this endpoint spoof it and defeat the backend's per-IP limit.
    clientIp: ip,
    xVercelIpTimezone: req.headers['x-vercel-ip-timezone'] || '',
  };

  // fetch() has no default timeout; without this a hung backend hangs the
  // customer's form indefinitely.
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(SIGNUP_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signup-Proxy-Secret': secret },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    let payload = null;
    try { payload = await res.json(); } catch { /* non-JSON body is fine */ }
    return { ok: res.ok, status: res.status, payload };
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : String(err.message || err);
    console.error('[notify] signup forward failed:', reason);
    return { ok: false, status: 0, reason };
  } finally {
    clearTimeout(timer);
  }
}

// ── Ops notification (Telegram, with email fallback) ─────────────────────────

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TELEGRAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: ctl.signal,
    });
    if (!res.ok) throw new Error(`Telegram API error: ${await res.text()}`);
  } finally {
    clearTimeout(timer);
  }
}

async function sendSupportEmail(subject, text) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: SUPPORT_ALERT_FROM, to: [SUPPORT_ALERT_TO], subject, text }),
  });
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${await res.text()}`);
}

// Best-effort by contract: this must never throw, because a failure to *tell
// ops about* a signup is not a reason to fail the customer's signup. Telegram
// first; on any failure the same content goes to support@ instead.
async function notifyOps(subject, telegramHtml, plainText) {
  try {
    await sendTelegram(process.env.TELEGRAM_CHAT_ID, telegramHtml);
    return 'telegram';
  } catch (err) {
    console.error('[notify] Telegram failed, falling back to support email:', err);
    try {
      await sendSupportEmail(subject, plainText);
      return 'email';
    } catch (err2) {
      console.error('[notify] support email ALSO failed — ops alert lost:', err2);
      return 'none';
    }
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const reqOrigin = req.headers.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : (process.env.ALLOWED_ORIGIN || ALLOWED_ORIGINS[0]),
  );
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body || {};
    const ip = clientIp(req);

    // The log export has no client-IP column, so record it (plus Vercel's geo
    // headers) here — without this there's no way to attribute a future wave.
    const ctx = {
      ip,
      country: req.headers['x-vercel-ip-country'] || '',
      city: req.headers['x-vercel-ip-city'] || '',
      source: data.source || 'unknown',
      email: normalizeEmail(data.email),
    };

    // 1. Honeypot — a real browser leaves this empty; it's off-screen and
    //    untabbable. Silent 200.
    if (String(data.companyFax || '').trim() !== '') {
      console.warn('[notify] DROP honeypot', JSON.stringify(ctx));
      return res.status(200).json({ ok: true });
    }

    // 2. Turnstile — the actual defence. Only hard failure here.
    const ts = await verifyTurnstile(data.turnstileToken, ip);
    if (!ts.ok) {
      console.warn('[notify] DROP turnstile', ts.reason, JSON.stringify(ctx));
      return res.status(403).json({ ok: false, error: 'verification_failed' });
    }

    // 3. Heuristics — defence in depth for a bot that gets past the challenge.
    const { score, reasons } = scoreSubmission(data, req);
    if (score >= SPAM_THRESHOLD) {
      console.warn('[notify] DROP heuristics', score, reasons.join(' '), JSON.stringify(ctx));

      // Route to a side channel when configured, so we can confirm we're not
      // eating real leads. Never let this failure surface to the caller.
      const spamChat = process.env.TELEGRAM_SPAM_CHAT_ID;
      if (spamChat) {
        const flagged = `<b>[SPAM ${score}]</b> ${esc(reasons.join(' '))}\n\n${formatMessage(data)}`;
        await sendTelegram(spamChat, flagged).catch((err) =>
          console.error('[notify] spam-channel send failed:', err));
      }
      return res.status(200).json({ ok: true });
    }

    // 4. Genuine lead.
    console.log('[notify] PASS', score, JSON.stringify(ctx));

    // Contact form has no backend leg — notify ops and we're done.
    if (data.source !== 'gen8r-website-signup') {
      await notifyOps(
        `New Gen8r contact message: ${data.name || 'unknown'}`,
        formatMessage(data),
        plainSummary(data, null, ctx),
      );
      return res.status(200).json({ ok: true });
    }

    // Signup: forward to the backend FIRST. It is the customer's critical path,
    // and doing it first is what lets the ops alert below report the outcome —
    // otherwise a backend outage produces a cheerful "New Sign-Up" ping for a
    // lead that was never created and will never receive an email.
    const fwd = await forwardSignup(data, req, ip);
    console.log('[notify] forward', fwd.status || fwd.reason, JSON.stringify(ctx));

    // Rate-limited retries are noise, and validation errors are the caller's
    // problem — neither is worth an ops alert.
    const worthAlerting = fwd.status !== 429 && fwd.status !== 400;
    if (worthAlerting) {
      const failed = !fwd.ok;
      const subject = failed
        ? `⚠️ Gen8r signup FAILED — create manually: ${data.companyName || data.name || 'unknown'}`
        : `New Gen8r signup: ${data.companyName || data.name || 'unknown'}`;
      const banner = failed
        ? `<b>⚠️ SIGNUP FAILED — create this Brand manually</b>\n<i>backend: ${esc(String(fwd.status || fwd.reason))}</i>\n\n`
        : '';
      await notifyOps(subject, banner + formatMessage(data), plainSummary(data, fwd, ctx));
    }

    // Relay the backend's verdict so the form can show the right message. On a
    // backend failure we deliberately return ok:true — ops has been alerted and
    // will create the Brand by hand, so showing the customer an error would
    // lose a lead we have in fact captured.
    if (fwd.ok) return res.status(200).json({ ok: true, signup: 'created' });
    if (fwd.status === 409) return res.status(200).json({ ok: true, signup: 'exists' });
    if (fwd.status === 429) return res.status(200).json({ ok: true, signup: 'rate_limited' });
    if (fwd.status === 400) return res.status(400).json({ ok: false, signup: 'invalid' });
    return res.status(200).json({ ok: true, signup: 'manual_followup' });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}

// ISO-2 country → dial code lookup. Mirrors the 12 entries in the signup
// dropdown. "OTHER" / unknown codes render the raw phone unchanged. Used to
// prefix the local phone number with its country code for the ops Telegram
// ping — gives @gen8r_notify_bot a fully-dialable number without storing
// the prefix on the form.
const DIAL_CODES = {
  AU: '+61', US: '+1', GB: '+44', IN: '+91', NZ: '+64', SG: '+65',
  CA: '+1',  AE: '+971', IE: '+353', ZA: '+27', DE: '+49', PH: '+63',
};

function formatPhone(country, phone) {
  if (!phone) return '';
  const code = DIAL_CODES[(country || '').toUpperCase()];
  return code ? `${code} ${phone}` : String(phone);
}

function formatMessage(data) {
  const { source, name, email, phone, country, companyName, companyUrl, message } = data;

  if (source === 'gen8r-website-signup') {
    return [
      '<b>New Sign-Up on gen8r.ai</b>',
      '',
      `<b>Name:</b> ${esc(name)}`,
      `<b>Email:</b> ${esc(email)}`,
      country     ? `<b>Country:</b> ${esc(country)}`         : null,
      phone       ? `<b>Phone:</b> ${esc(formatPhone(country, phone))}` : null,
      companyName ? `<b>Company:</b> ${esc(companyName)}`     : null,
      companyUrl  ? `<b>Website:</b> ${esc(companyUrl)}`      : null,
    ].filter(Boolean).join('\n');
  }

  return [
    '<b>New Contact Message on gen8r.ai</b>',
    '',
    `<b>Name:</b> ${esc(name)}`,
    `<b>Email:</b> ${esc(email)}`,
    phone ? `<b>Phone:</b> ${esc(formatPhone(country, phone))}` : null,
    message ? `<b>Message:</b> ${esc(message)}` : null,
  ].filter(Boolean).join('\n');
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Plain-text twin of formatMessage() for the support@ fallback. Carries the
// same lead detail plus the backend outcome and origin context — this email
// only ever gets sent when Telegram is down, so it has to stand alone as the
// single record of the signup.
function plainSummary(data, fwd, ctx) {
  const lines = [
    data.source === 'gen8r-website-signup' ? 'New Gen8r signup' : 'New Gen8r contact message',
    '',
    `Name:    ${data.name || '-'}`,
    `Email:   ${data.email || '-'}`,
  ];
  if (data.phone) lines.push(`Phone:   ${formatPhone(data.country, data.phone)}`);
  if (data.country) lines.push(`Country: ${data.country}`);
  if (data.companyName) lines.push(`Company: ${data.companyName}`);
  if (data.companyUrl) lines.push(`Website: ${data.companyUrl}`);
  if (data.message) lines.push(`Message: ${data.message}`);

  lines.push('', `Origin:  ip=${ctx.ip || '-'} country=${ctx.country || '-'} city=${ctx.city || '-'}`);

  if (fwd) {
    lines.push(
      '',
      fwd.ok
        ? `Backend: OK (${fwd.status}) — Brand created, confirmation email sent.`
        : `Backend: FAILED (${fwd.status || fwd.reason}) — NOT created. Create this Brand manually.`,
    );
  }

  lines.push('', 'Sent to support@ because the ops Telegram notification failed.');
  return lines.join('\n');
}

// Exported for offline calibration of the heuristics against captured samples.
// Unused by the request path — Vercel only ever invokes the default export.
export { looksLikeMash, junkMessage, junkDomain, normalizeEmail, scoreSubmission, SPAM_THRESHOLD };
