import test from 'node:test';
import assert from 'node:assert/strict';
import { createForgeCoordinator, createHerdrCoreAdapter, ForgeError } from '../src/index.mjs';

const input = {tenantId: 'tenant-a', workspaceId: 'workspace-one', template: 'implementer'};
const principal = {verified: true, principalId: 'operator-1', actorId: 'actor-1', tenantIds: ['tenant-a'], roles: ['invoke']};
const actor = {actorId: 'actor-1', actorType: 'human', name: 'Operator', permissions: ['forge.session.launch'],
  forbiddenCapabilities: [], allowedTools: [], maxRiskLevel: 'R3'};
function fixtures({identity = principal, durableActor = actor, response = {status: 'awaiting_approval',
  run: {runId:'run-1'}, approval:{approvalId:'approval-1'}, execution:{executionId:'execution-1'}},
  auditFails = false, runtimeFails = false} = {}) {
  const calls = {runtime:[], audit:[]};
  const coordinator = createForgeCoordinator({
    identity:{async requirePrincipal(){return identity;}},
    actorRegistry:{async get(){return durableActor;}},
    runtime:{async submitCommand(command){calls.runtime.push(command); if(runtimeFails) throw new Error('SECRET_RUNTIME_ERROR');return response;}},
    audit:{async append(event){if(auditFails) throw new Error('audit down');calls.audit.push(event);}}
  });
  return {coordinator, calls};
}
async function rejects(code, overrides = {}, req = input) {
  const {coordinator, calls} = fixtures(overrides);
  await assert.rejects(coordinator.requestSession(req), (err) => err instanceof ForgeError && err.code === code);
  assert.equal(calls.runtime.length, 0, 'must never submit after ' + code);
}
test('valid proposal uses existing Runtime gateway; no direct Herdr launch', async () => {
  const {coordinator,calls} = fixtures();
  const result = await coordinator.requestSession(input);
  assert.equal(result.status, 'awaiting_approval');
  assert.equal(result.engineStartedByForge, false);
  assert.equal(result.approvalId, 'approval-1');
  assert.match(result.requestId, /^forge-[0-9a-f-]+$/);
  assert.equal(calls.runtime.length, 1);
  assert.equal(calls.runtime[0].serviceKey, 'forge.session.launch');
  assert.equal(calls.runtime[0].actor.actorId, principal.actorId);
  assert.equal(calls.runtime[0].tenantId, input.tenantId);
  assert.equal(calls.runtime[0].payload.template, 'implementer');
  assert.equal(calls.audit[0].type, 'forge.session.requested');
  assert.equal(calls.audit[1].type, 'forge.session.runtime_result');
});
test('rejects caller identity, shell and policy overrides', async () => {
  for (const field of ['actor', 'principalId','command','shell','argv','environment','engine','requestId'])
    await rejects('unknown_field', {}, {...input, [field]:'injected'});
});
test('rejects path traversal and unapproved template', async () => {
  await rejects('invalid_request', {}, {...input, workspaceId:'../../host'});
  await rejects('template_forbidden', {}, {...input,template:'bash -c whoami'});
});
test('requires verified identity, invoke role and same-tenant binding', async () => {
  await rejects('auth_required', {identity:{...principal,verified:false}});
  await rejects('role_forbidden', {identity:{...principal,roles:['approve']}});
  await rejects('tenant_forbidden', {identity:{...principal,tenantIds:['tenant-b']}});
});
test('rejects wrong actor, absent capability, deny list and risk too low', async () => {
  await rejects('actor_forbidden', {durableActor:{...actor,actorId:'another-actor'}});
  await rejects('capability_forbidden', {durableActor:{...actor,permissions:[]}});
  await rejects('capability_forbidden', {durableActor:{...actor,forbiddenCapabilities:['forge.session.launch']}});
  await rejects('risk_forbidden', {durableActor:{...actor,maxRiskLevel:'R1'}});
});
test('rejects revoked and cross-tenant agent', async () => {
  await rejects('actor_forbidden', {durableActor:{...actor,actorType:'agent',tenantId:'tenant-a',revocationState:'revoked'}});
  await rejects('actor_forbidden', {durableActor:{...actor,actorType:'agent',tenantId:'tenant-b',revocationState:'active'}});
});
test('audit outage prevents submission', async () => {
  const {coordinator,calls} = fixtures({auditFails:true});
  await assert.rejects(coordinator.requestSession(input), /audit down/);
  assert.equal(calls.runtime.length,0);
});
test('runtime errors are redacted', async () => {
  const {coordinator,calls} = fixtures({runtimeFails:true});
  await assert.rejects(coordinator.requestSession(input), (e) => e.code==='runtime_unavailable' && !e.message.includes('SECRET'));
  assert.equal(calls.audit.at(-1).type,'forge.session.runtime_error');
});
test('unknown Runtime state cannot be presented as a launch', async () => {
  const {coordinator,calls} = fixtures({response:{status:'running'}});
  await assert.rejects(coordinator.requestSession(input), {code:'runtime_contract_invalid'});
  assert.equal(calls.audit.at(-1).type,'forge.session.unknown_response');
});
test('completed is Runtime status, not terminal launch evidence', async () => {
  const {coordinator} = fixtures({response:{status:'completed',run:{runId:'r'}}});
  const result = await coordinator.requestSession(input);
  assert.equal(result.status,'completed');
  assert.equal(result.engineStartedByForge,false);
});
test('herdr port refuses activation and every operation', async () => {
  const engine=createHerdrCoreAdapter();
  assert.equal(engine.enabled,false);
  for (const name of ['launch','attach','send','list','stop'])
    await assert.rejects(engine[name](), {code:'engine_disabled'});
  assert.throws(()=>createHerdrCoreAdapter({mode:'active'}), {code:'engine_not_authorized'});
});
