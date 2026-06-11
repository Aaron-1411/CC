/*
 * store-factory.js — picks the active HubStore adapter at runtime (Phase 3).
 *
 * Load order matters: config.js → HubStore.js (localStorage default) →
 * SupabaseAdapter.js → store-factory.js. Reads window.HUB_CONFIG.storeAdapter;
 * 'supabase' swaps window.HubStore to the Supabase adapter, anything else keeps
 * the localStorage adapter. This makes rollback trivial — just change config.js.
 *
 * The chosen adapter still exposes the identical synchronous HubStore API; the
 * app calls `await HubStore.init()` once at startup to hydrate it.
 */
(function (root) {
  'use strict';
  try {
    var cfg = root.HUB_CONFIG || {};
    if (cfg.storeAdapter === 'supabase' && root.SupabaseHubStore && cfg.supabase && cfg.supabase.url && cfg.supabase.anonKey) {
      root.HubStore = root.SupabaseHubStore.create({ url: cfg.supabase.url, anonKey: cfg.supabase.anonKey });
      if (typeof console !== 'undefined') console.info('[HubStore] using Supabase adapter');
    } else if (cfg.storeAdapter === 'supabase') {
      if (typeof console !== 'undefined') console.warn('[HubStore] storeAdapter=supabase but config incomplete — falling back to localStorage');
    }
    // else: keep the localStorage HubStore already on window.
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('[HubStore] factory error, using localStorage:', e);
  }
})(typeof window !== 'undefined' ? window : this);
