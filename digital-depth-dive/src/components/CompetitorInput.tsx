import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Target } from 'lucide-react';

interface CompetitorInputProps {
  competitors: string[];
  onChange: (competitors: string[]) => void;
  maxCompetitors?: number;
  disabled?: boolean;
}

export const CompetitorInput = ({ 
  competitors, 
  onChange, 
  maxCompetitors = 3,
  disabled = false 
}: CompetitorInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const addCompetitor = () => {
    const url = inputValue.trim().toLowerCase();
    if (!url) return;
    
    // Remove protocol for storage
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    if (competitors.length >= maxCompetitors) {
      return;
    }
    
    if (!competitors.includes(cleanUrl)) {
      onChange([...competitors, cleanUrl]);
    }
    setInputValue('');
  };

  const removeCompetitor = (index: number) => {
    onChange(competitors.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Competitor Analysis</span>
        <Badge variant="secondary" className="text-xs">Optional</Badge>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Add up to {maxCompetitors} competitor URLs to compare positioning, features, and performance.
      </p>

      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="competitor.com"
          className="flex-1 h-10 bg-muted/50 border-0"
          disabled={disabled || competitors.length >= maxCompetitors}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCompetitor}
          disabled={disabled || competitors.length >= maxCompetitors || !inputValue.trim()}
          className="h-10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {competitors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {competitors.map((comp, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="pl-3 pr-1 py-1 flex items-center gap-1"
            >
              {comp}
              <button
                type="button"
                onClick={() => removeCompetitor(index)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
