# Forge v0.1 architecture (not deployment approval)

## Responsibilities

- Forge owns developer workspace coordination and safe requests, but not execution authority.
- Sentinel must verify signed identity and map to durable AION Principal/Actor; never trust browser-provided identity or forged headers.
- AION Runtime owns the sole Execution Gateway, POST /v1/commands.
- AION Core owns policy, capability grants, R0-R3 risk and human approvals.
- AION Data owns durable Actor, execution, run, approval, event and audit evidence.
- AION Infra owns isolated worker infrastructure.

## Proposed flow

    verified principal -> tenant/actor preflight -> audit append
    -> Runtime POST /v1/commands; serviceKey forge.session.launch
    -> Core R3 human approval -> durable execution object
    -> future reviewed Runtime worker -> private herdr-core socket

Forge does not invoke the terminal engine. The proposed capability has not been registered. Runtime must resolve authoritative actor and tenant, not grant authority from request fields. An HTTP completed status is not proof a Herdr process launched. Require separate worker-attributed, durable launch evidence.

EnginePort has launch, attach, send, list and stop methods, all disabled in v0.1. Future activation requires isolation, explicit tenant scope, source pinning, audit and cancellation.

Deferred: browser shell, SSH forwarding, arbitrary commands, API exposure, unreviewed dependency installation, production credentials, autonomous PR merge, staging/prod deploy.
