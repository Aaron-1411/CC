import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { analysesApi, SavedAnalysis } from '@/lib/api/analyses';
import { AnalysisResults } from '@/components/AnalysisResults';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowLeft, Loader2, Share2, Copy, Check, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportAnalysisToPdf } from '@/lib/exportPdf';

const AnalysisView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<SavedAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (id && user) {
      loadAnalysis();
    }
  }, [id, user, authLoading, navigate]);

  const loadAnalysis = async () => {
    if (!id) return;
    setLoading(true);
    const result = await analysesApi.getById(id);
    if (result.success && result.data) {
      setAnalysis(result.data);
    } else {
      toast({ title: 'Error', description: 'Analysis not found.', variant: 'destructive' });
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleToggleShare = async () => {
    if (!analysis) return;
    const newPublicState = !analysis.is_public;
    const result = await analysesApi.togglePublic(analysis.id, newPublicState);
    
    if (result.success) {
      setAnalysis({ ...analysis, is_public: newPublicState });
      
      if (newPublicState && result.shareToken) {
        const shareUrl = `${window.location.origin}/report/${result.shareToken}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
      } else {
        toast({ title: 'Sharing Disabled', description: 'Report is now private.' });
      }
    }
  };

  const copyShareLink = () => {
    if (!analysis) return;
    const shareUrl = `${window.location.origin}/report/${analysis.share_token}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Link Copied', description: 'Share link copied to clipboard.' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analysis) {
    return null;
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
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wrench className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold gradient-text">Toolbox</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                  PDF
                </Button>
                <Button
                  variant={analysis.is_public ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleToggleShare}
                >
                  {copied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Share2 className="w-4 h-4 mr-2" />
                  )}
                  {analysis.is_public ? 'Sharing On' : 'Share'}
                </Button>
                {analysis.is_public && (
                  <Button variant="outline" size="sm" onClick={copyShareLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
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
        </main>
      </div>
    </div>
  );
};

export default AnalysisView;
