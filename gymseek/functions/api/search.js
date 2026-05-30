// Cloudflare Pages Function — POST /api/search
// Proxies to Groq API (no Node.js — pure Web APIs)

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';

const FACILITIES = [
  { id: 'gymFloor',   label: 'Gym floor' },
  { id: 'classes',    label: 'Classes' },
  { id: 'pool',       label: 'Pool' },
  { id: 'sauna',      label: 'Sauna/Steam' },
  { id: 'jacuzzi',    label: 'Hot tub/Plunge' },
  { id: 'tennis',     label: 'Tennis/Padel' },
  { id: 'squash',     label: 'Squash' },
  { id: 'spa',        label: 'Spa/Beauty' },
  { id: 'pt',         label: 'PT included' },
  { id: 'access24',   label: '24/7 access' },
  { id: 'noContract', label: 'No contract' },
];

const ELIGIBILITY = [
  { id: 'blueLight',    label: 'Blue Light Card' },
  { id: 'nhs',          label: 'NHS worker' },
  { id: 'student',      label: 'Student' },
  { id: 'over60',       label: 'Over 60' },
  { id: 'under18',      label: 'Under 18' },
  { id: 'universal',    label: 'Universal Credit' },
  { id: 'corporate',    label: 'Corporate scheme (Gympass/Wellhub)' },
  { id: 'amexPlat',     label: 'Amex Platinum' },
  { id: 'chase',        label: 'Chase card' },
  { id: 'hsbcPrem',     label: 'HSBC Premier' },
  { id: 'barclaysPrem', label: 'Barclays Premier' },
  { id: 'newCustomer',  label: 'New customer' },
];

const SYSTEM_PROMPT = `You are GymSeek, a brutally honest UK gym deal-finding assistant in the style of MoneySavingExpert — you tell users what's genuinely good, what the catches are, and what they should watch out for. Use web search to find current pricing where possible.

You know about:
- All major UK gym chains: PureGym, The Gym Group, Nuffield Health, Bannatyne's, David Lloyd, JD Gyms, Anytime Fitness, Everyone Active, Better (GLL), Village Gym, Fitness First, Virgin Active, Energie Fitness
- Council / local authority leisure centres (GLL/Better, Everyone Active, Places Leisure) — always include these, they are typically 30–50% cheaper than private chains
- Blue Light Card discounts (NHS, emergency services, armed forces) — typically 15–25% off at major chains
- Student discounts via UNiDAYS and Student Beans — typically 10–20% off
- Gympass / Wellhub corporate pricing — often 30–50% off standard rates
- NHS Staff Benefits / Health Service Discounts portal deals
- Card perks: Amex Platinum (can include premium gym access), Chase, HSBC Premier, Barclays Premier
- PayAsUGym, Hussle, ClassPass as flexible PAYG alternatives
- App-only rates — PureGym and The Gym Group are typically £2–4/mo cheaper when joining via their app
- TopCashback / Quidco — frequently offer £15–30 cashback on new gym sign-ups
- Current typical price ranges (2024–2025):
  - Budget chains (PureGym, The Gym Group): £18–30/mo
  - Mid-tier (Nuffield, Bannatyne's, JD Gyms): £25–50/mo
  - Premium (David Lloyd, Virgin Active, Fitness First): £50–120/mo
  - Council leisure centres: £15–30/mo (concessionary rates often 40% lower)

Search the web for the specific gyms in the user's area to find current pricing, current joining fee offers, and any active promotions before responding.

Return ONLY valid JSON — no markdown fences, no text outside the JSON:
{
  "summary": "2-sentence overview of the best opportunities in this area — be specific about savings available",
  "gyms": [
    {
      "name": "Full gym name",
      "chain": "Chain name or Independent",
      "distance": "Specific estimate — e.g. 'City centre', '~0.5 miles N of centre', '~1.2 miles SE'",
      "facilities": {"gymFloor":true,"classes":true,"pool":false,"sauna":false,"jacuzzi":false,"tennis":false,"squash":false,"spa":false,"pt":false,"access24":true,"noContract":true},
      "standardPrice": 29.99,
      "bestPrice": 22.50,
      "dealType": "Blue Light Card — approx 20% off",
      "howToClaim": "Exact actionable steps — e.g. 'Go to bluelightcard.co.uk, search PureGym, click the offer link, and sign up through that portal. Do NOT join via the main PureGym website or you lose the discount.'",
      "whyPick": "One honest sentence making the case for or against this gym.",
      "contract": "Rolling monthly",
      "joiningFee": 0,
      "joiningFeeNote": "Often waived — check current offer",
      "dealScore": 4.2,
      "tags": ["bestOverall"],
      "smartFlags": [
        {"type": "APP", "text": "Join via the PureGym app — the in-app rate is £2–3/mo cheaper than the website rate and takes 2 minutes."},
        {"type": "WATCHOUT", "text": "Prices are reviewed annually in January — your rate will likely increase by £1–3/mo after 12 months."}
      ],
      "cashback": "TopCashback often offers £20–25 cashback on new PureGym sign-ups — check before joining.",
      "priceSource": "estimate",
      "priceVerified": false,
      "verifyUrl": "https://www.puregym.com/memberships/",
      "notes": "Prices based on training data — verify current rates before joining"
    }
  ],
  "topPicks": {"bestOverall": "Gym Name", "cheapest": "Gym Name", "mostFlexible": "Gym Name"},
  "globalFlags": ["Always check your local council leisure centre — consistently 30–50% cheaper than private chains."],
  "disclaimer": "Prices are approximate and based on typical rates as of 2024–2025. Always verify current pricing directly with the gym before joining."
}

Rules:
- Include 4–6 gyms plausibly in or near the user's location.
- Always include the local council leisure centre. If you find a specific one via web search, use its real name.
- Sort by dealScore descending.
- tags: use only ["bestOverall","cheapest","mostFlexible"] — one gym per tag, a gym can hold multiple.
- dealScore 1.0–5.0: facility match vs requested (40%), price vs budget (30%), discount depth (20%), contract flexibility (10%).
- NEVER stack discounts — show only the single best eligible discount.
- Always include exactly 2 smartFlags per gym: one actionable tip (type: APP, BLC, STUDENT, CARD, COUNCIL, CORPORATE, FREE_TRIAL) and one WATCHOUT.
- whyPick: be honest. If a gym is overpriced relative to alternatives, say so.
- priceSource: "web" if found via search, "estimate" if using training data only.
- Return ONLY the JSON object, nothing else.`;

function buildUserMessage(profile) {
  const facs = FACILITIES.filter(f => (profile.facilities || []).includes(f.id)).map(f => f.label);
  const elis = ELIGIBILITY.filter(e => (profile.eligibility || []).includes(e.id)).map(e => e.label);
  const freq = { daily: 'Daily', few: 'A few times a week', occasional: 'Occasionally' }[profile.frequency] || profile.frequency;
  return `USER PROFILE:
Location: ${profile.location}
Monthly budget: £${profile.budget}
Facilities needed: ${facs.length ? facs.join(', ') : 'Just a basic gym floor'}
Usage frequency: ${freq}
Discounts/eligibility: ${elis.length ? elis.join(', ') : 'None'}${profile.notes ? `\nExtra preferences: ${profile.notes}` : ''}

Search for current gym prices in ${profile.location} then return the JSON with the best deals.`;
}

async function callGroq(apiKey, model, profile) {
  const r = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildUserMessage(profile) },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    // Fallback to standard model on any non-auth error
    if (r.status !== 401 && r.status !== 403 && model !== FALLBACK_MODEL) {
      console.log(`[fallback] ${model} returned ${r.status}, retrying with ${FALLBACK_MODEL}`);
      return callGroq(apiKey, FALLBACK_MODEL, profile);
    }
    return { error: err?.error?.message || `Groq API error ${r.status}`, status: r.status };
  }

  const data = await r.json();
  return { text: data.choices?.[0]?.message?.content || '', model };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your_groq_key_here') {
    return json({ error: 'GROQ_API_KEY not configured — add it in Cloudflare Pages > Settings > Environment Variables' }, 500);
  }

  let profile;
  try {
    profile = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (!profile.location || !profile.budget) {
    return json({ error: 'Missing location or budget' }, 400);
  }

  const model = env.GROQ_MODEL || 'compound-beta';

  try {
    const result = await callGroq(apiKey, model, profile);
    if (result.error) return json({ error: result.error }, result.status || 500);
    return json({ raw: result.text, model: result.model });
  } catch (err) {
    return json({ error: err.message || 'Server error' }, 500);
  }
}
