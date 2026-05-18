import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Share2, Link as LinkIcon, ClipboardCopy, Download, FileText, FileSpreadsheet } from "lucide-react";
import { copyText, downloadText, shareLink } from "@/lib/share";

interface ShareMenuProps {
  shareUrl: string;
  summaryText: string;
  filename: string;
  title?: string;
  onExportPdf?: () => void;
  onExportCsv?: () => void;
}

export default function ShareMenu({ shareUrl, summaryText, filename, title = "Share", onExportPdf, onExportCsv }: ShareMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-brand/30 text-brand hover:bg-brand-muted">
          <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share / Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground font-normal">
          {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => shareLink(shareUrl, title)}>
          <LinkIcon className="w-4 h-4 mr-2" /> Copy share link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyText(summaryText, "Summary copied")}>
          <ClipboardCopy className="w-4 h-4 mr-2" /> Copy text summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadText(summaryText, filename)}>
          <Download className="w-4 h-4 mr-2" /> Download .txt
        </DropdownMenuItem>
        {(onExportPdf || onExportCsv) && <DropdownMenuSeparator />}
        {onExportPdf && (
          <DropdownMenuItem onClick={onExportPdf}>
            <FileText className="w-4 h-4 mr-2" /> Download PDF report
          </DropdownMenuItem>
        )}
        {onExportCsv && (
          <DropdownMenuItem onClick={onExportCsv}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
