export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || 'https://gen8r.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const data = req.body;
    const message = formatMessage(data);

    const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const tgRes = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      console.error('Telegram API error:', await tgRes.text());
      return res.status(502).json({ ok: false, error: 'Failed to send notification' });
    }

    // Welcome email is now sent by the Gen8r backend (app.gen8r.ai/api/signup
    // → sendWelcomeEmail with magic-link activation, brand portal, Telegram
    // bridge token). This Vercel function only handles the Telegram lead-ping
    // for ops visibility — and the contact form. No more duplicate email send.

    return res.status(200).json({ ok: true });
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
