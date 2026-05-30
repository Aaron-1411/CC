import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, TrendingUp, Eye, Users, 
  Megaphone, Wand2, Layers, FileCode, Hammer, LucideIcon 
} from 'lucide-react';

export type SuiteType = 'seo' | 'ads' | 'pages' | 'outreach';

type SuiteTool = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

const suiteConfig: Record<SuiteType, { name: string; tools: SuiteTool[] }> = {
  seo: {
    name: 'SEO & Visibility',
    tools: [
      { id: 'analyze', label: 'Website Analyzer', href: '/analyze', icon: BarChart3 },
      { id: 'keyword-gap', label: 'Keyword Gap', href: '/keyword-gap', icon: TrendingUp },
      { id: 'ai-visibility', label: 'AI Visibility', href: '/ai-visibility', icon: Eye },
      { id: 'case-study', label: 'Case Study', href: '/case-study', icon: Layers },
    ],
  },
  ads: {
    name: 'Ads & Content',
    tools: [
      { id: 'ads', label: 'Ad Library', href: '/ads', icon: Megaphone },
      { id: 'generator', label: 'Ad Generator', href: '/generate', icon: Wand2 },
      { id: 'content-remix', label: 'Content Remix', href: '/content-remix', icon: Layers },
    ],
  },
  pages: {
    name: 'Page Building',
    tools: [
      { id: 'landing-page', label: 'Landing Page AI', href: '/landing-page', icon: FileCode },
      { id: 'rebuild', label: 'Site Rebuilder', href: '/rebuild', icon: Hammer },
    ],
  },
  outreach: {
    name: 'Lead Finder',
    tools: [
      { id: 'leads', label: 'Lead Finder', href: '/leads', icon: Users },
    ],
  },
};

interface SuiteTabNavProps {
  suite: SuiteType;
  className?: string;
}

export const SuiteTabNav = ({ suite, className }: SuiteTabNavProps) => {
  const location = useLocation();
  const config = suiteConfig[suite];

  return (
    <div className={cn('w-full', className)}>
      <nav className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border border-border overflow-x-auto">
        {config.tools.map((tool) => {
          const isActive = location.pathname === tool.href || 
            (tool.href === '/rebuild' && location.pathname.startsWith('/rebuild/'));
          const Icon = tool.icon;
          
          return (
            <Link
              key={tool.id}
              to={tool.href}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tool.label}</span>
              <span className="sm:hidden">{tool.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

// Export config for use elsewhere
export { suiteConfig };
