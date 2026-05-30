import { AnalysisResult } from '@/lib/api/analyze';

// Extended analysis type for enterprise features
export interface ExtendedAnalysisResult extends AnalysisResult {
  technicalSeo?: {
    score: number;
    titleTag: {
      present: boolean;
      optimized: boolean;
      length: number;
      feedback: string;
    };
    metaDescription: {
      present: boolean;
      optimized: boolean;
      length: number;
      feedback: string;
    };
    headingStructure: {
      h1Count: number;
      hasProperHierarchy: boolean;
      feedback: string;
    };
    contentLength: {
      wordCount: number;
      adequate: boolean;
      feedback: string;
    };
    internalLinking: {
      count: number;
      quality: string;
      feedback: string;
    };
    schemaMarkup: {
      detected: boolean;
      types: string[];
      feedback: string;
    };
    imageOptimization: {
      altTagsPresent: boolean;
      feedback: string;
    };
  };
  accessibility?: {
    score: number;
    issues: string[];
    positives: string[];
    feedback: string;
  };
  aioOptimization?: {
    score: number;
    strengths: string[];
    improvements: string[];
    contentStructure: string;
    authoritySignals: string[];
  };
  security?: {
    score: number;
    httpsEnabled: boolean;
    privacyPolicy: boolean;
    cookieConsent: boolean;
    contactInfo: boolean;
    feedback: string;
  };
  performanceIndicators?: {
    estimatedLoadSpeed: string;
    contentDensity: string;
    thirdPartyScripts: string;
    feedback: string;
  };
  executiveSummary?: string;
  topRecommendationsDetailed?: Array<{
    priority: number;
    category: string;
    issue: string;
    recommendation: string;
    impact: string;
    effort: string;
  }>;
  competitorInsights?: {
    analyzed: boolean;
    summary: string;
  };
}
