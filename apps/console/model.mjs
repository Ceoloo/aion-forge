/**
 * Browser-facing read-only projection. This is presentation validation, NOT
 * authorization: Runtime/Sentinel must enforce tenant + actor on the server.
 * Unknown fields (including credentials, paths and prompts) are never copied.
 */
export const SESSION_STATES = Object.freeze({
  working: { label: 'Working', tone: 'working', rank: 1 },
  approval_required: { label: 'Needs approval', tone: 'attention', rank: 0 },
  blocked: { label: 'Blocked', tone: 'danger', rank: 2 },
  queued: { label: 'Queued', tone: 'queued', rank: 3 },
  review: { label: 'In review', tone: 'review', rank: 4 },
  idle: { label: 'Idle', tone: 'neutral', rank: 5 },
  sleeping: { label: 'Sleeping', tone: 'neutral', rank: 6 },
  failed: { label: 'Failed', tone: 'danger', rank: 7 },
  unknown: { label: 'Unknown', tone: 'neutral', rank: 8 },
});
export const LOCATIONS = Object.freeze({local:'Local',cloud:'Cloud sandbox',unknown:'Not connected'});
export const VIEWS = Object.freeze(['overview','workspaces','sessions','approvals','evidence','settings']);
const identifier = v => typeof v === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
const display = (v,max=110) => typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max) : '';
const states = new Set(Object.keys(SESSION_STATES));

export function projectSnapshot(source, tenantId) {
  if (!identifier(tenantId) || source?.schemaVersion !== 1 ||
      !Array.isArray(source?.workspaces) || !Array.isArray(source?.sessions) ||
      !Array.isArray(source?.events)) throw new TypeError('invalid or unsupported dashboard snapshot');
  const workspaces = source.workspaces.filter(w => w?.tenantId === tenantId &&
    identifier(w.id)).slice(0,100).map(w => Object.freeze({
      id:w.id, name:display(w.name,64), repo:display(w.repo,66),
      branch:display(w.branch,85), environment:display(w.environment,25),
      location: LOCATIONS[w.location] ? w.location : 'unknown',
    }));
  const workspaceIds = new Set(workspaces.map(w=>w.id));
  const sessions = source.sessions.filter(s=>s?.tenantId === tenantId &&
    identifier(s.id) && workspaceIds.has(s.workspaceId)).slice(0,500).map(s=>Object.freeze({
      id:s.id, workspaceId:s.workspaceId, title:display(s.title,120),
      harness:display(s.harness,30), model:display(s.model,50),
      state:states.has(s.state) ? s.state : 'unknown',
      location:LOCATIONS[s.location] ? s.location : 'unknown',
      branch:display(s.branch,90), summary:display(s.summary,190),
      updatedAt: typeof s.updatedAt === 'string' && !Number.isNaN(Date.parse(s.updatedAt)) ?
        s.updatedAt : null,
      requestId: identifier(s.requestId) ? s.requestId : null,
      runId:identifier(s.runId) ? s.runId : null,
      executionId:identifier(s.executionId) ? s.executionId : null,
      approvalId:identifier(s.approvalId) ? s.approvalId : null,
      preview: s.preview === 'ready' ? 'ready' : 'unavailable',
      changedFiles:Number.isInteger(s.changedFiles) && s.changedFiles >= 0 ?
        Math.min(s.changedFiles,99999) : null,
    }));
  const sessionIds=new Set(sessions.map(s=>s.id));
  const events=source.events.filter(e=>e?.tenantId === tenantId && sessionIds.has(e.sessionId)
    && identifier(e.id)).slice(0,1000).map(e=>Object.freeze({
    id:e.id, sessionId:e.sessionId, title:display(e.title,140),
    detail:display(e.detail,170), time:typeof e.time === 'string' && !Number.isNaN(Date.parse(e.time)) ?
      e.time : null,
    level:['info','warning','success'].includes(e.level) ? e.level : 'info',
  }));
  return Object.freeze({schemaVersion:1, tenantId, workspaces:Object.freeze(workspaces),
    sessions:Object.freeze(sessions), events:Object.freeze(events),
    mode:'design-fixture', generatedAt:null});
}

export function sessionCounts(sessions){
  return Object.freeze({
    total:sessions.length,
    working:sessions.filter(s=>s.state==='working').length,
    attention:sessions.filter(s=>['approval_required','blocked'].includes(s.state)).length,
    queued:sessions.filter(s=>s.state==='queued').length,
    review:sessions.filter(s=>s.state==='review').length,
  });
}

export function searchSessions(sessions,workspaces,query='',workspaceId='all',status='all'){
  const q=display(query,120).toLocaleLowerCase();
  const repos=new Map(workspaces.map(w=>[w.id,w.repo]));
  return sessions.filter(s=>(workspaceId==='all'||s.workspaceId===workspaceId)&&
    (status==='all'||s.state===status)&&
    [s.title,s.harness,s.summary,s.branch,repos.get(s.workspaceId)].some(t=>t?.toLocaleLowerCase().includes(q)))
    .sort((a,b)=>(SESSION_STATES[a.state]?.rank??9)-(SESSION_STATES[b.state]?.rank??9));
}

/** A disabled control is not an invitation to call an API later. */
export const ACTION_AVAILABILITY=Object.freeze({
  inspect:true, filter:true, navigate:true, launch:false, approve:false,
  transfer:false, terminal:false, openPreview:false, changePermissions:false,
});
