import { Layers, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CrawlModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export const CrawlModeToggle = ({ enabled, onToggle, disabled }: CrawlModeToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(false)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          !enabled 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/50 text-muted-foreground hover:bg-muted',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <FileText className="w-4 h-4" />
        Single Page
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(true)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
          enabled 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-muted/50 text-muted-foreground hover:bg-muted',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Layers className="w-4 h-4" />
        Multi-Page Crawl
      </button>
    </div>
  );
};
