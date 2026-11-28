# Changelog

## Unreleased

- AirGuard Airlines (a fictional airline) is the default story: a fourth `airlines` pack is the default vertical, and the sample claims, tool names, scopes (`itinerary:read`, `refund:issue`) and lesson text that were banking wording now tell the airline story (itinerary read permitted, over-threshold refund denied). The retail, health and finance packs stay. Generated diagrams and the talk track were regenerated.

## 0.1.0 (2026-11-20)

- New lab: the Agent Identity Academy as a standalone. 13 lessons, one per agent type and per control — Agent Landscape, OIDC/PKCE sign-in, OAuth delegated access (RFC 8693), the Personal Agent (consumer, CIMD mocked), the enterprise Digital Assistant (task mandate + CIBA step-up), MCP discovery vs execution, PingOne Authorize permit/deny, human approval (CIBA/HITL, replay-safe), A2A multi-agent delegation, Privilege MCP protection, AI threat defense, lifecycle and revocation, and the closing evidence/product map.
- Every lesson walks the same five lifecycle stages (Discover, Register, Authenticate, Authorize, Govern) and activates only the stages it touches; the stage rail lights up per lesson.
- A frame-by-frame movie reel per lesson with a per-frame evidence drawer: mock tokens in play, a claim-diff table of what changed across the hop, and the redacted request/response. Run advances one frame every 2.2 s; a manual pick takes over; Reset clears the playhead.
- 14 diagram-studio/1 diagrams (one per lesson plus the stage model), generated from the lesson data by `scripts/build-diagrams.mjs`, ReactFlow with movable boxes, Simulate, Reset (restores positions) and speed control; doctor fails on a lesson without a diagram, an unused diagram, or an inconsistent frame.
- Derived from the AI-DEMO2 static Academy prototype, rewritten customer-neutral: every host is reserved (`auth.example-idp.invalid`), every token is a labelled mock sample, and the evidence drawer is headed `MOCK · sample claims`.
- 13-beat talk track (regenerated from the same story data the UI reads), presenter mode, doctor, per-workspace Reset, Learning Hub content pack.
- Mock-only by design: no live mode, zero outbound network in any mode (netguard with self-test); `AIA_MODE_REAL=1` only enables the rule-19 Real switch and the page keeps its simulation banner. Per-visitor workspaces (rule 13).
- Port 7831 (one port, from the shelf allocator, 2026-11-20). Catalog id D142.
