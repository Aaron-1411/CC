const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone validation - at least 10 digits
const phoneRegex = /[\d\s\-().+]{10,}/;

// Clean and validate email
function cleanEmail(email: string | null): string | null {
  if (!email) return null;
  const cleaned = email.toLowerCase().trim();
  // Filter out common non-business emails
  const invalidPatterns = [
    'example.com', 'test.com', 'sample.com', 'domain.com',
    'yourwebsite', 'email@', 'noreply', 'no-reply', 'donotreply'
  ];
  if (invalidPatterns.some(p => cleaned.includes(p))) return null;
  return emailRegex.test(cleaned) ? cleaned : null;
}

// Clean and format phone
function cleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) return null;
  // Format as standard US number if 10-11 digits
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0,3)}) ${digitsOnly.slice(3,6)}-${digitsOnly.slice(6)}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1,4)}) ${digitsOnly.slice(4,7)}-${digitsOnly.slice(7)}`;
  }
  return phone.trim();
}

// Calculate lead quality score
function calculateLeadScore(lead: any): number {
  let score = 0;
  
  // Has verified email (+40)
  if (lead.email && emailRegex.test(lead.email)) score += 40;
  
  // Has phone number (+25)
  if (lead.phone && phoneRegex.test(lead.phone.replace(/\D/g, ''))) score += 25;
  
  // Has website (+15)
  if (lead.website && lead.website.startsWith('http')) score += 15;
  
  // Has description (+10)
  if (lead.description && lead.description.length > 20) score += 10;
  
  // Business email domain (+10)
  if (lead.email && !lead.email.includes('gmail.com') && 
      !lead.email.includes('yahoo.com') && 
      !lead.email.includes('hotmail.com') &&
      !lead.email.includes('outlook.com')) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

// Deduplicate leads by website domain or email
function deduplicateLeads(leads: any[]): any[] {
  const seen = new Set<string>();
  return leads.filter(lead => {
    const domain = lead.website ? new URL(lead.website).hostname.replace('www.', '') : '';
    const email = lead.email || '';
    const key = domain || email;
    
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchResults, enrichDetails = true } = await req.json();

    if (!searchResults || !Array.isArray(searchResults)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search results are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare content for extraction with more context
    const combinedContent = searchResults.map((result: any, index: number) => {
      const content = result.markdown || result.description || '';
      return `
--- RESULT ${index + 1} ---
URL: ${result.url || 'Unknown'}
Title: ${result.title || 'Unknown'}
Content: ${content.slice(0, 4000)}
`;
    }).join('\n');

    const systemPrompt = `You are an enterprise-grade lead extraction specialist with expertise in:
- Identifying business contact information from web content
- Extracting emails, phone numbers, addresses, and social profiles
- Determining business type, size, and decision-maker information
- Qualifying leads based on business signals

EXTRACTION RULES:
1. Email patterns: name@domain.com, info@, contact@, sales@, hello@
2. Phone patterns: (XXX) XXX-XXXX, +1-XXX-XXX-XXXX, XXX.XXX.XXXX
3. Business indicators: years in business, team size, service areas
4. Social profiles: LinkedIn, Facebook, Twitter handles if visible

CRITICAL: Only extract REAL information found in the content. Never fabricate data.
Mark uncertain data with confidence levels.`;

    const extractionPrompt = `Extract comprehensive business lead information from these search results.

SEARCH RESULTS:
${combinedContent}

For each business found, extract as much information as possible.
Respond with valid JSON in this exact format:

{
  "leads": [
    {
      "name": "Business Name",
      "email": "email@domain.com or null",
      "phone": "formatted phone or null",
      "website": "https://business-website.com",
      "description": "What this business does (1-2 sentences)",
      "address": "Physical address if found or null",
      "category": "Business category/type",
      "socialProfiles": {
        "linkedin": "URL or null",
        "facebook": "URL or null",
        "twitter": "handle or null"
      },
      "businessSignals": {
        "yearsInBusiness": "number or null",
        "employeeCount": "string estimate or null",
        "serviceAreas": ["array of service areas/locations"]
      },
      "decisionMaker": {
        "name": "Owner/manager name if found or null",
        "title": "Their title if found or null"
      },
      "extractionConfidence": {
        "email": "high/medium/low/none",
        "phone": "high/medium/low/none",
        "overall": "high/medium/low"
      }
    }
  ],
  "extractionStats": {
    "totalProcessed": "number",
    "leadsFound": "number",
    "withEmail": "number",
    "withPhone": "number"
  }
}

QUALITY GUIDELINES:
- Prioritize business emails over personal (gmail, yahoo)
- Include area codes for phone numbers
- Verify website URLs match the business
- Note if info seems outdated or uncertain`;

    console.log('Calling AI for lead extraction...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: extractionPrompt }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'AI extraction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    let parsedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to parse lead data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let leads = parsedData.leads || [];
    
    // Post-process leads: clean, validate, score, deduplicate
    leads = leads.map((lead: any) => ({
      ...lead,
      email: cleanEmail(lead.email),
      phone: cleanPhone(lead.phone),
      qualityScore: calculateLeadScore(lead),
    }));

    // Deduplicate
    leads = deduplicateLeads(leads);

    // Sort by quality score
    leads.sort((a: any, b: any) => (b.qualityScore || 0) - (a.qualityScore || 0));

    // Calculate stats
    const stats = {
      totalProcessed: searchResults.length,
      leadsFound: leads.length,
      withEmail: leads.filter((l: any) => l.email).length,
      withPhone: leads.filter((l: any) => l.phone).length,
      averageScore: leads.length > 0 
        ? Math.round(leads.reduce((sum: number, l: any) => sum + (l.qualityScore || 0), 0) / leads.length)
        : 0,
      highQuality: leads.filter((l: any) => (l.qualityScore || 0) >= 70).length,
    };

    console.log('Extraction complete:', stats);
    return new Response(
      JSON.stringify({ success: true, leads, stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting leads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
