import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { analysesApi, SavedAnalysis } from '@/lib/api/analyses';
import { AppHeader } from '@/components/AppHeader';
import { StatsSection } from '@/components/StatsSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, Users, Hammer, ArrowRight, Clock, Loader2, FileText,
  Zap, Shield, Globe, TrendingUp, Megaphone, Wand2, Sparkles,
  Target, Lightbulb, CheckCircle2, Eye, Mail, Layers, Calendar, FileCode
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Organize tools by suite
const toolSuites = [
  {
    id: 'seo',
    name: 'SEO & Visibility',
    description: 'Audit, analyze, and optimize for search engines and AI',
    tools: [
      { id: 'analyze', title: 'Website Analyzer', subtitle: 'Deep-Dive Performance Audit', description: 'Get a comprehensive 30+ metric analysis covering UX, SEO, and conversion.', icon: BarChart3, href: '/analyze', gradient: 'from-teal-500 to-cyan-500', stats: '30+ metrics' },
      { id: 'keyword-gap', title: 'Keyword Gap Analysis', subtitle: 'Competitor Keyword Intel', description: "Find keyword opportunities your competitors rank for.", icon: TrendingUp, href: '/keyword-gap', gradient: 'from-lime-500 to-green-500', stats: 'Gap finder' },
      { id: 'ai-visibility', title: 'AI Search Visibility', subtitle: 'AI Crawler Optimization', description: 'Check if your site is optimized for ChatGPT and Gemini.', icon: Eye, href: '/ai-visibility', gradient: 'from-emerald-500 to-teal-500', stats: 'AI-ready' },
    ],
  },
  {
    id: 'ads',
    name: 'Ads & Content',
    description: 'Research, generate, and repurpose ad content',
    tools: [
      { id: 'ads', title: 'Ad Library', subtitle: 'Competitive Ad Intelligence', description: 'Search live ads from TikTok, Meta, and Google.', icon: Megaphone, href: '/ads', gradient: 'from-pink-500 to-rose-500', stats: '3 platforms' },
      { id: 'generator', title: 'Ad Generator', subtitle: 'AI-Powered Ad Creation', description: 'Generate platform-optimized ad copy in one click.', icon: Wand2, href: '/generate', gradient: 'from-violet-500 to-purple-500', stats: 'AI-driven' },
      { id: 'content-remix', title: 'Content Remix', subtitle: 'Multi-Format Repurposing', description: 'Turn content into tweets, LinkedIn posts, and more.', icon: Layers, href: '/content-remix', gradient: 'from-fuchsia-500 to-pink-500', stats: '5+ formats' },
    ],
  },
  {
    id: 'pages',
    name: 'Page Building',
    description: 'Create and rebuild high-converting pages',
    tools: [
      { id: 'landing-page', title: 'Landing Page AI', subtitle: 'AI Page Builder', description: 'Generate landing pages from a product description.', icon: FileCode, href: '/landing-page', gradient: 'from-rose-500 to-red-500', stats: 'AI-built' },
      { id: 'rebuild', title: 'Site Rebuilder', subtitle: 'Instant Landing Pages', description: 'Transform any website into an optimized template.', icon: Hammer, href: '/rebuild', gradient: 'from-orange-500 to-amber-500', stats: 'Full rebuild' },
    ],
  },
  {
    id: 'outreach',
    name: 'Outreach',
    description: 'Find leads and engage across channels',
    tools: [
      { id: 'leads', title: 'Lead Finder', subtitle: 'Targeted Prospect Discovery', description: 'Build prospect lists with verified contacts.', icon: Users, href: '/leads', gradient: 'from-blue-500 to-indigo-500', stats: '100 leads/search' },
      { id: 'lead-nurturing', title: 'Lead Nurturing', subtitle: 'Email Automation', description: 'Automate email sequences with AI-powered emails.', icon: Mail, href: '/lead-nurturing', gradient: 'from-sky-500 to-blue-500', stats: 'Automated' },
      { id: 'social-scheduler', title: 'Social Scheduler', subtitle: 'Multi-Platform Publishing', description: 'Schedule posts across LinkedIn, Twitter, and Instagram.', icon: Calendar, href: '/social-scheduler', gradient: 'from-indigo-500 to-violet-500', stats: '3 platforms' },
    ],
  },
];

const platformBenefits = [
  { icon: Zap, title: 'Instant Results', description: 'Get actionable insights in under 30 seconds. No waiting, no complex setup.' },
  { icon: Shield, title: 'Enterprise-Grade Security', description: 'Your data stays private with encrypted processing and secure infrastructure.' },
  { icon: Globe, title: 'Works on Any Site', description: 'Analyze any public website—no access tokens or integrations required.' },
  { icon: Lightbulb, title: 'Actionable Recommendations', description: 'Every analysis includes specific, prioritized steps you can implement today.' },
];

const Toolbox = () => {
  const { user } = useAuth();
  const [recentAnalyses, setRecentAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) { loadRecentAnalyses(); }
  }, [user]);

  const loadRecentAnalyses = async () => {
    setLoading(true);
    const result = await analysesApi.list();
    if (result.success && result.data) { setRecentAnalyses(result.data.slice(0, 5)); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/5 to-transparent blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-t from-blue-500/5 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative z-10">
        <AppHeader />

        <main className="container pb-20">
          {/* Hero Section */}
          <div className="py-12 md:py-20 text-center max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Your Complete Growth Toolkit
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight">
              Analyze. Discover. <br />
              <span className="gradient-text">Convert.</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Eleven powerful tools to audit websites, find qualified leads, spy on competitor ads, generate high-converting copy, and more—all in one place.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" className="shadow-lg hover-lift" asChild>
                <Link to="/analyze"><BarChart3 className="w-5 h-5 mr-2" />Analyze a Website</Link>
              </Button>
              <Button size="lg" variant="outline" className="hover-lift" asChild>
                <Link to="/leads"><Users className="w-5 h-5 mr-2" />Find Leads</Link>
              </Button>
            </div>
          </div>

          <StatsSection />

          {/* Tools Grid - Organized by Suite */}
          <div className="space-y-12 mb-20">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Four Suites, Eleven Tools</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Each tool is built for speed, accuracy, and professional-grade results.</p>
            </div>

            {toolSuites.map((suite) => (
              <div key={suite.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{suite.name}</h3>
                  <span className="text-sm text-muted-foreground">— {suite.description}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suite.tools.map((tool) => (
                    <Link key={tool.id} to={tool.href} className="group glass-card rounded-2xl p-5 md:p-6 hover:border-primary/40 transition-all hover-lift flex flex-col">
                      <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-md`}>
                        <tool.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="text-base md:text-lg font-semibold mb-1">{tool.title}</h3>
                      <p className="text-xs md:text-sm text-primary font-medium mb-2">{tool.subtitle}</p>
                      <p className="text-muted-foreground text-xs md:text-sm mb-4 flex-grow leading-relaxed line-clamp-2">{tool.description}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground font-medium bg-secondary px-2 py-1 rounded-full">{tool.stats}</span>
                        <div className="flex items-center text-primary text-sm font-medium">
                          Open<ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Platform Benefits */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Built for Professionals</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Enterprise reliability meets intuitive design.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {platformBenefits.map((benefit) => (
                <div key={benefit.title} className="glass-card rounded-xl p-5 text-center hover-lift">
                  <div className="w-11 h-11 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          {user && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm" asChild><Link to="/dashboard">View All</Link></Button>
              </div>
              {loading ? (
                <div className="glass-card rounded-xl p-6 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : recentAnalyses.length > 0 ? (
                <div className="space-y-2">
                  {recentAnalyses.map((analysis) => (
                    <Link key={analysis.id} to={`/analysis/${analysis.id}`} className="glass-card rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                        {analysis.screenshot_url ? <img src={analysis.screenshot_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FileText className="w-4 h-4 text-muted-foreground" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{analysis.metadata?.title || analysis.url}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(analysis.created_at), { addSuffix: true })}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No recent analyses yet</p>
                  <Button className="mt-4" asChild><Link to="/analyze">Analyze Your First Website</Link></Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Toolbox;