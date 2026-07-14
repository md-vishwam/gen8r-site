# SEO monitoring agent — run playbook

Runs every 2–3 days for ~2 weeks. **Read-only on the live site + Google** — this agent measures and recommends; it does NOT edit `index.html`/`/c/` or push site content. It only writes reports under `seo/monitor/`. It never spam-submits to Google or hammers Request Indexing.

## Each run
1. **Load** `seo/monitor/keywords.json` and `seo/monitor/history.json`.
2. **Rank check (live SERP):** for every keyword, run a web search and record gen8r.ai's position in the returned results — `1..N`, or `null` if not present. Note the URL that ranked (is it the `target`, or a different page?). SERP is US-only via the tool; treat as directional, not exact.
3. **GSC pull (if credentials present):** query Search Console API for last-run-to-now — total clicks, impressions, avg position, indexed-page count, and any NEW queries that appeared. If no creds, mark `gsc: "manual"` and remind Maulik to paste a Performance screenshot.
4. **Diff vs previous snapshot:** flag movement (↑/↓ positions, newly-ranking terms, newly-indexed pages, lost rankings).
5. **Recommend (the point of the agent):** 2–5 concrete next actions, e.g.:
   - keyword we're close on (pos 11–20) → what on-page tweak pushes it to page 1
   - target term with zero presence → is it winnable, or should we pick a longer-tail variant
   - a `/c/` page ranking with the WRONG url → internal-link/canonical fix
   - an AEO/comparison page worth creating
   - authority action for the day (which directory/community to hit)
6. **Append** the snapshot to `history.json` and **write** `seo/monitor/reports/<YYYY-MM-DD>.md`.
7. Add a one-line pointer to the memory log `seo_aeo_log.md`.
8. Commit reports (safe — `seo/` is excluded from the Vercel deploy via `.vercelignore`). Do NOT push site-content changes.

## Guard-rails
- Advisory only. Any site change is proposed in the report for Maulik to approve, never auto-applied.
- No Google spam: no automated Request-Indexing loops, no fake signals. IndexNow (Bing) pings only when real content actually changed.
- Keep the keyword list stable unless Maulik edits it; note *suggested* additions in the report rather than silently adding them.
