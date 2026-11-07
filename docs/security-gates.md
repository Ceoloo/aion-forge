# Forge security acceptance gates — default DENY

| Gate | v0.1 state | Required evidence before enabling |
| --- | --- | --- |
| Trusted identity | interface only | Sentinel/Keycloak signed JWT checks, issuer/subject/client/audience/expiry, no fallback |
| Principal/Actor | preflight tested with mocks | real AION Data identity binding, tenant isolation, revoked agents and canonical grants |
| R3 policy | proposed | forge.session.launch catalog service with explicit permission and mandatory human approval |
| Audit | required port | durable append-only AION Data records, outage denial and reconciliation |
| Worker isolation | absent | per-tenant unprivileged worker, bounded filesystem/network/memory/CPU, no host mounts |
| Terminal API | disabled | private Herdr socket only for one worker UID; never expose raw API to UI or another tenant |
| Supply chain | no binary installed | pinned reviewed upstream source, independently verified artifact, SBOM, licenses |
| Human control | disabled | signed approval binding, stop/cancel, safe retry, rollback and review |
| Evidence | mock-only | durable run ID, execution ID, worker identity, sanitized output and exit state |
| Production | prohibited | staging interoperability, external security review, maintainer and operator approvals |

Negative tests check spoofed identity, cross-tenant access, revoked agent, missing capability, explicit deny, insufficient risk ceiling, malicious template, path traversal, audit outage, invalid Runtime response and engine activation.

Local unit tests alone do not establish live authentication, real isolation or a deployed approval flow. Existing AIO-111/GE-001 gates remain unchanged.
