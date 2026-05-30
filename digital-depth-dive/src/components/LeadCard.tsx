import { Lead } from '@/lib/api/leads';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, Mail, Phone, Globe, ExternalLink, Copy, Check, 
  Linkedin, MapPin, Users, Calendar, Star, ChevronDown, ChevronUp,
  ShieldCheck, ShieldAlert, ShieldQuestion, AlertCircle, FolderPlus
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AddToListButton } from './LeadListManager';

interface LeadCardProps {
  lead: Lead;
  index: number;
  expanded?: boolean;
  showAddToList?: boolean;
}

const EmailVerificationBadge = ({ confidence }: { confidence: string }) => {
  const configs: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    high: {
      icon: <ShieldCheck className="w-3 h-3" />,
      label: 'Verified',
      className: 'bg-green-500/10 text-green-500 border-green-500/30',
    },
    medium: {
      icon: <ShieldQuestion className="w-3 h-3" />,
      label: 'Likely Valid',
      className: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    },
    low: {
      icon: <ShieldAlert className="w-3 h-3" />,
      label: 'Unverified',
      className: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
    },
    none: {
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Unknown',
      className: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
    },
  };

  const config = configs[confidence] || configs.none;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={cn("text-[10px] gap-1", config.className)}>
            {config.icon}
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Email confidence: {confidence}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const LeadCard = ({ lead, index, expanded: initialExpanded = false, showAddToList = true }: LeadCardProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(initialExpanded);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-500 border-green-500/30';
    if (score >= 60) return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    if (score >= 40) return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
    return 'bg-red-500/10 text-red-500 border-red-500/30';
  };

  const hasExtendedInfo = lead.address || lead.socialProfiles?.linkedin || 
    lead.businessSignals?.yearsInBusiness || lead.decisionMaker?.name;

  const emailConfidence = lead.extractionConfidence?.email || 'none';
  const phoneConfidence = lead.extractionConfidence?.phone || 'none';

  return (
    <Card 
      className="glass-card opacity-0 animate-fade-in hover:border-primary/30 transition-all duration-300"
      style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              {lead.qualityScore !== undefined && (
                <Badge 
                  variant="outline" 
                  className={cn("text-xs font-semibold", getQualityColor(lead.qualityScore))}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {lead.qualityScore}
                </Badge>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{lead.name}</h3>
                {lead.category && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {lead.category}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lead.description}</p>
              
              <div className="flex flex-wrap gap-2 mt-3">
                {lead.email && (
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary/20 transition-colors gap-1.5"
                      onClick={() => copyToClipboard(lead.email!, 'email')}
                    >
                      <Mail className="w-3 h-3" />
                      {lead.email}
                      {copiedField === 'email' ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-50" />
                      )}
                    </Badge>
                    <EmailVerificationBadge confidence={emailConfidence} />
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-1">
                    <Badge 
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary/20 transition-colors gap-1.5"
                      onClick={() => copyToClipboard(lead.phone!, 'phone')}
                    >
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                      {copiedField === 'phone' ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-50" />
                      )}
                    </Badge>
                    {phoneConfidence === 'high' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30 gap-1">
                              <ShieldCheck className="w-3 h-3" />
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Phone verified</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
                {lead.address && (
                  <Badge variant="outline" className="gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[200px]">{lead.address}</span>
                  </Badge>
                )}
              </div>

              {/* Expanded details */}
              {expanded && hasExtendedInfo && (
                <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                  {/* Business signals */}
                  {(lead.businessSignals?.yearsInBusiness || lead.businessSignals?.employeeCount) && (
                    <div className="flex flex-wrap gap-3 text-sm">
                      {lead.businessSignals.yearsInBusiness && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {lead.businessSignals.yearsInBusiness} years in business
                        </span>
                      )}
                      {lead.businessSignals.employeeCount && (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          {lead.businessSignals.employeeCount} employees
                        </span>
                      )}
                    </div>
                  )}

                  {/* Decision maker */}
                  {lead.decisionMaker?.name && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Key Contact: </span>
                      <span className="font-medium">{lead.decisionMaker.name}</span>
                      {lead.decisionMaker.title && (
                        <span className="text-muted-foreground"> ({lead.decisionMaker.title})</span>
                      )}
                    </div>
                  )}

                  {/* Service areas */}
                  {lead.businessSignals?.serviceAreas && lead.businessSignals.serviceAreas.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-1">Service Areas:</span>
                      {lead.businessSignals.serviceAreas.map((area, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Social profiles */}
                  {(lead.socialProfiles?.linkedin || lead.socialProfiles?.facebook) && (
                    <div className="flex gap-2">
                      {lead.socialProfiles.linkedin && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => window.open(lead.socialProfiles?.linkedin!, '_blank')}
                        >
                          <Linkedin className="w-4 h-4 mr-1.5" />
                          LinkedIn
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(lead.website, '_blank')}
            >
              <Globe className="w-4 h-4 mr-1.5" />
              Visit
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </Button>
            <div className="flex gap-1">
              {showAddToList && <AddToListButton lead={lead} variant="icon" />}
              {hasExtendedInfo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {(!lead.email && !lead.phone) && (
          <div className="mt-3 p-2 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">No contact info found - visit website for details</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
