import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  BorderStyle,
  ShadingType,
  WidthType,
  HeadingLevel,
} from 'docx';
import {
  AnalysisJob,
  PillarResult,
  RAGStatus,
  CheckType,
  OpportunityMatrix,
} from '@/types/analysis';
import { PILLARS } from './pillars';

// Colour palette — no # prefix needed for docx
const BRAND   = '8B0000';
const GREEN   = '0F6E56';
const AMBER   = '854F0B';
const RED     = 'A32D2D';
const GREY_BG = 'F4F4F4';
const WHITE   = 'FFFFFF';
const DARK    = '222222';

const RAG_COLORS: Record<RAGStatus, string> = {
  GREEN:   GREEN,
  AMBER:   AMBER,
  RED:     RED,
  PENDING: '888888',
  RUNNING: '888888',
};

const TYPE_SYMBOLS: Record<CheckType, string> = {
  CONFIRMED: '✓',
  INFERRED:  '~',
  UNKNOWN:   '✗',
};

const TYPE_COLORS: Record<CheckType, string> = {
  CONFIRMED: GREEN,
  INFERRED:  AMBER,
  UNKNOWN:   RED,
};

function noBorder() {
  return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
}

// docx rule: columnWidths on Table AND width on each TableCell
function ragHeaderRow(num: string, name: string, rag: RAGStatus): Table {
  const color = RAG_COLORS[rag] || '888888';
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [1000, 7000, 1500],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1000, type: WidthType.DXA },
            // ShadingType.CLEAR — not SOLID — for cell backgrounds
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: color },
            children: [new Paragraph({
              children: [new TextRun({ text: num.padStart(2, '0'), bold: true, color: WHITE, size: 22 })],
              alignment: AlignmentType.CENTER,
            })],
          }),
          new TableCell({
            width: { size: 7000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: color },
            children: [new Paragraph({
              children: [new TextRun({ text: name, bold: true, color: WHITE, size: 22 })],
            })],
          }),
          new TableCell({
            width: { size: 1500, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: color },
            children: [new Paragraph({
              children: [new TextRun({ text: rag, bold: true, color: WHITE, size: 18 })],
              alignment: AlignmentType.CENTER,
            })],
          }),
        ],
      }),
    ],
  });
}

function findingRow(type: CheckType, text: string, dataGapFlag?: string): Table {
  const symbol = TYPE_SYMBOLS[type];
  const color  = TYPE_COLORS[type];
  const children: TextRun[] = [
    new TextRun({ text: `${symbol}  `, color, bold: true, size: 20 }),
    new TextRun({ text, size: 20 }),
  ];
  if (dataGapFlag) {
    children.push(new TextRun({ text: `  ${dataGapFlag}`, color: '1A56DB', italics: true, size: 18 }));
  }
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [9500],
    borders: {
      top: noBorder(),
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' },
      left: noBorder(), right: noBorder(), insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9500, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: WHITE },
            margins: { top: 80, bottom: 80, left: 160, right: 160 },
            children: [new Paragraph({ children })],
          }),
        ],
      }),
    ],
  });
}

function opportunityCallout(text: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [200, 9300],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 200, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: AMBER },
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: 9300, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FEF9C3' },
            margins: { top: 100, bottom: 100, left: 200, right: 160 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'OPPORTUNITY  ', bold: true, color: AMBER, size: 18 }),
                new TextRun({ text, size: 20 }),
              ],
            })],
          }),
        ],
      }),
    ],
  });
}

function dataGapCallout(text: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [200, 9300],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideHorizontal: noBorder(), insideVertical: noBorder(),
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 200, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: '1A56DB' },
            children: [new Paragraph({ text: '' })],
          }),
          new TableCell({
            width: { size: 9300, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EFF6FF' },
            margins: { top: 100, bottom: 100, left: 200, right: 160 },
            children: [new Paragraph({
              children: [
                new TextRun({ text: 'DATA GAP  ', bold: true, color: '1A56DB', size: 18 }),
                new TextRun({ text, size: 20, italics: true }),
              ],
            })],
          }),
        ],
      }),
    ],
  });
}

function opportunityMatrixTable(matrix: OpportunityMatrix): Table {
  const cell = (label: string, color: string, items: string[]) =>
    new TableCell({
      width: { size: 4750, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: GREY_BG },
      margins: { top: 160, bottom: 160, left: 160, right: 160 },
      children: [
        new Paragraph({
          children: [new TextRun({ text: label, bold: true, color, size: 20 })],
          spacing: { after: 120 },
        }),
        ...items.map(item =>
          new Paragraph({
            children: [new TextRun({ text: `• ${item}`, size: 18 })],
            spacing: { before: 80 },
          })
        ),
      ],
    });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [4750, 4750],
    rows: [
      new TableRow({
        children: [
          cell('HIGH IMPACT / QUICK WIN',    GREEN,    matrix.highImpactEasy),
          cell('HIGH IMPACT / INVESTMENT',   AMBER,    matrix.highImpactInvestment),
        ],
      }),
      new TableRow({
        children: [
          cell('LOWER IMPACT / QUICK WIN',   '555555', matrix.lowerImpactEasy),
          cell('LONGER TERM / STRATEGIC',    BRAND,    matrix.longerTerm),
        ],
      }),
    ],
  });
}

function dataGapsSummaryTable(pillars: PillarResult[]): Table {
  const gapPillars = pillars.filter(p => p.dataGap);
  if (gapPillars.length === 0) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [9500],
      rows: [new TableRow({ children: [new TableCell({ width: { size: 9500, type: WidthType.DXA }, children: [new Paragraph({ text: 'No data gaps identified.' })] })] })],
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3000, 6500],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 3000, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: DARK },
            children: [new Paragraph({ children: [new TextRun({ text: 'PILLAR', bold: true, color: WHITE, size: 18 })] })],
          }),
          new TableCell({
            width: { size: 6500, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: DARK },
            children: [new Paragraph({ children: [new TextRun({ text: 'DATA GAP / ACTION NEEDED', bold: true, color: WHITE, size: 18 })] })],
          }),
        ],
      }),
      ...gapPillars.map(p =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 3000, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: GREY_BG },
              children: [new Paragraph({ children: [new TextRun({ text: p.name, bold: true, size: 18 })] })],
            }),
            new TableCell({
              width: { size: 6500, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: p.dataGap!, size: 18 })] })],
            }),
          ],
        })
      ),
    ],
  });
}

export async function generateReport(job: AnalysisJob): Promise<Buffer> {
  const completedPillars = PILLARS
    .map(p => job.pillars.find(r => r.id === p.id))
    .filter(Boolean) as PillarResult[];

  const greenCount = completedPillars.filter(p => p.status === 'GREEN').length;
  const amberCount = completedPillars.filter(p => p.status === 'AMBER').length;
  const redCount   = completedPillars.filter(p => p.status === 'RED').length;

  const sections: (Paragraph | Table)[] = [];

  // ── Cover ────────────────────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: job.brandName, bold: true, size: 56, color: BRAND })],
      heading: HeadingLevel.TITLE,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'E-Commerce Deep Dive Audit', size: 32, color: '555555' })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({ text: job.url, size: 22, color: '888888' })],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }),
        size: 22,
        color: '888888',
      })],
      spacing: { after: 400 },
    }),
    new Table({
      width: { size: 50, type: WidthType.PERCENTAGE },
      columnWidths: [2000, 2000, 2000],
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2000, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: GREEN },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${greenCount} GREEN`, bold: true, color: WHITE, size: 22 })] })],
            }),
            new TableCell({
              width: { size: 2000, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: AMBER },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${amberCount} AMBER`, bold: true, color: WHITE, size: 22 })] })],
            }),
            new TableCell({
              width: { size: 2000, type: WidthType.DXA },
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: RED },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${redCount} RED`, bold: true, color: WHITE, size: 22 })] })],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 600 } })
  );

  // ── Pillar sections ───────────────────────────────────────────────────────────
  for (const pillar of completedPillars) {
    if (pillar.status === 'PENDING' || pillar.status === 'RUNNING') {
      sections.push(
        ragHeaderRow(String(pillar.id), pillar.name, 'AMBER'),
        new Paragraph({
          children: [new TextRun({ text: 'Analysis in progress…', italics: true, color: '888888', size: 18 })],
          spacing: { before: 80, after: 320 },
        })
      );
      continue;
    }

    sections.push(ragHeaderRow(String(pillar.id), pillar.name, pillar.status));

    for (const f of pillar.findings) {
      sections.push(findingRow(f.type, f.text, f.dataGapFlag));
    }

    if (pillar.opportunity) sections.push(opportunityCallout(pillar.opportunity));
    if (pillar.dataGap)     sections.push(dataGapCallout(pillar.dataGap));
    sections.push(new Paragraph({ text: '', spacing: { after: 320 } }));
  }

  // ── Opportunity matrix ────────────────────────────────────────────────────────
  if (job.opportunityMatrix) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: 'Opportunity Matrix', bold: true, size: 32, color: DARK })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }),
      opportunityMatrixTable(job.opportunityMatrix),
      new Paragraph({ text: '', spacing: { after: 400 } })
    );
  }

  // ── Data gaps summary ─────────────────────────────────────────────────────────
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'Data Gaps Summary', bold: true, size: 32, color: DARK })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    dataGapsSummaryTable(completedPillars)
  );

  const doc = new Document({ sections: [{ children: sections }] });
  return Buffer.from(await Packer.toBuffer(doc));
}
