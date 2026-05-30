import { createContext, useContext, useState, ReactNode } from 'react';
import { AnalysisResult } from '@/lib/api/analyze';
import { ScrapeData } from '@/lib/api/firecrawl';

interface AnalysisState {
  analysis: AnalysisResult | null;
  scrapeData: ScrapeData | null;
  metadata: { title?: string; description?: string; sourceURL?: string } | null;
  analyzedUrl: string;
  pagesAnalyzed: number;
}

interface AnalysisStoreContextType {
  currentAnalysis: AnalysisState | null;
  setCurrentAnalysis: (state: AnalysisState | null) => void;
  hasUnsavedAnalysis: boolean;
}

const AnalysisStoreContext = createContext<AnalysisStoreContextType | undefined>(undefined);

export const AnalysisStoreProvider = ({ children }: { children: ReactNode }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisState | null>(null);

  const hasUnsavedAnalysis = currentAnalysis !== null && currentAnalysis.analysis !== null;

  return (
    <AnalysisStoreContext.Provider value={{ currentAnalysis, setCurrentAnalysis, hasUnsavedAnalysis }}>
      {children}
    </AnalysisStoreContext.Provider>
  );
};

export const useAnalysisStore = () => {
  const context = useContext(AnalysisStoreContext);
  if (context === undefined) {
    throw new Error('useAnalysisStore must be used within an AnalysisStoreProvider');
  }
  return context;
};
