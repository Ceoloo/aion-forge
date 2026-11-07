import { deny } from './errors.mjs';

const safeId = value => typeof value === 'string' && /^[A-Za-z0-9._:/-]{1,128}$/.test(value);

/**
 * Trusted backend adapter for the existing @aion/sentinel createKeycloakVerifier
 * result. The verifier MUST check signed JWT claims and fresh Data binding +
 * Actor on every call. No token, role or tenant is accepted from a Forge body.
 * No production connection is configured by this module.
 */
export function createSentinelIdentityAdapter({verifyIdentity, credentialProvider} = {}) {
  if (typeof verifyIdentity !== 'function' || typeof credentialProvider !== 'function')
    deny('configuration_error', 'pinned Sentinel verifier and credential provider are required');
  return Object.freeze({
    async requirePrincipal() {
      let credential;
      try { credential = await credentialProvider(); }
      catch { deny('auth_required', 'credential unavailable'); }
      if (typeof credential !== 'string' || credential.length < 30 ||
          credential.length > 16384 || /[\r\n]/.test(credential))
        deny('auth_required', 'credential missing or malformed');
      let result;
      try { result = await verifyIdentity({credential}); }
      catch { deny('auth_unavailable', 'identity verification unavailable'); }
      const p = result?.principal;
      if (result?.verified !== true || !safeId(p?.principalId) || !safeId(p?.actorId) ||
          !['operator','service','agent-worker'].includes(p?.kind) ||
          !Array.isArray(p?.tenantIds) || p.tenantIds.length === 0 ||
          p.tenantIds.some(x => !safeId(x)) || new Set(p.tenantIds).size !== p.tenantIds.length ||
          !Array.isArray(p?.roles) || p.roles.length === 0 ||
          p.roles.some(x => !['invoke','approve'].includes(x)) ||
          new Set(p.roles).size !== p.roles.length ||
          (p.kind !== 'operator' && p.roles.includes('approve')))
        deny('auth_invalid', 'verified Sentinel identity is invalid');
      const principal = {verified:true, principalId:p.principalId, actorId:p.actorId,
        kind:p.kind, tenantIds:Object.freeze([...p.tenantIds]), roles:Object.freeze([...p.roles])};
      // Non-enumerable so tokens are not accidentally JSON-serialized or audited.
      // Only the backend Runtime adapter receives this credential on the same request.
      Object.defineProperty(principal, 'runtimeBearer', {value:credential, enumerable:false});
      return Object.freeze(principal);
    }
  });
}
