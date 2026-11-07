import { createHash } from 'node:crypto';
import { deny } from './errors.mjs';

const TYPE_SET = new Set(['forge.session.requested','forge.session.runtime_result',
  'forge.session.runtime_error','forge.session.unknown_response']);
const STATUSES = new Set(['awaiting_approval','denied','failed','completed']);
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const INPUT_FIELDS = new Set(['type','requestId','tenantId','principalId','actorId',
  'workspaceId','template','status','runId','executionId']);
function valid(v) { return typeof v === 'string' && ID.test(v); }
function eventUuid(canonical) {
  const digest = createHash('sha256').update('aion-forge:audit:v1:' + canonical).digest('hex');
  return [digest.slice(0,8),digest.slice(8,12),'5'+digest.slice(13,16),
    'a'+digest.slice(17,20),digest.slice(20,32)].join('-');
}

/**
 * Only trusted Runtime-owned AION Data writer should be supplied.
 * write(record) MUST durably COMMIT before acknowledging {eventId,committed:true}.
 * This code cannot turn an untrusted in-memory writer into durable evidence.
 */
export function createDurableAuditAdapter({write} = {}) {
  if (typeof write !== 'function')
    deny('configuration_error','trusted durable AION Data audit writer required');
  return Object.freeze({
    async append(event) {
      if (!event || typeof event !== 'object' || Array.isArray(event) ||
          Object.keys(event).some(k => !INPUT_FIELDS.has(k)) ||
          !TYPE_SET.has(event.type) ||
          !['requestId','tenantId','principalId','actorId','workspaceId','template'].every(k => valid(event[k])) ||
          (event.status !== undefined && !STATUSES.has(event.status)) ||
          (event.runId !== undefined && !valid(event.runId)) ||
          (event.executionId !== undefined && !valid(event.executionId)))
        deny('audit_invalid','invalid audit event shape');
      const allowed = Object.fromEntries(Object.entries(event).filter(([k])=>INPUT_FIELDS.has(k)));
      const canonical = JSON.stringify(Object.fromEntries(Object.keys(allowed).sort().map(k=>[k,allowed[k]])));
      const record = Object.freeze({eventId:eventUuid(canonical), schemaVersion:'forge.audit.v1',
        recordedAt:new Date().toISOString(), ...allowed});
      let acknowledgement;
      try { acknowledgement = await write(record); }
      catch { deny('audit_unavailable','durable audit writer unavailable'); }
      if (acknowledgement?.committed !== true || acknowledgement?.eventId !== record.eventId)
        deny('audit_unavailable','audit write not durably acknowledged');
      return Object.freeze({eventId:record.eventId, committed:true});
    }
  });
}
