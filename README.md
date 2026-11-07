# AION Forge

**AION-owned governed development workspace — v0.1 foundation only (not production ready).**

Forge is a product surface for AION Software Factory. It proposes coding-agent sessions through **existing AION Runtime**. Forge never directly opens terminals, changes repositories or bypasses human approval.

## Delivered

- Strict request validation: no shell, raw paths, arbitrary templates or caller-supplied actor IDs.
- Server-side verified principal and durable canonical Actor are required integration ports.
- Tenant, invoke role, explicit capability, revoked agent and R3 risk preflight.
- Durable audit port must write before Runtime requests.
- Runtime HTTP adapter targets existing POST /v1/commands with server-supplied credential.
- Replaceable Herdr-core EnginePort is disabled.
- Zero npm dependencies; Node 22 tests, CI and read-only status CLI.

**Not yet built:** deployed Sentinel verifier, real AION Data audit adapter, registered Forge Runtime service/worker, sandboxed Herdr-core, session UI, staging interoperability and production execution. The proposed capability forge.session.launch is NOT registered by this change.

## Verify locally

    npm run check
    npm run status

Status intentionally reports engineEnabled=false, runtimeConnected=false, sentinelConnected=false and productionReady=false.

## Boundary

    Sentinel verified server identity (planned)
      -> Forge validation and durable audit
      -> existing AION Runtime Execution Gateway
      -> AION Core R3 policy / human approval
      -> AION Data run, execution and evidence
      -> future Runtime-owned isolated worker
      -> future private Herdr-core engine

Only a future Runtime-owned isolated worker may invoke Herdr-core after an approved capability and human decision. Herdr-core itself is not a sandbox or permission system.

See docs/architecture.md, docs/security-gates.md, docs/repository-audit.md and docs/herdr-core.md.

This scaffold includes no Herdr code or binary. Herdr-core is upstream Apache-2.0; review its license and notices before any future import. AION retains ownership of original Forge code.
