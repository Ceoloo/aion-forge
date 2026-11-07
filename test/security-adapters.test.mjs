import test from 'node:test';
import assert from 'node:assert/strict';
import {createSentinelIdentityAdapter, createDurableAuditAdapter,
  createForgeCoordinator, createRuntimeClient, ForgeError} from '../src/index.mjs';

const token='header.payload.signature'.repeat(3);
const principal={principalId:'p-one',actorId:'a-one',kind:'operator',tenantIds:['tenant-a'],roles:['invoke']};
const actor={actorId:'a-one',actorType:'human',name:'Human',permissions:['forge.session.launch'],
  forbiddenCapabilities:[],allowedTools:[],maxRiskLevel:'R3'};
const request={tenantId:'tenant-a',workspaceId:'work-one',template:'reviewer'};
const validAudit={type:'forge.session.requested',requestId:'forge-1',tenantId:'tenant-a',
  principalId:'p-one',actorId:'a-one',workspaceId:'work-one',template:'reviewer'};

test('Sentinel adapter yields only verified principal; bearer never serializes',async()=>{
  let seen;
  const identity=createSentinelIdentityAdapter({credentialProvider:async()=>token,
    verifyIdentity:async(x)=>{seen=x;return {verified:true,principal};}});
  const verified=await identity.requirePrincipal();
  assert.equal(seen.credential,token);
  assert.equal(verified.verified,true);
  assert.equal(verified.runtimeBearer,token);
  assert.equal(JSON.stringify(verified).includes(token),false);
  assert.deepEqual(verified.tenantIds,['tenant-a']);
  assert.equal(Object.isFrozen(verified),true);
});
test('Sentinel rejects invalid signatures, malformed principal, roles and verifier outages',async()=>{
  const create=(verification,credential=token)=>createSentinelIdentityAdapter({
    credentialProvider:async()=>credential,verifyIdentity:async()=>verification});
  await assert.rejects(create({verified:false}).requirePrincipal(),{code:'auth_invalid'});
  await assert.rejects(create({verified:true,principal:{...principal,tenantIds:['tenant-a','tenant-a']}}).requirePrincipal(),{code:'auth_invalid'});
  await assert.rejects(create({verified:true,principal:{...principal,kind:'service',roles:['approve']}}).requirePrincipal(),{code:'auth_invalid'});
  await assert.rejects(create({verified:true,principal:{...principal,roles:['invoke','superuser']}}).requirePrincipal(),{code:'auth_invalid'});
  await assert.rejects(create({verified:true,principal},'short').requirePrincipal(),{code:'auth_required'});
  await assert.rejects(createSentinelIdentityAdapter({
    credentialProvider:async()=>token,verifyIdentity:async()=>{throw Error('secret');}})
    .requirePrincipal(),e=>e.code==='auth_unavailable' && !e.message.includes('secret'));
});
test('strict audit schema uses allowlisted metadata and durable acknowledgment',async()=>{
  const writes=[];
  const audit=createDurableAuditAdapter({write:async(e)=>{writes.push(e);return {eventId:e.eventId,committed:true};}});
  const a=await audit.append(validAudit);
  const b=await audit.append(validAudit);
  assert.equal(a.eventId,b.eventId,'re-delivery gets the same immutable event id');
  assert.equal(writes.length,2);
  assert.equal(writes[0].schemaVersion,'forge.audit.v1');
  assert.equal(writes[0].tenantId,'tenant-a');
  assert.equal(JSON.stringify(writes).includes('Bearer '),false);
});
test('audit rejects credentials, arbitrary fields, missing acknowledgment and sink errors',async()=>{
  const ok=createDurableAuditAdapter({write:async e=>({eventId:e.eventId,committed:true})});
  await assert.rejects(ok.append({...validAudit,secret:'token'}),{code:'audit_invalid'});
  await assert.rejects(ok.append({...validAudit,actorId:'../../passwd'}),{code:'audit_invalid'});
  await assert.rejects(ok.append({...validAudit,type:'access.approved'}),{code:'audit_invalid'});
  await assert.rejects(createDurableAuditAdapter({write:async()=>undefined}).append(validAudit),{code:'audit_unavailable'});
  await assert.rejects(createDurableAuditAdapter({write:async()=>({eventId:'wrong',committed:true})}).append(validAudit),{code:'audit_unavailable'});
  await assert.rejects(createDurableAuditAdapter({write:async()=>{throw Error('db-secret');}}).append(validAudit),
    e=>e.code==='audit_unavailable' && !e.message.includes('db-secret'));
});
test('Runtime client requires same-request verified token in bound mode',async()=>{
  let calls=0; let seen;
  const client=createRuntimeClient({baseUrl:'https://runtime.example.invalid',
    requireBoundCredential:true,fetchImpl:async(_url,opts)=>{calls++;seen=opts;return {ok:true,json:async()=>({status:'awaiting_approval'})};}});
  const command={tenantId:'tenant-a',name:'x',actor,requestId:'forge-1',serviceKey:'forge.session.launch'};
  await assert.rejects(client.submitCommand(command),{code:'auth_required'});
  assert.equal(calls,0);
  await client.submitCommand(command,{runtimeBearer:token});
  assert.equal(calls,1);
  assert.equal(seen.headers.authorization,'Bearer '+token);
});
test('integration: verified identity + durable ack -> Runtime; rejected identity/audit cannot submit',async()=>{
  const calls=[];const evidence=[];
  const make=(verifyIdentity,ack=true)=>{
    const identity=createSentinelIdentityAdapter({credentialProvider:async()=>token,verifyIdentity});
    const audit=createDurableAuditAdapter({write:async e=>{evidence.push(e);return ack?{eventId:e.eventId,committed:true}:undefined;}});
    const runtime=createRuntimeClient({baseUrl:'https://runtime.example.invalid',requireBoundCredential:true,
      fetchImpl:async(_u,opts)=>{calls.push(opts);return {ok:true,json:async()=>({
        status:'awaiting_approval',run:{runId:'r1'},approval:{approvalId:'ap1'}})};}});
    return createForgeCoordinator({identity,audit,runtime,actorRegistry:{get:async()=>actor}});
  };
  const good=make(async()=>({verified:true,principal}));
  const response=await good.requestSession(request);
  assert.equal(response.status,'awaiting_approval');
  assert.equal(response.engineStartedByForge,false);
  assert.equal(calls.length,1);
  assert.equal(evidence.length,2);
  await assert.rejects(make(async()=>({verified:false})).requestSession(request),{code:'auth_invalid'});
  await assert.rejects(make(async()=>({verified:true,principal}),false).requestSession(request),{code:'audit_unavailable'});
  assert.equal(calls.length,1,'denied authentication and audit outage must never call Runtime');
});
