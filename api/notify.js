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

    if (data.source === 'gen8r-website-signup' && process.env.RESEND_API_KEY && data.email) {
      try {
        await sendWelcomeEmail(data);
      } catch (err) {
        console.error('Welcome email failed (non-blocking):', err);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
}

function formatMessage(data) {
  const { source, name, email, phone, business_type, message } = data;

  if (source === 'gen8r-website-signup') {
    return [
      '<b>New Sign-Up on gen8r.ai</b>',
      '',
      `<b>Name:</b> ${esc(name)}`,
      `<b>Email:</b> ${esc(email)}`,
      phone ? `<b>Phone:</b> ${esc(phone)}` : null,
      business_type ? `<b>Business:</b> ${esc(business_type)}` : null,
    ].filter(Boolean).join('\n');
  }

  return [
    '<b>New Contact Message on gen8r.ai</b>',
    '',
    `<b>Name:</b> ${esc(name)}`,
    `<b>Email:</b> ${esc(email)}`,
    phone ? `<b>Phone:</b> ${esc(phone)}` : null,
    message ? `<b>Message:</b> ${esc(message)}` : null,
  ].filter(Boolean).join('\n');
}

async function sendWelcomeEmail(data) {
  const firstName = (data.name || '').split(' ')[0] || 'there';

  const text = `Hi ${firstName},

Thanks for signing up — got your details and you'll hear from me personally soon.

If you'd like to skip the wait, here are two ways to get going:

  • Play with Gen8r straight away via Telegram: https://t.me/Gen8rBot
  • Or grab 30 minutes on my calendar: https://calendly.com/gen8r/30min

Either way, I'll be in touch.

Maulik
Founder, Gen8r
gen8r.ai
`;

  const html = `<p>Hi ${esc(firstName)},</p>
<p>Thanks for signing up &mdash; got your details and you'll hear from me personally soon.</p>
<p>If you'd like to skip the wait, here are two ways to get going:</p>
<ul>
  <li>Play with Gen8r straight away via Telegram: <a href="https://t.me/Gen8rBot">t.me/Gen8rBot</a></li>
  <li>Or grab 30 minutes on my calendar: <a href="https://calendly.com/gen8r/30min">calendly.com/gen8r/30min</a></li>
</ul>
<p>Either way, I'll be in touch.</p>
<p>Maulik<br>Founder, Gen8r<br><a href="https://gen8r.ai">gen8r.ai</a></p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Maulik Doshi <maulik@gen8r.ai>',
      reply_to: 'maulik@gen8r.ai',
      to: data.email,
      bcc: 'maulik@gen8r.ai',
      subject: 'Welcome to Gen8r',
      text,
      html,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend ${res.status}: ${errBody}`);
  }
}

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
