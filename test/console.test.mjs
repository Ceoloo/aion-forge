import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fixtureSnapshot,fixtureTenant } from '../apps/console/fixtures.mjs';
import { projectSnapshot, sessionCounts, searchSessions, SESSION_STATES, ACTION_AVAILABILITY } from '../apps/console/model.mjs';
const view=projectSnapshot(fixtureSnapshot,fixtureTenant);

test('dashboard projection is tenant-scoped and never trusts hidden workspace',()=>{
  assert.equal(view.workspaces.length,3);
  assert.equal(view.sessions.length,6);
  assert.equal(view.events.length,4);
  assert.equal(JSON.stringify(view).includes('private-secret'),false);
  assert.equal(JSON.stringify(view).includes('private-payload'),false);
  assert.equal(JSON.stringify(view).includes('Secret Event'),false);
});
test('dashboard only projects allowlisted fields and drops credentials and raw text',()=>{
  const copy=structuredClone(fixtureSnapshot);
  copy.workspaces[0].token='VERY_PRIVATE_ACCESS_TOKEN';
  copy.sessions[0].prompt='VERY_PRIVATE_PROMPT';
  copy.sessions[0].rawTerminalOutput='VERY_PRIVATE_SHELL';
  copy.sessions[0].bearer='VERY_PRIVATE_JWT';
  copy.events[0].payload={secret:'VERY_PRIVATE_EVIDENCE'};
  const result=JSON.stringify(projectSnapshot(copy,fixtureTenant));
  assert.equal(result.includes('VERY_PRIVATE'),false);
});
test('unknown status never falsely claims working or completed',()=>{
  const copy=structuredClone(fixtureSnapshot);
  copy.sessions[0].state='live_and_approved';
  const result=projectSnapshot(copy,fixtureTenant);
  assert.equal(result.sessions[0].state,'unknown');
  assert.equal(SESSION_STATES.unknown.label,'Unknown');
});
test('counts and search honor status and workspace constraints',()=>{
  const counts=sessionCounts(view.sessions);
  assert.deepEqual(counts,{total:6,working:1,attention:2,queued:1,review:1});
  assert.equal(searchSessions(view.sessions,view.workspaces,'identity').length,1);
  assert.equal(searchSessions(view.sessions,view.workspaces,'','w-interface').length,3);
  assert.equal(searchSessions(view.sessions,view.workspaces,'','all','approval_required').length,1);
  assert.equal(searchSessions(view.sessions,view.workspaces,'no match').length,0);
});
test('bad snapshots and tenant IDs cannot reach UI',()=>{
  assert.throws(()=>projectSnapshot(null,'demo-tenant'),TypeError);
  assert.throws(()=>projectSnapshot({...fixtureSnapshot,schemaVersion:2},'demo-tenant'),TypeError);
  assert.throws(()=>projectSnapshot(fixtureSnapshot,'../tenant'),TypeError);
  assert.throws(()=>projectSnapshot({...fixtureSnapshot,sessions:{}},'demo-tenant'),TypeError);
});
test('read-only UI cannot grant privileges, open terminals or transfer machines',()=>{
  for(const key of ['launch','approve','transfer','terminal','openPreview','changePermissions'])
    assert.equal(ACTION_AVAILABILITY[key],false,key+' must be disabled');
});
test('fixture contains no production private keys or credential-shaped content',()=>{
  const text=JSON.stringify(fixtureSnapshot);
  for(const s of ['-----BEGIN','sk-proj-','Bearer ','password=','postgresql://','token='])
    assert.equal(text.includes(s),false,'forbidden fixture string');
});
test('HTML declares restrictive CSP, accessible landmarks and no inline JS',()=>{
  const html=readFileSync(new URL('../apps/console/index.html',import.meta.url),'utf8');
  assert.match(html,/connect-src 'none'/);
  assert.match(html,/<main\b[^>]*id="main"/);
  assert.match(html,/role="dialog"/);
  assert.match(html,/id="announcement"[^>]*aria-live=/);
  assert.doesNotMatch(html,/<script(?![^>]*src=)/);
  assert.doesNotMatch(html,/\bonclick=/i);
  assert.match(html,/<button[^>]*disabled[^>]*>＋ New session/);
});
test('frontend code renders text using DOM textContent without unsafe HTML insertion',()=>{
  const app=readFileSync(new URL('../apps/console/app.mjs',import.meta.url),'utf8');
  assert.match(app,/\.textContent=/);
  assert.doesNotMatch(app,/\.innerHTML\s*=/);
  assert.doesNotMatch(app,/\bfetch\s*\(/);
  assert.doesNotMatch(app,/\bWebSocket\s*\(/);
});
test('local preview server is bound to loopback with a strict asset allowlist',()=>{
  const server=readFileSync(new URL('../scripts/serve-console.mjs',import.meta.url),'utf8');
  assert.match(server,/\.listen\(chosen,'127\.0\.0\.1'/);
  assert.match(server,/const assets=new Map/);
  assert.match(server,/connect-src 'none'/);
  assert.doesNotMatch(server,/\bexec\s*\(/);
});
