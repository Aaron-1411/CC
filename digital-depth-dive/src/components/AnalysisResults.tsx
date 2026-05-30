import { AnalysisResult } from '@/lib/api/analyze';
import { AnalysisCard } from './AnalysisCard';
import { ScoreCircle } from './ScoreCircle';
import { WebsiteScreenshot } from './WebsiteScreenshot';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Target, 
  Layout, 
  Palette, 
  MousePointerClick, 
  MessageSquare,
  User,
  Clock,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Image,
  Search,
  Shield,
  Zap,
  Eye,
  FileCode,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface AnalysisResultsProps {
  analysis: AnalysisResult & {
    technicalSeo?: any;
    accessibility?: any;
    aioOptimization?: any;
    security?: any;
    performanceIndicators?: any;
    executiveSummary?: string;
    topRecommendationsDetailed?: any[];
  };
  metadata?: { title?: string; description?: string; sourceURL?: string };
  url: string;
  screenshot?: string;
}

export const AnalysisResults = ({ analysis, metadata, url, screenshot }: AnalysisResultsProps) => {
  // Check if extended analysis data is available
  const hasExtendedData = analysis.technicalSeo || analysis.accessibility || analysis.aioOptimization;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* Header with Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Website Info */}
        <div className="space-y-4 opacity-0 animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-bold">{metadata?.title || url}</h2>
          <a 
            href={url.startsWith('http') ? url : `https://${url}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            {url}
            <ExternalLink className="w-4 h-4" />
          </a>
          {metadata?.description && (
            <p className="text-muted-foreground">{metadata.description}</p>
          )}
          
          {/* Executive Summary */}
          {analysis.executiveSummary && (
            <div className="glass-card p-4 rounded-xl border-l-4 border-primary">
              <p className="text-sm font-medium text-primary mb-1">Executive Summary</p>
              <p className="text-sm text-muted-foreground">{analysis.executiveSummary}</p>
            </div>
          )}
          
          {/* Overall Score */}
          <div className="glass-card p-6 rounded-2xl flex items-center gap-6 mt-6">
            <ScoreCircle score={analysis.overallScore} size="lg" label="Overall Score" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Enterprise-grade assessment across UX, SEO, conversion, accessibility, and security.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-score-excellent" />
                  <span>80+ Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-score-good" />
                  <span>60-79 Good</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-score-average" />
                  <span>40-59 Average</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-score-poor" />
                  <span>&lt;40 Needs Work</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screenshot */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {screenshot ? (
            <WebsiteScreenshot screenshot={screenshot} url={url} title={metadata?.title} />
          ) : (
            <div className="glass-card rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Screenshot not available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extended Metrics Bar */}
      {hasExtendedData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '150ms' }}>
          {analysis.technicalSeo && (
            <div className="glass-card p-4 rounded-xl text-center">
              <Search className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold">{analysis.technicalSeo.score}</p>
              <p className="text-xs text-muted-foreground">Technical SEO</p>
            </div>
          )}
          {analysis.accessibility && (
            <div className="glass-card p-4 rounded-xl text-center">
              <Eye className="w-5 h-5 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold">{analysis.accessibility.score}</p>
              <p className="text-xs text-muted-foreground">Accessibility</p>
            </div>
          )}
          {analysis.aioOptimization && (
            <div className="glass-card p-4 rounded-xl text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold">{analysis.aioOptimization.score}</p>
              <p className="text-xs text-muted-foreground">AI Overview Ready</p>
            </div>
          )}
          {analysis.security && (
            <div className="glass-card p-4 rounded-xl text-center">
              <Shield className="w-5 h-5 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold">{analysis.security.score}</p>
              <p className="text-xs text-muted-foreground">Security</p>
            </div>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry & Business */}
        <AnalysisCard title="Industry & Business" icon={<Building2 className="w-5 h-5" />} delay={200}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Industry</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">{analysis.industry.name}</Badge>
                <span className="text-sm text-muted-foreground">
                  ({analysis.industry.confidence}% confidence)
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{analysis.industry.subCategory}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Main Product/Service</p>
              <p className="font-medium">{analysis.businessOffer.mainProduct}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Value Proposition</p>
              <p className="text-sm">{analysis.businessOffer.valueProposition}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Target Audience</p>
              <p className="text-sm">{analysis.businessOffer.targetAudience}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pricing Model</p>
              <Badge variant="outline">{analysis.businessOffer.pricingModel}</Badge>
            </div>
            {analysis.businessOffer.differentiators && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Key Differentiators</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.businessOffer.differentiators.map((d: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.businessOffer.trustSignals && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Trust Signals</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.businessOffer.trustSignals.map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnalysisCard>

        {/* Website Creator & Last Updated */}
        <div className="space-y-6">
          <AnalysisCard title="Website Creator" icon={<User className="w-5 h-5" />} delay={250}>
            <div className="space-y-3">
              {analysis.websiteCreator.identified ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-score-good" />
                    <span className="font-medium">{analysis.websiteCreator.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Found in: {analysis.websiteCreator.evidence}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Creator not identified</span>
                </div>
              )}
              {analysis.websiteCreator.platform && (
                <div>
                  <p className="text-sm text-muted-foreground">Platform Detected</p>
                  <Badge variant="secondary">{analysis.websiteCreator.platform}</Badge>
                </div>
              )}
              {analysis.websiteCreator.technologies && (
                <div>
                  <p className="text-sm text-muted-foreground">Technologies</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {analysis.websiteCreator.technologies.map((tech: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AnalysisCard>

          <AnalysisCard title="Last Updated" icon={<Clock className="w-5 h-5" />} delay={300}>
            <div className="space-y-3">
              <p className="font-medium">{analysis.lastUpdated.estimated}</p>
              <p className="text-sm text-muted-foreground">{analysis.lastUpdated.evidence}</p>
              <Badge variant="outline" className="capitalize">
                {analysis.lastUpdated.confidence} confidence
              </Badge>
            </div>
          </AnalysisCard>
        </div>
      </div>

      {/* Effectiveness Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalysisCard title="UX Design" icon={<Layout className="w-5 h-5" />} delay={350}>
          <div className="flex flex-col items-center gap-4">
            <ScoreCircle score={analysis.effectiveness.ux.score} size="md" />
            <p className="text-sm text-center text-muted-foreground">
              {analysis.effectiveness.ux.summary}
            </p>
            <div className="w-full space-y-2">
              <div>
                <p className="text-xs font-medium text-score-good mb-1">Strengths</p>
                <ul className="text-xs space-y-1">
                  {analysis.effectiveness.ux.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 text-score-good shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-score-average mb-1">Improvements</p>
                <ul className="text-xs space-y-1">
                  {analysis.effectiveness.ux.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 text-score-average shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard title="Visual Design" icon={<Palette className="w-5 h-5" />} delay={400}>
          <div className="flex flex-col items-center gap-4">
            <ScoreCircle score={analysis.effectiveness.visual.score} size="md" />
            <p className="text-sm text-center text-muted-foreground">
              {analysis.effectiveness.visual.summary}
            </p>
            <div className="w-full space-y-2">
              <div>
                <p className="text-xs font-medium text-score-good mb-1">Strengths</p>
                <ul className="text-xs space-y-1">
                  {analysis.effectiveness.visual.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 text-score-good shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-score-average mb-1">Improvements</p>
                <ul className="text-xs space-y-1">
                  {analysis.effectiveness.visual.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 text-score-average shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard title="Conversion" icon={<MousePointerClick className="w-5 h-5" />} delay={450}>
          <div className="flex flex-col items-center gap-4">
            <ScoreCircle score={analysis.effectiveness.conversion.score} size="md" />
            <p className="text-sm text-center text-muted-foreground">
              {analysis.effectiveness.conversion.summary}
            </p>
            <div className="w-full space-y-2">
              <div>
                <p className="text-xs font-medium text-score-good mb-1">Present Elements</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.effectiveness.conversion.conversionElements.map((el: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{el}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-score-average mb-1">Missing</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.effectiveness.conversion.missingElements.map((el: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{el}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard title="Communication" icon={<MessageSquare className="w-5 h-5" />} delay={500}>
          <div className="flex flex-col items-center gap-4">
            <ScoreCircle score={analysis.effectiveness.communication.score} size="md" />
            <div className="w-full">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Message Clarity</span>
                <span className="font-medium">{analysis.effectiveness.communication.clarity}%</span>
              </div>
              <Progress value={analysis.effectiveness.communication.clarity} className="h-2" />
            </div>
            <p className="text-sm text-center text-muted-foreground">
              {analysis.effectiveness.communication.summary}
            </p>
          </div>
        </AnalysisCard>
      </div>

      {/* Technical SEO Section */}
      {analysis.technicalSeo && (
        <AnalysisCard title="Technical SEO" icon={<Search className="w-5 h-5" />} delay={520}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Title Tag</span>
                {analysis.technicalSeo.titleTag.optimized ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{analysis.technicalSeo.titleTag.feedback}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Meta Description</span>
                {analysis.technicalSeo.metaDescription.optimized ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{analysis.technicalSeo.metaDescription.feedback}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Heading Structure</span>
                {analysis.technicalSeo.headingStructure.hasProperHierarchy ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">H1 count: {analysis.technicalSeo.headingStructure.h1Count}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Content Length</span>
                {analysis.technicalSeo.contentLength.adequate ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">~{analysis.technicalSeo.contentLength.wordCount} words</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Schema Markup</span>
                {analysis.technicalSeo.schemaMarkup.detected ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {analysis.technicalSeo.schemaMarkup.detected 
                  ? analysis.technicalSeo.schemaMarkup.types.join(', ')
                  : 'Not detected'
                }
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Image Alt Tags</span>
                {analysis.technicalSeo.imageOptimization.altTagsPresent ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{analysis.technicalSeo.imageOptimization.feedback}</p>
            </div>
          </div>
        </AnalysisCard>
      )}

      {/* AI Overview Optimization */}
      {analysis.aioOptimization && (
        <AnalysisCard title="AI Overview Optimization" icon={<Sparkles className="w-5 h-5" />} delay={540}>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{analysis.aioOptimization.contentStructure}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-green-400 mb-2">AIO Strengths</p>
                <ul className="text-xs space-y-1">
                  {analysis.aioOptimization.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-400 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-orange-400 mb-2">Improvements</p>
                <ul className="text-xs space-y-1">
                  {analysis.aioOptimization.improvements.map((i: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 text-orange-400 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {analysis.aioOptimization.authoritySignals && analysis.aioOptimization.authoritySignals.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">E-E-A-T Signals</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.aioOptimization.authoritySignals.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnalysisCard>
      )}

      {/* Security & Accessibility Row */}
      {(analysis.security || analysis.accessibility) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analysis.security && (
            <AnalysisCard title="Security" icon={<Shield className="w-5 h-5" />} delay={560}>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    {analysis.security.httpsEnabled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    HTTPS
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {analysis.security.privacyPolicy ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                    )}
                    Privacy Policy
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {analysis.security.cookieConsent ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                    )}
                    Cookie Consent
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {analysis.security.contactInfo ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                    )}
                    Contact Info
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{analysis.security.feedback}</p>
              </div>
            </AnalysisCard>
          )}

          {analysis.accessibility && (
            <AnalysisCard title="Accessibility (WCAG)" icon={<Eye className="w-5 h-5" />} delay={580}>
              <div className="space-y-3">
                {analysis.accessibility.positives.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-400 mb-1">Positives</p>
                    <ul className="text-xs space-y-1">
                      {analysis.accessibility.positives.slice(0, 3).map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-400 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.accessibility.issues.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-orange-400 mb-1">Issues</p>
                    <ul className="text-xs space-y-1">
                      {analysis.accessibility.issues.slice(0, 3).map((issue: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 text-orange-400 shrink-0" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">{analysis.accessibility.feedback}</p>
              </div>
            </AnalysisCard>
          )}
        </div>
      )}

      {/* Competitor Insights */}
      {analysis.competitorInsights?.analyzed && (
        <AnalysisCard title="Competitor Insights" icon={<TrendingUp className="w-5 h-5" />} delay={580}>
          <div className="space-y-4">
            <p className="text-sm">{analysis.competitorInsights.summary}</p>
            {analysis.competitorInsights.competitorStrengths?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-orange-400 mb-2">Competitor Advantages</p>
                <ul className="text-xs space-y-1">
                  {analysis.competitorInsights.competitorStrengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 mt-0.5 text-orange-400 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.competitorInsights.opportunityGaps?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-400 mb-2">Opportunity Gaps</p>
                <ul className="text-xs space-y-1">
                  {analysis.competitorInsights.opportunityGaps.map((g: string, i: number) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle2 className="w-3 h-3 mt-0.5 text-green-400 shrink-0" />
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </AnalysisCard>
      )}

      {/* Recommendations */}
      <AnalysisCard title="Prioritized Recommendations" icon={<Lightbulb className="w-5 h-5" />} delay={600}>
        <ul className="space-y-3">
          {(analysis.topRecommendationsDetailed || analysis.topRecommendations.map((rec: string, i: number) => ({
            priority: i + 1,
            category: 'General',
            recommendation: rec,
            impact: 'medium',
            effort: 'medium'
          }))).map((rec: any, i: number) => (
            <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium shrink-0 ${
                rec.priority === 1 ? 'bg-red-500/20 text-red-400' :
                rec.priority === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-primary/20 text-primary'
              }`}>
                {rec.priority}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                  {rec.impact && (
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${
                        rec.impact === 'high' ? 'bg-green-500/10 text-green-400' :
                        rec.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {rec.impact} impact
                    </Badge>
                  )}
                  {rec.effort && (
                    <Badge variant="secondary" className="text-xs">
                      {rec.effort} effort
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{rec.recommendation || rec}</p>
              </div>
            </li>
          ))}
        </ul>
      </AnalysisCard>
    </div>
  );
};
