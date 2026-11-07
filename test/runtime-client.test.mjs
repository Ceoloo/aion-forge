import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeClient, ForgeError } from '../src/index.mjs';
const command = {tenantId:'tenant-a',name:'ForgeSessionLaunch',requestId:'forge-test',
  serviceKey:'forge.session.launch', actor:{actorId:'actor-1'},payload:{template:'reviewer'}};
test('Runtime client sends bearer, tenant and command through existing gateway', async () => {
  let captured;
  const client=createRuntimeClient({baseUrl:'https://runtime.example.invalid',tokenProvider:async()=> 'test-token-secret',
    fetchImpl:async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({status:'awaiting_approval'})};}});
  const result=await client.submitCommand(command);
  assert.equal(result.status,'awaiting_approval');
  assert.equal(captured.url,'https://runtime.example.invalid/v1/commands');
  assert.equal(captured.options.headers.authorization,'Bearer test-token-secret');
  assert.equal(captured.options.headers['x-aion-tenant-id'],'tenant-a');
  assert.equal(captured.options.redirect,'error');
  assert.equal(JSON.parse(captured.options.body).tenantId,undefined);
  assert.equal(JSON.parse(captured.options.body).serviceKey,'forge.session.launch');
});
test('endpoint must be HTTPS or loopback; no embedded credentials', () => {
  for (const url of ['http://runtime.example.com','https://u:pw@runtime.example.com',
    'file:///etc/passwd','https://runtime.example.com/other','https://runtime.example.com/?token=x']) {
    assert.throws(()=>createRuntimeClient({baseUrl:url,tokenProvider:async()=> 'secret-secret'}),ForgeError);
  }
  assert.ok(createRuntimeClient({baseUrl:'http://127.0.0.1:8080',tokenProvider:async()=> 'secret-secret'}));
});
test('missing token denies before network',async()=>{
  let calls=0;
  const client=createRuntimeClient({baseUrl:'https://runtime.example.invalid',tokenProvider:async()=> '',
    fetchImpl:async()=>{calls++;return {};}});
  await assert.rejects(client.submitCommand(command),{code:'auth_required'});
  assert.equal(calls,0);
});
test('HTTP errors do not leak raw response body',async()=>{
  const client=createRuntimeClient({baseUrl:'https://runtime.example.invalid',tokenProvider:async()=> 'secret-secret',
    fetchImpl:async()=>({ok:false,status:403,json:async()=>({secret:'credential-LEAK'})})});
  await assert.rejects(client.submitCommand(command),e=>e.code==='runtime_rejected' && !e.message.includes('LEAK'));
});
