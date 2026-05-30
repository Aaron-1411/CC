import { useState } from 'react';
import { BrandAnalysis, KeyFeature, USP, CustomerPersona, MarketingAngle, SelectedInsights } from '@/lib/api/adGenerator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Star, 
  Trophy, 
  Users, 
  Lightbulb, 
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface BrandInsightSelectorProps {
  analysis: BrandAnalysis;
  onGenerate: (selected: SelectedInsights) => void;
  isGenerating: boolean;
}

export const BrandInsightSelector = ({ 
  analysis, 
  onGenerate, 
  isGenerating 
}: BrandInsightSelectorProps) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    analysis.keyFeatures.slice(0, 3).map(f => f.id)
  );
  const [selectedUSPs, setSelectedUSPs] = useState<string[]>(
    analysis.uniqueSellingPoints.slice(0, 2).map(u => u.id)
  );
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(
    analysis.customerPersonas.slice(0, 2).map(p => p.id)
  );
  const [selectedAngles, setSelectedAngles] = useState<string[]>(
    analysis.marketingAngles.slice(0, 3).map(a => a.id)
  );

  const toggleSelection = (
    id: string, 
    current: string[], 
    setter: (value: string[]) => void
  ) => {
    if (current.includes(id)) {
      setter(current.filter(i => i !== id));
    } else {
      setter([...current, id]);
    }
  };

  const handleGenerate = () => {
    onGenerate({
      features: selectedFeatures,
      usps: selectedUSPs,
      personas: selectedPersonas,
      angles: selectedAngles,
    });
  };

  const totalSelected = selectedFeatures.length + selectedUSPs.length + 
    selectedPersonas.length + selectedAngles.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Select Your Ad Ingredients</h2>
        <p className="text-muted-foreground">
          Choose the features, USPs, personas, and angles to include in your generated ads
        </p>
      </div>

      {/* Product Overview */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{analysis.productOverview.name}</h3>
            <p className="text-sm text-muted-foreground">
              {analysis.productOverview.type} • {analysis.productOverview.category}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Features */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">Key Features</h3>
            <Badge variant="secondary" className="ml-auto">
              {selectedFeatures.length}/{analysis.keyFeatures.length}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {analysis.keyFeatures.map((feature) => (
              <label 
                key={feature.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedFeatures.includes(feature.id)
                    ? 'bg-yellow-500/10 border border-yellow-500/30'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <Checkbox 
                  checked={selectedFeatures.includes(feature.id)}
                  onCheckedChange={() => toggleSelection(feature.id, selectedFeatures, setSelectedFeatures)}
                />
                <span className="text-sm">{feature.feature}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* USPs */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">Unique Selling Points</h3>
            <Badge variant="secondary" className="ml-auto">
              {selectedUSPs.length}/{analysis.uniqueSellingPoints.length}
            </Badge>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
            {analysis.uniqueSellingPoints.map((usp) => (
              <label 
                key={usp.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedUSPs.includes(usp.id)
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <Checkbox 
                  checked={selectedUSPs.includes(usp.id)}
                  onCheckedChange={() => toggleSelection(usp.id, selectedUSPs, setSelectedUSPs)}
                />
                <span className="text-sm">{usp.point}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Customer Personas */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Target Personas</h3>
            <Badge variant="secondary" className="ml-auto">
              {selectedPersonas.length}/{analysis.customerPersonas.length}
            </Badge>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {analysis.customerPersonas.map((persona) => (
              <label 
                key={persona.id}
                className={`block p-3 rounded-lg cursor-pointer transition-all ${
                  selectedPersonas.includes(persona.id)
                    ? 'bg-purple-500/10 border border-purple-500/30'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={selectedPersonas.includes(persona.id)}
                    onCheckedChange={() => toggleSelection(persona.id, selectedPersonas, setSelectedPersonas)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{persona.name}</div>
                    <p className="text-xs text-muted-foreground mt-1">{persona.demographics}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {persona.painPoints.slice(0, 2).map((point, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-red-400/80">
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>

        {/* Marketing Angles */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold">Marketing Angles</h3>
            <Badge variant="secondary" className="ml-auto">
              {selectedAngles.length}/{analysis.marketingAngles.length}
            </Badge>
          </div>
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
            {analysis.marketingAngles.map((angle) => (
              <label 
                key={angle.id}
                className={`block p-3 rounded-lg cursor-pointer transition-all ${
                  selectedAngles.includes(angle.id)
                    ? 'bg-orange-500/10 border border-orange-500/30'
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={selectedAngles.includes(angle.id)}
                    onCheckedChange={() => toggleSelection(angle.id, selectedAngles, setSelectedAngles)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{angle.angle}</span>
                      <Badge variant="outline" className="text-xs">
                        {angle.targetEmotion}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground italic">"{angle.hook}"</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <Button 
          size="lg"
          onClick={handleGenerate}
          disabled={isGenerating || totalSelected === 0}
          className="px-8"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              Generating Ads...
            </>
          ) : (
            <>
              Generate Ads
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground">
          {totalSelected} ingredients selected • Ads will be customized based on your choices
        </p>
      </div>
    </div>
  );
};
