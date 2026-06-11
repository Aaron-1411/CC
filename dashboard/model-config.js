/*
 * model-config.js — single source of truth for the agent→model mapping and
 * token pricing (ROADMAP locked decision #5). Plain JS, loaded two ways:
 *   • Browser: <script src="/model-config.js"> sets window.MODEL_CONFIG.
 *   • Pages Functions (TS, bundled by Wrangler/esbuild): import from this file.
 *
 * Model IDs are the API model strings — update them to the current Anthropic
 * model names as they ship. Prices are USD per million tokens (input/output);
 * convert to GBP for display via usdToGbp.
 */
(function (root) {
  'use strict';

  var MODEL_CONFIG = {
    // Logical model roles (ROADMAP #5).
    models: {
      // Opus — Chairman synthesis + Phase 9 council debates on high-value calls.
      chairman:   { id: 'claude-opus-4-8',   label: 'Opus 4.8',   role: 'Chairman synthesis; high-value council debates',
                    priceInputPerMTokUSD: 15.0, priceOutputPerMTokUSD: 75.0 },
      // Sonnet — all worker agents (Developer, QA, UX, Automation, etc.).
      worker:     { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', role: 'All worker/council agents',
                    priceInputPerMTokUSD: 3.0,  priceOutputPerMTokUSD: 15.0 },
      // Haiku — summarisation, classification, session compression.
      summariser: { id: 'claude-haiku-4-5',  label: 'Haiku 4.5',  role: 'Summarisation, classification, session compression',
                    priceInputPerMTokUSD: 0.8,  priceOutputPerMTokUSD: 4.0 },
    },
    // Task → model-role mapping. Callers ask for a task, not a hardcoded model.
    tasks: {
      chairman:  'chairman',
      agent:     'worker',
      council:   'chairman',
      summarise: 'summariser',
      classify:  'summariser',
      compress:  'summariser',
    },
    currency: { code: 'GBP', symbol: '£', usdToGbp: 0.79 },
    anthropicVersion: '2023-06-01',
    maxTokens: 4096,
  };

  /** Resolve a task name (or model-role) to a model entry. */
  function modelForTask(task) {
    var role = MODEL_CONFIG.tasks[task] || (MODEL_CONFIG.models[task] ? task : 'chairman');
    return MODEL_CONFIG.models[role];
  }

  /**
   * Estimate cost in GBP for a model role/task given input + output tokens.
   * @returns {number} GBP
   */
  function estimateCostGBP(task, inputTokens, outputTokens) {
    var m = modelForTask(task); if (!m) return 0;
    var usd = ((inputTokens || 0) * m.priceInputPerMTokUSD + (outputTokens || 0) * m.priceOutputPerMTokUSD) / 1e6;
    return usd * MODEL_CONFIG.currency.usdToGbp;
  }

  var api = { MODEL_CONFIG: MODEL_CONFIG, modelForTask: modelForTask, estimateCostGBP: estimateCostGBP };

  root.MODEL_CONFIG = MODEL_CONFIG;
  root.modelForTask = modelForTask;
  root.estimateCostGBP = estimateCostGBP;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; }
})(typeof self !== 'undefined' ? self : this);
