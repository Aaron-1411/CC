/*
 * HubStore.js — the Personal Hub storage abstraction (Phase A).
 *
 * Locked decision #1: ALL persistence goes through HubStore. The UI must never
 * call localStorage directly. This is the localStorage adapter for Phases 0–2;
 * a Supabase adapter replaces the backend (not the interface) from Phase 3.
 *
 * No build step in dashboard/, so this loads as a plain <script> and attaches
 * `window.HubStore`. Load it BEFORE seed.js and before the main inline script.
 *
 * Each entity type gets its own `hub:`-prefixed key holding a JSON array of
 * items that each carry an `id`. (Distinct from the legacy `ws:` keys the
 * current UI still uses — those migrate onto HubStore in a later step/phase.)
 *
 * @typedef {import('./types').Project} Project
 * @typedef {import('./types').Prompt} Prompt
 * @typedef {import('./types').Skill} Skill
 * @typedef {import('./types').ToolCard} ToolCard
 * @typedef {import('./types').MemoryBranch} MemoryBranch
 * @typedef {import('./types').AuditLogEntry} AuditLogEntry
 */
(function (global) {
  'use strict';

  var KEY_PREFIX = 'hub:';

  /**
   * Return a working storage backend. Uses localStorage when available, else a
   * volatile in-memory map so the app never throws (e.g. Safari private mode).
   * @returns {{getItem:Function,setItem:Function,removeItem:Function,persistent:boolean}}
   */
  function makeBackend() {
    try {
      var probe = '__hub_probe__';
      global.localStorage.setItem(probe, '1');
      global.localStorage.removeItem(probe);
      var ls = global.localStorage;
      return {
        getItem: function (k) { return ls.getItem(k); },
        setItem: function (k, v) { ls.setItem(k, v); },
        removeItem: function (k) { ls.removeItem(k); },
        persistent: true,
      };
    } catch (e) {
      var mem = Object.create(null);
      return {
        getItem: function (k) { return k in mem ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; },
        persistent: false,
      };
    }
  }

  var backend = makeBackend();

  /** @param {string} key @returns {Array<Object>} */
  function readArray(key) {
    try {
      var raw = backend.getItem(KEY_PREFIX + key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  /** @param {string} key @param {Array<Object>} arr @returns {void} */
  function writeArray(key, arr) {
    backend.setItem(KEY_PREFIX + key, JSON.stringify(arr));
  }

  /**
   * Repository<T> over a single `hub:<key>` array of `{ id }` items.
   * @template {{id:string}} T
   * @param {string} key
   * @returns {{
   *   get:(id:string)=>(T|null), getAll:()=>T[], save:(item:T)=>T,
   *   delete:(id:string)=>boolean, exportAll:()=>string, importAll:(json:string)=>void
   * }}
   */
  function createRepository(key) {
    return {
      /** @param {string} id @returns {Object|null} */
      get: function (id) {
        var found = readArray(key).filter(function (x) { return x && x.id === id; })[0];
        return found || null;
      },
      /** @returns {Array<Object>} */
      getAll: function () { return readArray(key); },
      /** Insert or update by id. @param {Object} item @returns {Object} */
      save: function (item) {
        if (!item || typeof item.id === 'undefined') {
          throw new Error('HubStore.' + key + '.save requires an item with an id');
        }
        var all = readArray(key);
        var idx = -1;
        for (var i = 0; i < all.length; i++) { if (all[i] && all[i].id === item.id) { idx = i; break; } }
        if (idx >= 0) { all[idx] = item; } else { all.push(item); }
        writeArray(key, all);
        return item;
      },
      /** @param {string} id @returns {boolean} true if an item was removed */
      delete: function (id) {
        var all = readArray(key);
        var next = all.filter(function (x) { return !(x && x.id === id); });
        var changed = next.length !== all.length;
        if (changed) { writeArray(key, next); }
        return changed;
      },
      /** @returns {string} JSON of this repository's array */
      exportAll: function () { return JSON.stringify(readArray(key)); },
      /** @param {string} json @returns {void} */
      importAll: function (json) {
        var parsed = JSON.parse(json);
        writeArray(key, Array.isArray(parsed) ? parsed : []);
      },
      key: key,
    };
  }

  var repositories = {
    /** @type {ReturnType<typeof createRepository>} projects */
    projects: createRepository('projects'),
    prompts: createRepository('prompts'),
    skills: createRepository('skills'),
    tools: createRepository('tools'),
    memory: createRepository('memory'),
    auditLog: createRepository('auditLog'),
  };

  // ── Key-value app state (non-entity: workspace notes, prefs, etc.) ────────
  // A single `hub:state` object. Keeps misc UI state inside HubStore so the UI
  // never calls localStorage directly (locked decision #1).
  var STATE_KEY = 'state';
  function readState() {
    try {
      var raw = backend.getItem(KEY_PREFIX + STATE_KEY);
      var parsed = raw ? JSON.parse(raw) : {};
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) { return {}; }
  }
  var stateApi = {
    /** @param {string} k @param {*} [dflt] */
    get: function (k, dflt) { var s = readState(); return (k in s) ? s[k] : (dflt === undefined ? null : dflt); },
    /** @param {string} k @param {*} v @returns {*} */
    set: function (k, v) { var s = readState(); s[k] = v; backend.setItem(KEY_PREFIX + STATE_KEY, JSON.stringify(s)); return v; },
    /** @returns {Object} the whole state object */
    all: function () { return readState(); },
  };

  /**
   * Serialise every repository + app state into one backup/migration document.
   * @returns {string} pretty JSON: { version, exportedAt, data:{...arrays}, state:{} }
   */
  function exportAllData() {
    var data = {};
    Object.keys(repositories).forEach(function (name) {
      data[name] = repositories[name].getAll();
    });
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: data, state: readState() }, null, 2);
  }

  /**
   * Restore from an exportAllData() document (or a bare { name: [] } map).
   * Unknown keys are ignored; missing keys are left untouched.
   * @param {string} json
   * @returns {void}
   */
  function importAllData(json) {
    var parsed = JSON.parse(json);
    var data = parsed && parsed.data ? parsed.data : parsed;
    Object.keys(repositories).forEach(function (name) {
      if (Array.isArray(data[name])) {
        repositories[name].importAll(JSON.stringify(data[name]));
      }
    });
    if (parsed && parsed.state && typeof parsed.state === 'object') {
      backend.setItem(KEY_PREFIX + STATE_KEY, JSON.stringify(parsed.state));
    }
  }

  /** @returns {boolean} true when every repository is empty (seed gate). */
  function isEmpty() {
    return Object.keys(repositories).every(function (name) {
      return repositories[name].getAll().length === 0;
    });
  }

  var HubStore = {
    projects: repositories.projects,
    prompts: repositories.prompts,
    skills: repositories.skills,
    tools: repositories.tools,
    memory: repositories.memory,
    auditLog: repositories.auditLog,
    state: stateApi,
    exportAllData: exportAllData,
    importAllData: importAllData,
    isEmpty: isEmpty,
    /** No-op for the localStorage adapter (reads are already synchronous). The
     *  Supabase adapter overrides this to hydrate its cache. Uniform contract so
     *  app init can always `await HubStore.init()`. */
    init: function () { return Promise.resolve(); },
    /** True when persisting to real localStorage; false on the in-memory fallback. */
    persistent: backend.persistent,
    backend: 'localStorage',
    KEY_PREFIX: KEY_PREFIX,
  };

  global.HubStore = HubStore;
  if (typeof module !== 'undefined' && module.exports) { module.exports = HubStore; }
})(typeof window !== 'undefined' ? window : this);
