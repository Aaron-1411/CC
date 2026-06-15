// Journal statistics. Pure function over signals + trades so it can run on the
// client (demo mode) and be mirrored by the server's /api/journal. Kept simple
// and explicit — every field maps 1:1 to the JournalStats contract.

import type { JournalStats, ParsedSignal, UserTrade } from '../types/contract';

interface SignalLite {
  signal: Pick<ParsedSignal, 'id' | 'entry' | 'entryRange' | 'stopLoss' | 'takeProfit' | 'signalTime' | 'direction'>;
  trades: UserTrade[];
}

// R = reward/risk in units of initial risk. For a long: (exit-entry)/(entry-stop).
function tradeR(trade: UserTrade, entry: number, stop: number): number | null {
  if (trade.exitPrice == null) return null;
  const risk = Math.abs(entry - stop);
  if (risk === 0) return null;
  const move = trade.direction === 'long' ? trade.exitPrice - entry : entry - trade.exitPrice;
  return move / risk;
}

function signalEntry(s: SignalLite['signal']): number | null {
  if (s.entry != null) return s.entry;
  if (s.entryRange) return (s.entryRange[0] + s.entryRange[1]) / 2;
  return null;
}

export function computeStats(items: SignalLite[]): JournalStats {
  const totalSignals = items.length;
  const closed: { trade: UserTrade; sigEntry: number; stop: number }[] = [];
  const allTrades: { item: SignalLite; trade: UserTrade }[] = [];

  for (const item of items) {
    for (const trade of item.trades) {
      allTrades.push({ item, trade });
      const stop = item.signal.stopLoss;
      const sigEntry = signalEntry(item.signal);
      if (trade.status === 'closed' && trade.exitPrice != null && stop != null && sigEntry != null) {
        closed.push({ trade, sigEntry, stop });
      }
    }
  }

  const tradesTaken = allTrades.length;
  const takeRate = totalSignals > 0 ? tradesTaken / totalSignals : 0;

  let wins = 0;
  let losses = 0;
  let myTotalR = 0;
  let signalTotalR = 0;

  for (const { trade, sigEntry, stop } of closed) {
    const myR = tradeR(trade, trade.entryPrice, stop);
    const sigR = tradeR(trade, sigEntry, stop);
    if (myR != null) {
      myTotalR += myR;
      if (myR > 0) wins++;
      else losses++;
    }
    if (sigR != null) signalTotalR += sigR;
  }

  // Slippage and timing delay over all trades that have the needed data.
  let slipSum = 0;
  let slipN = 0;
  let delaySum = 0;
  let delayN = 0;
  for (const { item, trade } of allTrades) {
    const sigEntry = signalEntry(item.signal);
    if (sigEntry != null) {
      // Signed so a worse fill (paying up on a long, selling lower on a short)
      // is positive slippage.
      const slip = trade.direction === 'long' ? trade.entryPrice - sigEntry : sigEntry - trade.entryPrice;
      slipSum += slip;
      slipN++;
    }
    const delayMins = (Date.parse(trade.entryTime) - Date.parse(item.signal.signalTime)) / 60000;
    if (Number.isFinite(delayMins)) {
      delaySum += delayMins;
      delayN++;
    }
  }

  const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;

  return {
    totalSignals,
    tradesTaken,
    takeRate,
    wins,
    losses,
    winRate,
    avgEntrySlippage: slipN > 0 ? slipSum / slipN : 0,
    avgTimingDelayMins: delayN > 0 ? delaySum / delayN : 0,
    myTotalR,
    signalTotalR,
  };
}
