/**
 * Synthetic UI ONLY. Never use customer data, production identities or tokens
 * here. No execution or backend requests are triggered by this fixture.
 */
export const fixtureTenant='demo-tenant';
export const fixtureSnapshot={
  schemaVersion:1,
  workspaces:[
    {id:'w-platform',tenantId:'demo-tenant',name:'Platform Core',repo:'aion-runtime',
      branch:'feat/identity-staging',environment:'Staging',location:'cloud'},
    {id:'w-interface',tenantId:'demo-tenant',name:'Forge Interface',repo:'aion-forge',
      branch:'feat/console-review',environment:'Local design',location:'local'},
    {id:'w-security',tenantId:'demo-tenant',name:'Security Layer',repo:'AION-SENTINEL',
      branch:'feat/audit-proofs',environment:'Staging',location:'cloud'},
    // A tenant-isolation negative fixture. It must never appear in the UI.
    {id:'w-other-tenant',tenantId:'different-tenant',name:'Private',repo:'private-secret',
      branch:'hidden',location:'cloud'}
  ],
  sessions:[
    {id:'s-identity',tenantId:'demo-tenant',workspaceId:'w-platform',
      title:'Verify signed identity mapping',harness:'Codex',model:'Selected at runtime',
      state:'approval_required',location:'cloud',branch:'feat/identity-staging',
      summary:'Ready for operator review; no execution permitted in this preview.',
      updatedAt:'2026-11-07T17:18:00Z',requestId:'forge-sample-001',
      runId:'run-sample-001',executionId:'exec-sample-001',approvalId:'approval-sample-001',
      changedFiles:4,preview:'unavailable'},
    {id:'s-ui',tenantId:'demo-tenant',workspaceId:'w-interface',
      title:'Design the Control Room shell',harness:'Claude Code',model:'Selected at runtime',
      state:'review',location:'local',branch:'feat/console-review',
      summary:'Review navigation and accessibility before implementation.',
      updatedAt:'2026-11-07T16:45:00Z',requestId:'forge-sample-002',
      runId:'run-sample-002',executionId:'exec-sample-002',changedFiles:8,preview:'unavailable'},
    {id:'s-audit',tenantId:'demo-tenant',workspaceId:'w-security',
      title:'Audit tenant-bound event writes',harness:'Codex',model:'Selected at runtime',
      state:'blocked',location:'cloud',branch:'feat/audit-proofs',
      summary:'Blocked until signed identity and Data readback are staged.',
      updatedAt:'2026-11-07T16:20:00Z',requestId:'forge-sample-003',
      changedFiles:2,preview:'unavailable'},
    {id:'s-docs',tenantId:'demo-tenant',workspaceId:'w-interface',
      title:'Document agent handoff protocol',harness:'Pi',model:'Selected at runtime',
      state:'queued',location:'local',branch:'docs/handoff-contract',
      summary:'Queued behind the review gate.',updatedAt:'2026-11-07T15:48:00Z',
      requestId:'forge-sample-004',changedFiles:0},
    {id:'s-replay',tenantId:'demo-tenant',workspaceId:'w-platform',
      title:'Inspect session recovery semantics',harness:'OpenCode',model:'Selected at runtime',
      state:'sleeping',location:'cloud',branch:'test/recovery',
      summary:'Saved context remains; process does not run.',updatedAt:'2026-11-07T13:28:00Z',
      requestId:'forge-sample-005',changedFiles:1},
    {id:'s-explore',tenantId:'demo-tenant',workspaceId:'w-interface',
      title:'Model isolated preview artifacts',harness:'Codex',model:'Selected at runtime',
      state:'working',location:'local',branch:'feat/preview-contract',
      summary:'Example working state only—no worker is connected.',
      updatedAt:'2026-11-07T14:21:00Z',requestId:'forge-sample-006',
      changedFiles:3,preview:'unavailable'},
    {id:'s-private',tenantId:'different-tenant',workspaceId:'w-other-tenant',title:'Secret',
      harness:'Private',state:'working',summary:'private-token',branch:'secret'}
  ],
  events:[
    {id:'event-1',tenantId:'demo-tenant',sessionId:'s-identity',title:'Approval requested',
      detail:'R3 gate requires an authorized operator',level:'warning',time:'2026-11-07T17:18:00Z'},
    {id:'event-2',tenantId:'demo-tenant',sessionId:'s-identity',title:'Identity preflight recorded',
      detail:'Principal and Actor references linked to a sample request',level:'info',time:'2026-11-07T17:14:00Z'},
    {id:'event-3',tenantId:'demo-tenant',sessionId:'s-ui',title:'Changes ready for review',
      detail:'8 example files grouped in a review packet',level:'success',time:'2026-11-07T16:45:00Z'},
    {id:'event-4',tenantId:'demo-tenant',sessionId:'s-audit',title:'Audit gate blocked',
      detail:'Durable staging proof required',level:'warning',time:'2026-11-07T16:20:00Z'},
    {id:'event-hidden',tenantId:'different-tenant',sessionId:'s-private',title:'Secret Event',
      detail:'private-payload',level:'info'}
  ]
};
