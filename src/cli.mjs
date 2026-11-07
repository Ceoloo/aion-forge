#!/usr/bin/env node
import { createHerdrCoreAdapter } from './engines/herdr-core.mjs';
if (process.argv[2] === 'status') {
  const adapter = createHerdrCoreAdapter();
  console.log(JSON.stringify({
    product: 'AION Forge', version: '0.2.0',
    identityAdapterAvailable: true, auditAdapterAvailable: true,
    identityWiredToLiveSentinel: false, auditWiredToLiveData: false,
    engine: adapter.kind, engineEnabled: adapter.enabled,
    runtimeConnected: false, productionReady: false
  }, null, 2));
} else {
  console.error('Usage: npm run status');
  process.exitCode = 2;
}
