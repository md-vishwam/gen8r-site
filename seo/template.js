// ── Programmatic SEO page template ───────────────────────────────────────────
// Renders one (vertical × contentType) page as a self-contained static HTML
// string. Like privacy.html / terms.html, each page carries its own inline CSS
// (the design tokens are copied from index.html's :root — keep them roughly in
// sync if the brand palette changes). Consumed by seo/generate.js.

const { brand, tenDayPlan, art } = require('./data');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const pageSlug = (v, ct, city) =>
  `${ct.slug}-for-a-${v.slug}${city ? `-in-${city.slug}` : ''}`;
const pageUrl = (v, ct, city) => `${brand.origin}/c/${pageSlug(v, ct, city)}`;

// ── Per-content-type sample block ────────────────────────────────────────────
function sampleBlock(v, ct) {
  if (ct.sample === 'captions') {
    const items = v.captions
      .map((c) => `<li><p class="cap">${esc(c)}</p></li>`)
      .join('\n');
    return `
      <h2>Ready-to-post captions for your ${esc(v.name)}</h2>
      <ul class="cards">
        ${items}
      </ul>
      <p class="hashtags"><strong>Hashtags:</strong> ${v.hashtags.map(esc).join(' ')}</p>`;
  }
  if (ct.sample === 'reels') {
    const items = v.reelIdeas
      .map((r, i) => `<li><span class="num">${i + 1}</span><p>${esc(r)}</p></li>`)
      .join('\n');
    return `
      <h2>Reel ideas you can shoot on a phone</h2>
      <ul class="cards numbered">
        ${items}
      </ul>`;
  }
  // plan
  const rows = tenDayPlan(v)
    .map(
      (d) => `
        <tr>
          <td class="day">Day ${d.day}</td>
          <td class="theme">${esc(d.theme)}</td>
          <td>${esc(d.post)}</td>
        </tr>`
    )
    .join('\n');
  return `
      <h2>Your 10-day plan, day by day</h2>
      <div class="table-wrap">
        <table class="plan">
          <thead><tr><th>Day</th><th>Theme</th><th>What to post</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
}

// ── FAQ (rendered on-page AND emitted as FAQPage structured data) ────────────
function faqItems(v, ct) {
  return [
    {
      q: `How often should ${art(v.name)} ${v.name} post on Instagram?`,
      a: `Consistency beats volume. For most ${v.name} accounts, three to five quality posts a week — a mix of offers, ${'behind-the-scenes'}, and Reels — outperforms daily posting you can’t sustain. The 10-day arc above is built to be repeatable, not exhausting.`,
    },
    {
      q: `Do I have to write all of this myself?`,
      a: `No — that’s exactly what gen8r automates. You describe ${v.promo} once, and gen8r generates the captions, images, hashtags, and Reels for a full campaign, then publishes them to Instagram and Facebook on your approval. You review instead of author.`,
    },
    {
      q: `How much does gen8r cost for ${art(v.name)} ${v.name}?`,
      a: `Plans start at $29/month, and early-access accounts get their first month free. There’s no long-term contract — you can generate your first campaign and see the output before you commit.`,
    },
  ];
}

// ── Internal linking (SEO silo + real navigation) ────────────────────────────
function relatedLinks(v, ct, verticals, contentTypes) {
  const sameVertical = contentTypes
    .filter((c) => c.slug !== ct.slug)
    .map((c) => `<li><a href="/c/${pageSlug(v, c)}">${esc(c.label(v))}</a></li>`)
    .join('\n');
  const sameType = verticals
    .filter((other) => other.slug !== v.slug)
    .map((other) => `<li><a href="/c/${pageSlug(other, ct)}">${esc(ct.label(other))}</a></li>`)
    .join('\n');
  return `
    <nav class="related" aria-label="Related guides">
      <div>
        <h3>More for ${art(v.name)} ${esc(v.name)}</h3>
        <ul>${sameVertical}</ul>
      </div>
      <div>
        <h3>${esc(ct.noun)} for other businesses</h3>
        <ul>${sameType}</ul>
      </div>
    </nav>`;
}

// ── Local (geo) block — only rendered on city-scoped pages ───────────────────
// Carries the real local signal (angle + taggable suburbs + local hashtags)
// that keeps a city variant from reading as a doorway-page clone of the national
// version.
function localBlock(v, city) {
  const c = city.byVertical[v.slug];
  const tags = [...c.hashtags, ...city.hashtags];
  return `
      <h2>Making it work in ${esc(city.name)}</h2>
      <p>${esc(c.angle)} Tag your neighbourhood — ${esc(c.suburbs)} — so nearby customers,
      not just the algorithm, actually find you.</p>
      <p class="hashtags"><strong>${esc(city.name)} hashtags:</strong> ${tags.map(esc).join(' ')}</p>`;
}

// City pages link back to the national guide set + the local marketing hub,
// rather than to a (non-existent) cross-city silo.
function cityRelatedLinks(v, ct, city) {
  const nationalGuides = ['instagram-captions', '10-day-social-media-plan', 'instagram-reel-ideas'];
  return `
    <nav class="related" aria-label="Related guides">
      <div>
        <h3>More for ${art(v.name)} ${esc(v.name)}</h3>
        <ul>
          <li><a href="/c/${ct.slug}-for-a-${v.slug}">${esc(ct.label(v))} (all locations)</a></li>
        </ul>
      </div>
      <div>
        <h3>Social media marketing in ${esc(city.name)}</h3>
        <ul>
          <li><a href="/c/social-media-marketing-for-small-business-in-${city.slug}">gen8r for ${esc(city.name)} small businesses</a></li>
        </ul>
      </div>
    </nav>`;
}

function renderPage({ vertical: v, contentType: ct, verticals, contentTypes, buildDate, city }) {
  const url = pageUrl(v, ct, city);
  const inCity = city ? ` in ${city.name}` : '';
  const label = `${ct.label(v)}${inCity}`;
  const query = `${ct.query(v)}${city ? ` in ${city.name.toLowerCase()}` : ''}`;
  // <title> is decoupled from the on-page H1 (`label`) so it stays under ~60
  // chars (Bing/Google truncate longer). The 10-day-plan label is verbose
  // ("A 10-Day Social Media Plan for a …"), so title uses a compact,
  // keyword-front-loaded form; the "10-day" keyword still lives in H1, meta
  // description, body, and slug.
  const titleCore =
    ct.slug === '10-day-social-media-plan' ? `${v.title} Social Media Plan${inCity}` : label;
  const title = `${titleCore} | ${brand.name}`;
  // For city pages, lead the intro with the local angle so the meta description
  // (first two sentences) carries the city + suburb signal.
  const introText = city
    ? `${label}, ready to post. ${city.byVertical[v.slug].angle} ${ct.intro(v)}`
    : ct.intro(v);
  const description = `${introText.split('. ').slice(0, 2).join('. ')}.`.slice(0, 158);
  const faqs = faqItems(v, ct);

  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: brand.name,
      url: brand.origin,
      logo: `${brand.origin}/gen8r-logo.png`,
      sameAs: brand.social,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: label,
      description,
      about: query,
      url,
      ...(city ? { contentLocation: { '@type': 'City', name: city.name } } : {}),
      ...(buildDate ? { datePublished: buildDate, dateModified: buildDate } : {}),
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      isPartOf: { '@type': 'WebSite', name: brand.name, url: brand.origin },
      publisher: {
        '@type': 'Organization',
        name: brand.name,
        url: brand.origin,
        logo: { '@type': 'ImageObject', url: `${brand.origin}/gen8r-logo.png` },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'gen8r', item: brand.origin },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${brand.origin}/c/` },
        { '@type': 'ListItem', position: 3, name: label, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  const faqHtml = faqs
    .map((f) => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(label)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="gen8r">
<meta property="og:image" content="${brand.origin}/og-preview.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(label)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${brand.origin}/og-preview.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
${structured.map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n')}
<style>
  :root{
    --bg:#06060b; --surface:#0d0d16; --border:#1e1e2e; --text:#e8e8f0;
    --muted:#a0a0b8; --accent:#00e5ff; --gold:#ffb800;
    --font-display:'Instrument Serif',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif; --font-mono:'JetBrains Mono',monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);
    line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  .wrap{max-width:820px;margin:0 auto;padding:0 24px}
  header{border-bottom:1px solid var(--border);padding:20px 0;position:sticky;top:0;
    background:rgba(6,6,11,.8);backdrop-filter:blur(12px);z-index:10}
  header .wrap{display:flex;align-items:center;justify-content:space-between}
  .logo{font-family:var(--font-mono);font-size:22px;font-weight:500;letter-spacing:-.5px;
    color:var(--text);display:inline-flex;align-items:center;gap:2px}
  .logo:hover{text-decoration:none}
  .logo-eight{background:linear-gradient(135deg,#00e5ff 0%,#7b61ff 50%,#ff6ec7 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    font-weight:700;font-size:26px;filter:drop-shadow(0 0 8px rgba(0,229,255,.4));
    animation:pulse-glow 3s ease-in-out infinite}
  @keyframes pulse-glow{0%,100%{filter:drop-shadow(0 0 8px rgba(0,229,255,.4))}
    50%{filter:drop-shadow(0 0 16px rgba(0,229,255,.6))}}
  .nav-cta{font-family:var(--font-mono);font-size:13px;padding:8px 16px;border:1px solid var(--accent);
    border-radius:8px;color:var(--accent)}
  .nav-cta:hover{background:var(--accent);color:var(--bg);text-decoration:none}
  .crumb{font-family:var(--font-mono);font-size:12px;color:var(--muted);
    text-transform:uppercase;letter-spacing:.08em;margin:40px 0 14px}
  h1{font-family:var(--font-display);font-size:clamp(34px,6vw,52px);line-height:1.1;
    font-weight:400;margin-bottom:20px}
  h2{font-family:var(--font-display);font-size:clamp(26px,4vw,34px);font-weight:400;
    margin:52px 0 18px}
  h3{font-size:18px;margin-bottom:8px}
  .lede{font-size:19px;color:var(--muted);margin-bottom:28px}
  .btn{display:inline-block;font-family:var(--font-mono);font-size:15px;font-weight:500;
    background:var(--accent);color:var(--bg);padding:14px 28px;border-radius:10px;margin:8px 0}
  .btn:hover{text-decoration:none;filter:brightness(1.1)}
  .btn.gold{background:var(--gold)}
  ul.cards{list-style:none;display:grid;gap:14px;margin:8px 0}
  ul.cards li{background:var(--surface);border:1px solid var(--border);border-radius:12px;
    padding:18px 20px}
  ul.cards.numbered li{display:flex;gap:14px;align-items:flex-start}
  .num{font-family:var(--font-mono);color:var(--accent);font-weight:500;flex:0 0 auto}
  .cap{font-size:17px}
  .hashtags{font-family:var(--font-mono);font-size:14px;color:var(--accent);margin-top:14px}
  .table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:12px}
  table.plan{width:100%;border-collapse:collapse;font-size:15px;min-width:560px}
  table.plan th,table.plan td{text-align:left;padding:12px 16px;border-bottom:1px solid var(--border);
    vertical-align:top}
  table.plan th{font-family:var(--font-mono);font-size:12px;text-transform:uppercase;
    letter-spacing:.06em;color:var(--muted);background:var(--surface)}
  table.plan td.day{font-family:var(--font-mono);color:var(--accent);white-space:nowrap}
  table.plan td.theme{color:var(--text);font-weight:500;white-space:nowrap}
  .cta-band{background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(255,184,0,.06));
    border:1px solid var(--border);border-radius:16px;padding:32px;margin:56px 0;text-align:center}
  .cta-band p{color:var(--muted);margin-bottom:8px}
  .faq-item{border-top:1px solid var(--border);padding:22px 0}
  .faq-item p{color:var(--muted)}
  nav.related{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin:56px 0;
    border-top:1px solid var(--border);padding-top:32px}
  nav.related h3{font-family:var(--font-mono);font-size:12px;text-transform:uppercase;
    letter-spacing:.06em;color:var(--muted);margin-bottom:12px}
  nav.related ul{list-style:none;display:grid;gap:8px}
  footer{border-top:1px solid var(--border);padding:32px 0;margin-top:40px;
    color:var(--muted);font-size:14px}
  @media(max-width:600px){nav.related{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <a class="logo" href="/">gen<span class="logo-eight">8</span>r</a>
    <a class="nav-cta" href="/#start" data-loc="seo-header">Try free &rarr;</a>
  </div>
</header>

<main class="wrap">
  <p class="crumb"><a href="/">gen8r</a> / ${esc(ct.noun)}${city ? ` / ${esc(city.name)}` : ''}</p>
  <h1>${esc(label)}</h1>
  <p class="lede">${esc(introText)}</p>
  <a class="btn" href="/#start" data-loc="seo-hero">Generate my campaign free &rarr;</a>

  ${sampleBlock(v, ct)}
${city ? localBlock(v, city) : ''}

  <h2>Turn this into an auto-published campaign</h2>
  <p>Templates are a start — but the real work is doing this every day, on time, across Instagram and Facebook.
  That’s what gen8r automates. Describe ${esc(v.promo)} once, and gen8r generates a full campaign
  (captions, AI images, branded flyers, hashtags, and Reels), then publishes it on your approval. You go from
  <em>author</em> to <em>approve</em>.</p>

  <div class="cta-band">
    <p>Early access — first month free, no contract.</p>
    <a class="btn gold" href="/#start" data-loc="seo-band">Start your free campaign &rarr;</a>
  </div>

  <h2>Frequently asked questions</h2>
  ${faqHtml}

  ${city ? cityRelatedLinks(v, ct, city) : relatedLinks(v, ct, verticals, contentTypes)}
</main>

<footer>
  <div class="wrap">
    <p><a href="/">gen8r</a> — ${esc(brand.tagline)}. &copy; gen8r by LiftLogic AI.
    &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
  </div>
</footer>
</body>
</html>`;
}

// ── Local marketing landing page ─────────────────────────────────────────────
// A dedicated per-city page targeting local commercial intent ("social media
// marketing for <city> small businesses") — the honest, product-matched answer
// to "marketing agency in <city>" searches, without impersonating a local
// agency (no fake address; Service schema with areaServed instead).
const landingSlug = (city) => `social-media-marketing-for-small-business-in-${city.slug}`;
const landingUrl = (city) => `${brand.origin}/c/${landingSlug(city)}`;

function renderLocalLanding({ city, verticals, geoGuides, buildDate }) {
  const url = landingUrl(city);
  const title = `Social Media Marketing for ${city.name} Small Businesses | ${brand.name}`;
  const description = (
    `AI social media marketing for ${city.name} small businesses. gen8r generates and auto-publishes ` +
    `Instagram and Facebook campaigns from $29/mo — no agency needed.`
  ).slice(0, 158);

  const faqs = [
    {
      q: `Do I need a marketing agency in ${city.name}?`,
      a: `Not for social media. A ${city.name} agency typically charges $1,000–$3,000/month to run your socials. gen8r does the same core job — generating and publishing on-brand Instagram and Facebook campaigns — from $29/month, with you approving each post before it goes live. Keep an agency for big-picture strategy; let gen8r handle the daily posting.`,
    },
    {
      q: `How much does social media marketing cost for ${art(city.name)} ${city.name} small business?`,
      a: `With gen8r, plans start at $29/month and early-access accounts get their first month free — no contract. That’s a fraction of a ${city.name} agency retainer or the cost of hiring a part-time social media manager.`,
    },
    {
      q: `Which ${city.name} businesses is gen8r for?`,
      a: `Any ${city.name} small business that lives on Instagram and Facebook — cafés, restaurants, yoga studios, hair salons, real estate agents, and event venues, to name a few. You describe what you’re promoting; gen8r writes the captions, makes the images, and publishes the campaign on your approval.`,
    },
  ];

  const guideLinks = geoGuides
    .map((g) => `<li><a href="${g.url}">${esc(g.label)}</a></li>`)
    .join('\n        ');

  const structured = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `AI social media marketing for ${city.name} small businesses`,
      serviceType: 'Social media marketing',
      description,
      url,
      provider: {
        '@type': 'Organization',
        name: brand.name,
        url: brand.origin,
        logo: `${brand.origin}/gen8r-logo.png`,
        sameAs: brand.social,
      },
      areaServed: { '@type': 'City', name: city.name },
      offers: {
        '@type': 'Offer',
        price: '29.00',
        priceCurrency: 'USD',
        url: `${brand.origin}/#start`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'gen8r', item: brand.origin },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${brand.origin}/c/` },
        { '@type': 'ListItem', position: 3, name: `Social media marketing in ${city.name}`, item: url },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  const faqHtml = faqs
    .map((f) => `<div class="faq-item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="website">
<meta property="og:url" content="${url}">
<meta property="og:title" content="Social Media Marketing for ${esc(city.name)} Small Businesses">
<meta property="og:description" content="${esc(description)}">
<meta property="og:site_name" content="gen8r">
<meta property="og:image" content="${brand.origin}/og-preview.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Social Media Marketing for ${esc(city.name)} Small Businesses">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${brand.origin}/og-preview.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
${structured.map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`).join('\n')}
<style>
  :root{
    --bg:#06060b; --surface:#0d0d16; --border:#1e1e2e; --text:#e8e8f0;
    --muted:#a0a0b8; --accent:#00e5ff; --gold:#ffb800;
    --font-display:'Instrument Serif',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif; --font-mono:'JetBrains Mono',monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);
    line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  .wrap{max-width:820px;margin:0 auto;padding:0 24px}
  header{border-bottom:1px solid var(--border);padding:20px 0;position:sticky;top:0;
    background:rgba(6,6,11,.8);backdrop-filter:blur(12px);z-index:10}
  header .wrap{display:flex;align-items:center;justify-content:space-between}
  .logo{font-family:var(--font-mono);font-size:22px;font-weight:500;letter-spacing:-.5px;
    color:var(--text);display:inline-flex;align-items:center;gap:2px}
  .logo:hover{text-decoration:none}
  .logo-eight{background:linear-gradient(135deg,#00e5ff 0%,#7b61ff 50%,#ff6ec7 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    font-weight:700;font-size:26px;filter:drop-shadow(0 0 8px rgba(0,229,255,.4))}
  .nav-cta{font-family:var(--font-mono);font-size:13px;padding:8px 16px;border:1px solid var(--accent);
    border-radius:8px;color:var(--accent)}
  .nav-cta:hover{background:var(--accent);color:var(--bg);text-decoration:none}
  .crumb{font-family:var(--font-mono);font-size:12px;color:var(--muted);
    text-transform:uppercase;letter-spacing:.08em;margin:40px 0 14px}
  h1{font-family:var(--font-display);font-size:clamp(34px,6vw,52px);line-height:1.1;
    font-weight:400;margin-bottom:20px}
  h2{font-family:var(--font-display);font-size:clamp(26px,4vw,34px);font-weight:400;
    margin:52px 0 18px}
  h3{font-size:18px;margin-bottom:8px}
  .lede{font-size:19px;color:var(--muted);margin-bottom:28px}
  p{margin-bottom:16px}
  .btn{display:inline-block;font-family:var(--font-mono);font-size:15px;font-weight:500;
    background:var(--accent);color:var(--bg);padding:14px 28px;border-radius:10px;margin:8px 0}
  .btn:hover{text-decoration:none;filter:brightness(1.1)}
  .btn.gold{background:var(--gold)}
  ul.guides{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0}
  ul.guides li{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:14px 16px}
  .cta-band{background:linear-gradient(135deg,rgba(0,229,255,.08),rgba(255,184,0,.06));
    border:1px solid var(--border);border-radius:16px;padding:32px;margin:56px 0;text-align:center}
  .cta-band p{color:var(--muted);margin-bottom:8px}
  .faq-item{border-top:1px solid var(--border);padding:22px 0}
  .faq-item p{color:var(--muted);margin-bottom:0}
  footer{border-top:1px solid var(--border);padding:32px 0;margin-top:40px;
    color:var(--muted);font-size:14px}
  @media(max-width:600px){ul.guides{grid-template-columns:1fr}}
</style>
</head>
<body>
<header>
  <div class="wrap">
    <a class="logo" href="/">gen<span class="logo-eight">8</span>r</a>
    <a class="nav-cta" href="/#start" data-loc="seo-header">Try free &rarr;</a>
  </div>
</header>

<main class="wrap">
  <p class="crumb"><a href="/">gen8r</a> / Social media marketing in ${esc(city.name)}</p>
  <h1>Social media marketing for ${esc(city.name)} small businesses</h1>
  <p class="lede">${esc(city.blurb)} gen8r is the AI that generates and auto-publishes your
  Instagram and Facebook campaigns — so a ${esc(city.name)} café, salon, or studio can market like it has
  a full-time social team, without hiring one.</p>
  <a class="btn" href="/#start" data-loc="seo-hero">Generate my first campaign free &rarr;</a>

  <h2>Marketing that keeps up with your week</h2>
  <p>Most ${esc(city.name)} owners know they should be posting — they just don’t have the hours. gen8r fixes
  the hard part: you describe what you’re promoting once (a new offer, an event, a slow Tuesday), and gen8r
  writes the captions, generates the images and branded flyers, picks the hashtags, and scripts the Reels —
  then publishes the whole campaign to Instagram and Facebook once you approve each post. You go from
  <em>author</em> to <em>approve</em>.</p>

  <h2>Built for ${esc(city.name)} business types</h2>
  <p>Start from a ready-to-post guide tuned for your business and your city, then let gen8r take it live:</p>
  <ul class="guides">
        ${guideLinks}
  </ul>

  <div class="cta-band">
    <p>Early access — first month free, no contract. Cheaper than a ${esc(city.name)} agency retainer.</p>
    <a class="btn gold" href="/#start" data-loc="seo-band">Start your free campaign &rarr;</a>
  </div>

  <h2>Frequently asked questions</h2>
  ${faqHtml}
</main>

<footer>
  <div class="wrap">
    <p><a href="/">gen8r</a> — ${esc(brand.tagline)}. &copy; gen8r by LiftLogic AI.
    &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p>
  </div>
</footer>
</body>
</html>`;
}

module.exports = { renderPage, renderLocalLanding, pageSlug, pageUrl, landingSlug, landingUrl };
