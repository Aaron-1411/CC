import { Link } from 'react-router-dom';
import { BarChart3, Users, Hammer, ArrowRight, Megaphone, Wand2, Eye, TrendingUp, Layers, FileCode, BookOpen, LucideIcon } from 'lucide-react';

type Tool = 'analyze' | 'leads' | 'rebuild' | 'ads' | 'generator' | 'ai-visibility' | 'keyword-gap' | 'content-remix' | 'landing-page' | 'case-study';

interface ToolCardsProps {
  exclude?: Tool | Tool[];
}

type ToolData = {
  id: Tool;
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  suite: 'seo' | 'ads' | 'pages' | 'outreach';
};

const toolsData: ToolData[] = [
  // SEO & Visibility Suite
  {
    id: 'analyze',
    title: 'Website Analyzer',
    subtitle: 'Deep-Dive Performance Audit',
    description: 'Get a 30+ metric analysis covering UX, SEO, and conversion potential in seconds.',
    icon: BarChart3,
    href: '/analyze',
    gradient: 'from-teal-500 to-cyan-500',
    suite: 'seo',
  },
  {
    id: 'keyword-gap',
    title: 'Keyword Gap Analysis',
    subtitle: 'Competitor Keyword Intel',
    description: "Discover keyword opportunities your competitors rank for that you're missing.",
    icon: TrendingUp,
    href: '/keyword-gap',
    gradient: 'from-lime-500 to-green-500',
    suite: 'seo',
  },
  {
    id: 'ai-visibility',
    title: 'AI Search Visibility',
    subtitle: 'AI Crawler Optimization',
    description: 'Check if your site is optimized for ChatGPT, Perplexity, and Gemini.',
    icon: Eye,
    href: '/ai-visibility',
    gradient: 'from-emerald-500 to-teal-500',
    suite: 'seo',
  },
  {
    id: 'case-study',
    title: 'Case Study Deep Dive',
    subtitle: 'Brand Research Intelligence',
    description: 'Get investment-grade brand analysis with competitors, growth levers, and emulation plans.',
    icon: BookOpen,
    href: '/case-study',
    gradient: 'from-indigo-500 to-blue-500',
    suite: 'seo',
  },
  // Ads & Content Suite
  {
    id: 'ads',
    title: 'Ad Library',
    subtitle: 'Competitive Ad Intelligence',
    description: 'Search live ads from TikTok, Meta, and Google to discover winning creatives.',
    icon: Megaphone,
    href: '/ads',
    gradient: 'from-pink-500 to-rose-500',
    suite: 'ads',
  },
  {
    id: 'generator',
    title: 'Ad Generator',
    subtitle: 'AI-Powered Ad Creation',
    description: 'Extract brand insights and generate platform-optimized ad copy in one click.',
    icon: Wand2,
    href: '/generate',
    gradient: 'from-violet-500 to-purple-500',
    suite: 'ads',
  },
  {
    id: 'content-remix',
    title: 'Content Remix',
    subtitle: 'Multi-Format Repurposing',
    description: 'Turn any content into tweets, LinkedIn posts, TikTok scripts, and more.',
    icon: Layers,
    href: '/content-remix',
    gradient: 'from-fuchsia-500 to-pink-500',
    suite: 'ads',
  },
  // Page Building Suite
  {
    id: 'landing-page',
    title: 'Landing Page AI',
    subtitle: 'AI Page Builder',
    description: 'Generate high-converting landing pages from a product description.',
    icon: FileCode,
    href: '/landing-page',
    gradient: 'from-rose-500 to-red-500',
    suite: 'pages',
  },
  {
    id: 'rebuild',
    title: 'Site Rebuilder',
    subtitle: 'Instant Landing Pages',
    description: 'Transform any website into an optimized, conversion-focused template.',
    icon: Hammer,
    href: '/rebuild',
    gradient: 'from-orange-500 to-amber-500',
    suite: 'pages',
  },
  // Outreach Suite
  {
    id: 'leads',
    title: 'Lead Finder',
    subtitle: 'Targeted Prospect Discovery',
    description: 'Build high-quality prospect lists with verified emails and phone numbers.',
    icon: Users,
    href: '/leads',
    gradient: 'from-blue-500 to-indigo-500',
    suite: 'outreach',
  },
];

export const ToolCards = ({ exclude }: ToolCardsProps) => {
  const excludeArray = Array.isArray(exclude) ? exclude : exclude ? [exclude] : [];
  const filteredTools = toolsData.filter(t => !excludeArray.includes(t.id));

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="border-t border-border mt-12 pt-12">
      <h3 className="text-xl font-bold text-center mb-2">Explore More Tools</h3>
      <p className="text-muted-foreground text-center mb-8 text-sm">
        Discover other ways to grow your business
      </p>
      <div className={`grid grid-cols-1 ${filteredTools.length <= 2 ? 'md:grid-cols-2 max-w-2xl' : 'sm:grid-cols-2 lg:grid-cols-4 max-w-5xl'} gap-4 mx-auto`}>
        {filteredTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.id}
              to={tool.href}
              onClick={handleClick}
              className="group glass-card rounded-xl p-5 hover:border-primary/40 transition-all hover-lift"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-semibold text-base mb-1">{tool.title}</h4>
              <p className="text-xs text-primary font-medium mb-2">{tool.subtitle}</p>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-2">{tool.description}</p>
              <div className="flex items-center text-primary text-sm font-medium">
                Open Tool
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};