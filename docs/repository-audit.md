# Cross-repository audit — 2026-11-07

GitHub default-branch source snapshots (NOT live production attestations):

| Repository | Observed SHA | Findings |
| --- | --- | --- |
| Ceoloo/aion-core | fbcbb7b877d7401338b7f58c8b4c97165979d7b5 | Owns Actor, permissions, R0-R3 policy, human approval; Forge must not duplicate |
| Ceoloo/aion-runtime | dc196b9fe74b5c5ec8d3c3166dbe249380348e69 | Existing POST /v1/commands. Sentinel Keycloak integration remains draft/disabled pending staging authorization |
| Ceoloo/aion-data | a9653d0d771613b43cc0b52966fd493c4f6c9b51 | Durable actors, runs, approvals; draft identity-bindings migration 0015 |
| Ceoloo/aion-infra | bcb7c94ad3a6c31438c49df35c4e01ffd46ad827 | Provider-neutral deploy contract; no reviewed Forge worker isolation yet |
| Ceoloo/aion-products | 568211d2c0bd51129f964440ffa81603d2db1bfc | Product domain separate from policy and Runtime |
| Ceoloo/AION-SENTINEL | bfcff381602e5a8ae11d5e9a2ab88b466d7cd801 | Default branch presently README only; Sentinel PR #2 referenced by Runtime but not deployed |
| Ceoloo/aion-desks | 2682acabb95a607ee15497fb01238c9860d7713f | Example product satellite, no execution gateway |
| herdrdev/herdr-core | 9ce385d9c8abb041dd4437476d770365b3fb5282 | Apache-2.0 terminal engine, not sandbox or per-client auth |

## Next approvals

1. Validate Sentinel/Data/Runtime integration in isolated staging and record negative Keycloak/tenant evidence.
2. Review service catalog registration for forge.session.launch as R3, requiring human approval.
3. Implement append-only audit and idempotent reconciliation; record run/execution/request IDs.
4. Build isolated worker and validated, pinned Herdr artifact/private socket.
5. Demonstrate two-agent coding workflow with tests, audited PR creation and **no auto merge/deployment**.

Do not alter existing GE-001, AIO-111 or production readiness gates. This repo is public: never commit secrets, customer data, bearer tokens or raw terminal transcripts.
