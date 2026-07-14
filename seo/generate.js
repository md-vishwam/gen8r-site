#!/usr/bin/env node
// ── Programmatic SEO page generator ──────────────────────────────────────────
// Renders one static HTML page per (vertical × contentType) into /c/, writes a
// /c/ hub index, and regenerates sitemap.xml (hand-maintained pages + generated
// ones). Pure static output — Vercel just serves it, no runtime cost.
//
//   node seo/generate.js
//
// Re-run after editing seo/data.js or seo/template.js. Output is committed to
// the repo so the deploy stays a plain static push.

const fs = require('fs');
const path = require('path');
const { brand, verticals, contentTypes } = require('./data');
const { renderPage, pageSlug } = require('./template');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'c');

// Build date (YYYY-MM-DD) — stamped as <lastmod> in the sitemap and as
// dateModified in each page's Article schema. A moving lastmod is a legitimate
// recrawl signal: it tells Google/Bing the page changed since last crawl.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Hand-maintained pages that must stay in the sitemap (extensionless routes, to
// match the existing sitemap.xml convention).
const STATIC_URLS = [
  { loc: `${brand.origin}/`, changefreq: 'weekly', priority: '1.0' },
  { loc: `${brand.origin}/open-telegram`, changefreq: 'monthly', priority: '0.5' },
  { loc: `${brand.origin}/privacy`, changefreq: 'yearly', priority: '0.3' },
  { loc: `${brand.origin}/terms`, changefreq: 'yearly', priority: '0.3' },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 1. Render each combo ─────────────────────────────────────────────────────
const generated = [];
for (const vertical of verticals) {
  for (const contentType of contentTypes) {
    const slug = pageSlug(vertical, contentType);
    const html = renderPage({ vertical, contentType, verticals, contentTypes, buildDate: BUILD_DATE });
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.html`), html);
    generated.push({ slug, vertical, contentType });
  }
}

// ── 2. /c/ hub index (link hub for crawlers + humans) ────────────────────────
const groups = verticals
  .map((v) => {
    const links = contentTypes
      .map((ct) => `<li><a href="/c/${pageSlug(v, ct)}">${ct.label(v)}</a></li>`)
      .join('\n        ');
    return `
      <section>
        <h2>${v.title}</h2>
        <ul>
        ${links}
        </ul>
      </section>`;
  })
  .join('\n');

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Free social media guides for small business | gen8r</title>
<meta name="description" content="Free, ready-to-use Instagram captions, Reel ideas, and 15-day social media plans for yoga studios, coffee shops, restaurants, salons, and real estate agents.">
<link rel="canonical" href="${brand.origin}/c/">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--bg:#06060b;--surface:#0d0d16;--border:#1e1e2e;--text:#e8e8f0;--muted:#a0a0b8;
    --accent:#00e5ff;--font-display:'Instrument Serif',Georgia,serif;
    --font-body:'DM Sans',system-ui,sans-serif;--font-mono:'JetBrains Mono',monospace;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.6}
  a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
  .wrap{max-width:900px;margin:0 auto;padding:0 24px}
  header{border-bottom:1px solid var(--border);padding:20px 0}
  header .wrap{display:flex;justify-content:space-between;align-items:center}
  .logo{font-family:var(--font-display);font-size:26px;color:var(--text)}.logo b{color:var(--accent)}
  .nav-cta{font-family:var(--font-mono);font-size:13px;padding:8px 16px;border:1px solid var(--accent);border-radius:8px}
  h1{font-family:var(--font-display);font-size:clamp(32px,5vw,46px);font-weight:400;margin:48px 0 12px}
  .lede{color:var(--muted);font-size:18px;margin-bottom:16px;max-width:640px}
  h2{font-family:var(--font-display);font-size:26px;font-weight:400;margin:36px 0 12px}
  section{border-top:1px solid var(--border);padding-top:20px}
  ul{list-style:none;display:grid;gap:8px;margin-bottom:8px}
  footer{border-top:1px solid var(--border);padding:32px 0;margin-top:48px;color:var(--muted);font-size:14px}
</style>
</head>
<body>
<header><div class="wrap">
  <a class="logo" href="/">gen<b>8</b>r</a>
  <a class="nav-cta" href="/#start">Try free &rarr;</a>
</div></header>
<main class="wrap">
  <h1>Free social media guides</h1>
  <p class="lede">Ready-to-post captions, Reel ideas, and 15-day plans by business type — and the tool that generates and publishes them for you.</p>
  ${groups}
</main>
<footer><div class="wrap"><p><a href="/">gen8r</a> — ${brand.tagline}. &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms</a></p></div></footer>
</body>
</html>`;
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), indexHtml);

// ── 3. Regenerate sitemap.xml (static pages + hub + generated) ───────────────
const allUrls = [
  ...STATIC_URLS,
  { loc: `${brand.origin}/c/`, changefreq: 'weekly', priority: '0.6' },
  ...generated.map((g) => ({
    loc: `${brand.origin}/c/${g.slug}`,
    changefreq: 'monthly',
    priority: '0.6',
  })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) =>
      `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap);

console.log(`Generated ${generated.length} pages + /c/ hub`);
console.log(`Sitemap: ${allUrls.length} URLs`);
