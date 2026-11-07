import { deny } from './errors.mjs';

function checkRuntimeEndpoint(value) {
  let url;
  try { url = new URL(value); } catch { deny('configuration_error', 'Runtime URL is invalid'); }
  if (url.username || url.password || url.search || url.hash || url.pathname !== '/')
    deny('configuration_error', 'Runtime URL must be an origin without credentials, query or path');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local))
    deny('configuration_error', 'Runtime must use HTTPS unless on loopback');
  return url.origin;
}

/** Gateway transport; production composition MUST set requireBoundCredential. */
export function createRuntimeClient({baseUrl, tokenProvider, fetchImpl = fetch,
  requireBoundCredential = false} = {}) {
  const origin = checkRuntimeEndpoint(baseUrl);
  if (typeof fetchImpl !== 'function' || (typeof tokenProvider !== 'function' && !requireBoundCredential))
    deny('configuration_error', 'Runtime tokenProvider or required bound credential is missing');
  return Object.freeze({
    async submitCommand(command, {runtimeBearer} = {}) {
      if (requireBoundCredential && typeof runtimeBearer !== 'string')
        deny('auth_required', 'same-request verified Sentinel credential required');
      const token = typeof runtimeBearer === 'string' ? runtimeBearer : await tokenProvider();
      if (typeof token !== 'string' || token.length < 8 || /[\r\n]/.test(token))
        deny('auth_required', 'Runtime bearer credential unavailable');
      let response;
      try {
        response = await fetchImpl(origin + '/v1/commands', {
          method: 'POST', redirect: 'error',
          headers: {'authorization': 'Bearer ' + token, 'content-type': 'application/json',
            'x-aion-tenant-id': command.tenantId},
          body: JSON.stringify(Object.fromEntries(Object.entries(command).filter(([k]) => k !== 'tenantId'))),
          signal: AbortSignal.timeout(10_000)
        });
      } catch { deny('runtime_unavailable', 'Runtime connection failed'); }
      if (!response.ok) deny('runtime_rejected', 'Runtime rejected the command (' + response.status + ')');
      let value;
      try { value = await response.json(); } catch { deny('runtime_contract_invalid', 'Runtime returned invalid JSON'); }
      return value;
    }
  });
}
