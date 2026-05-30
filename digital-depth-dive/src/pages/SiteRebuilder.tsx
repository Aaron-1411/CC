import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { AppHeader } from '@/components/AppHeader';
import { ToolCards } from '@/components/ToolCards';
import { SuiteTabNav } from '@/components/SuiteTabNav';
import { UrlInput } from '@/components/UrlInput';
import { Button } from '@/components/ui/button';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { rebuilderApi } from '@/lib/api/rebuilder';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, Hammer, Check, Copy, Download,
  Phone, Mail, MapPin, Palette, FileCode, Layout,
  ChevronDown, ChevronUp, Sparkles, Globe, Eye, Save
} from 'lucide-react';

type RebuildStep = 'idle' | 'scraping' | 'extracting' | 'generating' | 'complete';

type ExtractedData = {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    logo?: string;
  };
  contact: {
    phone: string | null;
    email: string | null;
    location: string | null;
  };
  businessInfo: {
    name: string;
    description: string;
    industry: string;
    valueProposition: string;
  };
  images: {
    logo?: string;
    favicon?: string;
    heroImage?: string;
    ogImage?: string;
    gallery: string[];
  };
  screenshot?: string;
  sourceUrl: string;
};

const SiteRebuilder = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [step, setStep] = useState<RebuildStep>('idle');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    branding: true,
    contact: true,
    business: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRebuild = async (url: string) => {
    setStep('scraping');
    setExtractedData(null);
    setGeneratedCode('');
    setShowPreview(false);
    setIsSaved(false);

    try {
      // Step 1: Scrape with branding extraction and links
      const scrapeResult = await firecrawlApi.scrape(url, {
        formats: ['markdown', 'html', 'screenshot', 'branding', 'links'],
        onlyMainContent: false,
      });

      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Failed to scrape website');
      }

      // Access data properly - Firecrawl returns data in scrapeResult.data
      const scrapeData = scrapeResult.data;
      if (!scrapeData) {
        throw new Error('No data returned from scrape');
      }

      setStep('extracting');

      // Step 2: Extract business info using AI
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('analyze-website', {
        body: {
          scrapedData: {
            markdown: scrapeData.markdown || '',
            html: scrapeData.html || '',
            metadata: scrapeData.metadata || {},
          },
          url,
        },
      });

      if (aiError) {
        console.error('AI extraction error:', aiError);
      }

      // Build extracted data
      const branding = scrapeData.branding || {};
      const metadata = scrapeData.metadata || {};
      const analysis = aiResult?.analysis || {};
      const htmlContent = scrapeData.html || '';

      // Extract images from the HTML
      const extractedImages = extractImagesFromHtml(htmlContent, url);

      const extracted: ExtractedData = {
        branding: {
          primaryColor: branding.colors?.primary || '#0d9488',
          secondaryColor: branding.colors?.secondary || '#1e293b',
          accentColor: branding.colors?.accent || '#14b8a6',
          backgroundColor: branding.colors?.background || '#ffffff',
          textColor: branding.colors?.textPrimary || '#1a1a1a',
          fontFamily: branding.fonts?.[0]?.family || branding.typography?.fontFamilies?.primary || 'Inter, sans-serif',
          logo: branding.images?.logo || branding.logo,
        },
        contact: {
          phone: extractPhone(scrapeData.markdown || scrapeData.html || ''),
          email: extractEmail(scrapeData.markdown || scrapeData.html || ''),
          location: extractLocation(scrapeData.markdown || scrapeData.html || ''),
        },
        businessInfo: {
          name: metadata.title?.split('|')[0]?.split('-')[0]?.trim() || 'Business Name',
          description: metadata.description || analysis.businessOffer?.valueProposition || '',
          industry: analysis.industry?.name || 'Business Services',
          valueProposition: analysis.businessOffer?.valueProposition || metadata.description || 'Quality products and services',
        },
        images: {
          logo: branding.images?.logo || branding.logo || extractedImages.logo,
          favicon: (branding.images as Record<string, string> | undefined)?.favicon || extractedImages.favicon,
          heroImage: extractedImages.heroImage,
          ogImage: (branding.images as Record<string, string> | undefined)?.ogImage,
          gallery: extractedImages.gallery,
        },
        screenshot: scrapeData.screenshot,
        sourceUrl: url,
      };

      setExtractedData(extracted);
      setStep('generating');

      // Step 3: Generate optimized website
      await new Promise(resolve => setTimeout(resolve, 1000));
      const code = generateOptimizedWebsite(extracted);
      setGeneratedCode(code);
      setStep('complete');

      // Auto-save if user is logged in
      if (user) {
        const saveResult = await rebuilderApi.save({
          url,
          original_title: extracted.businessInfo.name,
          generated_html: code,
          brand_colors: {
            primary: extracted.branding.primaryColor,
            secondary: extracted.branding.secondaryColor,
            accent: extracted.branding.accentColor,
            background: extracted.branding.backgroundColor,
            text: extracted.branding.textColor,
          },
          extracted_info: {
            businessName: extracted.businessInfo.name,
            industry: extracted.businessInfo.industry,
            valueProposition: extracted.businessInfo.valueProposition,
          },
          screenshot_url: extracted.screenshot || null,
        });
        if (saveResult.success) {
          setIsSaved(true);
        }
      }

      toast({
        title: '✅ Website Generated!',
        description: user ? 'Your optimized website has been saved to your dashboard.' : 'Your optimized website template is ready. Sign in to save it.',
      });
    } catch (error) {
      console.error('Rebuild error:', error);
      toast({
        title: 'Rebuild Failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      setStep('idle');
    }
  };

  const handleSave = async () => {
    if (!user || !extractedData || !generatedCode) return;
    
    setIsSaving(true);
    const result = await rebuilderApi.save({
      url: extractedData.sourceUrl,
      original_title: extractedData.businessInfo.name,
      generated_html: generatedCode,
      brand_colors: {
        primary: extractedData.branding.primaryColor,
        secondary: extractedData.branding.secondaryColor,
        accent: extractedData.branding.accentColor,
        background: extractedData.branding.backgroundColor,
        text: extractedData.branding.textColor,
      },
      extracted_info: {
        businessName: extractedData.businessInfo.name,
        industry: extractedData.businessInfo.industry,
        valueProposition: extractedData.businessInfo.valueProposition,
      },
      screenshot_url: extractedData.screenshot || null,
    });
    
    setIsSaving(false);
    if (result.success) {
      setIsSaved(true);
      toast({ title: 'Saved!', description: 'Operation saved to your dashboard.' });
    } else {
      toast({ title: 'Save Failed', description: result.error, variant: 'destructive' });
    }
  };

  const extractEmail = (content: string): string | null => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = content.match(emailRegex);
    return matches?.[0] || null;
  };

  const extractPhone = (content: string): string | null => {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const matches = content.match(phoneRegex);
    return matches?.[0] || null;
  };

  const extractLocation = (content: string): string | null => {
    const addressPatterns = [
      /\d{1,5}\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,\s]+[\w\s]+,?\s*[A-Z]{2}\s*\d{5}/gi,
      /[\w\s]+,\s*[A-Z]{2}\s*\d{5}/g,
    ];
    for (const pattern of addressPatterns) {
      const matches = content.match(pattern);
      if (matches?.[0]) return matches[0];
    }
    return null;
  };

  const extractImagesFromHtml = (html: string, baseUrl: string): { logo?: string; favicon?: string; heroImage?: string; gallery: string[] } => {
    const result: { logo?: string; favicon?: string; heroImage?: string; gallery: string[] } = { gallery: [] };
    
    // Helper to resolve relative URLs
    const resolveUrl = (src: string): string => {
      if (!src) return '';
      if (src.startsWith('http://') || src.startsWith('https://')) return src;
      if (src.startsWith('//')) return `https:${src}`;
      if (src.startsWith('/')) {
        try {
          const urlObj = new URL(baseUrl);
          return `${urlObj.origin}${src}`;
        } catch {
          return src;
        }
      }
      try {
        return new URL(src, baseUrl).href;
      } catch {
        return src;
      }
    };

    // Extract logo (look for common logo patterns)
    const logoPatterns = [
      /<img[^>]+class="[^"]*logo[^"]*"[^>]+src="([^"]+)"/gi,
      /<img[^>]+id="[^"]*logo[^"]*"[^>]+src="([^"]+)"/gi,
      /<img[^>]+alt="[^"]*logo[^"]*"[^>]+src="([^"]+)"/gi,
      /<img[^>]+src="([^"]+)"[^>]+alt="[^"]*logo[^"]*"/gi,
      /<a[^>]+class="[^"]*logo[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"/gis,
    ];
    
    for (const pattern of logoPatterns) {
      const match = pattern.exec(html);
      if (match?.[1]) {
        result.logo = resolveUrl(match[1]);
        break;
      }
    }

    // Extract favicon
    const faviconMatch = html.match(/<link[^>]+rel="[^"]*icon[^"]*"[^>]+href="([^"]+)"/i);
    if (faviconMatch?.[1]) {
      result.favicon = resolveUrl(faviconMatch[1]);
    }

    // Extract hero/banner images (first large images in hero sections)
    const heroPatterns = [
      /<(?:section|div)[^>]+class="[^"]*(?:hero|banner|jumbotron|header-image)[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/gi,
      /<img[^>]+class="[^"]*(?:hero|banner|featured)[^"]*"[^>]+src="([^"]+)"/gi,
    ];
    
    for (const pattern of heroPatterns) {
      const match = pattern.exec(html);
      if (match?.[1]) {
        result.heroImage = resolveUrl(match[1]);
        break;
      }
    }

    // Extract gallery images (all other significant images)
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/gi;
    let imgMatch;
    const seenUrls = new Set<string>();
    
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const src = resolveUrl(imgMatch[1]);
      // Filter out tiny images, icons, tracking pixels
      if (src && !seenUrls.has(src) && 
          !src.includes('1x1') && 
          !src.includes('pixel') && 
          !src.includes('tracking') &&
          !src.includes('.svg') &&
          !src.includes('icon') &&
          !src.includes('sprite')) {
        seenUrls.add(src);
        result.gallery.push(src);
      }
    }

    // Limit gallery to first 6 images
    result.gallery = result.gallery.slice(0, 6);

    return result;
  };

  const generateOptimizedWebsite = (data: ExtractedData): string => {
    const sanitize = (str: string) => str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${sanitize(data.businessInfo.valueProposition)}">
  <meta name="keywords" content="${sanitize(data.businessInfo.industry)}, ${sanitize(data.businessInfo.name)}">
  <title>${sanitize(data.businessInfo.name)} | ${sanitize(data.businessInfo.industry)}</title>
  
  <!-- Open Graph / Social -->
  <meta property="og:title" content="${sanitize(data.businessInfo.name)}">
  <meta property="og:description" content="${sanitize(data.businessInfo.valueProposition)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${sanitize(data.sourceUrl)}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${sanitize(data.businessInfo.name)}">
  <meta name="twitter:description" content="${sanitize(data.businessInfo.valueProposition)}">
  
  <!-- Favicon -->
  ${data.images.favicon ? `<link rel="icon" href="${sanitize(data.images.favicon)}">` : '<link rel="icon" type="image/x-icon" href="/favicon.ico">'}
  
  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(data.branding.fontFamily.split(',')[0])}:wght@400;500;600;700&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --primary: ${data.branding.primaryColor};
      --secondary: ${data.branding.secondaryColor};
      --accent: ${data.branding.accentColor};
      --background: ${data.branding.backgroundColor};
      --text: ${data.branding.textColor};
      --text-muted: #666666;
      --border: #e5e7eb;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    html { scroll-behavior: smooth; }
    
    body {
      font-family: ${data.branding.fontFamily};
      color: var(--text);
      background: var(--background);
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    
    /* Header */
    header {
      background: var(--secondary);
      color: white;
      padding: 1rem 0;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .logo span { color: var(--primary); }
    
    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;
    }
    
    .nav-links a {
      color: rgba(255,255,255,0.9);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }
    
    .nav-links a:hover { color: var(--primary); }
    
    .nav-cta {
      background: var(--primary);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .nav-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(13, 148, 136, 0.4);
    }
    
    /* Hero */
    .hero {
      background: linear-gradient(135deg, var(--secondary) 0%, #0f172a 100%);
      color: white;
      padding: 10rem 0 6rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 600px;
      background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
      opacity: 0.1;
      pointer-events: none;
    }
    
    .hero h1 {
      font-size: clamp(2.5rem, 5vw, 4rem);
      margin-bottom: 1.5rem;
      font-weight: 700;
      line-height: 1.2;
    }
    
    .hero p {
      font-size: 1.25rem;
      opacity: 0.9;
      max-width: 600px;
      margin: 0 auto 2.5rem;
      line-height: 1.8;
    }
    
    .hero-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn-primary {
      background: var(--primary);
      color: white;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(13, 148, 136, 0.3);
    }
    
    .btn-secondary {
      background: transparent;
      color: white;
      padding: 1rem 2rem;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: border-color 0.3s, background 0.3s;
    }
    
    .btn-secondary:hover {
      border-color: var(--primary);
      background: rgba(255,255,255,0.05);
    }
    
    /* Sections */
    section { padding: 6rem 0; }
    
    .section-header {
      text-align: center;
      margin-bottom: 4rem;
    }
    
    .section-header h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: var(--text);
    }
    
    .section-header p {
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
      font-size: 1.1rem;
    }
    
    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .feature-card {
      background: white;
      padding: 2.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .feature-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
    }
    
    .feature-card h3 {
      font-size: 1.25rem;
      margin-bottom: 0.75rem;
      color: var(--text);
    }
    
    .feature-card p {
      color: var(--text-muted);
      line-height: 1.7;
    }
    
    /* About Section */
    .about { background: #f8fafc; }
    
    .about-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    
    .about-text h2 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
    }
    
    .about-text p {
      color: var(--text-muted);
      margin-bottom: 1.5rem;
      line-height: 1.8;
    }
    
    .about-image {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      border-radius: 16px;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2rem;
    }
    
    /* Contact Section */
    .contact { background: var(--secondary); color: white; }
    
    .contact .section-header h2 { color: white; }
    .contact .section-header p { color: rgba(255,255,255,0.8); }
    
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(255,255,255,0.1);
      border-radius: 12px;
    }
    
    .contact-icon {
      width: 50px;
      height: 50px;
      background: var(--primary);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .contact-item span {
      font-size: 1.1rem;
    }
    
    /* Footer */
    footer {
      background: #0f172a;
      color: white;
      padding: 3rem 0;
      text-align: center;
    }
    
    footer p { opacity: 0.8; }
    
    footer a { color: var(--primary); text-decoration: none; }
    
    /* Mobile Menu */
    .mobile-menu-btn {
      display: none;
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .hero { padding: 8rem 0 4rem; }
      
      .nav-links, .nav-cta { display: none; }
      .mobile-menu-btn { display: block; }
      
      .about-content { grid-template-columns: 1fr; gap: 2rem; }
      .about-image { height: 300px; }
      
      .section-header h2 { font-size: 2rem; }
      section { padding: 4rem 0; }
    }
  </style>
</head>
<body>
  <header>
    <nav class="container">
      <a href="#" class="logo">
        ${data.images.logo ? `<img src="${sanitize(data.images.logo)}" alt="${sanitize(data.businessInfo.name)} Logo" style="height: 40px; width: auto; object-fit: contain;">` : `<span>${sanitize(data.businessInfo.name.charAt(0))}</span>${sanitize(data.businessInfo.name.slice(1))}`}
      </a>
      <ul class="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <a href="#contact" class="nav-cta">Get Started</a>
      <button class="mobile-menu-btn">☰</button>
    </nav>
  </header>

  <section class="hero" id="home"${data.images.heroImage ? ` style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%), url('${sanitize(data.images.heroImage)}') center/cover;"` : ''}>
    <div class="container">
      <h1>${sanitize(data.businessInfo.name)}</h1>
      <p>${sanitize(data.businessInfo.valueProposition)}</p>
      <div class="hero-buttons">
        <a href="#contact" class="btn-primary">Get Started →</a>
        <a href="#services" class="btn-secondary">Learn More</a>
      </div>
    </div>
  </section>

  <section id="services">
    <div class="container">
      <div class="section-header">
        <h2>Our Services</h2>
        <p>Professional ${sanitize(data.businessInfo.industry.toLowerCase())} services tailored to your needs</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>Fast & Reliable</h3>
          <p>Quick turnaround times without compromising on quality. We deliver when we promise.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3>Expert Team</h3>
          <p>Our experienced professionals bring years of industry expertise to every project.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">💎</div>
          <h3>Quality First</h3>
          <p>We maintain the highest standards in everything we do, ensuring exceptional results.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="about" id="about">
    <div class="container">
      <div class="about-content">
        <div class="about-text">
          <h2>About ${sanitize(data.businessInfo.name)}</h2>
          <p>${sanitize(data.businessInfo.description || data.businessInfo.valueProposition)}</p>
          <p>We're committed to delivering excellence in ${sanitize(data.businessInfo.industry.toLowerCase())}. Our team works closely with each client to understand their unique needs and deliver solutions that exceed expectations.</p>
          <a href="#contact" class="btn-primary">Contact Us</a>
        </div>
        <div class="about-image">
          ${data.images.gallery[0] ? `<img src="${sanitize(data.images.gallery[0])}" alt="${sanitize(data.businessInfo.name)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 16px;">` : (data.images.logo ? `<img src="${sanitize(data.images.logo)}" alt="${sanitize(data.businessInfo.name)}" style="max-width: 80%; max-height: 80%; object-fit: contain;">` : '🏢')}
        </div>
      </div>
    </div>
  </section>

  <section class="contact" id="contact">
    <div class="container">
      <div class="section-header">
        <h2>Get In Touch</h2>
        <p>Ready to get started? Contact us today!</p>
      </div>
      <div class="contact-grid">
        ${data.contact.phone ? `
        <div class="contact-item">
          <div class="contact-icon">📞</div>
          <span>${sanitize(data.contact.phone)}</span>
        </div>
        ` : ''}
        ${data.contact.email ? `
        <div class="contact-item">
          <div class="contact-icon">✉️</div>
          <span>${sanitize(data.contact.email)}</span>
        </div>
        ` : ''}
        ${data.contact.location ? `
        <div class="contact-item">
          <div class="contact-icon">📍</div>
          <span>${sanitize(data.contact.location)}</span>
        </div>
        ` : ''}
        ${!data.contact.phone && !data.contact.email && !data.contact.location ? `
        <div class="contact-item">
          <div class="contact-icon">💬</div>
          <span>Contact us for more information</span>
        </div>
        ` : ''}
      </div>
    </div>
  </section>

  <footer>
    <div class="container">
      <p>&copy; ${new Date().getFullYear()} ${sanitize(data.businessInfo.name)}. All rights reserved.</p>
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">
        Built with <a href="#">Toolbox</a>
      </p>
    </div>
  </footer>

  <script>
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
      const header = document.querySelector('header');
      if (window.scrollY > 50) {
        header.style.background = 'rgba(30, 41, 59, 0.98)';
      } else {
        header.style.background = 'var(--secondary)';
      }
    });
  </script>
</body>
</html>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast({ title: 'Copied!', description: 'Code copied to clipboard.' });
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${extractedData?.businessInfo.name || 'website'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: 'Website template downloaded.' });
  };

  const handleReset = () => {
    setStep('idle');
    setExtractedData(null);
    setGeneratedCode('');
    setShowPreview(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Suite Tab Navigation */}
          <div className="pt-6 pb-4">
            <SuiteTabNav suite="pages" />
          </div>

          {/* Idle State - URL Input */}
          {step === 'idle' && (
            <div className="py-12 md:py-16 space-y-12 max-w-4xl mx-auto">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium">
                  AI-Powered Site Generation
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  Site <span className="gradient-text">Rebuilder</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Enter any website URL and we'll generate an optimized, SEO-ready website template 
                  with extracted branding, contact info, and best practices built in.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <UrlInput 
                  onAnalyze={handleRebuild} 
                  isLoading={false}
                  placeholder="Enter website URL to rebuild..."
                  buttonText="Rebuild Site"
                />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Palette className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Color Extraction</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically extracts brand colors and fonts
                  </p>
                </div>
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Contact Info</h3>
                  <p className="text-sm text-muted-foreground">
                    Phone, email, and location migrated
                  </p>
                </div>
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Layout className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">SEO-Optimized</h3>
                  <p className="text-sm text-muted-foreground">
                    Meta tags and semantic HTML included
                  </p>
                </div>
                <div className="glass-card rounded-xl p-5 text-center">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Modern Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Conversion-focused responsive layout
                  </p>
                </div>
              </div>

              <ToolCards exclude="rebuild" />
            </div>
          )}

          {/* Loading States */}
          {(step === 'scraping' || step === 'extracting' || step === 'generating') && (
            <div className="py-20 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  {step === 'scraping' && 'Scraping Website...'}
                  {step === 'extracting' && 'Extracting Data...'}
                  {step === 'generating' && 'Generating Template...'}
                </h2>
                <p className="text-muted-foreground">
                  {step === 'scraping' && 'Fetching content and branding information'}
                  {step === 'extracting' && 'Analyzing business info and contact details'}
                  {step === 'generating' && 'Building your optimized website'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className={`flex items-center gap-2 ${step === 'scraping' ? 'text-primary' : ''}`}>
                  {step !== 'scraping' && <Check className="w-4 h-4 text-green-500" />}
                  {step === 'scraping' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Scrape
                </div>
                <div className="w-8 h-px bg-border" />
                <div className={`flex items-center gap-2 ${step === 'extracting' ? 'text-primary' : ''}`}>
                  {step === 'generating' && <Check className="w-4 h-4 text-green-500" />}
                  {step === 'extracting' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {step === 'scraping' && <div className="w-4 h-4 rounded-full border-2 border-muted" />}
                  Extract
                </div>
                <div className="w-8 h-px bg-border" />
                <div className={`flex items-center gap-2 ${step === 'generating' ? 'text-primary' : ''}`}>
                  {step === 'generating' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {(step === 'scraping' || step === 'extracting') && <div className="w-4 h-4 rounded-full border-2 border-muted" />}
                  Generate
                </div>
              </div>
            </div>
          )}

          {/* Complete State */}
          {step === 'complete' && extractedData && (
            <div className="py-8 max-w-5xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Website Generated!</h1>
                  <p className="text-muted-foreground">
                    Rebuilt from: <span className="text-foreground">{extractedData.sourceUrl}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    New Rebuild
                  </Button>
                </div>
              </div>

              {/* Extracted Data Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branding */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('branding')}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Branding</span>
                    </div>
                    {expandedSections.branding ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {expandedSections.branding && (
                    <div className="p-4 pt-0 border-t border-border/50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-border" 
                          style={{ backgroundColor: extractedData.branding.primaryColor }}
                        />
                        <span className="text-sm font-mono">{extractedData.branding.primaryColor}</span>
                        <span className="text-xs text-muted-foreground">Primary</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded border border-border" 
                          style={{ backgroundColor: extractedData.branding.secondaryColor }}
                        />
                        <span className="text-sm font-mono">{extractedData.branding.secondaryColor}</span>
                        <span className="text-xs text-muted-foreground">Secondary</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Font:</span>{' '}
                        {extractedData.branding.fontFamily.split(',')[0]}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('contact')}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Contact</span>
                    </div>
                    {expandedSections.contact ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {expandedSections.contact && (
                    <div className="p-4 pt-0 border-t border-border/50 space-y-2 text-sm">
                      {extractedData.contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {extractedData.contact.phone}
                        </div>
                      )}
                      {extractedData.contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {extractedData.contact.email}
                        </div>
                      )}
                      {extractedData.contact.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {extractedData.contact.location}
                        </div>
                      )}
                      {!extractedData.contact.phone && !extractedData.contact.email && !extractedData.contact.location && (
                        <p className="text-muted-foreground">No contact info detected</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Business */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('business')}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Business</span>
                    </div>
                    {expandedSections.business ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {expandedSections.business && (
                    <div className="p-4 pt-0 border-t border-border/50 space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>{' '}
                        {extractedData.businessInfo.name}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Industry:</span>{' '}
                        {extractedData.businessInfo.industry}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview / Code Tabs */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={showPreview ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant={!showPreview ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setShowPreview(false)}
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      Code
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {user && !isSaved && (
                      <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                    )}
                    {isSaved && (
                      <span className="text-sm text-green-500 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Saved
                      </span>
                    )}
                    <Button variant="outline" size="sm" onClick={copyCode}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button size="sm" onClick={downloadCode}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {showPreview ? (
                  <div className="bg-white">
                    <iframe
                      srcDoc={generatedCode}
                      className="w-full h-[600px] border-0"
                      title="Website Preview"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-secondary/20 max-h-[600px] overflow-auto">
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {generatedCode}
                    </pre>
                  </div>
                )}
              </div>

              <ToolCards exclude={['landing-page', 'rebuild']} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SiteRebuilder;
