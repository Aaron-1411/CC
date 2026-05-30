import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnalysisCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const AnalysisCard = ({ title, icon, children, className, delay = 0 }: AnalysisCardProps) => {
  return (
    <Card 
      className={cn(
        'glass-card overflow-hidden opacity-0 animate-fade-in',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-lg font-semibold">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
