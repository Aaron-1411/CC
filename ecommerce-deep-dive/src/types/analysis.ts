export type RAGStatus = 'GREEN' | 'AMBER' | 'RED' | 'PENDING' | 'RUNNING';
export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type CheckType = 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';

export interface Finding {
  type: CheckType;
  text: string;
  confidence: Confidence;
  dataGapFlag?: string;
}

export interface PillarResult {
  id: number;
  name: string;
  status: RAGStatus;
  findings: Finding[];
  opportunity: string;
  dataGap?: string;
  completedAt?: Date;
  error?: string;
}

export interface AnalysisJob {
  id: string;
  url: string;
  brandName: string;
  supplementaryData?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';
  pillars: PillarResult[];
  startedAt: Date;
  completedAt?: Date;
  opportunityMatrix?: OpportunityMatrix;
  error?: string;
}

export interface OpportunityMatrix {
  highImpactEasy: string[];
  highImpactInvestment: string[];
  lowerImpactEasy: string[];
  longerTerm: string[];
}
