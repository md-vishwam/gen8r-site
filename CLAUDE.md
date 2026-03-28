# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

gen8r.ai — a landing page for an AI-powered social media campaign tool. The product lets small businesses describe a promotion (via Slack or Telegram), then generates and auto-publishes a 15-day social media campaign (captions, images, hashtags, reels) to Instagram and Facebook.

## Architecture

This is a **single-file static site** — everything lives in `index.html` (~1850 lines):
- **CSS** (lines ~11–1210): Custom properties in `:root`, component styles, responsive breakpoints, animations
- **HTML** (lines ~1213–1714): Sections in order: Nav, Hero, How It Works, Demo Preview, Features, Pricing, FAQ, Get Started (signup form + Telegram CTA + Calendly booking), Contact, Footer
- **JavaScript** (lines ~1715–end): Scroll-based reveal animations, mobile nav toggle, FAQ accordion, form submission handlers (`signupForm`, `contactForm`)

No build tools, frameworks, bundlers, or package managers. To develop, open `index.html` in a browser.

## Key External Integrations

- **Telegram bot**: `https://t.me/travelcampaign_bot`
- **Calendly**: `https://calendly.com/liftlogic/30min`
- **Google Fonts**: Instrument Serif, DM Sans, JetBrains Mono

## Design System

- Dark theme (`--bg: #06060b`) with cyan accent (`--accent: #00e5ff`) and gold secondary (`--gold: #ffb800`)
- Typography: `--font-display` (Instrument Serif) for headings, `--font-body` (DM Sans) for text, `--font-mono` (JetBrains Mono) for code/labels
- Gradient palette defined in `--gradient-1` and `--gradient-2`
- Scroll-reveal animation system using `.reveal` class + IntersectionObserver
