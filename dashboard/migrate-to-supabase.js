/*
 * migrate-to-supabase.js — one-time, idempotent copy of a localStorage Hub into
 * Supabase (Phase 3, Part A). Run from the browser console on the live hub:
 *
 *   1. Create the Supabase project and run supabase/migrations/0001_init.sql.
 *   2. Open the hub (still on storeAdapter:'local' so this reads localStorage).
 *   3. In the console:  await migrateHubToSupabase({ url, anonKey })
 *      (or call with no args to read window.HUB_CONFIG.supabase).
 *   4. Flip config.js → storeAdapter:'supabase' and reload.
 *
 * Idempotent: every row is upserted with Prefer: resolution=merge-duplicates,
 * so re-running overwrites by id instead of duplicating. It reads the raw `hub:`
 * localStorage keys directly (not window.HubStore) so it works regardless of
 * which adapter is currently active. No build step, no dependencies.
 */
(function (root) {
  'use strict';

  var KP = 'hub:';
  function readArray(key) {
    try { var raw = root.localStorage.getItem(KP + key); var p = raw ? JSON.parse(raw) : []; return Array.isArray(p) ? p : []; }
    catch (e) { return []; }
  }
  function readState() {
    try { var raw = root.localStorage.getItem(KP + 'state'); var p = raw ? JSON.parse(raw) : {}; return (p && typeof p === 'object') ? p : {}; }
    catch (e) { return {}; }
  }

  // snake_case row mappers (kept in sync with SupabaseAdapter.js / 0001_init.sql).
  function projRow(p) { return { id: p.id, name: p.name, description: p.description || '', status: p.status, priority: p.priority, quick_launch_url: p.quickLaunchUrl || null, created_at: p.createdAt || null, updated_at: p.updatedAt || null }; }
  function promptRow(p) { return { id: p.id, title: p.title, body: p.body || '', category: p.category, favourite: !!p.favourite, created_at: p.createdAt || null, updated_at: p.updatedAt || null }; }
  function skillRow(s) { return { id: s.id, name: s.name, description: s.description || '', tags: s.tags || [], source_link: s.sourceLink || null, created_at: s.createdAt || null, updated_at: s.updatedAt || null }; }
  function toolRow(t) { return { id: t.id, name: t.name, connected: !!t.connected, description: t.description || '', purpose: t.purpose || '', future_agents: t.futureAgents || [], capabilities: t.capabilities || [] }; }
  function auditRow(a) { return { id: a.id, timestamp: a.timestamp || null, agent_id: a.agentId, action: a.action || '', project_id: a.projectId || null, tokens_used: a.tokensUsed != null ? a.tokensUsed : null, approved: a.approved != null ? a.approved : null, authorisation_level: a.authorisationLevel || 'advisory' }; }

  function create(config) {
    var url = (config.url || '').replace(/\/+$/, '');
    var key = config.anonKey || '';
    if (!url || !key) throw new Error('migrateHubToSupabase: url + anonKey required');

    function post(table, rows) {
      if (!rows.length) return Promise.resolve({ table: table, count: 0 });
      return fetch(url + '/rest/v1/' + table, {
        method: 'POST',
        headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(rows),
      }).then(function (res) {
        if (!res.ok) return res.text().then(function (t) { throw new Error('POST ' + table + ': ' + res.status + ' ' + t); });
        return { table: table, count: rows.length };
      });
    }

    return Promise.resolve()
      .then(function () { return post('projects', readArray('projects').map(projRow)); })
      .then(log)
      .then(function () { return post('prompts', readArray('prompts').map(promptRow)); })
      .then(log)
      .then(function () { return post('skills', readArray('skills').map(skillRow)); })
      .then(log)
      .then(function () { return post('tools', readArray('tools').map(toolRow)); })
      .then(log)
      .then(function () { return post('audit_log', readArray('auditLog').map(auditRow)); })
      .then(log)
      .then(function () { return migrateMemory(readArray('memory')); })
      .then(function () { return migrateState(readState()); })
      .then(function () { console.info('[migrate] done.'); return true; });

    function log(r) { if (r && r.count != null) console.info('[migrate] ' + r.table + ': ' + r.count + ' rows'); return r; }

    // memory branches + their children (decisions / sessions / repos).
    function migrateMemory(branches) {
      var chain = Promise.resolve();
      branches.forEach(function (b) {
        var s = b.sections || {};
        chain = chain
          .then(function () { return post('memory_branches', [{ id: b.id, project_id: b.projectId, summary: s.summary || '', architecture: s.architecture || '', roadmap: s.roadmap || '', open_issues: s.openIssues || '', skills_used: s.skillsUsed || [] }]); })
          .then(function () { return post('decisions', (s.decisions || []).map(function (d) { return { id: d.id, memory_branch_id: b.id, date: d.date || null, title: d.title, context: d.context || '', decision: d.decision || '', consequences: d.consequences || '' }; })); })
          .then(function () { return post('session_summaries', (b.sessions || []).map(function (x) { return { id: x.id, memory_branch_id: b.id, date: x.date || null, title: x.title, summary: x.summary || '', tokens_estimate: x.tokensEstimate != null ? x.tokensEstimate : null }; })); })
          .then(function () { return post('repo_refs', (s.repositories || []).map(function (r, i) { return { id: b.id + ':r' + i, memory_branch_id: b.id, name: r.name || '', url: r.url || '', note: r.note || '' }; })); });
      });
      return chain.then(function () { console.info('[migrate] memory: ' + branches.length + ' branches'); });
    }

    function migrateState(state) {
      var rows = Object.keys(state).map(function (k) { return { key: k, value: JSON.stringify(state[k]) }; });
      return post('workspace_notes', rows).then(log);
    }
  }

  function migrateHubToSupabase(config) {
    var cfg = config || ((root.HUB_CONFIG || {}).supabase) || {};
    return create(cfg);
  }

  root.migrateHubToSupabase = migrateHubToSupabase;
  if (typeof module !== 'undefined' && module.exports) { module.exports = { migrateHubToSupabase: migrateHubToSupabase }; }
})(typeof self !== 'undefined' ? self : this);
