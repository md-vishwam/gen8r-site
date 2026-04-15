# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gen8r.ai — a landing page for an AI-powered social media campaign tool. The product lets small businesses describe a promotion (via Slack or Telegram), then generates and auto-publishes a 15-day social media campaign (captions, images, hashtags, reels) to Instagram and Facebook.

## Architecture

This is a **single-file static site** — everything lives in `index.html` (~1950 lines):
- **CSS** (lines ~11–1210): Custom properties in `:root`, component styles, responsive breakpoints, animations
- **HTML** (lines ~1213–1808): Sections in order: Nav, Hero, How It Works, Demo Preview, Features, Pricing, FAQ, Get Started (signup form + Telegram CTA + Calendly booking), Contact, Footer
- **JavaScript** (lines ~1810–end): Scroll reveal (IntersectionObserver), nav scroll/mobile toggle, FAQ accordion, signup toggle, form submission handlers (`signupForm`, `contactForm`), smooth-scroll for anchor links

No build tools, frameworks, bundlers, or package managers. To develop, open `index.html` in a browser.

## Form Submission Flow

Both `signupForm` and `contactForm` POST to `/api/notify` (a Vercel serverless function at `api/notify.js`). The function forwards submissions to a Telegram bot (`@gen8r_notify_bot`) via the Telegram Bot API. Bot token and chat ID are stored as Vercel environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). The data payloads include a `source` field (`gen8r-website-signup` / `gen8r-website-contact`) to distinguish notification types.

## Key External Integrations

- **Telegram bot (customer-facing)**: `https://t.me/Gen8rBot` — used by customers to create campaigns
- **Telegram bot (internal notifications)**: `@gen8r_notify_bot` — receives form submission alerts via `api/notify.js`
- **Calendly**: `https://calendly.com/liftlogic/30min`
- **Google Fonts**: Instrument Serif, DM Sans, JetBrains Mono
- **SEO**: Open Graph, Twitter Card meta tags, and JSON-LD structured data (SoftwareApplication + FAQPage schemas) are in `<head>`
- **Parent company**: LiftLogic AI (`https://liftlogic.dev`, `hello@liftlogic.dev`)

## Design System

- Dark theme (`--bg: #06060b`) with cyan accent (`--accent: #00e5ff`) and gold secondary (`--gold: #ffb800`)
- Typography: `--font-display` (Instrument Serif) for headings, `--font-body` (DM Sans) for text, `--font-mono` (JetBrains Mono) for code/labels
- Gradient palette defined in `--gradient-1` and `--gradient-2`
- Scroll-reveal animation system using `.reveal` class + IntersectionObserver (add `.reveal-delay-1` through `.reveal-delay-3` for staggered animations)
- Pricing tiers: Solo ($29), Pro ($79), Agency ($149) — referenced in JSON-LD structured data, so keep both in sync
