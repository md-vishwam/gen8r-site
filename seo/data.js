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
// CITY EXPANSION (hybrid plan): verticals carry no geo yet. When a page proves
// it ranks, the same template can be re-emitted per city by extending the slug
// with `-in-<city>` and threading a `city` field through — the template already
// keys everything off the vertical object.

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
];

const contentTypes = [
  {
    slug: 'instagram-captions',
    noun: 'Instagram captions',
    // What the page is "about" — drives <title>, <h1>, and canonical query.
    label: (v) => `Instagram Captions for a ${v.title}`,
    query: (v) => `instagram captions for a ${v.name}`,
    intro: (v) =>
      `Writing Instagram captions for a ${v.name} every day is the part that quietly eats your week. ` +
      `Below are ready-to-post captions written in a ${v.vibe} voice for ${v.audience} — plus the hashtags ` +
      `that actually get seen. Use them as-is, or let gen8r generate a fresh set (and the images to match) automatically.`,
    // Which sample block the template renders for this content type.
    sample: 'captions',
  },
  {
    slug: '15-day-social-media-plan',
    noun: '15-day social media plan',
    label: (v) => `A 15-Day Social Media Plan for a ${v.title}`,
    query: (v) => `social media plan for a ${v.name}`,
    intro: (v) =>
      `The hardest part of social media for a ${v.name} isn’t any single post — it’s keeping it going for two straight weeks. ` +
      `Here’s a proven 15-day arc built around ${v.promo}, tuned for ${v.audience}. It’s the same structure gen8r generates ` +
      `and publishes for you automatically, so you approve instead of author.`,
    sample: 'plan',
  },
  {
    slug: 'instagram-reel-ideas',
    noun: 'Instagram Reel ideas',
    label: (v) => `Instagram Reel Ideas for a ${v.title}`,
    query: (v) => `reel ideas for a ${v.name}`,
    intro: (v) =>
      `Reels are where a ${v.name} gets discovered by people who don’t follow you yet — but only if you keep shipping them. ` +
      `Here are Reel ideas built for ${v.audience}, each one shootable on a phone in a few minutes. gen8r can turn ideas ` +
      `like these into finished, captioned videos as part of your campaign.`,
    sample: 'reels',
  },
];

// A generic 15-day arc, specialized per vertical at render time. Kept here so
// every "plan" page shares a credible backbone while reading uniquely.
function fifteenDayPlan(v) {
  return [
    { day: 1, theme: 'Introduce the offer', post: `Announce ${v.promo} with a scroll-stopping image and a clear “here’s what you get.”` },
    { day: 2, theme: 'Behind the scenes', post: `A candid look at what makes your ${v.name} different — the people, the process, the details.` },
    { day: 3, theme: 'Social proof', post: 'Share a real review or a customer story that speaks to the people you want more of.' },
    { day: 4, theme: 'Educate', post: `Answer the one question ${v.audience} always ask before they commit.` },
    { day: 5, theme: 'Reel', post: v.reelIdeas[0] },
    { day: 6, theme: 'Offer reminder', post: `Nudge on ${v.promo} with a fresh angle and a deadline.` },
    { day: 7, theme: 'Community', post: 'Feature a regular, a staff pick, or a local partner — show you belong here.' },
    { day: 8, theme: 'Value post', post: 'A quick tip or list your audience will save and come back to.' },
    { day: 9, theme: 'Reel', post: v.reelIdeas[1] },
    { day: 10, theme: 'Story-style', post: 'A day-in-the-life sequence that makes people feel the vibe before they visit.' },
    { day: 11, theme: 'Testimonial', post: 'A second, different customer voice — variety builds trust.' },
    { day: 12, theme: 'Objection-buster', post: `Tackle the reason someone hesitates about a ${v.name} like yours, head-on.` },
    { day: 13, theme: 'Reel', post: v.reelIdeas[2] },
    { day: 14, theme: 'Last call', post: `Final reminder on ${v.promo} — urgency + a single, obvious next step.` },
    { day: 15, theme: 'Thank you + next', post: 'Thank everyone who engaged and tease what’s coming next so momentum carries.' },
  ];
}

module.exports = { brand, verticals, contentTypes, fifteenDayPlan };
