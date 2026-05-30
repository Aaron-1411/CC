import { BrandAnalysis } from '@/lib/api/adGenerator';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Package, 
  Star, 
  Target, 
  Lightbulb, 
  Palette, 
  Trophy,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BrandAnalysisCardProps {
  analysis: BrandAnalysis;
  scrapedBranding?: any;
  compact?: boolean;
}

export const BrandAnalysisCard = ({ analysis, scrapedBranding, compact = false }: BrandAnalysisCardProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    features: !compact,
    usps: !compact,
    personas: false,
    angles: !compact,
    branding: false,
    advantages: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const Section = ({ 
    id, 
    icon: Icon, 
    title, 
    children,
    color = 'text-primary'
  }: { 
    id: string; 
    icon: any; 
    title: string; 
    children: React.ReactNode;
    color?: string;
  }) => (
    <Collapsible open={expandedSections[id]} onOpenChange={() => toggleSection(id)}>
      <CollapsibleTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="font-medium">{title}</span>
          </div>
          {expandedSections[id] ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <Card className="overflow-hidden bg-card/50 backdrop-blur-sm">
      <div className="p-4 border-b border-border/50 bg-muted/30">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Brand Analysis
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {analysis.productOverview.name} - {analysis.productOverview.category}
        </p>
      </div>

      <div className="divide-y divide-border/50">
        {/* Product Overview */}
        <Section id="overview" icon={Package} title="Product Overview" color="text-blue-400">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{analysis.productOverview.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span>{analysis.productOverview.category}</span>
            </div>
            <p className="text-muted-foreground pt-2">{analysis.productOverview.description}</p>
          </div>
        </Section>

        {/* Key Features */}
        <Section id="features" icon={Star} title={`Key Features (${analysis.keyFeatures.length})`} color="text-yellow-400">
          <div className="flex flex-wrap gap-2">
            {analysis.keyFeatures.map((feature, i) => (
              <Badge key={feature.id || i} variant="secondary" className="text-xs">
                {feature.feature}
              </Badge>
            ))}
          </div>
        </Section>

        {/* USPs */}
        <Section id="usps" icon={Trophy} title={`USPs (${analysis.uniqueSellingPoints.length})`} color="text-green-400">
          <ul className="space-y-2 text-sm">
            {analysis.uniqueSellingPoints.map((usp, i) => (
              <li key={usp.id || i} className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>{usp.point}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Customer Personas */}
        <Section id="personas" icon={Users} title={`Personas (${analysis.customerPersonas.length})`} color="text-purple-400">
          <div className="space-y-4">
            {analysis.customerPersonas.map((persona, i) => (
              <div key={persona.id || i} className="bg-muted/30 rounded-lg p-3">
                <h4 className="font-medium text-sm mb-2">{persona.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{persona.demographics}</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1">Pain Points:</span>
                    <ul className="list-disc list-inside">
                      {persona.painPoints.slice(0, 3).map((point, j) => (
                        <li key={j} className="text-red-400/80">{point}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Motivations:</span>
                    <ul className="list-disc list-inside">
                      {persona.motivations.slice(0, 3).map((mot, j) => (
                        <li key={j} className="text-green-400/80">{mot}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Marketing Angles */}
        <Section id="angles" icon={Lightbulb} title={`Marketing Angles (${analysis.marketingAngles.length})`} color="text-orange-400">
          <div className="space-y-3">
            {analysis.marketingAngles.map((angle, i) => (
              <div key={angle.id || i} className="bg-orange-500/5 rounded-lg p-3 border border-orange-500/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{angle.angle}</span>
                  <Badge variant="outline" className="text-xs">
                    {angle.targetEmotion}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground italic">"{angle.hook}"</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Branding */}
        <Section id="branding" icon={Palette} title="Brand Voice & Style" color="text-pink-400">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Color Scheme:</span>
              <span>{analysis.branding.colorScheme}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tone:</span>
              <span>{analysis.branding.tone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Style:</span>
              <span>{analysis.branding.style}</span>
            </div>
            {analysis.branding.primaryColors?.length > 0 && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-muted-foreground text-xs">Colors:</span>
                <div className="flex gap-1">
                  {analysis.branding.primaryColors.map((color, i) => (
                    <div 
                      key={i}
                      className="w-6 h-6 rounded border border-border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Competitive Advantages */}
        <Section id="advantages" icon={Trophy} title={`Competitive Advantages (${analysis.competitiveAdvantages.length})`} color="text-cyan-400">
          <ul className="space-y-2 text-sm">
            {analysis.competitiveAdvantages.map((adv, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">→</span>
                <span>{adv}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Card>
  );
};
