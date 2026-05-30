import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { RebuilderOperation } from '@/lib/api/rebuilder';
import { Eye, Code, Download, Copy, FileText, X } from 'lucide-react';

interface RebuildPreviewModalProps {
  rebuild: RebuilderOperation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RebuildPreviewModal = ({ rebuild, open, onOpenChange }: RebuildPreviewModalProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('preview');

  if (!rebuild) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(rebuild.generated_html);
    toast({ title: 'Copied!', description: 'HTML code copied to clipboard.' });
  };

  const downloadHtml = () => {
    const blob = new Blob([rebuild.generated_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rebuild.original_title || 'website'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: 'HTML file downloaded.' });
  };

  const downloadPdf = async () => {
    try {
      // Create a new window with the HTML content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({ title: 'Error', description: 'Please allow popups to download PDF.', variant: 'destructive' });
        return;
      }
      
      printWindow.document.write(rebuild.generated_html);
      printWindow.document.close();
      
      // Wait for content to load then print as PDF
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
      toast({ title: 'Print Dialog Opened', description: 'Select "Save as PDF" to download.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate PDF.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {rebuild.original_title || rebuild.url}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={downloadHtml}>
                <Download className="w-4 h-4 mr-2" />
                HTML
              </Button>
              <Button variant="outline" size="sm" onClick={downloadPdf}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-border">
            <TabsList className="bg-transparent">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
            <iframe
              srcDoc={rebuild.generated_html}
              title="Website Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts"
            />
          </TabsContent>

          <TabsContent value="code" className="flex-1 m-0 overflow-auto p-6">
            <pre className="bg-secondary/50 rounded-lg p-4 overflow-auto text-sm font-mono whitespace-pre-wrap">
              {rebuild.generated_html}
            </pre>
          </TabsContent>
        </Tabs>

        {/* Info bar */}
        <div className="px-6 py-3 border-t border-border bg-secondary/30 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Source: {rebuild.url}</span>
            {rebuild.extracted_info?.industry && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                {rebuild.extracted_info.industry}
              </span>
            )}
          </div>
          {rebuild.brand_colors && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Colors:</span>
              <div 
                className="w-4 h-4 rounded-full border border-border" 
                style={{ backgroundColor: rebuild.brand_colors.primary }} 
                title="Primary"
              />
              <div 
                className="w-4 h-4 rounded-full border border-border" 
                style={{ backgroundColor: rebuild.brand_colors.secondary }} 
                title="Secondary"
              />
              <div 
                className="w-4 h-4 rounded-full border border-border" 
                style={{ backgroundColor: rebuild.brand_colors.accent }} 
                title="Accent"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
