import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface CaseStudySectionProps {
  icon: ReactNode;
  title: string;
  emoji?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CaseStudySection = ({ 
  icon, 
  title, 
  emoji, 
  children, 
  defaultOpen = true,
  className 
}: CaseStudySectionProps) => {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn('glass-card rounded-xl overflow-hidden', className)}>
      <CollapsibleTrigger className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">
            {emoji && <span className="mr-2">{emoji}</span>}
            {title}
          </h3>
        </div>
        <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-6 pb-6 pt-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

interface InfoRowProps {
  label: string;
  value: string | ReactNode;
  className?: string;
}

export const InfoRow = ({ label, value, className }: InfoRowProps) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-border/50 last:border-0', className)}>
    <span className="text-sm font-medium text-muted-foreground min-w-[160px]">{label}:</span>
    <span className="text-sm flex-1">{value || <span className="text-muted-foreground/60 italic">Not available</span>}</span>
  </div>
);

interface TagListProps {
  items: string[];
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export const TagList = ({ items, variant = 'default' }: TagListProps) => {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground/60 italic text-sm">None identified</span>;
  }

  const variantClasses = {
    default: 'bg-muted text-foreground',
    success: 'bg-green-500/10 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    destructive: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span 
          key={i} 
          className={cn('px-2.5 py-1 rounded-full text-xs font-medium', variantClasses[variant])}
        >
          {item}
        </span>
      ))}
    </div>
  );
};
