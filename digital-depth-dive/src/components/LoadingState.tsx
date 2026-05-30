import { Globe, Brain, FileText, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface LoadingStateProps {
  step: 'mapping' | 'scraping' | 'analyzing' | 'generating';
  progress?: {
    current: number;
    total: number;
    currentUrl?: string;
  };
  isCrawlMode?: boolean;
}

const getSteps = (isCrawlMode: boolean) => [
  ...(isCrawlMode ? [{ key: 'mapping', label: 'Mapping Site', icon: Layers, description: 'Discovering pages...' }] : []),
  { key: 'scraping', label: isCrawlMode ? 'Crawling Pages' : 'Scraping Website', icon: Globe, description: isCrawlMode ? 'Fetching multiple pages...' : 'Fetching content and structure...' },
  { key: 'analyzing', label: 'AI Analysis', icon: Brain, description: 'Processing with advanced AI...' },
  { key: 'generating', label: 'Generating Report', icon: FileText, description: 'Compiling insights...' },
];

// Estimated time per step in seconds
const STEP_TIMES: Record<string, number> = {
  mapping: 3,
  scraping: 5, // per page in crawl mode
  analyzing: 8,
  generating: 2,
};

export const LoadingState = ({ step, progress, isCrawlMode = false }: LoadingStateProps) => {
  const steps = getSteps(isCrawlMode);
  const currentIndex = steps.findIndex((s) => s.key === step);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stepStartTime, setStepStartTime] = useState(Date.now());

  useEffect(() => {
    setStepStartTime(Date.now());
    setElapsedTime(0);
  }, [step]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - stepStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [stepStartTime]);

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const baseProgress = (currentIndex / steps.length) * 100;
    
    if (step === 'scraping' && progress && progress.total > 0) {
      const stepProgress = (progress.current / progress.total) * (100 / steps.length);
      return Math.min(baseProgress + stepProgress, 100);
    }
    
    // Add time-based progress within step
    const stepDuration = step === 'scraping' && isCrawlMode 
      ? STEP_TIMES.scraping * (progress?.total || 1)
      : STEP_TIMES[step] || 5;
    const stepProgress = Math.min(elapsedTime / stepDuration, 0.9) * (100 / steps.length);
    
    return Math.min(baseProgress + stepProgress, 99);
  };

  // Estimate remaining time
  const getEstimatedTime = () => {
    let remaining = 0;
    
    for (let i = currentIndex; i < steps.length; i++) {
      const stepKey = steps[i].key;
      if (i === currentIndex) {
        if (stepKey === 'scraping' && isCrawlMode && progress) {
          const pagesLeft = progress.total - progress.current;
          remaining += pagesLeft * STEP_TIMES.scraping;
        } else {
          const estimatedDuration = STEP_TIMES[stepKey] || 5;
          remaining += Math.max(estimatedDuration - elapsedTime, 0);
        }
      } else {
        if (stepKey === 'scraping' && isCrawlMode && progress) {
          remaining += progress.total * STEP_TIMES.scraping;
        } else {
          remaining += STEP_TIMES[stepKey] || 5;
        }
      }
    }
    
    if (remaining < 60) {
      return `~${Math.max(remaining, 1)}s remaining`;
    }
    return `~${Math.ceil(remaining / 60)}m remaining`;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="w-full max-w-xl mx-auto py-16">
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/20 blur-3xl animate-pulse" />
        </div>

        {/* Progress Circle */}
        <div className="relative flex flex-col items-center justify-center mb-8">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className="text-primary transition-all duration-500"
                strokeDasharray={`${progressPercentage * 2.64} 264`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{getEstimatedTime()}</p>
        </div>

        {/* Page progress for crawl mode */}
        {isCrawlMode && progress && step === 'scraping' && (
          <div className="mb-6 p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Page {progress.current} of {progress.total}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            {progress.currentUrl && (
              <p className="mt-2 text-xs text-muted-foreground truncate">
                {progress.currentUrl}
              </p>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex;

            return (
              <div
                key={s.key}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-xl transition-all duration-500',
                  isActive && 'bg-card border border-primary/50 glow-primary',
                  isComplete && 'bg-card/50',
                  !isActive && !isComplete && 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isComplete && 'bg-primary/20 text-primary',
                    !isActive && !isComplete && 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.label}</p>
                  <p className="text-sm text-muted-foreground truncate">{s.description}</p>
                </div>
                {isActive && (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                {isComplete && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
