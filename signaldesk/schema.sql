CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  raw_json TEXT NOT NULL,        -- RawDiscordMessage
  parsed_json TEXT NOT NULL,     -- ParsedSignal
  signal_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  signal_id TEXT NOT NULL REFERENCES signals(id),
  trade_json TEXT NOT NULL,      -- UserTrade
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sync_state (
  channel_id TEXT PRIMARY KEY,
  last_message_id TEXT
);
-- 60s candle cache to protect the Twelve Data 800/day ceiling.
CREATE TABLE IF NOT EXISTS candle_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  fetched_at INTEGER NOT NULL    -- unix seconds
);
CREATE INDEX IF NOT EXISTS idx_signals_time ON signals(signal_time DESC);
CREATE INDEX IF NOT EXISTS idx_trades_signal ON trades(signal_id);
