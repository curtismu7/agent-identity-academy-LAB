# Agent Identity Academy LAB

Tier: Demo.
Repo: https://github.com/curtismu7/agent-identity-academy-LAB

A standalone port of the Agent Identity Academy: **13 lessons, one per agent type and per control** — from classification (Foundation) through OIDC sign-in, delegated access (RFC 8693), the Personal Agent, the enterprise Digital Assistant, MCP discovery and execution, PingOne Authorize permit/deny, human approval (CIBA/HITL), A2A multi-agent delegation, Privilege MCP protection, AI threat defense, lifecycle and revocation, to the closing evidence and product map.

Every lesson walks the same five lifecycle stages — **Discover, Register, Authenticate, Authorize, Govern** — and activates only the stages it touches. The page shows: the stage rail, the lesson rail, the actors and trust boundary, a **frame-by-frame movie reel** with a per-frame evidence drawer (mock tokens in play, a **claim diff table** of what changed across the hop, and the redacted request/response), the frame-to-product map, and a **diagram-studio diagram** per lesson (ReactFlow: movable boxes, Simulate, Reset restores positions, speed control).

## Source and honesty

- **Derived from** the AI-DEMO2 static Academy prototype (`academy-identity-preview.html`), rewritten customer-neutral: every host is a reserved name (`*.invalid`), every token is a labelled mock sample (the sample issuer is `auth.example-idp.invalid`), and no tenant, client id or hostname from any real environment ships in this lab.
- Sample claims follow real token shapes (scope narrowing, `act` claims, audience rebinds) so the teaching story is accurate, but no token is issued or read: every frame's evidence drawer is headed `MOCK · sample claims`.
- CIMD is labelled as a mock (PingOne does not support it); the lab states its own reading everywhere.

## Run it

Prerequisite: Node 26+ (Docker form needs Docker/OrbStack only). Mock mode needs no tenant and no credentials.

```
npm install
npm run build
npm test
npm start            # serves http://127.0.0.1:7831/
npm run doctor       # preflight: port free, mode, netguard self-test, diagram coverage, lesson consistency
npm run reset        # reset the current workspace's recorded runs
```

Docker (OrbStack, published on `127.0.0.1` only):

```
docker compose up --build -d
```

Then open it through the family lab proxy: **https://local.ping-devops.com:8443/agent-identity-academy/**

## Modes (rule 19)

Mock is the only mode: this lab has **no live mode** — it contacts no tenant and no gateway in any mode, and the netguard refuses every non-loopback socket. The header's Mock/Real switch follows the family contract (`POST /api/mode`, `GET /api/info`): Real answers 409 with the honest reason and the toggle stays disabled unless the owner sets `AIA_MODE_REAL=1` — and even then Real only changes what the mode switch reports; the content is the same simulation, and the REAL modal the page opens on says so.

## Layout

```
server/   Express API: /api/health (demo-health/1), /api/story, /api/diagram, /api/info, /api/mode, /api/reset
server/src/story.js      the 13 lessons: all page text, frames, actors, products
server/diagrams/*.json   14 diagram-studio/1 documents, generated from the lesson data
scripts/build-diagrams.mjs   regenerates the diagrams from story.js (run after editing lessons)
web/      React + Vite SPA: lesson rail, stage rail, filmstrip, evidence drawer, claim diff, journey
```

## Development notes

- After editing lessons in `server/src/story.js`, run `node scripts/build-diagrams.mjs` so the diagrams stay in sync, then `npm run content-pack && npm run talk-track` for the generated artifacts (CI checks for drift).
- The vendored shared components (`TopMenu`, `standalone-ui.css`, `JsonPane`, `VerifyMark`, `diagram-kit`) are byte-pinned; never edit them in this repo — change the canonical copy in AI-DEMO-Standalone and re-vendor.
- `npm run doctor` must stay green: it checks port 7831, the netguard self-test, diagram coverage (every lesson's diagram exists, none unused), lesson consistency (every frame's stage is a real stage and is declared by its lesson), and that no non-reserved host or key-looking value appears in the story.
