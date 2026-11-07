# AION Forge

AION-owned governed development workspace. **v0.2 trust-boundary code is review-only; not production-ready.**

## Present

- v0.1: request schema, Actor/tenant/R3 policy preflight, existing Runtime command transport, disabled Herdr-core interface.
- v0.2: Sentinel verification adapter and same-request credential binding; strictly allowlisted audit event adapter requiring a committed persistence acknowledgment.
- Node 22 security-negative tests, CI, zero installed Herdr binaries.

## Verify

    npm run check
    npm run status

The status command intentionally reports identityWiredToLiveSentinel=false, auditWiredToLiveData=false, engineEnabled=false, runtimeConnected=false and productionReady=false.

## Boundary

    trusted Sentinel verifier -> durable Principal/Actor binding
      -> Forge preflight -> trusted AION Data audit
      -> existing AION Runtime POST /v1/commands
      -> AION Core R3 policy/human approval
      -> future isolated worker -> Herdr-core (DISABLED)

Forge product must not directly query Data or expose a Herdr terminal socket. A trusted Runtime-side adapter will be required before deployment. The proposed forge.session.launch catalog capability is NOT registered.

Read docs/v0.2-trust-boundary.md, docs/security-gates.md, docs/architecture.md, and docs/repository-audit.md.

Herdr-core upstream is Apache-2.0. No Herdr code or binaries are bundled here. Existing GE-001 and AIO-111 production gates are unchanged.
