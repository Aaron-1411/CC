import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Maximize2, X } from 'lucide-react';

interface WebsiteScreenshotProps {
  screenshot: string;
  url: string;
  title?: string;
}

export const WebsiteScreenshot = ({ screenshot, url, title }: WebsiteScreenshotProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="relative group rounded-xl overflow-hidden border border-border bg-card">
        <div className="aspect-video overflow-hidden">
          <img
            src={screenshot}
            alt={`Screenshot of ${title || url}`}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Site
          </a>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
            Expand
          </button>
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-6xl w-full max-h-[90vh] overflow-auto rounded-2xl border border-border bg-card shadow-2xl">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={screenshot}
              alt={`Screenshot of ${title || url}`}
              className="w-full h-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
};
