/*
 * SupabaseAdapter.js — a HubStore adapter backed by Supabase (PostgREST REST,
 * dependency-free fetch — no @supabase/supabase-js). Phase 3, Part A.
 *
 * Preserves HubStore's SYNCHRONOUS API (get/getAll/save/delete return
 * immediately) by serving reads from an in-memory cache that is hydrated once by
 * `await HubStore.init()`. Writes are write-through: the cache updates instantly
 * and the row is persisted to Supabase in the background (errors surfaced via
 * window.toast / console).
 *
 * Exposes window.SupabaseHubStore.create({ url, anonKey }).
 *
 * @typedef {import('./types').Project} Project
 * @typedef {import('./types').MemoryBranch} MemoryBranch
 */
(function (root) {
  'use strict';

  var clone = function (x) { return x == null ? x : JSON.parse(JSON.stringify(x)); };

  // ── snake_case row ⇄ camelCase type mappers for the flat tables ─────────────
  var MAP = {
    projects: {
      table: 'projects',
      toRow: function (p) { return { id: p.id, name: p.name, description: p.description || '', status: p.status, priority: p.priority, quick_launch_url: p.quickLaunchUrl || null, created_at: p.createdAt, updated_at: p.updatedAt }; },
      fromRow: function (r) { return { id: r.id, name: r.name, description: r.description || '', status: r.status, priority: r.priority, quickLaunchUrl: r.quick_launch_url || '', createdAt: r.created_at, updatedAt: r.updated_at }; },
    },
    prompts: {
      table: 'prompts',
      toRow: function (p) { return { id: p.id, title: p.title, body: p.body || '', category: p.category, favourite: !!p.favourite, created_at: p.createdAt, updated_at: p.updatedAt }; },
      fromRow: function (r) { return { id: r.id, title: r.title, body: r.body || '', category: r.category, favourite: !!r.favourite, createdAt: r.created_at, updatedAt: r.updated_at }; },
    },
    skills: {
      table: 'skills',
      toRow: function (s) { return { id: s.id, name: s.name, description: s.description || '', tags: s.tags || [], source_link: s.sourceLink || null, created_at: s.createdAt, updated_at: s.updatedAt }; },
      fromRow: function (r) { return { id: r.id, name: r.name, description: r.description || '', tags: r.tags || [], sourceLink: r.source_link || '', createdAt: r.created_at, updatedAt: r.updated_at }; },
    },
    tools: {
      table: 'tools',
      toRow: function (t) { return { id: t.id, name: t.name, connected: !!t.connected, description: t.description || '', purpose: t.purpose || '', future_agents: t.futureAgents || [], capabilities: t.capabilities || [] }; },
      fromRow: function (r) { return { id: r.id, name: r.name, connected: !!r.connected, description: r.description || '', purpose: r.purpose || '', futureAgents: r.future_agents || [], capabilities: r.capabilities || [] }; },
    },
    auditLog: {
      table: 'audit_log',
      toRow: function (a) { return { id: a.id, timestamp: a.timestamp, agent_id: a.agentId, action: a.action || '', project_id: a.projectId || null, tokens_used: a.tokensUsed != null ? a.tokensUsed : null, approved: a.approved != null ? a.approved : null, authorisation_level: a.authorisationLevel || 'advisory' }; },
      fromRow: function (r) { return { id: r.id, timestamp: r.timestamp, agentId: r.agent_id, action: r.action || '', projectId: r.project_id || undefined, tokensUsed: r.tokens_used != null ? r.tokens_used : undefined, approved: r.approved != null ? r.approved : undefined, authorisationLevel: r.authorisation_level }; },
    },
  };

  function decFromRow(r) { return { id: r.id, date: r.date || '', title: r.title, context: r.context || '', decision: r.decision || '', consequences: r.consequences || '' }; }
  function sesFromRow(r) { var o = { id: r.id, date: r.date || '', title: r.title, summary: r.summary || '' }; if (r.tokens_estimate != null) o.tokensEstimate = r.tokens_estimate; return o; }
  function repoFromRow(r) { return { name: r.name || '', url: r.url || '', note: r.note || '' }; }

  function create(config) {
    var url = (config.url || '').replace(/\/+$/, '');
    var key = config.anonKey || '';
    var FLAT = ['projects', 'prompts', 'skills', 'tools', 'auditLog'];
    var cache = { projects: [], prompts: [], skills: [], tools: [], memory: [], auditLog: [], state: {} };
    var ready = false;

    function onError(e) {
      try { if (typeof root.toast === 'function') root.toast('Supabase sync error'); } catch (x) {}
      if (typeof console !== 'undefined') console.warn('[SupabaseAdapter]', e && e.message ? e.message : e);
    }
    function headers(extra) {
      var h = { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };
      if (extra) for (var k in extra) h[k] = extra[k];
      return h;
    }
    function rest(method, path, body, prefer) {
      return fetch(url + '/rest/v1/' + path, {
        method: method,
        headers: headers(prefer ? { Prefer: prefer } : null),
        body: body != null ? JSON.stringify(body) : undefined,
      }).then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error('Supabase ' + method + ' ' + path + ': ' + res.status + ' ' + t); });
        return res.text().then(function (txt) { return txt ? JSON.parse(txt) : null; });
      });
    }
    // fire-and-forget write-through
    function persist(promise) { promise.catch(onError); }
    function upsert(table, row) { return rest('POST', table, [row], 'resolution=merge-duplicates,return=minimal'); }
    function del(table, id) { return rest('DELETE', table + '?id=eq.' + encodeURIComponent(id), null, 'return=minimal'); }

    // ── memory assembly / persistence ─────────────────────────────────────────
    function assembleMemory(branches, decisions, sessions, repos) {
      var byBranch = {};
      branches.forEach(function (b) {
        byBranch[b.id] = { id: b.id, projectId: b.project_id,
          sections: { summary: b.summary || '', architecture: b.architecture || '', roadmap: b.roadmap || '', openIssues: b.open_issues || '', skillsUsed: b.skills_used || [], decisions: [], repositories: [] },
          sessions: [] };
      });
      decisions.forEach(function (d) { if (byBranch[d.memory_branch_id]) byBranch[d.memory_branch_id].sections.decisions.push(decFromRow(d)); });
      repos.forEach(function (r) { if (byBranch[r.memory_branch_id]) byBranch[r.memory_branch_id].sections.repositories.push(repoFromRow(r)); });
      sessions.forEach(function (s) { if (byBranch[s.memory_branch_id]) byBranch[s.memory_branch_id].sessions.push(sesFromRow(s)); });
      return Object.keys(byBranch).map(function (k) { return byBranch[k]; });
    }
    function persistMemory(branch) {
      var s = branch.sections || {};
      var branchRow = { id: branch.id, project_id: branch.projectId, summary: s.summary || '', architecture: s.architecture || '', roadmap: s.roadmap || '', open_issues: s.openIssues || '', skills_used: s.skillsUsed || [] };
      var decRows = (s.decisions || []).map(function (d) { return { id: d.id, memory_branch_id: branch.id, date: d.date || null, title: d.title, context: d.context || '', decision: d.decision || '', consequences: d.consequences || '' }; });
      var sesRows = (branch.sessions || []).map(function (x) { return { id: x.id, memory_branch_id: branch.id, date: x.date || null, title: x.title, summary: x.summary || '', tokens_estimate: x.tokensEstimate != null ? x.tokensEstimate : null }; });
      var repoRows = (s.repositories || []).map(function (r, i) { return { id: branch.id + ':r' + i, memory_branch_id: branch.id, name: r.name || '', url: r.url || '', note: r.note || '' }; });
      // upsert branch, then replace children (delete-all-then-insert per branch)
      return upsert('memory_branches', branchRow)
        .then(function () { return rest('DELETE', 'decisions?memory_branch_id=eq.' + encodeURIComponent(branch.id), null, 'return=minimal'); })
        .then(function () { return decRows.length ? rest('POST', 'decisions', decRows, 'return=minimal') : null; })
        .then(function () { return rest('DELETE', 'session_summaries?memory_branch_id=eq.' + encodeURIComponent(branch.id), null, 'return=minimal'); })
        .then(function () { return sesRows.length ? rest('POST', 'session_summaries', sesRows, 'return=minimal') : null; })
        .then(function () { return rest('DELETE', 'repo_refs?memory_branch_id=eq.' + encodeURIComponent(branch.id), null, 'return=minimal'); })
        .then(function () { return repoRows.length ? rest('POST', 'repo_refs', repoRows, 'return=minimal') : null; });
    }

    // ── repositories (the HubStore repos) ──────────────────────────────────────
    function flatRepo(name) {
      var m = MAP[name];
      return {
        getAll: function () { return clone(cache[name]); },
        get: function (id) { var f = cache[name].filter(function (x) { return x && x.id === id; })[0]; return f ? clone(f) : null; },
        save: function (item) {
          var arr = cache[name]; var i = -1;
          for (var k = 0; k < arr.length; k++) { if (arr[k].id === item.id) { i = k; break; } }
          if (i >= 0) arr[i] = clone(item); else arr.push(clone(item));
          persist(upsert(m.table, m.toRow(item)));
          return item;
        },
        delete: function (id) {
          var arr = cache[name]; var next = arr.filter(function (x) { return x.id !== id; });
          var changed = next.length !== arr.length;
          if (changed) { cache[name] = next; persist(del(m.table, id)); }
          return changed;
        },
        exportAll: function () { return JSON.stringify(clone(cache[name])); },
        importAll: function (json) { var a = JSON.parse(json); cache[name] = Array.isArray(a) ? a : []; persist(Promise.all(cache[name].map(function (x) { return upsert(m.table, m.toRow(x)); }))); },
        key: name,
      };
    }
    var memoryRepo = {
      getAll: function () { return clone(cache.memory); },
      get: function (id) { var f = cache.memory.filter(function (x) { return x && x.id === id; })[0]; return f ? clone(f) : null; },
      save: function (branch) {
        var arr = cache.memory; var i = -1;
        for (var k = 0; k < arr.length; k++) { if (arr[k].id === branch.id) { i = k; break; } }
        if (i >= 0) arr[i] = clone(branch); else arr.push(clone(branch));
        persist(persistMemory(branch));
        return branch;
      },
      delete: function (id) {
        var arr = cache.memory; var next = arr.filter(function (x) { return x.id !== id; });
        var changed = next.length !== arr.length;
        if (changed) { cache.memory = next; persist(del('memory_branches', id)); }
        return changed;
      },
      exportAll: function () { return JSON.stringify(clone(cache.memory)); },
      importAll: function (json) { var a = JSON.parse(json); cache.memory = Array.isArray(a) ? a : []; persist(Promise.all(cache.memory.map(persistMemory))); },
      key: 'memory',
    };

    var stateApi = {
      get: function (k, dflt) { return (k in cache.state) ? clone(cache.state[k]) : (dflt === undefined ? null : dflt); },
      set: function (k, v) { cache.state[k] = clone(v); persist(upsert('workspace_notes', { key: k, value: JSON.stringify(v) })); return v; },
      all: function () { return clone(cache.state); },
    };

    function isEmpty() { return FLAT.every(function (n) { return cache[n].length === 0; }) && cache.memory.length === 0; }

    function exportAllData() {
      var data = {};
      FLAT.forEach(function (n) { data[n] = clone(cache[n]); });
      data.memory = clone(cache.memory);
      return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: data, state: clone(cache.state) }, null, 2);
    }
    function importAllData(json) {
      var parsed = JSON.parse(json); var data = parsed && parsed.data ? parsed.data : parsed;
      FLAT.forEach(function (n) { if (Array.isArray(data[n])) adapter[n].importAll(JSON.stringify(data[n])); });
      if (Array.isArray(data.memory)) adapter.memory.importAll(JSON.stringify(data.memory));
      if (parsed && parsed.state) { Object.keys(parsed.state).forEach(function (k) { stateApi.set(k, parsed.state[k]); }); }
    }

    // ── init: hydrate the cache from Supabase ──────────────────────────────────
    function init() {
      if (ready) return Promise.resolve();
      var sel = '?select=*';
      return Promise.all([
        rest('GET', 'projects' + sel), rest('GET', 'prompts' + sel), rest('GET', 'skills' + sel),
        rest('GET', 'tools' + sel), rest('GET', 'audit_log' + sel),
        rest('GET', 'memory_branches' + sel), rest('GET', 'decisions' + sel),
        rest('GET', 'session_summaries' + sel), rest('GET', 'repo_refs' + sel),
        rest('GET', 'workspace_notes' + sel),
      ]).then(function (res) {
        cache.projects = (res[0] || []).map(MAP.projects.fromRow);
        cache.prompts = (res[1] || []).map(MAP.prompts.fromRow);
        cache.skills = (res[2] || []).map(MAP.skills.fromRow);
        cache.tools = (res[3] || []).map(MAP.tools.fromRow);
        cache.auditLog = (res[4] || []).map(MAP.auditLog.fromRow);
        cache.memory = assembleMemory(res[5] || [], res[6] || [], res[7] || [], res[8] || []);
        cache.state = {};
        (res[9] || []).forEach(function (r) { try { cache.state[r.key] = JSON.parse(r.value); } catch (e) { cache.state[r.key] = r.value; } });
        ready = true;
      });
    }

    var adapter = {
      projects: flatRepo('projects'), prompts: flatRepo('prompts'), skills: flatRepo('skills'),
      tools: flatRepo('tools'), auditLog: flatRepo('auditLog'), memory: memoryRepo,
      state: stateApi, exportAllData: exportAllData, importAllData: importAllData, isEmpty: isEmpty,
      init: init, persistent: true, backend: 'supabase', KEY_PREFIX: 'supabase:',
    };
    return adapter;
  }

  root.SupabaseHubStore = { create: create };
  if (typeof module !== 'undefined' && module.exports) { module.exports = { create: create }; }
})(typeof self !== 'undefined' ? self : this);
