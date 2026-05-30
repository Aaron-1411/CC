import PptxGenJS from 'pptxgenjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisJob, PillarResult } from '@/types/analysis';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const MODEL = 'gemini-2.0-flash';

// IMPORTANT: pptxgenjs NEVER uses "#" prefix on hex colours — corrupts files
const DARK_BG    = '1A1A1A';
const CREAM_BG   = 'F9F6F0';
const BRAND_RED  = '8B0000';
const GREEN      = '0F6E56';
const AMBER      = 'B45309';
const LIGHT_GREY = 'E5E5E5';

// Shadow factory — pptxgenjs mutates shadow objects in place, so always use fresh instances
const makeShadow = (): PptxGenJS.ShadowProps => ({
  type: 'outer',
  blur: 4,
  offset: 2,
  angle: 45,
  color: '000000',
  opacity: 0.15,
});

async function generateSlideCopy(
  slideType: string,
  relevantFindings: PillarResult[],
  brandName: string
): Promise<Record<string, string>> {
  const findingsSummary = relevantFindings
    .map(p => `${p.name}: ${p.opportunity || ''}\n${p.findings.slice(0, 3).map(f => f.text).join('; ')}`)
    .join('\n\n');

  try {
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: 'You are a pitch deck copywriter. Write punchy, specific, revenue-focused slide copy for a founder audience. Return ONLY valid JSON.',
    });
    const result = await model.generateContent(
      `Brand: ${brandName}\nSlide type: ${slideType}\n\nFindings:\n${findingsSummary}\n\nReturn JSON with these keys: { "headline": "", "stat": "", "statLabel": "", "bodyLine1": "", "bodyLine2": "", "action": "" }. Keep headlines under 8 words. Stats should be concrete numbers or percentages.`
    );
    const text = result.response.text();
    return JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim());
  } catch {
    return {
      headline: relevantFindings[0]?.name || slideType,
      bodyLine1: relevantFindings[0]?.opportunity || '',
      stat: '',
      statLabel: '',
      bodyLine2: '',
      action: '',
    };
  }
}

export async function generateDeck(job: AnalysisJob): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33" x 7.5"

  const completedPillars = job.pillars.filter(
    p => p.status !== 'PENDING' && p.status !== 'RUNNING' && !p.error
  );
  const redAmberPillars = completedPillars.filter(p => p.status === 'RED' || p.status === 'AMBER');
  const greenPillars    = completedPillars.filter(p => p.status === 'GREEN');
  const quickWins       = job.opportunityMatrix?.highImpactEasy || [];

  // ── SLIDE 1: Cover ────────────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: DARK_BG };
    slide.addText(job.brandName.toUpperCase(), {
      x: 0.6, y: 1.4, w: 8, h: 1.2,
      fontSize: 54, fontFace: 'Arial Black', color: 'FFFFFF', bold: true,
    });
    slide.addText('Growth Opportunity Brief', {
      x: 0.6, y: 2.7, w: 8, h: 0.5,
      fontSize: 22, fontFace: 'Arial', color: 'AAAAAA',
    });
    slide.addText(`${quickWins.length} quick wins identified`, {
      x: 0.6, y: 3.4, w: 8, h: 0.4,
      fontSize: 18, fontFace: 'Arial', color: LIGHT_GREY,
    });
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.5, y: 1.2, w: 3.2, h: 2.8,
      fill: { color: BRAND_RED },
      shadow: makeShadow(),
    });
    slide.addText(String(quickWins.length), {
      x: 9.5, y: 1.8, w: 3.2, h: 1.0,
      fontSize: 52, fontFace: 'Arial Black', color: 'FFFFFF', align: 'center', bold: true,
    });
    slide.addText('quick wins\nidentified', {
      x: 9.5, y: 2.9, w: 3.2, h: 0.8,
      fontSize: 13, fontFace: 'Arial', color: 'DDDDDD', align: 'center',
    });
    slide.addText(
      new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      { x: 0.6, y: 6.5, w: 5, h: 0.4, fontSize: 14, fontFace: 'Arial', color: '666666' }
    );
  }

  // ── SLIDE 2: What we found ────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM_BG };
    slide.addText('What we found', {
      x: 0.6, y: 0.4, w: 12, h: 0.8,
      fontSize: 36, fontFace: 'Arial Black', color: DARK_BG, bold: true,
    });
    const cards = [
      { label: 'STRONG', color: GREEN,     text: `${greenPillars.length} pillars performing well. ${greenPillars[0]?.opportunity || ''}` },
      { label: 'GAPS',   color: AMBER,     text: `${redAmberPillars.length} pillars need attention. ${redAmberPillars[0]?.opportunity || ''}` },
      { label: 'RISK',   color: '9B1C1C',  text: completedPillars.filter(p => p.status === 'RED')[0]?.opportunity || 'Revenue leaks identified across multiple pillars.' },
    ];
    cards.forEach((card, i) => {
      const x = 0.6 + i * 4.2;
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.5, w: 3.8, h: 4.8, fill: { color: 'FFFFFF' }, shadow: makeShadow() });
      slide.addShape(pptx.ShapeType.rect, { x, y: 1.5, w: 3.8, h: 0.5, fill: { color: card.color } });
      slide.addText(card.label, { x, y: 1.5, w: 3.8, h: 0.5, fontSize: 13, fontFace: 'Arial Black', color: 'FFFFFF', align: 'center', bold: true });
      slide.addText(card.text, { x: x + 0.2, y: 2.2, w: 3.4, h: 3.8, fontSize: 15, fontFace: 'Arial', color: DARK_BG, valign: 'top', wrap: true });
    });
  }

  // ── SLIDE 3: Revenue leak ─────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: DARK_BG };
    slide.addText('The Revenue Leak', {
      x: 0.6, y: 0.4, w: 12, h: 0.8,
      fontSize: 36, fontFace: 'Arial Black', color: 'FFFFFF', bold: true,
    });
    const stages = ['Visitors', 'Engaged', 'Add to Cart', 'Checkout', 'Purchase'];
    const widths  = [10.5, 8.5, 6.5, 5.0, 3.5];
    const shades  = ['8B0000', '7A1212', '6B2424', '5C3636', '4D4848'];
    stages.forEach((stage, i) => {
      const w = widths[i];
      const x = (13.33 - w) / 2;
      const y = 1.4 + i * 1.0;
      slide.addShape(pptx.ShapeType.rect, { x, y, w, h: 0.72, fill: { color: shades[i] } });
      slide.addText(stage, { x, y, w, h: 0.72, fontSize: 15, fontFace: 'Arial', color: 'FFFFFF', align: 'center', bold: true });
    });
    const uxPillar = completedPillars.find(p => p.id === 5);
    if (uxPillar?.opportunity) {
      slide.addText(`Key leak: ${uxPillar.opportunity}`, {
        x: 0.6, y: 6.6, w: 12, h: 0.5,
        fontSize: 14, fontFace: 'Arial', color: AMBER, align: 'center', italic: true,
      });
    }
  }

  // ── SLIDES 4–7: Quick wins ────────────────────────────────────────────────────
  const priorityPillars = [...redAmberPillars]
    .sort((a, b) => (a.status === 'RED' ? -1 : 1))
    .slice(0, 4);

  for (let i = 0; i < 4; i++) {
    const pillar = priorityPillars[i];
    const label  = `Quick Win 0${i + 1}`;
    const copy   = pillar
      ? await generateSlideCopy('quick_win', [pillar], job.brandName)
      : { headline: 'Analysis pending', stat: '', statLabel: '', bodyLine1: '', bodyLine2: '', action: '' };

    const slide = pptx.addSlide();
    slide.background = { color: CREAM_BG };
    // Left accent bar
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: AMBER } });
    slide.addText(label, {
      x: 0.6, y: 0.4, w: 8, h: 0.45,
      fontSize: 13, fontFace: 'Arial', color: AMBER, bold: true,
    });
    slide.addText(copy.headline || pillar?.name || label, {
      x: 0.6, y: 1.0, w: 8.8, h: 1.3,
      fontSize: 34, fontFace: 'Arial Black', color: DARK_BG, bold: true,
    });
    if (copy.bodyLine1 || pillar?.opportunity) {
      slide.addText(copy.bodyLine1 || pillar?.opportunity || '', {
        x: 0.6, y: 2.5, w: 8.8, h: 0.8,
        fontSize: 17, fontFace: 'Arial', color: '444444', wrap: true,
      });
    }
    if (copy.bodyLine2) {
      slide.addText(copy.bodyLine2, {
        x: 0.6, y: 3.4, w: 8.8, h: 0.7,
        fontSize: 17, fontFace: 'Arial', color: '444444', wrap: true,
      });
    }
    if (copy.action) {
      slide.addText(`→ ${copy.action}`, {
        x: 0.6, y: 4.5, w: 8.8, h: 0.5,
        fontSize: 15, fontFace: 'Arial', color: BRAND_RED, bold: true,
      });
    }
    // Right stat panel — fresh shadow each time
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.9, y: 1.0, w: 3.0, h: 3.2,
      fill: { color: DARK_BG },
      shadow: makeShadow(),
    });
    if (copy.stat) {
      slide.addText(copy.stat, {
        x: 9.9, y: 1.5, w: 3.0, h: 1.2,
        fontSize: 44, fontFace: 'Arial Black', color: AMBER, align: 'center', bold: true,
      });
    }
    if (copy.statLabel) {
      slide.addText(copy.statLabel, {
        x: 9.9, y: 2.8, w: 3.0, h: 0.9,
        fontSize: 13, fontFace: 'Arial', color: 'AAAAAA', align: 'center', wrap: true,
      });
    }
  }

  // ── SLIDES 8–9: Growth bets ───────────────────────────────────────────────────
  const channelPillars = completedPillars
    .filter(p => [2, 3, 4, 8, 9, 10].includes(p.id))
    .slice(0, 2);

  for (let i = 0; i < 2; i++) {
    const pillar = channelPillars[i];
    const label  = `Growth Bet 0${i + 1}`;
    const copy   = pillar
      ? await generateSlideCopy('growth_bet', [pillar], job.brandName)
      : { headline: 'Channel opportunity', stat: '', statLabel: '', bodyLine1: '', action: '' };

    const slide = pptx.addSlide();
    slide.background = { color: DARK_BG };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.28, h: 7.5, fill: { color: GREEN } });
    slide.addText(label, {
      x: 0.6, y: 0.4, w: 8, h: 0.45,
      fontSize: 13, fontFace: 'Arial', color: GREEN, bold: true,
    });
    slide.addText(copy.headline || pillar?.name || label, {
      x: 0.6, y: 1.0, w: 8.8, h: 1.3,
      fontSize: 34, fontFace: 'Arial Black', color: 'FFFFFF', bold: true,
    });
    slide.addText(copy.bodyLine1 || pillar?.opportunity || '', {
      x: 0.6, y: 2.5, w: 8.8, h: 1.6,
      fontSize: 17, fontFace: 'Arial', color: 'CCCCCC', wrap: true,
    });
    if (copy.action) {
      slide.addText(`→ ${copy.action}`, {
        x: 0.6, y: 4.5, w: 8.8, h: 0.5,
        fontSize: 15, fontFace: 'Arial', color: GREEN, bold: true,
      });
    }
    slide.addShape(pptx.ShapeType.rect, {
      x: 9.9, y: 1.0, w: 3.0, h: 3.2,
      fill: { color: BRAND_RED },
      shadow: makeShadow(),
    });
    if (copy.stat) {
      slide.addText(copy.stat, {
        x: 9.9, y: 1.5, w: 3.0, h: 1.2,
        fontSize: 44, fontFace: 'Arial Black', color: 'FFFFFF', align: 'center', bold: true,
      });
    }
    if (copy.statLabel) {
      slide.addText(copy.statLabel, {
        x: 9.9, y: 2.8, w: 3.0, h: 0.9,
        fontSize: 13, fontFace: 'Arial', color: 'DDDDDD', align: 'center', wrap: true,
      });
    }
  }

  // ── SLIDE 10: Revenue model ───────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM_BG };
    slide.addText('Revenue Model', {
      x: 0.6, y: 0.4, w: 12, h: 0.8,
      fontSize: 36, fontFace: 'Arial Black', color: DARK_BG, bold: true,
    });
    slide.addText('Illustrative scenario — based on typical uplift ranges for identified gaps', {
      x: 0.6, y: 1.2, w: 12, h: 0.4,
      fontSize: 13, fontFace: 'Arial', color: '888888', italic: true,
    });
    const scenarios = [
      { label: 'Today',          sub: 'Current state', color: '888888', h: 2.0 },
      { label: '+ Quick Wins',   sub: '30–60 days',    color: AMBER,    h: 3.5 },
      { label: '+ Channel Bets', sub: '3–6 months',    color: GREEN,    h: 5.0 },
    ];
    scenarios.forEach((s, i) => {
      const x    = 1.5 + i * 3.8;
      const barY = 6.2 - s.h;
      slide.addShape(pptx.ShapeType.rect, { x, y: barY, w: 2.8, h: s.h, fill: { color: s.color }, shadow: makeShadow() });
      slide.addText(s.label, { x, y: barY - 0.5, w: 2.8, h: 0.4, fontSize: 14, fontFace: 'Arial Black', color: DARK_BG, align: 'center', bold: true });
      slide.addText(s.sub,   { x, y: 6.3,        w: 2.8, h: 0.4, fontSize: 12, fontFace: 'Arial',       color: '888888', align: 'center' });
    });
  }

  // ── SLIDE 11: Longer term ─────────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: DARK_BG };
    slide.addText('Longer Term', {
      x: 0.6, y: 0.4, w: 12, h: 0.8,
      fontSize: 36, fontFace: 'Arial Black', color: 'FFFFFF', bold: true,
    });
    const ideas = job.opportunityMatrix?.longerTerm?.slice(0, 3) || [
      'Build a subscription tier to lock in repeat revenue and improve LTV',
      'Open a B2B / trade channel with volume pricing to diversify revenue',
      'Test retail pop-ups or events to drive brand awareness and new acquisition',
    ];
    ideas.forEach((idea, i) => {
      const y = 1.6 + i * 1.7;
      slide.addShape(pptx.ShapeType.rect, { x: 0.6, y, w: 12.1, h: 1.3, fill: { color: '2A2A2A' }, shadow: makeShadow() });
      slide.addText(String(i + 1), { x: 0.8, y, w: 0.8, h: 1.3, fontSize: 28, fontFace: 'Arial Black', color: BRAND_RED, valign: 'middle', bold: true });
      slide.addText(idea, { x: 1.8, y: y + 0.1, w: 10.6, h: 1.1, fontSize: 16, fontFace: 'Arial', color: 'DDDDDD', valign: 'middle', wrap: true });
    });
  }

  // ── SLIDE 12: Where to start ──────────────────────────────────────────────────
  {
    const slide = pptx.addSlide();
    slide.background = { color: CREAM_BG };
    slide.addText('Where To Start', {
      x: 0.6, y: 0.4, w: 12, h: 0.8,
      fontSize: 36, fontFace: 'Arial Black', color: DARK_BG, bold: true,
    });
    slide.addText('This week, in order:', {
      x: 0.6, y: 1.3, w: 12, h: 0.4,
      fontSize: 16, fontFace: 'Arial', color: '666666',
    });
    const actions = quickWins.length > 0
      ? quickWins.slice(0, 5)
      : redAmberPillars.slice(0, 5).map(p => p.opportunity).filter(Boolean);

    actions.forEach((action, i) => {
      const y = 2.0 + i * 0.95;
      slide.addShape(pptx.ShapeType.ellipse, { x: 0.6, y, w: 0.6, h: 0.6, fill: { color: BRAND_RED } });
      slide.addText(String(i + 1), { x: 0.6, y, w: 0.6, h: 0.6, fontSize: 16, fontFace: 'Arial Black', color: 'FFFFFF', align: 'center', bold: true });
      slide.addText(action, { x: 1.4, y: y + 0.05, w: 11.2, h: 0.6, fontSize: 15, fontFace: 'Arial', color: DARK_BG, valign: 'middle', wrap: true });
    });
  }

  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  return buffer;
}
