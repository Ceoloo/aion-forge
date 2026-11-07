import { deny } from './errors.mjs';

export const LAUNCH_CAPABILITY = 'forge.session.launch';
export const ALLOWED_TEMPLATES = Object.freeze(['implementer', 'reviewer']);
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function parseLaunchRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    deny('invalid_request', 'launch request must be an object');
  const allowed = new Set(['tenantId', 'workspaceId', 'template']);
  if (Object.keys(value).some((key) => !allowed.has(key)))
    deny('unknown_field', 'launch request contains unsupported fields');
  for (const field of ['tenantId', 'workspaceId']) {
    if (typeof value[field] !== 'string' || !IDENTIFIER.test(value[field]))
      deny('invalid_request', field + ' must be a validated identifier');
  }
  if (!ALLOWED_TEMPLATES.includes(value.template))
    deny('template_forbidden', 'template is not approved');
  return Object.freeze({tenantId: value.tenantId, workspaceId: value.workspaceId, template: value.template});
}

export function assertVerifiedPrincipal(principal, tenantId) {
  if (!principal || principal.verified !== true || typeof principal.actorId !== 'string' ||
      typeof principal.principalId !== 'string' || !Array.isArray(principal.tenantIds) ||
      !Array.isArray(principal.roles))
    deny('auth_required', 'verified identity is required');
  if (!principal.tenantIds.includes(tenantId))
    deny('tenant_forbidden', 'principal is not bound to this tenant');
  if (!principal.roles.includes('invoke'))
    deny('role_forbidden', 'principal lacks invoke role');
  return principal;
}

export function assertCanonicalActor(actor, principal, tenantId) {
  if (!actor || actor.actorId !== principal.actorId ||
      !['human', 'agent', 'service'].includes(actor.actorType))
    deny('actor_forbidden', 'principal has no matching durable actor');
  if (actor.actorType === 'agent' && (actor.tenantId !== tenantId || actor.revocationState !== 'active'))
    deny('actor_forbidden', 'agent tenant or revocation state is invalid');
  if (!Array.isArray(actor.permissions) || !actor.permissions.includes(LAUNCH_CAPABILITY) ||
      !Array.isArray(actor.forbiddenCapabilities) || actor.forbiddenCapabilities.includes(LAUNCH_CAPABILITY))
    deny('capability_forbidden', 'actor lacks permitted Forge capability');
  if (actor.maxRiskLevel !== 'R3')
    deny('risk_forbidden', 'actor risk ceiling does not allow a new session');
  return actor;
}
