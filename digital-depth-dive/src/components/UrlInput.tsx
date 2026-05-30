import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe, ArrowRight, Loader2 } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  placeholder?: string;
  buttonText?: string;
}

export const UrlInput = ({ 
  onAnalyze, 
  isLoading, 
  placeholder = "Enter website URL to analyze...",
  buttonText = "Analyze"
}: UrlInputProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative flex items-center gap-2 p-2 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Globe className="w-5 h-5 text-muted-foreground" />
          </div>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !url.trim()}
            className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all duration-300 hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {buttonText}ing
              </>
            ) : (
              <>
                {buttonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
