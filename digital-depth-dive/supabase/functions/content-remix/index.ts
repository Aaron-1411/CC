const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentVariant {
  format: string;
  platform: string;
  content: string;
  characterCount: number;
  estimatedPerformance: number;
  hashtags?: string[];
  hook?: string;
}

interface RemixResult {
  originalSummary: string;
  keyPoints: string[];
  variants: ContentVariant[];
  visualSuggestions: {
    format: string;
    description: string;
    dimensions: string;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, url, targetPlatforms } = await req.json();

    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Remixing content from: ${url || 'direct input'}`);

    // Extract key points from content
    const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 30);
    const keyPoints = sentences
      .slice(0, 5)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 20);

    // Generate summary
    const words = content.split(/\s+/);
    const originalSummary = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');

    // Generate variants for different platforms
    const variants: ContentVariant[] = [];
    const platforms = targetPlatforms || ['twitter', 'linkedin', 'instagram', 'tiktok', 'facebook'];

    platforms.forEach((platform: string) => {
      const variant = generateVariant(content, keyPoints, platform);
      variants.push(variant);
    });

    // Generate visual suggestions
    const visualSuggestions = [
      {
        format: 'Square Post',
        description: 'Single image with key quote overlay',
        dimensions: '1080x1080',
      },
      {
        format: 'Carousel',
        description: `${Math.min(10, keyPoints.length + 2)} slides breaking down main points`,
        dimensions: '1080x1350',
      },
      {
        format: 'Story/Reel',
        description: 'Vertical video with animated text',
        dimensions: '1080x1920',
      },
      {
        format: 'Wide Banner',
        description: 'Blog header or LinkedIn article image',
        dimensions: '1200x628',
      },
    ];

    const result: RemixResult = {
      originalSummary,
      keyPoints,
      variants,
      visualSuggestions,
    };

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Content remix error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Remix failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateVariant(content: string, keyPoints: string[], platform: string): ContentVariant {
  const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
  
  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      return {
        format: 'Tweet Thread',
        platform: 'Twitter/X',
        content: generateTwitterThread(keyPoints),
        characterCount: 280,
        estimatedPerformance: 75,
        hashtags: extractHashtags(content, 3),
        hook: keyPoints[0]?.slice(0, 100) || 'Check this out!',
      };
      
    case 'linkedin':
      return {
        format: 'LinkedIn Post',
        platform: 'LinkedIn',
        content: generateLinkedInPost(keyPoints, content),
        characterCount: 1300,
        estimatedPerformance: 82,
        hook: generateHook(keyPoints[0] || content.slice(0, 100)),
      };
      
    case 'instagram':
      return {
        format: 'Instagram Caption',
        platform: 'Instagram',
        content: generateInstagramCaption(keyPoints),
        characterCount: 2200,
        estimatedPerformance: 70,
        hashtags: extractHashtags(content, 10),
      };
      
    case 'tiktok':
      return {
        format: 'TikTok Script',
        platform: 'TikTok',
        content: generateTikTokScript(keyPoints),
        characterCount: 150,
        estimatedPerformance: 85,
        hook: 'POV: ' + (keyPoints[0]?.slice(0, 50) || 'You just learned something amazing'),
        hashtags: extractHashtags(content, 5),
      };
      
    case 'facebook':
      return {
        format: 'Facebook Post',
        platform: 'Facebook',
        content: generateFacebookPost(keyPoints, content),
        characterCount: 500,
        estimatedPerformance: 68,
      };
      
    default:
      return {
        format: 'Generic Post',
        platform: platform,
        content: keyPoints.slice(0, 3).join('\n\n'),
        characterCount: 500,
        estimatedPerformance: 60,
      };
  }
}

function generateTwitterThread(keyPoints: string[]): string {
  const thread: string[] = [];
  
  thread.push(`🧵 Thread: ${keyPoints[0]?.slice(0, 100) || 'Important insights'}\n\nLet me break this down 👇`);
  
  keyPoints.slice(1, 5).forEach((point, i) => {
    thread.push(`${i + 2}/ ${point.slice(0, 250)}`);
  });
  
  thread.push(`${keyPoints.length + 1}/ That's a wrap!\n\nLike this thread? Follow for more insights.\n\nRT the first tweet to share with your network 🙏`);
  
  return thread.join('\n\n---\n\n');
}

function generateLinkedInPost(keyPoints: string[], fullContent: string): string {
  const hook = generateHook(keyPoints[0] || fullContent.slice(0, 100));
  
  let post = `${hook}\n\n`;
  post += `Here's what I learned:\n\n`;
  
  keyPoints.slice(0, 4).forEach((point, i) => {
    post += `${['1️⃣', '2️⃣', '3️⃣', '4️⃣'][i]} ${point.slice(0, 200)}\n\n`;
  });
  
  post += `---\n\n`;
  post += `💡 Key takeaway: Focus on what matters most.\n\n`;
  post += `What's your experience with this? Drop a comment below 👇\n\n`;
  post += `#business #growth #insights`;
  
  return post;
}

function generateInstagramCaption(keyPoints: string[]): string {
  let caption = `✨ ${keyPoints[0]?.slice(0, 100) || 'Something amazing'}\n\n`;
  caption += `Here's the breakdown:\n\n`;
  
  keyPoints.slice(0, 3).forEach((point) => {
    caption += `➡️ ${point.slice(0, 150)}\n\n`;
  });
  
  caption += `Save this post for later! 📌\n\n`;
  caption += `Double tap if you agree ❤️\n\n`;
  caption += `.\n.\n.\n`;
  
  return caption;
}

function generateTikTokScript(keyPoints: string[]): string {
  let script = `[HOOK - 0-3 seconds]\n`;
  script += `"Wait, you need to hear this..."\n\n`;
  
  script += `[CONTENT - 3-45 seconds]\n`;
  keyPoints.slice(0, 3).forEach((point, i) => {
    script += `Point ${i + 1}: ${point.slice(0, 100)}\n`;
  });
  
  script += `\n[CTA - Last 5 seconds]\n`;
  script += `"Follow for more tips like this!"\n`;
  script += `[Point to follow button]`;
  
  return script;
}

function generateFacebookPost(keyPoints: string[], fullContent: string): string {
  let post = `📢 ${keyPoints[0]?.slice(0, 150) || 'Check this out'}\n\n`;
  
  keyPoints.slice(1, 3).forEach((point) => {
    post += `• ${point.slice(0, 200)}\n`;
  });
  
  post += `\nWhat do you think? Share your thoughts in the comments! 💬`;
  
  return post;
}

function generateHook(firstPoint: string): string {
  const hooks = [
    `I used to think this was impossible.\n\nThen I discovered...`,
    `Stop scrolling. This changed everything for me.`,
    `Here's what nobody tells you about ${firstPoint.slice(0, 30)}...`,
    `I spent years learning this the hard way.\n\nSave yourself the trouble:`,
    `This might be controversial, but...`,
  ];
  
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function extractHashtags(content: string, count: number): string[] {
  const words = content.toLowerCase().split(/\s+/);
  const wordFreq = new Map<string, number>();
  
  words.forEach(word => {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length > 4 && clean.length < 20) {
      wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
    }
  });
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => `#${word}`);
}
