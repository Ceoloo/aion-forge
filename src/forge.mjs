import { randomUUID } from 'node:crypto';
import { parseLaunchRequest, assertVerifiedPrincipal, assertCanonicalActor, LAUNCH_CAPABILITY } from './contracts.mjs';
import { deny } from './errors.mjs';

const RESULT_STATUSES = new Set(['awaiting_approval', 'denied', 'failed', 'completed']);

/**
 * Product-level coordinator only. All actual execution stays in AION Runtime.
 * identity.requirePrincipal is a TRUSTED server-side Sentinel/Runtime adapter.
 * actorRegistry.get resolves a durable AION Data Actor (never request input).
 * audit.append must durably write evidence and fail closed.
 */
export function createForgeCoordinator({identity, actorRegistry, runtime, audit}) {
  for (const [name, object, method] of [
    ['identity', identity, 'requirePrincipal'],
    ['actorRegistry', actorRegistry, 'get'],
    ['runtime', runtime, 'submitCommand'],
    ['audit', audit, 'append'],
  ]) {
    if (typeof object?.[method] !== 'function')
      deny('configuration_error', name + '.' + method + ' is required');
  }
  return Object.freeze({
    async requestSession(untrustedInput) {
      const input = parseLaunchRequest(untrustedInput);
      const principal = assertVerifiedPrincipal(await identity.requirePrincipal(), input.tenantId);
      const actor = assertCanonicalActor(
        await actorRegistry.get(principal.actorId, input.tenantId), principal, input.tenantId
      );
      const requestId = 'forge-' + randomUUID();
      const auditFields = {requestId, tenantId: input.tenantId, principalId: principal.principalId,
        actorId: actor.actorId, workspaceId: input.workspaceId, template: input.template};
      await audit.append({type: 'forge.session.requested', ...auditFields});
      let result;
      try {
        result = await runtime.submitCommand({
          tenantId: input.tenantId,
          requestId,
          name: 'ForgeSessionLaunch',
          serviceKey: LAUNCH_CAPABILITY,
          actor,
          payload: {workspaceId: input.workspaceId, template: input.template},
          metadata: {forgeRequestId: requestId, source: 'aion-forge'},
          environment: 'staging'
        });
      } catch {
        await audit.append({type: 'forge.session.runtime_error', ...auditFields});
        deny('runtime_unavailable', 'Runtime did not accept this request; no engine was invoked');
      }
      const status = result?.status;
      if (!RESULT_STATUSES.has(status)) {
        await audit.append({type: 'forge.session.unknown_response', ...auditFields});
        deny('runtime_contract_invalid', 'Runtime returned an unknown command state');
      }
      const runId = result?.run?.runId;
      const executionId = result?.execution?.executionId;
      const approvalId = result?.approval?.approvalId;
      await audit.append({type: 'forge.session.runtime_result', ...auditFields, status,
        ...(typeof runId === 'string' ? {runId} : {}),
        ...(typeof executionId === 'string' ? {executionId} : {})});
      return Object.freeze({status, requestId,
        ...(typeof runId === 'string' ? {runId} : {}),
        ...(typeof executionId === 'string' ? {executionId} : {}),
        ...(status === 'awaiting_approval' && typeof approvalId === 'string' ? {approvalId} : {}),
        engineStartedByForge: false});
    }
  });
}
