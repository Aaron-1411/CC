import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const HOLDINGS = [
  { ticker:"EQQQ",  yfSymbol:"EQQQ.L", name:"Invesco EQQQ Nasdaq 100 UCITS ETF",  type:"ETF",   nativeCcy:"GBP", isin:"IE00B53SZB19", ter:0.0030, exchange:"LSE" },
  { ticker:"VWRP",  yfSymbol:"VWRP.L", name:"Vanguard FTSE All-World UCITS ETF",   type:"ETF",   nativeCcy:"GBP", isin:"IE00B3RBWM25", ter:0.0022, exchange:"LSE" },
  { ticker:"VUAG",  yfSymbol:"VUAG.L", name:"Vanguard S&P 500 UCITS ETF",          type:"ETF",   nativeCcy:"GBP", isin:"IE00B3XXRP09", ter:0.0007, exchange:"LSE" },
  { ticker:"BRK.A", yfSymbol:"BRK-A",  name:"Berkshire Hathaway Inc. Class A",     type:"Stock", nativeCcy:"USD", isin:"US0846707026", ter:null,   exchange:"NYSE" },
  { ticker:"NVDA",  yfSymbol:"NVDA",   name:"NVIDIA Corporation",                  type:"Stock", nativeCcy:"USD", isin:"US67066G1040", ter:null,   exchange:"NASDAQ" },
  { ticker:"GOOGL", yfSymbol:"GOOGL",  name:"Alphabet Inc. Class A",               type:"Stock", nativeCcy:"USD", isin:"US02079K3059", ter:null,   exchange:"NASDAQ" },
  { ticker:"AAPL",  yfSymbol:"AAPL",   name:"Apple Inc.",                          type:"Stock", nativeCcy:"USD", isin:"US0378331005", ter:null,   exchange:"NASDAQ" },
  { ticker:"SGLN",  yfSymbol:"SGLN.L", name:"iShares Physical Gold ETC",           type:"ETF",   nativeCcy:"USD", isin:"IE00B4ND3602", ter:0.0012, exchange:"LSE" },
  { ticker:"ASML",  yfSymbol:"ASML",   name:"ASML Holding NV",                     type:"Stock", nativeCcy:"USD", isin:"US0441861046", ter:null,   exchange:"NASDAQ" },
  { ticker:"MSTR",  yfSymbol:"MSTR",   name:"Strategy Inc. (MicroStrategy)",       type:"Stock", nativeCcy:"USD", isin:"US5949724083", ter:null,   exchange:"NASDAQ" },
  { ticker:"PLTR",  yfSymbol:"PLTR",   name:"Palantir Technologies Inc.",          type:"Stock", nativeCcy:"USD", isin:"US69608A1088", ter:null,   exchange:"NYSE" },
];

const SNAPSHOT_POSITIONS = [
  { ticker:"EQQQ",  valueGBP:1378.10, dailyChangeGBP: 189.79, dailyPct: 15.97 },
  { ticker:"VWRP",  valueGBP:1362.82, dailyChangeGBP: 122.83, dailyPct:  9.91 },
  { ticker:"VUAG",  valueGBP:1170.77, dailyChangeGBP: 109.15, dailyPct: 10.28 },
  { ticker:"BRK.A", valueGBP: 938.65, dailyChangeGBP:   7.04, dailyPct:  0.76 },
  { ticker:"NVDA",  valueGBP: 749.57, dailyChangeGBP:  31.27, dailyPct:  4.35 },
  { ticker:"GOOGL", valueGBP: 570.18, dailyChangeGBP:  14.44, dailyPct:  2.60 },
  { ticker:"AAPL",  valueGBP: 558.68, dailyChangeGBP:   5.56, dailyPct:  1.01 },
  { ticker:"SGLN",  valueGBP: 375.01, dailyChangeGBP:  -3.68, dailyPct: -0.97 },
  { ticker:"ASML",  valueGBP: 211.00, dailyChangeGBP:   7.98, dailyPct:  3.93 },
  { ticker:"MSTR",  valueGBP: 208.86, dailyChangeGBP: -59.47, dailyPct:-22.16 },
  { ticker:"PLTR",  valueGBP: 200.29, dailyChangeGBP:   5.09, dailyPct:  2.61 },
];

async function main() {
  console.log("Seeding database…");

  for (const h of HOLDINGS) {
    await prisma.holding.upsert({ where: { ticker: h.ticker }, update: {}, create: h });
  }
  console.log(`✓ ${HOLDINGS.length} holdings`);

  const snapshotDate = new Date("2026-05-10T16:00:00Z");
  const totalValueGBP = SNAPSHOT_POSITIONS.reduce((s, p) => s + p.valueGBP, 0);

  const existing = await prisma.dailySnapshot.findUnique({ where: { date: snapshotDate } });
  if (!existing) {
    const snap = await prisma.dailySnapshot.create({
      data: { date: snapshotDate, totalValueGBP, gbpUsd: 1.275 },
    });
    for (const pos of SNAPSHOT_POSITIONS) {
      const holding = await prisma.holding.findUnique({ where: { ticker: pos.ticker } });
      if (!holding) continue;
      await prisma.positionSnapshot.create({
        data: {
          snapshotId: snap.id,
          holdingId: holding.id,
          valueGBP: pos.valueGBP,
          priceGBP: 0,
          dailyReturnPct: pos.dailyPct,
          weight: pos.valueGBP / totalValueGBP,
        },
      });
    }
    console.log("✓ Baseline snapshot (10 May 2026)");
  } else {
    console.log("✓ Snapshot already exists — skipping");
  }

  const existingIsa = await prisma.isaAllowance.findFirst({ where: { taxYear: "2025/26" } });
  if (!existingIsa) {
    await prisma.isaAllowance.create({
      data: { taxYear: "2025/26", allowanceGBP: 20000, usedGBP: totalValueGBP },
    });
    console.log("✓ ISA allowance 2025/26");
  }

  console.log("✓ Seed complete");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
