import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { analysesApi, SavedAnalysis } from '@/lib/api/analyses';
import { AnalysisResults } from '@/components/AnalysisResults';
import { Wrench, Loader2, AlertCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportAnalysisToPdf } from '@/lib/exportPdf';

const SharedReport = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shareToken) {
      loadSharedAnalysis();
    }
  }, [shareToken]);

  const loadSharedAnalysis = async () => {
    if (!shareToken) return;
    setLoading(true);
    const result = await analysesApi.getByShareToken(shareToken);
    if (result.success && result.data) {
      setAnalysis(result.data);
    } else {
      setError('This report is not available or has been made private.');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Report Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link to="/">Go to Toolbox</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container py-4">
            <nav className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold gradient-text">Toolbox</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm">
                  Shared Report
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportAnalysisToPdf({
                    analysis: analysis.analysis_data,
                    metadata: analysis.metadata || undefined,
                    url: analysis.analyzed_url,
                    screenshot: analysis.screenshot_url || undefined,
                  })}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </nav>
          </div>
        </header>

        <main className="container py-8">
          <AnalysisResults
            analysis={analysis.analysis_data}
            metadata={analysis.metadata || undefined}
            url={analysis.analyzed_url}
            screenshot={analysis.screenshot_url || undefined}
          />
          
          {/* CTA */}
          <div className="mt-12 glass-card rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Want to analyze your own websites?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get comprehensive AI-powered insights on any website with Toolbox.
            </p>
            <Button asChild size="lg">
              <Link to="/auth">Get Started Free</Link>
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SharedReport;
