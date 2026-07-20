// ── Programmatic SEO content data ────────────────────────────────────────────
// The raw material for the /c/ landing pages. Each generated page is one
// (vertical × contentType) combo. To add coverage, add a row here and re-run
// `node seo/generate.js` — no template changes needed.
//
// Content is hand-authored for now so every page is substantive (thin,
// duplicated pages get demoted by Google — the whole point of this engine is
// pages that are actually useful). When the app.gen8r.ai generation endpoint is
// reachable, real generated campaigns can replace/augment the `captions`,
// `reelIdeas`, and plan output per vertical.
//
// CITY EXPANSION (implemented): the `cities` array below re-emits selected
// guides per city (slug extended with `-in-<slug>`) and powers a local landing
// page. Which content types get localized is controlled by GEO_CONTENT_TYPES in
// generate.js. Keep geo pages genuinely local (see the `cities` note) so they
// don't get demoted as doorway pages.

// "a" vs "an" for a following word — so vowel-initial verticals (event venue)
// read correctly in titles, headings, and prose. Slugs keep the flat `-for-a-`.
const art = (w) => (/^[aeiou]/i.test(String(w).trim()) ? 'an' : 'a');

const brand = {
  name: 'gen8r',
  origin: 'https://gen8r.ai',
  tagline: 'AI social media campaigns for small business',
  // Social profiles → emitted as Organization `sameAs` for entity/brand SEO.
  // Keep in sync with the footer + Organization schema in index.html. Swap the
  // numeric Facebook URL for /gen8r once the vanity username is claimed.
  social: [
    'https://www.facebook.com/profile.php?id=61589032155158',
    'https://www.instagram.com/gen8rai',
    'https://www.youtube.com/@gen8r',
    'https://www.tiktok.com/@gen8rai',
    'https://www.pinterest.com/doshi4582/gen8r/',
    'https://www.reddit.com/r/Gen8R/',
  ],
};

const verticals = [
  {
    slug: 'yoga-studio',
    name: 'yoga studio',
    title: 'Yoga Studio',
    audience: 'students looking for calm, community, and a consistent practice',
    promo: 'a new-member intro offer',
    vibe: 'calm, encouraging, and wellness-forward',
    captions: [
      'Roll out your mat, leave the week behind. New here? Your first class is on us. 🧘',
      'Breathe in for four, out for six. That’s the whole reset. See you on the mat this week.',
      'Community over competition — every body is a yoga body. Bring a friend, we saved you a spot. 🌿',
    ],
    reelIdeas: [
      'A 15-second “Sunday reset” flow — three poses, calming voiceover, class times on the end card.',
      'Time-lapse of the studio filling up before a packed evening class, set to a lo-fi track.',
      'A student’s 30-day transformation, before/after their first month of unlimited classes.',
    ],
    hashtags: ['#yogastudio', '#yogaeverydamnday', '#yogacommunity', '#namaste', '#yogalife'],
  },
  {
    slug: 'coffee-shop',
    name: 'coffee shop',
    title: 'Coffee Shop',
    audience: 'regulars and passers-by who want a better cup and a reason to linger',
    promo: 'a free refill or a new seasonal drink',
    vibe: 'warm, energetic, and a little playful',
    captions: [
      'Your 3pm slump called. We answered — with a fresh single-origin pour. ☕',
      'Beans roasted this week, pulled this morning, in your hands right now. Taste the difference.',
      'Bring a friend, we’ll bring the oat-milk latte art. First refill’s on the house today. 🫶',
    ],
    reelIdeas: [
      'Close-up pour of the new seasonal latte, steam rising, with the recipe teased on screen.',
      'A “day in the life” of the morning rush at 7am — grinder, steam wand, first customer smile.',
      'Barista ranks the top three drinks nobody orders but everybody should. Menu on the end card.',
    ],
    hashtags: ['#coffeeshop', '#specialtycoffee', '#coffeelover', '#latteart', '#localcoffee'],
  },
  {
    slug: 'real-estate-agent',
    name: 'real estate agent',
    title: 'Real Estate Agent',
    audience: 'buyers and sellers deciding whether now is the right time to move',
    promo: 'a free home valuation or a new listing tour',
    vibe: 'confident, helpful, and locally credible',
    captions: [
      'Just listed: three beds, light-drenched, walk-to-everything. DM for a private tour before it’s gone. 🔑',
      'Thinking of selling this year? Here’s what your neighborhood actually sold for last month. 📈',
      'Keys handed over, another family home. This is the part of the job I love most. 🏡',
    ],
    reelIdeas: [
      'A 20-second walkthrough of a new listing’s best three rooms, with the price reveal at the end.',
      '“Three things buyers get wrong about this market” — quick talking-head with on-screen captions.',
      'Sold-in-a-weekend story: listing photo, offer count, and the happy handover.',
    ],
    hashtags: ['#realestate', '#justlisted', '#homesforsale', '#realtorlife', '#dreamhome'],
  },
  {
    slug: 'restaurant',
    name: 'restaurant',
    title: 'Restaurant',
    audience: 'locals choosing where to eat tonight and regulars worth bringing back',
    promo: 'a new menu, a nightly special, or a limited-time deal',
    vibe: 'appetizing, inviting, and a little urgent',
    captions: [
      'Tonight’s special is gone by 8 for a reason. Book your table now. 🍝',
      'New menu drop — same kitchen you trust, three dishes you haven’t tried yet. Swipe for the lineup.',
      'Two-for-one on the patio, Thursday only. Bring the crew, we’ll bring the plates. 🍷',
    ],
    reelIdeas: [
      'The signature dish coming together in the kitchen, 10 seconds, plated at the end.',
      'A “what $30 gets you here” tasting run — three plates, one price, on-screen labels.',
      'Friday-night patio time-lapse, glasses clinking, with your booking link on the end card.',
    ],
    hashtags: ['#restaurant', '#foodie', '#eatlocal', '#nowserving', '#dinnertonight'],
  },
  {
    slug: 'hair-salon',
    name: 'hair salon',
    title: 'Hair Salon',
    audience: 'new clients hunting for a stylist and regulars due for their next appointment',
    promo: 'a first-visit discount or a seasonal color offer',
    vibe: 'stylish, confident, and personal',
    captions: [
      'New season, new you. Fall color slots are filling fast — book before they’re gone. 💇',
      'That “I woke up like this” blowout? It’s a 45-minute appointment. Treat yourself this week.',
      'Show us this post for 20% off your first cut. New clients, we’ve been waiting for you. ✨',
    ],
    reelIdeas: [
      'A satisfying color transformation, before → foils → reveal, in 15 seconds.',
      'Stylist’s three-step tip for making a blowout last five days, shot at the chair.',
      'New-client walk-in to walk-out glow-up, with the booking link on the end card.',
    ],
    hashtags: ['#hairsalon', '#hairtransformation', '#balayage', '#hairstylist', '#newhairnewme'],
  },
  {
    slug: 'event-venue',
    name: 'event venue',
    title: 'Event Venue',
    audience: 'couples, companies, and organizers deciding where to host their next event',
    promo: 'a venue tour offer or an off-peak date discount',
    vibe: 'aspirational, vivid, and celebratory',
    captions: [
      'Picture your day here: golden-hour light, room for everyone, a view they won’t stop talking about. Book a tour this week. ✨',
      'Off-peak dates just opened — same unforgettable space, a friendlier price. DM us before they’re taken. 🥂',
      'From the first toast to the last dance, this room was built for the moment. Enquire for available dates.',
    ],
    reelIdeas: [
      'A 15-second walkthrough from empty room to fully-styled event, with the reveal on the beat drop.',
      'Time-lapse of a setup coming together — tables, lights, flowers — ending on the finished space at dusk.',
      'A quick “three ways to use this space” tour (wedding, corporate, party) with enquiry details on the end card.',
    ],
    hashtags: ['#eventvenue', '#weddingvenue', '#eventspace', '#venuehire', '#corporateevents'],
  },
];

// ── Cities (geo expansion) ───────────────────────────────────────────────────
// Each city localizes the guide pages (slug gets `-in-<slug>`) and powers a
// dedicated local landing page. To keep Google from treating geo variants as
// doorway pages, every city carries REAL local signal per vertical (a genuine
// local angle, taggable suburbs, and local hashtags) — not just a name swap.
// Adding a city = add one object here (with a byVertical entry per vertical) and
// re-run the generator. Start narrow, prove it ranks, then scale.
const cities = [
  {
    slug: 'sydney',
    name: 'Sydney',
    region: 'Australia',
    // Used by the local marketing landing page intro/meta.
    blurb:
      'Sydney small businesses compete for attention on the same feeds as everyone else — but the ones that win post consistently, locally, and on-brand.',
    hashtags: ['#sydney', '#sydneysmallbusiness', '#supportlocalsydney'],
    byVertical: {
      'yoga-studio': {
        angle:
          'From Bondi to the Inner West, Sydney’s wellness crowd is spoilt for choice — your posts have to feel like a local exhale, not a franchise.',
        suburbs: 'Bondi, Newtown, and Manly',
        hashtags: ['#sydneyyoga', '#bondiyoga', '#yogasydney'],
      },
      'coffee-shop': {
        angle:
          'Sydney runs on coffee, and Surry Hills, Newtown and Manly set a brutal bar for a flat white — local regulars notice everything.',
        suburbs: 'Surry Hills, Newtown, and Manly',
        hashtags: ['#sydneycoffee', '#sydneycafe', '#surryhills'],
      },
      'real-estate-agent': {
        angle:
          'The Sydney market moves on suburb-level trust — buyers and sellers from the Inner West to the Northern Beaches want an agent who clearly owns their pocket.',
        suburbs: 'the Inner West, Northern Beaches, and Eastern Suburbs',
        hashtags: ['#sydneyrealestate', '#sydneyproperty', '#sydneyhomes'],
      },
      restaurant: {
        angle:
          'Sydney diners choose on the feed — from Surry Hills small bars to Darling Harbour, tonight’s booking is won on Instagram before anyone reads a menu.',
        suburbs: 'Surry Hills, Newtown, and Darling Harbour',
        hashtags: ['#sydneyeats', '#sydneyfood', '#sydneyrestaurant'],
      },
      'hair-salon': {
        angle:
          'Sydney clients book the look they see — the CBD-to-Bondi salon scene is crowded, and a strong feed is your chair’s best marketing.',
        suburbs: 'the CBD, Bondi, and Paddington',
        hashtags: ['#sydneyhair', '#sydneysalon', '#bondihair'],
      },
      'event-venue': {
        angle:
          'Sydney is a backdrop that sells itself — harbour views, warehouse spaces, rooftop bars — so your feed just has to make organizers picture their event there.',
        suburbs: 'The Rocks, Darling Harbour, and the Inner West',
        hashtags: ['#sydneyevents', '#sydneyvenue', '#sydneyweddings'],
      },
    },
  },
];

const contentTypes = [
  {
    slug: 'instagram-captions',
    noun: 'Instagram captions',
    // What the page is "about" — drives <title>, <h1>, and canonical query.
    label: (v) => `Instagram Captions for ${art(v.title)} ${v.title}`,
    query: (v) => `instagram captions for ${art(v.name)} ${v.name}`,
    intro: (v) =>
      `Writing Instagram captions for ${art(v.name)} ${v.name} every day is the part that quietly eats your week. ` +
      `Below are ready-to-post captions written in a ${v.vibe} voice for ${v.audience} — plus the hashtags ` +
      `that actually get seen. Use them as-is, or let gen8r generate a fresh set (and the images to match) automatically.`,
    // Which sample block the template renders for this content type.
    sample: 'captions',
  },
  {
    slug: '10-day-social-media-plan',
    noun: '10-day social media plan',
    label: (v) => `A 10-Day Social Media Plan for ${art(v.title)} ${v.title}`,
    query: (v) => `social media plan for ${art(v.name)} ${v.name}`,
    intro: (v) =>
      `The hardest part of social media for ${art(v.name)} ${v.name} isn’t any single post — it’s keeping it going day after day. ` +
      `Here’s a proven 10-day arc built around ${v.promo}, tuned for ${v.audience}. It’s the same structure gen8r generates ` +
      `and publishes for you automatically, so you approve instead of author.`,
    sample: 'plan',
  },
  {
    slug: 'instagram-reel-ideas',
    noun: 'Instagram Reel ideas',
    label: (v) => `Instagram Reel Ideas for ${art(v.title)} ${v.title}`,
    query: (v) => `reel ideas for ${art(v.name)} ${v.name}`,
    intro: (v) =>
      `Reels are where ${art(v.name)} ${v.name} gets discovered by people who don’t follow you yet — but only if you keep shipping them. ` +
      `Here are Reel ideas built for ${v.audience}, each one shootable on a phone in a few minutes. gen8r can turn ideas ` +
      `like these into finished, captioned videos as part of your campaign.`,
    sample: 'reels',
  },
];

// A generic 10-day arc, specialized per vertical at render time. Kept here so
// every "plan" page shares a credible backbone while reading uniquely. This
// mirrors the 10 posts gen8r actually generates for a campaign.
function tenDayPlan(v) {
  return [
    { day: 1, theme: 'Introduce the offer', post: `Announce ${v.promo} with a scroll-stopping image and a clear “here’s what you get.”` },
    { day: 2, theme: 'Behind the scenes', post: `A candid look at what makes your ${v.name} different — the people, the process, the details.` },
    { day: 3, theme: 'Social proof', post: 'Share a real review or a customer story that speaks to the people you want more of.' },
    { day: 4, theme: 'Educate', post: `Answer the one question ${v.audience} always ask before they commit.` },
    { day: 5, theme: 'Reel', post: v.reelIdeas[0] },
    { day: 6, theme: 'Offer reminder', post: `Nudge on ${v.promo} with a fresh angle and a deadline.` },
    { day: 7, theme: 'Community', post: 'Feature a regular, a staff pick, or a local partner — show you belong here.' },
    { day: 8, theme: 'Reel', post: v.reelIdeas[1] },
    { day: 9, theme: 'Last call', post: `Final reminder on ${v.promo} — urgency + a single, obvious next step.` },
    { day: 10, theme: 'Thank you + next', post: 'Thank everyone who engaged and tease what’s coming next so momentum carries.' },
  ];
}

module.exports = { brand, verticals, contentTypes, cities, tenDayPlan, art };
