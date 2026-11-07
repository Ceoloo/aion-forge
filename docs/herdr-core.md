# Upstream Herdr-core evaluation — 2026-11-07

Source: https://github.com/herdrdev/herdr-core
Observed master SHA: 9ce385d9c8abb041dd4437476d770365b3fb5282
License: Apache-2.0; no upstream code or binary imported into Forge v0.1.

Herdr-core offers persistent terminals, agent delegation, JSON-RPC/OpenRPC over local socket or Windows pipe, remote transports and attach streams. Upstream explicitly states it is NOT a sandbox or permission broker. Any API client effectively has its OS account privileges; HC_SESSION does not isolate tenants. Stored terminal history and screens may contain secrets.

Release manifests check hashes over HTTPS, but are not independently signed. Do not use unreviewed curl-pipe-shell installers or automatic updates for AION workers. Pin independently reviewed source and artifact, verify notices and restrict socket access.

Decision: define a replaceable disabled engine interface. Later build a private local JSON-RPC adapter exclusively in the Runtime-owned isolated worker. Prove schema negotiation, timeouts, flow control, cancellation, socket ACLs, failure cleanup and audit evidence before activation.
