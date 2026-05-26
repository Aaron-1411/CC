import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(__dir, '../package.json'));
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const TICKERS = [
  { ticker: 'EQQQ', yf: 'EQQQ.L' }, { ticker: 'VWRP', yf: 'VWRP.L' },
  { ticker: 'VUAG', yf: 'VUAG.L' }, { ticker: 'BRK.A', yf: 'BRK-A' },
  { ticker: 'NVDA', yf: 'NVDA' }, { ticker: 'GOOGL', yf: 'GOOGL' },
  { ticker: 'AAPL', yf: 'AAPL' }, { ticker: 'SGLN', yf: 'SGLN.L' },
  { ticker: 'ASML', yf: 'ASML' }, { ticker: 'MSTR', yf: 'MSTR' },
  { ticker: 'PLTR', yf: 'PLTR' },
];
const MODULES = 'assetProfile,defaultKeyStatistics,financialData,summaryDetail,incomeStatementHistory,cashflowStatementHistory,earningsHistory,calendarEvents,upgradeDowngradeHistory,topHoldings';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function acquireCrumb() {
  for (let i = 0; i < 5; i++) {
    try {
      const r1 = await fetch('https://fc.yahoo.com/', { headers: { 'User-Agent': UA } });
      const cookies = [];
      r1.headers.forEach((v, k) => { if (k === 'set-cookie') cookies.push(v); });
      const cookie = cookies.flatMap(h => h.split(/,(?=[^ ])/)).map(s => s.split(';')[0].trim()).filter(Boolean).join('; ');
      await sleep(4000 + i * 3000);
      const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', { headers: { 'User-Agent': UA, 'Cookie': cookie } });
      if (r2.status === 429) { console.log(`  Crumb 429, retry ${i+1}...`); await sleep(15000); continue; }
      if (!r2.ok) return null;
      const crumb = (await r2.text()).trim();
      if (crumb.length < 2) return null;
      console.log('  Crumb:', crumb.slice(0, 8));
      return { crumb, cookie };
    } catch (e) { console.log('  Crumb error:', e.message); }
  }
  return null;
}

async function fetchOne(yf, auth) {
  const hdrs = { 'User-Agent': UA, 'Accept': 'application/json', 'Origin': 'https://finance.yahoo.com', 'Referer': 'https://finance.yahoo.com/' };
  if (auth?.cookie) hdrs['Cookie'] = auth.cookie;
  const qs = `?modules=${MODULES}${auth?.crumb ? '&crumb=' + encodeURIComponent(auth.crumb) : ''}`;
  for (const base of ['https://query1.finance.yahoo.com/v11/finance/quoteSummary', 'https://query2.finance.yahoo.com/v10/finance/quoteSummary']) {
    try {
      const res = await fetch(base + '/' + encodeURIComponent(yf) + qs, { headers: hdrs });
      if (res.status === 429) { await sleep(6000); continue; }
      if (!res.ok) continue;
      const json = await res.json();
      const r = json?.quoteSummary?.result?.[0];
      if (!r) continue;
      return { source: 'quoteSummary', assetProfile: r.assetProfile ?? null, defaultKeyStatistics: r.defaultKeyStatistics ?? null, financialData: r.financialData ?? null, summaryDetail: r.summaryDetail ?? null, incomeStatementHistory: r.incomeStatementHistory?.incomeStatementHistory ?? [], cashflowStatementHistory: r.cashflowStatementHistory?.cashflowStatementHistory ?? [], earningsHistory: r.earningsHistory?.history ?? [], calendarEvents: r.calendarEvents ?? null, upgradeDowngradeHistory: r.upgradeDowngradeHistory?.history?.slice(0,10) ?? [], topHoldings: r.topHoldings ?? null };
    } catch (e) { console.log('  err:', e.message); }
  }
  return null;
}

const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });
console.log('Acquiring crumb...');
const auth = await acquireCrumb();
let ok = 0, fail = 0;
for (const { ticker, yf } of TICKERS) {
  process.stdout.write(ticker + '... ');
  const d = await fetchOne(yf, auth);
  if (d) {
    await prisma.fundamentalSnapshot.upsert({ where: { ticker }, update: { data: JSON.stringify(d), fetchedAt: new Date() }, create: { ticker, data: JSON.stringify(d) } });
    console.log('✓'); ok++;
  } else { console.log('✗'); fail++; }
  await sleep(9000);
}
console.log('Done:', ok + '/' + (ok+fail));
await prisma.$disconnect();
