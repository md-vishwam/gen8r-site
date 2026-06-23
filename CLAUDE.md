# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gen8r.ai — a landing page for an AI-powered social media campaign tool. The product lets small businesses describe a promotion (via Slack or Telegram), then generates and auto-publishes a 15-day social media campaign (captions, images, hashtags, reels) to Instagram and Facebook.

## Architecture

The landing page is a **single self-contained file**, `index.html` (~2300 lines) — CSS, HTML, and JS are all inline, in that order:
- **CSS**: Custom properties in `:root`, component styles, responsive breakpoints, animations
- **HTML**: Sections in order — Nav, Hero, How It Works, Demo Preview (toggleable panels `#demo-travel` / `#demo-yoga` / `#demo-realestate`), Features, Pricing, FAQ, Get Started (signup form + Telegram CTA + Calendly booking), Contact, Footer
- **JavaScript**: Scroll reveal (IntersectionObserver), nav scroll/mobile toggle, FAQ accordion, signup toggle, form submission handlers (`signupForm`, `contactForm`), smooth-scroll for anchor links

Line numbers drift as the file grows — locate things by section comment (`// ── Contact Form ──`), element `id`, or CSS selector rather than by line.

### Other pages
`privacy.html`, `terms.html`, and `open-telegram.html` are **independent** static pages, each with its own inline CSS (they do NOT share styles with `index.html`). A change to the design system in `index.html` will not propagate to them — update each page deliberately. `open-telegram.html` is the deep-link bridge that sends mobile users into `https://t.me/Gen8rBot?start=web` and shows a QR for desktop.

No build tools, frameworks, bundlers, or package managers — there is nothing to build, lint, or test. To develop, open the HTML file in a browser. Deployment is via Vercel (static files + the `api/` serverless function); pushing to the repo triggers a deploy.

## Form Submission Flow

Both forms tag their payload with a `source` field (`gen8r-website-signup` / `gen8r-website-contact`) so the serverless function can format the notification correctly.

**Contact form** — single POST to `/api/notify` (the Vercel function at `api/notify.js`), which forwards to the internal Telegram bot (`@gen8r_notify_bot`) via the Telegram Bot API. Token and chat ID are Vercel env vars (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

**Signup form** — **dual-fires** two requests in parallel (`index.html`, `signupForm` handler):
1. `/api/notify` (Vercel → Telegram ops ping) — always fires; this is what guarantees the lead is captured even if the backend is down. The form's success/error state is driven by THIS response.
2. `https://app.gen8r.ai/api/signup` (the real onboarding backend, separate repo) — best-effort, wrapped in `.catch()`. Creates the Brand, mints the Telegram bridge token, kicks off brand extraction when `companyUrl` is given, and sends the magic-link activation email. A `409` here means the email already has an account → the form swaps in a "Log in instead" message; all other backend outcomes fall through to the generic success copy because the lead is already captured via notify.

The welcome email is sent by `app.gen8r.ai/api/signup`, NOT by this Vercel function — `api/notify.js` only does the ops Telegram ping and contact routing. The `RESEND_API_KEY` env var (historical duplicate welcome email) is now unused and can be removed from Vercel.

**Keep in sync:** `notify.js` has a `DIAL_CODES` map that mirrors the 12-entry country dropdown in the signup form (`#signupCountry`). If you add/remove a country option in `index.html`, update `DIAL_CODES` so the ops ping shows a fully-dialable phone number.

## Key External Integrations

- **Telegram bot (customer-facing)**: `https://t.me/Gen8rBot` — used by customers to create campaigns
- **Telegram bot (internal notifications)**: `@gen8r_notify_bot` — receives form submission alerts via `api/notify.js`
- **Calendly**: `https://calendly.com/gen8r/30min`
- **Google Fonts**: Instrument Serif, DM Sans, JetBrains Mono
- **SEO**: Open Graph, Twitter Card meta tags, and JSON-LD structured data (SoftwareApplication + FAQPage schemas) are in `<head>`
- **Parent company**: LiftLogic AI (`https://liftlogic.dev`, `hello@liftlogic.dev`)

## Design System

- Dark theme (`--bg: #06060b`) with cyan accent (`--accent: #00e5ff`) and gold secondary (`--gold: #ffb800`)
- Typography: `--font-display` (Instrument Serif) for headings, `--font-body` (DM Sans) for text, `--font-mono` (JetBrains Mono) for code/labels
- Gradient palette defined in `--gradient-1` and `--gradient-2`
- Scroll-reveal animation system using `.reveal` class + IntersectionObserver (add `.reveal-delay-1` through `.reveal-delay-3` for staggered animations)
- Pricing tiers: Starter ($29), Growth ($49), Pro ($99) — the JSON-LD `AggregateOffer` in `<head>` carries `lowPrice`/`highPrice`/`offerCount`, so keep it in sync when prices or tier count change
