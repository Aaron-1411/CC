import { 
  FileText, Target, TrendingUp, ShoppingCart, Megaphone, 
  Share2, Users, Trophy, Lightbulb, Shield, Building2,
  DollarSign, Zap, Globe, MessageSquare, Eye
} from 'lucide-react';
import { CaseStudy } from '@/lib/api/caseStudy';
import { CaseStudySection, InfoRow, TagList } from './CaseStudySection';
import { Badge } from '@/components/ui/badge';

interface CaseStudyResultsProps {
  caseStudy: CaseStudy;
}

export const CaseStudyResults = ({ caseStudy }: CaseStudyResultsProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-bold">
            {caseStudy.brandName?.charAt(0) || 'B'}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">🧠 Brand Case Study — {caseStudy.brandName}</h1>
            <p className="text-muted-foreground">{caseStudy.inputs?.websiteUrl}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">{caseStudy.inputs?.category}</Badge>
              <Badge variant="outline">{caseStudy.inputs?.businessModel}</Badge>
              <Badge variant="outline">{caseStudy.inputs?.pricePoint}</Badge>
              <Badge variant="outline">{caseStudy.framing?.stage}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 0. Inputs */}
      <CaseStudySection icon={<FileText className="w-5 h-5" />} title="Inputs" emoji="🔹">
        <div className="space-y-1">
          <InfoRow label="Brand name" value={caseStudy.inputs?.brandName} />
          <InfoRow label="Website URL" value={caseStudy.inputs?.websiteUrl} />
          <InfoRow label="Country / Market" value={caseStudy.inputs?.country} />
          <InfoRow label="Category / Niche" value={caseStudy.inputs?.category} />
          <InfoRow label="Core Products" value={caseStudy.inputs?.coreProducts} />
          <InfoRow label="Business Model" value={caseStudy.inputs?.businessModel} />
          <InfoRow label="Price Point" value={caseStudy.inputs?.pricePoint} />
          <InfoRow label="Target Customer" value={caseStudy.inputs?.targetCustomer} />
          <InfoRow label="Why Worth Studying" value={caseStudy.inputs?.whyWorthStudying} />
          <InfoRow label="Hypothesis" value={caseStudy.inputs?.hypothesis} />
        </div>
      </CaseStudySection>

      {/* 1. Case Study Framing */}
      <CaseStudySection icon={<Target className="w-5 h-5" />} title="Case Study Framing" emoji="🧭">
        <div className="space-y-4">
          <InfoRow label="What they're really selling" value={caseStudy.framing?.whatTheySell} />
          <InfoRow label="Brand/Performance Led" value={caseStudy.framing?.brandOrPerformanceLed} />
          <InfoRow label="Stage" value={caseStudy.framing?.stage} />
          <InfoRow label="Category Story" value={caseStudy.framing?.categoryStory} />
          <div className="pt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Biggest Constraints:</p>
            <TagList items={caseStudy.framing?.biggestConstraints || []} variant="warning" />
          </div>
          <div className="pt-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Biggest Advantages:</p>
            <TagList items={caseStudy.framing?.biggestAdvantages || []} variant="success" />
          </div>
        </div>
      </CaseStudySection>

      {/* 2. Scale & Reality Snapshot */}
      <CaseStudySection icon={<TrendingUp className="w-5 h-5" />} title="Scale & Reality Snapshot" emoji="📊">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <h4 className="font-medium mb-3">Traffic & Channels</h4>
            <InfoRow label="Traffic Estimate" value={caseStudy.scaleSnapshot?.trafficEstimate} />
            <InfoRow label="Top Geographies" value={<TagList items={caseStudy.scaleSnapshot?.topGeographies || []} />} />
            <InfoRow label="Channel Mix" value={caseStudy.scaleSnapshot?.channelMix} />
          </div>
          <div className="space-y-1">
            <h4 className="font-medium mb-3">Business Signals</h4>
            <InfoRow label="Team Signals" value={caseStudy.scaleSnapshot?.teamSignals} />
            <InfoRow label="Funding" value={caseStudy.scaleSnapshot?.fundingSignals} />
            <InfoRow label="Retail Presence" value={caseStudy.scaleSnapshot?.retailPresence} />
            <InfoRow label="Partnerships" value={caseStudy.scaleSnapshot?.partnerships} />
          </div>
        </div>
        {caseStudy.scaleSnapshot?.revenueProxy && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue Proxy
              <Badge variant="outline" className="ml-2">{caseStudy.scaleSnapshot.revenueProxy.confidence} Confidence</Badge>
            </h4>
            <InfoRow label="Range" value={caseStudy.scaleSnapshot.revenueProxy.range} />
            <InfoRow label="Method" value={caseStudy.scaleSnapshot.revenueProxy.method} />
            <InfoRow label="Uncertainty" value={caseStudy.scaleSnapshot.revenueProxy.uncertainty} />
          </div>
        )}
      </CaseStudySection>

      {/* 3. Offer & Funnel Mechanics */}
      <CaseStudySection icon={<ShoppingCart className="w-5 h-5" />} title="Offer & Funnel Mechanics" emoji="🧲">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Core Offer Architecture</h4>
            <div className="space-y-1">
              <InfoRow label="Core Promise" value={caseStudy.offerMechanics?.corePromise} />
              <InfoRow label="Hero Headline" value={caseStudy.offerMechanics?.heroHeadline} />
              <InfoRow label="Primary CTA" value={caseStudy.offerMechanics?.primaryCta} />
              <InfoRow label="Entry Product" value={caseStudy.offerMechanics?.entryProduct} />
              <InfoRow label="Core Product" value={caseStudy.offerMechanics?.coreProduct} />
              <InfoRow label="Premium Product" value={caseStudy.offerMechanics?.premiumProduct} />
              <InfoRow label="Bundles" value={caseStudy.offerMechanics?.bundles} />
              <InfoRow label="Upsells/Cross-sells" value={caseStudy.offerMechanics?.upsells} />
              <InfoRow label="Subscription" value={caseStudy.offerMechanics?.subscription} />
              <InfoRow label="Pricing Architecture" value={caseStudy.offerMechanics?.pricingArchitecture} />
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-3">Funnel Psychology</h4>
            <div className="space-y-1">
              <InfoRow label="Buying Trigger" value={caseStudy.offerMechanics?.buyingTrigger} />
              <InfoRow label="Main Objections" value={<TagList items={caseStudy.offerMechanics?.mainObjections || []} variant="warning" />} />
              <InfoRow label="Objection Handling" value={caseStudy.offerMechanics?.objectionHandling} />
              <InfoRow label="Risk Reversal" value={caseStudy.offerMechanics?.riskReversal} />
              <InfoRow label="Urgency Source" value={caseStudy.offerMechanics?.urgencySource} />
              <InfoRow label="Trust Signals" value={<TagList items={caseStudy.offerMechanics?.trustSignals || []} variant="success" />} />
              <InfoRow label="Landing Page System" value={caseStudy.offerMechanics?.landingPageSystem} />
            </div>
          </div>
        </div>
      </CaseStudySection>

      {/* 4. Paid Media Strategy */}
      <CaseStudySection icon={<Megaphone className="w-5 h-5" />} title="Paid Media Strategy" emoji="📣">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Channel Roles</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(caseStudy.paidMediaStrategy?.channelRoles || {}).map(([channel, role]) => (
                <div key={channel} className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-medium text-primary uppercase">{channel}</span>
                  <p className="text-sm mt-1">{role || 'Not identified'}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Funnel Mapping</h4>
            <div className="grid gap-4">
              {['tof', 'mof', 'bof'].map((stage) => {
                const stageData = caseStudy.paidMediaStrategy?.funnelMapping?.[stage as keyof typeof caseStudy.paidMediaStrategy.funnelMapping];
                const stageLabels = { tof: 'Top of Funnel', mof: 'Middle of Funnel', bof: 'Bottom of Funnel' };
                return (
                  <div key={stage} className="p-4 border border-border rounded-lg">
                    <h5 className="font-medium text-sm mb-3">{stageLabels[stage as keyof typeof stageLabels]}</h5>
                    {stageData?.emotionsTargeted && (
                      <InfoRow label="Emotions" value={<TagList items={stageData.emotionsTargeted} />} />
                    )}
                    {stageData?.coreNarratives && (
                      <InfoRow label="Narratives" value={<TagList items={stageData.coreNarratives} />} />
                    )}
                    {stageData?.proofTypes && (
                      <InfoRow label="Proof Types" value={<TagList items={stageData.proofTypes} />} />
                    )}
                    <InfoRow label="Typical CTAs" value={<TagList items={stageData?.typicalCtas || []} />} />
                  </div>
                );
              })}
            </div>
          </div>

          {caseStudy.paidMediaStrategy?.creativeAngles && caseStudy.paidMediaStrategy.creativeAngles.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Creative Angles ({caseStudy.paidMediaStrategy.creativeAngles.length})</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {caseStudy.paidMediaStrategy.creativeAngles.map((angle, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium">{angle.angle}</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">{angle.funnelStage}</Badge>
                        <Badge variant="secondary" className="text-xs">{angle.channel}</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      <strong>Driver:</strong> {angle.emotionalDriver} • <strong>CTA:</strong> {angle.cta}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <InfoRow label="Creative Velocity" value={caseStudy.paidMediaStrategy?.creativeVelocity} />
          </div>
          <InfoRow label="Repeated Narratives" value={<TagList items={caseStudy.paidMediaStrategy?.repeatedNarratives || []} />} />
          <InfoRow label="Absent Angles" value={<TagList items={caseStudy.paidMediaStrategy?.absentAngles || []} variant="warning" />} />
        </div>
      </CaseStudySection>

      {/* 5. Organic Social Strategy */}
      <CaseStudySection icon={<Share2 className="w-5 h-5" />} title="Organic Social Strategy" emoji="📱">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3">Platform Roles</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(caseStudy.organicSocialStrategy?.platformRoles || {}).map(([platform, role]) => (
                <div key={platform} className="p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-medium text-primary uppercase">{platform}</span>
                  <p className="text-sm mt-1">{role || 'Not identified'}</p>
                </div>
              ))}
            </div>
          </div>

          {caseStudy.organicSocialStrategy?.contentPillars && caseStudy.organicSocialStrategy.contentPillars.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Content Pillars</h4>
              <div className="space-y-2">
                {caseStudy.organicSocialStrategy.contentPillars.map((pillar, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{pillar.pillar}</span>
                      <p className="text-sm text-muted-foreground">{pillar.notes}</p>
                    </div>
                    <Badge variant="outline">{pillar.percentOfFeed}</Badge>
                    <Badge variant="secondary">{pillar.goal}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <InfoRow label="Hook Patterns" value={<TagList items={caseStudy.organicSocialStrategy?.hookPatterns || []} />} />
              <InfoRow label="Visual Identity" value={caseStudy.organicSocialStrategy?.visualIdentity} />
              <InfoRow label="Voice Style" value={caseStudy.organicSocialStrategy?.voiceStyle} />
            </div>
            <div>
              <InfoRow label="Founder Visibility" value={caseStudy.organicSocialStrategy?.founderVisibility} />
              <InfoRow label="Founder Role" value={caseStudy.organicSocialStrategy?.founderRole} />
              <InfoRow label="Posting Cadence" value={caseStudy.organicSocialStrategy?.postingCadence} />
            </div>
          </div>
        </div>
      </CaseStudySection>

      {/* 6. Influencer & Affiliate Engine */}
      <CaseStudySection icon={<Users className="w-5 h-5" />} title="Influencer & Affiliate Engine" emoji="🔗">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Affiliate Program</h4>
            <InfoRow label="Exists" value={caseStudy.influencerEngine?.affiliateProgram?.exists ? 'Yes' : 'No / Unknown'} />
            <InfoRow label="Platform" value={caseStudy.influencerEngine?.affiliateProgram?.platform} />
            <InfoRow label="Commission Rate" value={caseStudy.influencerEngine?.affiliateProgram?.commissionRate} />
          </div>
          <div>
            <h4 className="font-medium mb-3">Creator Strategy</h4>
            <InfoRow label="Density" value={caseStudy.influencerEngine?.creatorStrategy?.density} />
            <InfoRow label="Archetypes" value={<TagList items={caseStudy.influencerEngine?.creatorStrategy?.archetypes || []} />} />
            <InfoRow label="Content Style" value={caseStudy.influencerEngine?.creatorStrategy?.contentStyle} />
          </div>
        </div>
        <div className="mt-4">
          <InfoRow label="Partnerships" value={<TagList items={caseStudy.influencerEngine?.partnerships || []} />} />
          <InfoRow label="Distribution Risk" value={caseStudy.influencerEngine?.distributionRisk} />
        </div>
      </CaseStudySection>

      {/* 7. Why This Brand Wins */}
      <CaseStudySection icon={<Trophy className="w-5 h-5" />} title="Why This Brand Wins" emoji="🏆">
        <div className="space-y-4">
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <p className="text-sm font-medium text-primary mb-1">Primary Growth Lever</p>
            <p className="text-lg font-semibold">{caseStudy.whyTheyWin?.primaryGrowthLever}</p>
          </div>
          
          <InfoRow label="Secondary Levers" value={<TagList items={caseStudy.whyTheyWin?.secondaryLevers || []} variant="success" />} />
          <InfoRow label="Hard-to-Copy Advantages" value={<TagList items={caseStudy.whyTheyWin?.hardToCopyAdvantages || []} variant="success" />} />
          
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <div>
              <h4 className="font-medium mb-3">Moats</h4>
              <InfoRow label="Product" value={caseStudy.whyTheyWin?.moats?.product} />
              <InfoRow label="Brand" value={caseStudy.whyTheyWin?.moats?.brand} />
              <InfoRow label="Distribution" value={caseStudy.whyTheyWin?.moats?.distribution} />
              <InfoRow label="Operational" value={caseStudy.whyTheyWin?.moats?.operational} />
            </div>
            <div>
              <h4 className="font-medium mb-3">Risks & Weaknesses</h4>
              <TagList items={caseStudy.whyTheyWin?.weaknesses || []} variant="destructive" />
              <div className="mt-4">
                <InfoRow label="What Breaks If Copied" value={caseStudy.whyTheyWin?.whatBreaksIfCopied} />
              </div>
            </div>
          </div>
        </div>
      </CaseStudySection>

      {/* 8. Emulation & Transfer */}
      <CaseStudySection icon={<Lightbulb className="w-5 h-5" />} title="Emulation & Transfer" emoji="🧪">
        <div className="space-y-4">
          <InfoRow label="What to Copy" value={<TagList items={caseStudy.emulationPlan?.whatToCopy || []} variant="success" />} />
          <InfoRow label="What to Adapt" value={<TagList items={caseStudy.emulationPlan?.whatToAdapt || []} />} />
          <InfoRow label="What to Avoid" value={<TagList items={caseStudy.emulationPlan?.whatToAvoid || []} variant="destructive" />} />
          <InfoRow label="Best Categories" value={<TagList items={caseStudy.emulationPlan?.bestCategories || []} />} />
          <InfoRow label="Required Constraints" value={<TagList items={caseStudy.emulationPlan?.requiredConstraints || []} variant="warning" />} />
          
          {caseStudy.emulationPlan?.thirtyDayPlan && (
            <div className="mt-6">
              <h4 className="font-medium mb-4">30-Day Replication Plan</h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(caseStudy.emulationPlan.thirtyDayPlan).map(([week, tasks]) => (
                  <div key={week} className="p-4 border border-border rounded-lg">
                    <h5 className="font-medium text-sm mb-2 capitalize">{week.replace('week', 'Week ')}</h5>
                    <ul className="space-y-1">
                      {(tasks as string[]).map((task, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CaseStudySection>

      {/* Competitors */}
      {caseStudy.competitors && caseStudy.competitors.length > 0 && (
        <CaseStudySection icon={<Building2 className="w-5 h-5" />} title="Competitor Analysis" emoji="⚔️">
          <div className="grid gap-4">
            {caseStudy.competitors.map((competitor, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="font-semibold">{competitor.name}</h4>
                    <a href={competitor.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {competitor.url}
                    </a>
                  </div>
                </div>
                <InfoRow label="Positioning" value={competitor.positioning} />
                <InfoRow label="Differentiator" value={competitor.differentiator} />
                <div className="grid sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Strengths</p>
                    <TagList items={competitor.strengths} variant="success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Weaknesses</p>
                    <TagList items={competitor.weaknesses} variant="destructive" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CaseStudySection>
      )}

      {/* 10. Verification Log */}
      <CaseStudySection icon={<Shield className="w-5 h-5" />} title="Verification Log" emoji="✅" defaultOpen={false}>
        <div className="space-y-6">
          {caseStudy.verificationLog?.verifiedFacts && caseStudy.verificationLog.verifiedFacts.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">Verified Facts</h4>
              <div className="space-y-2">
                {caseStudy.verificationLog.verifiedFacts.map((fact, i) => (
                  <div key={i} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg text-sm">
                    <p className="font-medium">{fact.fact}</p>
                    <p className="text-muted-foreground mt-1">Source: {fact.source}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {caseStudy.verificationLog?.hypotheses && caseStudy.verificationLog.hypotheses.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 text-yellow-600 dark:text-yellow-400">Hypotheses (Need Verification)</h4>
              <div className="space-y-2">
                {caseStudy.verificationLog.hypotheses.map((hypo, i) => (
                  <div key={i} className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg text-sm">
                    <p className="font-medium">{hypo.hypothesis}</p>
                    <p className="text-muted-foreground mt-1">
                      <strong>Evidence needed:</strong> {hypo.evidenceNeeded}
                    </p>
                    <p className="text-muted-foreground">
                      <strong>Where to check:</strong> {hypo.whereToCheck}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CaseStudySection>
    </div>
  );
};
