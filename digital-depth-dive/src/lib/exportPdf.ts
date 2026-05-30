import jsPDF from 'jspdf';
import { AnalysisResult } from '@/lib/api/analyze';

interface ExportOptions {
  analysis: AnalysisResult;
  metadata?: { title?: string; description?: string; sourceURL?: string };
  url: string;
  screenshot?: string;
}

export const exportAnalysisToPdf = async (options: ExportOptions): Promise<void> => {
  const { analysis, metadata, url, screenshot } = options;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;
  
  // Colors
  const primaryColor: [number, number, number] = [13, 148, 136]; // Teal
  const textColor: [number, number, number] = [30, 30, 30];
  const mutedColor: [number, number, number] = [100, 100, 100];
  const bgLight: [number, number, number] = [248, 250, 252];
  const accentColor: [number, number, number] = [20, 184, 166];
  
  // ========== COVER PAGE ==========
  // Full gradient background
  pdf.setFillColor(13, 148, 136);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative circles
  pdf.setFillColor(20, 184, 166);
  pdf.circle(pageWidth - 30, 40, 60, 'F');
  pdf.setFillColor(6, 95, 70);
  pdf.circle(30, pageHeight - 50, 80, 'F');
  
  // Logo area
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin, margin, 45, 15, 3, 3, 'F');
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🔧 Toolbox', margin + 5, margin + 10);
  
  // Main title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Website', margin, pageHeight / 2 - 20);
  pdf.text('Analysis Report', margin, pageHeight / 2 - 2);
  
  // Subtitle
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const title = metadata?.title || url;
  const splitTitle = pdf.splitTextToSize(title, contentWidth);
  pdf.text(splitTitle, margin, pageHeight / 2 + 20);
  
  // Overall Score Badge
  const scoreX = pageWidth - margin - 40;
  const scoreY = pageHeight / 2 - 10;
  pdf.setFillColor(255, 255, 255);
  pdf.circle(scoreX, scoreY, 25, 'F');
  
  const scoreColor: [number, number, number] = analysis.overallScore >= 80 
    ? [34, 197, 94] 
    : analysis.overallScore >= 60 
      ? [234, 179, 8] 
      : analysis.overallScore >= 40 
        ? [249, 115, 22] 
        : [239, 68, 68];
  pdf.setTextColor(...scoreColor);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text(analysis.overallScore.toString(), scoreX, scoreY + 4, { align: 'center' });
  pdf.setFontSize(8);
  pdf.setTextColor(...mutedColor);
  pdf.text('SCORE', scoreX, scoreY + 12, { align: 'center' });
  
  // Date & URL footer
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, margin, pageHeight - margin - 10);
  pdf.setFontSize(9);
  pdf.text(url.slice(0, 60) + (url.length > 60 ? '...' : ''), margin, pageHeight - margin);
  
  // ========== EXECUTIVE SUMMARY PAGE ==========
  pdf.addPage();
  yPos = margin;
  
  // Helper to add new page if needed
  const checkNewPage = (height: number) => {
    if (yPos + height > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };
  
  // Helper to draw score circle
  const drawScoreCircle = (x: number, y: number, score: number, size: number = 20) => {
    const color: [number, number, number] = score >= 80 
      ? [34, 197, 94] 
      : score >= 60 
        ? [234, 179, 8] 
        : score >= 40 
          ? [249, 115, 22] 
          : [239, 68, 68];
    
    pdf.setDrawColor(...color);
    pdf.setLineWidth(1.5);
    pdf.circle(x, y, size / 2, 'S');
    pdf.setTextColor(...color);
    pdf.setFontSize(size * 0.6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(score.toString(), x, y + size * 0.2, { align: 'center' });
  };

  // Executive Summary Header
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, pageWidth, 25, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', margin, 17);
  yPos = 35;

  // Website title and URL
  pdf.setTextColor(...textColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const reportTitle = metadata?.title || url;
  const splitReportTitle = pdf.splitTextToSize(reportTitle, contentWidth);
  pdf.text(splitReportTitle, margin, yPos);
  yPos += splitReportTitle.length * 6 + 2;
  
  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(9);
  pdf.text(url, margin, yPos);
  yPos += 8;
  
  if (metadata?.description) {
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(9);
    const desc = pdf.splitTextToSize(metadata.description, contentWidth);
    pdf.text(desc, margin, yPos);
    yPos += desc.length * 5 + 5;
  }
  
  yPos += 5;
  
  // Overall Score Box
  pdf.setFillColor(...bgLight);
  pdf.roundedRect(margin, yPos, contentWidth, 35, 3, 3, 'F');
  
  drawScoreCircle(margin + 20, yPos + 17, analysis.overallScore, 28);
  
  pdf.setTextColor(...textColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overall Score', margin + 40, yPos + 14);
  
  pdf.setTextColor(...mutedColor);
  pdf.setFontSize(9);
  pdf.text('Based on UX, Visual Design, Conversion & Communication', margin + 40, yPos + 22);
  
  // Score Legend
  const legendItems = [
    { label: '80+ Excellent', color: [34, 197, 94] as [number, number, number] },
    { label: '60-79 Good', color: [234, 179, 8] as [number, number, number] },
    { label: '40-59 Average', color: [249, 115, 22] as [number, number, number] },
    { label: '<40 Needs Work', color: [239, 68, 68] as [number, number, number] },
  ];
  
  let legendX = margin + 40;
  const legendY = yPos + 29;
  legendItems.forEach(item => {
    pdf.setFillColor(...item.color);
    pdf.circle(legendX + 2, legendY, 2, 'F');
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(7);
    pdf.text(item.label, legendX + 6, legendY + 1);
    legendX += 30;
  });
  
  yPos += 45;
  
  // Section helper
  const addSection = (title: string, icon?: string) => {
    checkNewPage(30);
    pdf.setFillColor(...bgLight);
    pdf.roundedRect(margin, yPos, contentWidth, 10, 2, 2, 'F');
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin + 5, yPos + 7);
    yPos += 15;
  };
  
  const addKeyValue = (key: string, value: string, indent: number = 0) => {
    checkNewPage(10);
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(9);
    pdf.text(key, margin + indent, yPos);
    pdf.setTextColor(...textColor);
    pdf.setFont('helvetica', 'normal');
    const valueLines = pdf.splitTextToSize(value, contentWidth - 50 - indent);
    pdf.text(valueLines, margin + 45 + indent, yPos);
    yPos += Math.max(valueLines.length * 5, 6);
  };
  
  // Industry & Business
  addSection('Industry & Business');
  addKeyValue('Industry', `${analysis.industry.name} (${analysis.industry.confidence}% confidence)`);
  addKeyValue('Sub-Category', analysis.industry.subCategory);
  addKeyValue('Main Product', analysis.businessOffer.mainProduct);
  addKeyValue('Value Prop', analysis.businessOffer.valueProposition);
  addKeyValue('Target', analysis.businessOffer.targetAudience);
  addKeyValue('Pricing', analysis.businessOffer.pricingModel);
  yPos += 5;
  
  // Website Creator
  addSection('Website Creator & Updates');
  if (analysis.websiteCreator.identified) {
    addKeyValue('Creator', analysis.websiteCreator.name || 'Unknown');
    addKeyValue('Evidence', analysis.websiteCreator.evidence || '—');
  } else {
    addKeyValue('Creator', 'Not identified');
  }
  if (analysis.websiteCreator.platform) {
    addKeyValue('Platform', analysis.websiteCreator.platform);
  }
  addKeyValue('Last Updated', `${analysis.lastUpdated.estimated} (${analysis.lastUpdated.confidence} confidence)`);
  yPos += 5;
  
  // Effectiveness Scores
  addSection('Effectiveness Scores');
  
  const scores = [
    { name: 'UX Design', data: analysis.effectiveness.ux },
    { name: 'Visual Design', data: analysis.effectiveness.visual },
    { name: 'Conversion', data: analysis.effectiveness.conversion },
    { name: 'Communication', data: analysis.effectiveness.communication },
  ];
  
  scores.forEach(score => {
    checkNewPage(25);
    
    // Score badge
    const scoreColor: [number, number, number] = score.data.score >= 80 
      ? [34, 197, 94] 
      : score.data.score >= 60 
        ? [234, 179, 8] 
        : score.data.score >= 40 
          ? [249, 115, 22] 
          : [239, 68, 68];
    
    pdf.setTextColor(...textColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(score.name, margin, yPos);
    
    pdf.setFillColor(...scoreColor);
    pdf.roundedRect(margin + 35, yPos - 4, 12, 6, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.text(score.data.score.toString(), margin + 41, yPos, { align: 'center' });
    
    yPos += 5;
    
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(8);
    const summary = pdf.splitTextToSize(score.data.summary, contentWidth);
    pdf.text(summary, margin, yPos);
    yPos += summary.length * 4 + 3;
    
    // Strengths
    if ('strengths' in score.data && score.data.strengths.length > 0) {
      pdf.setTextColor(34, 197, 94);
      pdf.setFontSize(7);
      pdf.text('✓ ' + score.data.strengths.slice(0, 2).join(' • '), margin, yPos);
      yPos += 4;
    }
    
    // Weaknesses
    if ('weaknesses' in score.data && score.data.weaknesses.length > 0) {
      pdf.setTextColor(249, 115, 22);
      pdf.setFontSize(7);
      pdf.text('↑ ' + score.data.weaknesses.slice(0, 2).join(' • '), margin, yPos);
      yPos += 4;
    }
    
    yPos += 3;
  });
  
  // Recommendations
  checkNewPage(40);
  addSection('Top Recommendations');
  
  analysis.topRecommendations.forEach((rec, i) => {
    checkNewPage(15);
    pdf.setFillColor(...primaryColor);
    pdf.circle(margin + 3, yPos - 1, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(7);
    pdf.text((i + 1).toString(), margin + 3, yPos, { align: 'center' });
    
    pdf.setTextColor(...textColor);
    pdf.setFontSize(9);
    const recLines = pdf.splitTextToSize(rec, contentWidth - 15);
    pdf.text(recLines, margin + 10, yPos);
    yPos += recLines.length * 5 + 3;
  });
  
  // Footer on each page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setTextColor(...mutedColor);
    pdf.setFontSize(8);
    pdf.text(
      `Generated by Toolbox • Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pdf.internal.pageSize.getHeight() - 8,
      { align: 'center' }
    );
  }
  
  // Save
  const filename = `toolbox-report-${(metadata?.title || url).replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 50)}.pdf`;
  pdf.save(filename);
};
