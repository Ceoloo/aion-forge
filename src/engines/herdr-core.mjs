import { deny } from '../errors.mjs';

/** Inert replaceable EnginePort; never connect to hc from the product tier.
 * Future activation requires reviewed isolated Runtime-owned worker.
 */
export function createHerdrCoreAdapter({mode = 'disabled'} = {}) {
  if (mode !== 'disabled')
    deny('engine_not_authorized', 'herdr-core activation requires a reviewed Runtime worker');
  return Object.freeze({
    kind: 'herdr-core',
    enabled: false,
    async launch() { deny('engine_disabled', 'terminal launch is disabled'); },
    async attach() { deny('engine_disabled', 'terminal attach is disabled'); },
    async send() { deny('engine_disabled', 'terminal input is disabled'); },
    async list() { deny('engine_disabled', 'terminal inspection is disabled'); },
    async stop() { deny('engine_disabled', 'terminal termination is disabled'); }
  });
}
