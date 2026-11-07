# Forge Control Room — Cloudroom and Herdr concept study
Reviewed: 2026-11-07
Cloudroom source: https://github.com/davidondrej/cloudroom at becdfa79cdf948d7be3f052783326fcebf32bdf9
Herdr source: https://github.com/herdrdev/herdr
Herdr-core: https://github.com/herdrdev/herdr-core at 9ce385d9c8abb041dd4437476d770365b3fb5282

## Summary

AION Forge is an AION-owned **governed coding-agent work environment**, not another terminal multiplexer and not a new execution control plane. The GUI should feel like a compact engineering cockpit rather than a giant general-purpose IDE.

Cloudroom ships a responsive desktop app (React/TypeScript layout, project/thread navigation, secondary-panel layout, preview, code review, cloud/local harnesses) and Rust core. It has session journaling, safe recovery, queues, per-sandbox Git branches, account/harness selection, a dashboard with summarized statuses, resource samples, and session teleport. Source-informed UI findings came from its README, gui/apps/app/src/components/layout, sidebar, secondary-panel, and core/docs. No pixel-perfect visual comparison or rendered desktop screenshot has been verified.

Herdr provides a terminal-first layout, persistent daemon sessions, agent-aware working/blocked/idle states, multiple machines and keyboard/pane operations. Its local socket grants the OS account's privileges; it is not a sandbox. The Forge product never exposes that raw socket.

## Best ideas, with decision

| Pattern | Cloudroom/Herdr value | Forge decision | Gate |
|---|---|---|---|
| Project / branch / session navigation | Find the right thread among many agents | **NOW**: searchable, workspace-scoped read-only session list | Synthetic fixture only |
| Explicit working / queued / blocked / idle states | Avoid chasing silent agents | **NOW**: status chips and attention-first sorting | Real values only from canonical Runtime |
| Agent-independent harness labels | Claude Code, Codex, Pi, OpenCode | **NOW**: display-only harness summaries | Agent registration/worker identity required before launch |
| Local / cloud side-by-side | Context preserved across environments | **NOW**: location/status labels | No actual remote worker connection |
| Review & changes inspection | Fast context on modified files | **NOW**: review-packet concept; no raw diffs yet | Sandboxed diff artifact + code review required |
| Preview pane | Quick view of dev output | **NOW**: gated/disabled preview panel | Private preview relay, sanitized hostname & origin, tenant auth |
| Durable queued session requests | Don't lose work on disconnect | **NEXT**: design contract, not scheduling code | AION Runtime/Data accepted receipt, idempotent resume/cleanup |
| Session transfer/teleport | Move a running conversation to other machine | **LATER**: explicit checkpoint handoff; not raw process migration | Proven compatible native history, portable credentials, independent approval and cleanup |
| Background resource dashboard | CPU/memory/disk + waiting agents | **LATER**: metrics schema, never invented live numbers | Worker telemetry provenance and freshness |
| Terminal panes | Persistent attachable agent sessions | **LATER**: reviewed Herdr-core EnginePort behind worker | OS isolation, private socket, permission gate |
| Native cloud/local filesystem access | Helps productivity | **AVOID by default** | No unrestricted/full Mac or host access; never inherit production credentials |
| Agents run without approval prompts | Cloudroom trusted-machine convention | **REJECT** | Violates AION Runtime governance rules |

## AION-owned design system

- **Desktop:** 250px workspace rail, fluid center panel, 326px read-only inspector. Search/palette accessible with Ctrl/Cmd+K.
- **Narrow desktop/tablet:** workspace rail plus main; inspector becomes a drawer with explicit close.
- **Mobile:** browse-only rail overlay and inspector drawer; no terminal controls.
- **Mental model:** tenant → workspace/repository → session → run/execution → human gate/evidence.
- **Hierarchy:** title + environment banner → session status counters → action-needed queue → selected session detail.
- **Visual language:** graphite surfaces, aqua for navigation/work, amber for approvals, coral for blocked, violet for reviews. Status includes text and shape; never color-only.
- **Data minimization:** no prompts, shell output, token values, raw file paths, user names or credential-derived capabilities in list projection. Missing metrics/fields read as unknown, never zero or success.
- **Live API future:** implement a Runtime-owned, authenticated read-only BFF endpoint that returns the allowlisted model in apps/console/model.mjs. It must bind tenant and Actor on server, cap records, include sampledAt/source/version, and never expose privileged APIs to the browser. CSP connect-src must be reviewed for the single permitted origin only AFTER the backend is approved.

## Reviewable frontend foundation

Static app under apps/console is intentionally standalone and dependency-free, so engineers can review UX without configuring AION production, keys or new package supply chains.

    npm run console

Open http://127.0.0.1:4173 on your development machine. The server binds loopback only; CSP denies all outbound connections. All sample session states are synthetic. No launch, approve, transfer, terminal or preview action is wired. Tests enforce the projection and CSP guardrails.

**Long-term production recommendation:** move to React + TypeScript + Vite or an approved desktop shell once the design is accepted; preserve the same component contracts and read-only BFF. Do not copy Cloudroom's code or its branded assets. Apache-2.0 permits use with license obligations, but this implementation adapts concepts independently and vendors no Cloudroom/Herdr source.
