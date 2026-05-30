export const PILLARS = [
  { id: 1,  name: 'Competitor landscape',          autonomy: 'PARTIAL' },
  { id: 2,  name: 'SEO and organic search',        autonomy: 'PARTIAL' },
  { id: 3,  name: 'Google Ads',                    autonomy: 'PARTIAL' },
  { id: 4,  name: 'Meta Ads',                      autonomy: 'PARTIAL' },
  { id: 5,  name: 'Website and UX',                autonomy: 'FULL'    },
  { id: 6,  name: 'Offer, promotions and pricing', autonomy: 'FULL'    },
  { id: 7,  name: 'Email and CRM',                 autonomy: 'SETUP'   },
  { id: 8,  name: 'Social and content',            autonomy: 'PARTIAL' },
  { id: 9,  name: 'Influencer and affiliates',     autonomy: 'PARTIAL' },
  { id: 10, name: 'Marketplace and retail',        autonomy: 'SETUP'   },
  { id: 11, name: 'Partnerships and PR',           autonomy: 'FULL'    },
  { id: 12, name: 'Reviews, trust and reputation', autonomy: 'FULL'    },
  { id: 13, name: 'Tech stack and operations',     autonomy: 'FULL'    },
] as const;

export type PillarId = typeof PILLARS[number]['id'];

// Processing order: fully autonomous pillars first for fast early results
export const PILLAR_ORDER = [5, 6, 12, 13, 11, 1, 2, 4, 3, 8, 9, 10, 7];

export function getPillarChecklist(id: number): string {
  const checklists: Record<number, string> = {
    1: `- Identify top 3-5 direct competitors
- Price positioning vs market
- Channel mix (D2C vs marketplace)
- Estimated traffic and revenue signals (search for Similarweb/SEMrush data)
- Review sentiment vs competitors
- New entrants or private label threats`,

    2: `- Page titles, H1s, meta descriptions on homepage and one PDP
- robots.txt and sitemap presence (check [url]/robots.txt)
- Blog or content strategy existence and quality
- Internal linking structure
- Schema markup signals (product, review, FAQ)
- Any keyword ranking signals from search results
- Search for backlinks or domain authority signals`,

    3: `- Search Google Ads Transparency Centre for brand
- Run branded + category searches to check Shopping presence
- Check if brand ads appear for category keywords
- Look for remarketing (visit site, note if ads follow)
- Search SpyFu or SEMrush signals for paid activity`,

    4: `- Search Meta Ad Library for brand name
- Document all active creative formats (video/static/UGC)
- Analyse hooks, offers, and copy angles
- Note oldest running ads (longevity = strong performer)
- Check Instagram presence and follower count
- Assess whether pixel/tracking signals are present in source`,

    5: `- Browse homepage: proposition clarity within 5 seconds
- Check navigation depth and mobile hamburger menu
- Review one full PDP: images, copy, social proof, payment options, upsell
- Check checkout: number of steps, payment methods, trust signals
- Note: exit intent, back-in-stock, cart abandonment tools
- Check site speed signals (any obvious render-blocking issues)
- Mobile UX assessment`,

    6: `- Check for welcome pop-up (wait 10-15 seconds on homepage)
- Free shipping threshold (banner or footer)
- BNPL options on PDP (Klarna, Shop Pay, etc.)
- Bundle mechanics
- Loyalty or subscription programme
- Urgency/scarcity mechanics (stock counters, timers)
- Current active promotions`,

    7: `- Check for Klaviyo or other ESP in page scripts
- Sign up to email list (note pop-up offer, if any)
- Add product to cart then abandon (note if email follows)
- Check footer for SMS sign-up
- Look for post-purchase review request signals`,

    8: `- Find all active social channels (Instagram, TikTok, Pinterest, YouTube)
- Note follower counts and post frequency
- Assess content themes and quality
- Search for TikTok Shop presence
- Search hashtag for organic UGC volume
- Note engagement rate (approximate from visible likes/comments)`,

    9: `- Check Meta Ad Library for promo codes (signals influencer activity)
- Look for affiliate or ambassador programme on site
- Search brand + "discount code" or "collab"
- Assess authenticity of any influencer content found
- Note influencer tiers in play`,

    10: `- Search Amazon for brand name — note listing quality, reviews, A+ content
- Search Etsy for brand
- Check for retail partnerships (About page, press mentions)
- Note price consistency across channels
- Search for any marketplace advertising signals`,

    11: `- Search "[brand name] press" and "[brand name] featured in"
- Check homepage for as-seen-in badges
- Look for B Corp, ethical, or industry accreditations
- Search for podcast or newsletter sponsorships
- Note any co-brand or collaboration campaigns`,

    12: `- Search Trustpilot for brand (note rating and review volume)
- Search Google Reviews
- Read negative review themes (what do complaints have in common?)
- Check response rate to negative reviews
- Assess on-site review widget and star ratings on PDPs
- Check returns policy clarity`,

    13: `- Inspect page scripts for platform (Shopify/Magento/WooCommerce)
- Identify ESP (Klaviyo/Dotdigital/Mailchimp script)
- Check for analytics tags (GA4, GTM)
- Identify subscription platform (ReCharge, Skio)
- Check for live chat, returns management, loyalty app signals
- Note BuiltWith or Wappalyzer signals if available`,
  };
  return checklists[id] || '- Conduct a thorough audit of this pillar';
}
