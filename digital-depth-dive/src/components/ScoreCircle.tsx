import { cn } from '@/lib/utils';

interface ScoreCircleProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

export const ScoreCircle = ({ score, size = 'md', label, showLabel = true }: ScoreCircleProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-score-excellent stroke-score-excellent';
    if (score >= 60) return 'text-score-good stroke-score-good';
    if (score >= 40) return 'text-score-average stroke-score-average';
    return 'text-score-poor stroke-score-poor';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    return 'Needs Work';
  };

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const strokeWidth = size === 'lg' ? 4 : size === 'md' ? 6 : 8;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn('relative', sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000 ease-out', getScoreColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', textSizes[size], getScoreColor(score).split(' ')[0])}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && (
        <div className="text-center">
          {label && <p className="text-sm font-medium text-foreground">{label}</p>}
          <p className={cn('text-xs font-medium', getScoreColor(score).split(' ')[0])}>
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
};
