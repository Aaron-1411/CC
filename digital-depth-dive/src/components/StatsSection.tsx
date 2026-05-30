import { BarChart3, Users, Globe, Zap } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

const stats = [
  {
    icon: BarChart3,
    value: 12500,
    suffix: '+',
    label: 'Sites Analyzed',
    description: 'Comprehensive audits completed',
  },
  {
    icon: Users,
    value: 850000,
    suffix: '+',
    label: 'Leads Generated',
    description: 'Verified business contacts',
  },
  {
    icon: Globe,
    value: 45,
    suffix: '+',
    label: 'Countries',
    description: 'Worldwide coverage',
  },
  {
    icon: Zap,
    value: 99.9,
    suffix: '%',
    label: 'Uptime',
    description: 'Always available',
    decimals: 1,
  },
];

export const StatsSection = () => {
  return (
    <div className="py-12 mb-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-5 md:p-6 text-center group hover:border-primary/40 transition-all hover-lift"
          >
            <div className="w-11 h-11 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <stat.icon className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
              <AnimatedCounter 
                end={stat.value} 
                suffix={stat.suffix}
                decimals={stat.decimals || 0}
              />
            </div>
            <div className="font-semibold text-sm mb-1">{stat.label}</div>
            <div className="text-xs text-muted-foreground">{stat.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};