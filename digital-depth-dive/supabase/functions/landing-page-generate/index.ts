const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LandingPageResult {
  html: string;
  variants: {
    headline: string;
    subheadline: string;
    cta: string;
  }[];
  conversionTips: string[];
  abTestSuggestions: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productDescription, businessName, style, targetAudience, features } = await req.json();

    if (!productDescription) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating landing page for: ${businessName || 'New Product'}`);

    // Generate headline variants
    const variants = generateHeadlineVariants(productDescription, targetAudience || 'general');
    
    // Generate HTML
    const html = generateLandingPageHtml({
      businessName: businessName || 'Your Brand',
      headline: variants[0].headline,
      subheadline: variants[0].subheadline,
      cta: variants[0].cta,
      productDescription,
      features: features || extractFeatures(productDescription),
      style: style || 'modern',
    });

    // Generate conversion tips
    const conversionTips = [
      'Add social proof (testimonials, logos, reviews) above the fold',
      'Use a contrasting color for your CTA button',
      'Include a clear value proposition in the headline',
      'Add urgency elements (limited time, scarcity)',
      'Remove navigation to keep focus on conversion',
      'Add trust badges near the CTA',
      'Use directional cues pointing to the form/button',
    ];

    // Generate A/B test suggestions
    const abTestSuggestions = [
      'Test benefit-focused vs. feature-focused headlines',
      'Try "Get Started Free" vs. "Start Your Free Trial"',
      'Compare long-form vs. short-form copy',
      'Test with/without video on the hero section',
      'Experiment with form field count',
    ];

    const result: LandingPageResult = {
      html,
      variants,
      conversionTips: conversionTips.slice(0, 5),
      abTestSuggestions: abTestSuggestions.slice(0, 3),
    };

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Landing page generation error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Generation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateHeadlineVariants(description: string, audience: string): { headline: string; subheadline: string; cta: string }[] {
  const words = description.split(/\s+/).slice(0, 10).join(' ');
  
  return [
    {
      headline: `Transform Your ${audience === 'b2b' ? 'Business' : 'Life'} Today`,
      subheadline: `Discover the smarter way to ${words.toLowerCase()}`,
      cta: 'Get Started Free',
    },
    {
      headline: `The #1 Solution for ${words.slice(0, 30)}`,
      subheadline: 'Join thousands of satisfied customers who made the switch',
      cta: 'Start Your Free Trial',
    },
    {
      headline: `Stop Wasting Time. Start ${words.slice(0, 20)}`,
      subheadline: 'The all-in-one platform that actually works',
      cta: 'See It In Action',
    },
  ];
}

function extractFeatures(description: string): string[] {
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
  return sentences.slice(0, 4).map(s => s.trim());
}

function generateLandingPageHtml(config: {
  businessName: string;
  headline: string;
  subheadline: string;
  cta: string;
  productDescription: string;
  features: string[];
  style: string;
}): string {
  const primaryColor = config.style === 'bold' ? '#6366f1' : config.style === 'minimal' ? '#000000' : '#0d9488';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${config.productDescription.slice(0, 160)}">
  <title>${config.businessName} - ${config.headline}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1a1a2e; }
    
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, ${primaryColor}10 0%, #ffffff 100%);
    }
    
    .hero-content { max-width: 800px; }
    
    .badge {
      display: inline-block;
      background: ${primaryColor}15;
      color: ${primaryColor};
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    
    h1 {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 800;
      margin-bottom: 1.5rem;
      line-height: 1.1;
    }
    
    .subheadline {
      font-size: 1.25rem;
      color: #666;
      margin-bottom: 2.5rem;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .cta-group { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    
    .btn-primary {
      background: ${primaryColor};
      color: white;
      padding: 1rem 2.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px ${primaryColor}40;
    }
    
    .btn-secondary {
      background: transparent;
      color: #333;
      padding: 1rem 2.5rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.2s;
    }
    
    .btn-secondary:hover { border-color: ${primaryColor}; }
    
    .trust-badges {
      margin-top: 3rem;
      display: flex;
      gap: 2rem;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      opacity: 0.6;
    }
    
    .trust-badges span { font-size: 0.875rem; color: #666; }
    
    .features {
      padding: 6rem 2rem;
      background: #f8fafc;
    }
    
    .features-container { max-width: 1200px; margin: 0 auto; }
    
    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }
    
    .section-header h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    .section-header p {
      color: #666;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }
    
    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    }
    
    .feature-icon {
      width: 50px;
      height: 50px;
      background: ${primaryColor}15;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    
    .feature-card h3 { margin-bottom: 0.5rem; }
    .feature-card p { color: #666; font-size: 0.95rem; }
    
    .cta-section {
      padding: 6rem 2rem;
      text-align: center;
      background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
      color: white;
    }
    
    .cta-section h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    .cta-section p {
      margin-bottom: 2rem;
      opacity: 0.9;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .cta-section .btn-primary {
      background: white;
      color: ${primaryColor};
    }
    
    footer {
      padding: 2rem;
      text-align: center;
      background: #1a1a2e;
      color: rgba(255,255,255,0.7);
    }
    
    @media (max-width: 768px) {
      h1 { font-size: 2rem; }
      .cta-group { flex-direction: column; }
      .btn-primary, .btn-secondary { width: 100%; text-align: center; }
    }
  </style>
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <span class="badge">✨ ${config.businessName}</span>
      <h1>${config.headline}</h1>
      <p class="subheadline">${config.subheadline}</p>
      <div class="cta-group">
        <a href="#signup" class="btn-primary">${config.cta}</a>
        <a href="#features" class="btn-secondary">Learn More</a>
      </div>
      <div class="trust-badges">
        <span>⭐ 4.9/5 Rating</span>
        <span>👥 10,000+ Users</span>
        <span>🔒 Secure & Private</span>
      </div>
    </div>
  </section>

  <section class="features" id="features">
    <div class="features-container">
      <div class="section-header">
        <h2>Why Choose Us</h2>
        <p>Everything you need to succeed, all in one place.</p>
      </div>
      <div class="features-grid">
        ${config.features.slice(0, 4).map((feature, i) => `
        <div class="feature-card">
          <div class="feature-icon">${['⚡', '🎯', '📈', '💎'][i]}</div>
          <h3>Feature ${i + 1}</h3>
          <p>${feature.slice(0, 100)}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="cta-section" id="signup">
    <h2>Ready to Get Started?</h2>
    <p>Join thousands of others who have already transformed their results.</p>
    <a href="#" class="btn-primary">${config.cta}</a>
  </section>

  <footer>
    <p>© ${new Date().getFullYear()} ${config.businessName}. All rights reserved.</p>
  </footer>
</body>
</html>`;
}
