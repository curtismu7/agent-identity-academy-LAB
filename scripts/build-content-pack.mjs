// Builds content-pack.json for the Learning Hub from the story data, so the pack cannot drift from the lab.
//   node scripts/build-content-pack.mjs        (writes content-pack.json)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStory, LESSONS, STAGES } from '../server/src/story.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const sid = (n) => `S${String(n).padStart(2, '0')}`;

export function buildPack() {
  const story = buildStory();
  const terms = {
    'landscape': ['agent-landscape', 'agent-classification'],
    'login': ['oidc-pkce', 'bff-token-custody'],
    'delegation': ['token-exchange', 'sub-act'],
    'personal-agent': ['personal-agent', 'cimd'],
    'digital-assistant': ['task-mandate', 'ciba'],
    'mcp': ['mcp-discovery'],
    'authorize': ['policy-decision'],
    'human-approval': ['human-approval'],
    'a2a': ['a2a-delegation'],
    'privilege-mcp': ['privilege-door'],
    'threat-defense': ['threat-defense'],
    'lifecycle': ['agent-lifecycle'],
    'evidence-map': ['evidence-timeline'],
  };
  return {
    schema: 'demo-content-pack/1',
    id: 'agent-identity-academy',
    title: 'Agent Identity Academy',
    version,
    demo: { id: 'agent-identity-academy', name: 'Agent Identity Academy', catalog: 'D142', baseUrl: 'http://localhost:7831', doctor: '/api/health', tags: ['agent-identity', 'ai-agent-security', 'learning', 'mock-only'] },
    glossary: [
      { id: 'lifecycle', term: 'Agent identity lifecycle', definition: STAGES.map((s) => `${s.label}: ${s.question}`).join(' '), aliases: ['five stages', 'stage model'] },
      { id: 'sub-act', term: 'sub and act', definition: 'sub names the person on whose behalf a call is made; act names the agent that acts. Delegation keeps both visible: the customer remains the subject while the agent is the actor, and neither impersonates the other.', aliases: ['actor chain', 'delegation claims'] },
      { id: 'token-exchange', term: 'Token exchange (RFC 8693)', definition: 'The OAuth grant that mints a narrower delegated token: audience rebinds to the target resource, scope narrows to what the hop needs, lifetime shortens, and act records the acting agent.', aliases: ['RFC 8693', 'delegated token'] },
      { id: 'personal-agent', term: 'Personal Agent', definition: 'An external agent the customer owns and the enterprise does not control (a consumer AI assistant). The enterprise controls identification, connection, consent and per-tool reach — never the reasoning runtime.', aliases: ['consumer agent'] },
      { id: 'task-mandate', term: 'Task mandate', definition: 'The bounded task an enterprise agent is given: what it may do, what ceiling it must respect, and where it must stop and ask. Enterprise control does not mean unlimited authority.', aliases: ['mandate'] },
      { id: 'human-approval', term: 'Human approval (HITL)', definition: 'A high-impact action pauses; approval arrives through a channel the agent does not own (CIBA or MFA); the receipt is bound to the exact intent and consumed once, so a replay is refused.', aliases: ['HITL', 'CIBA'] },
      { id: 'evidence-timeline', term: 'Evidence timeline', definition: 'The correlated audit story: who acted (sub + act), under whose authority (token + policy decision), what ran (protocol, tool), and what can be proved at each lifecycle stage.', aliases: ['audit evidence'] },
      { id: 'privilege-door', term: 'Privilege door', definition: 'The PingOne Privilege brokered entry to a protected MCP tool: a time-bound session is opened, the protected call runs inside it, and the underlying credential never reaches the agent or the browser.', aliases: ['privileged session'] },
      { id: 'threat-defense', term: 'Threat defense boundaries', definition: 'Prompt injection, replay, scope escalation and audience mismatch each stop at a different observable boundary. The model\u2019s mistake cannot manufacture authority.', aliases: ['attack boundaries'] },
      { id: 'agent-lifecycle', term: 'Lifecycle and revocation', definition: 'A detected agent moves from unknown to known (register with an owner) to stopped (revoke). The proof of governance is the next call failing closed.', aliases: ['revocation'] },
      { id: 'policy-decision', term: 'Policy decision', definition: 'PingOne Authorize evaluates the action independently of the agent: PERMIT or DENY with a reason and obligations, enforced by the gateway before the tool runs. The agent cannot argue with it.', aliases: ['permit deny'] },
      { id: 'a2a-delegation', term: 'A2A delegation', definition: 'Agent2Agent task handoff: the primary agent discovers the specialist\u2019s Agent Card and exchanges authority for it. The act chain nests (specialist acts for planner acts for customer) and every hop narrows scope.', aliases: ['agent2agent', 'agent card'] },
      { id: 'ciba', term: 'CIBA', definition: 'Client Initiated Backchannel Authentication: the agent\u2019s high-impact request triggers a push to the customer\u2019s registered channel; approval comes back out-of-band and is bound to the exact intent.', aliases: ['backchannel auth'] },
      { id: 'mcp-discovery', term: 'MCP discovery', definition: 'MCP initialize and tools/list tell an agent what a tool is and what schema it accepts. That is discovery evidence; the gateway and policy decision on tools/call is the execution authority.', aliases: ['tools list'] },
      { id: 'oidc-pkce', term: 'OIDC with PKCE', definition: 'The human sign-in flow: authorization-code with a code challenge, the exchange done server-side in the BFF, tokens never handed to browser JavaScript.', aliases: ['sign-in flow'] },
      { id: 'bff-token-custody', term: 'BFF token custody', definition: 'The backend-for-frontend holds the user\u2019s tokens in the server-side session; the browser holds only an HttpOnly cookie and every downstream hop spends tokens from custody.', aliases: ['token custody'] },
      { id: 'agent-landscape', term: 'Agent landscape', definition: 'Classify before trusting: who owns the agent, where it runs, whose authority it carries. Consumer, enterprise, employee and third-party each get a different control pattern.', aliases: ['classification'] },
      { id: 'agent-classification', term: 'Agent classification', definition: 'The first evidence step: runtime and owner separate a Personal Agent from an Enterprise Agent from an employee agent from a third-party embedded agent.', aliases: ['agent taxonomy'] },
      { id: 'cimd', term: 'CIMD', definition: 'Client-ID Metadata Discovery: a client identifies itself by publishing metadata at a URL. Demonstrated here as a mock; PingOne does not support CIMD, so DCR or managed registration supplies the metadata.', aliases: ['client metadata'] },
    ],
    sources: [
      { id: 'academy-proto', title: 'Agent Identity Academy lesson prototype (AI-DEMO2 static Academy, rewritten customer-neutral)', url: 'https://academy-source.invalid/agent-identity', kind: 'product-doc', use: 'The 13 lessons, their actors, frames and evidence shapes.', status: 'read', checked: '2026-11-20' },
    ],
    cards: [
      { id: 'concept-lifecycle', label: 'Start: the five lifecycle questions', description: STAGES.map((s) => s.question).join(' '), group: 'concept', action: { type: 'route', href: '/#lessons' }, terms: ['lifecycle'] },
      ...LESSONS.map((l, i) => ({
        id: `lesson-${l.id}`,
        label: `${String(i + 1).padStart(2, '0')}. ${l.nav} — ${l.taxonomy}`,
        description: l.outcome,
        group: 'concept',
        action: { type: 'route', href: `/#lessons` },
        terms: terms[l.id] || [],
        story: sid(i + 1),
      })),
      { id: 'ref-doctor', label: 'Doctor and health', description: 'Preflight checks and the demo-health/1 endpoint.', group: 'setup', action: { type: 'route', href: '/api/health' } },
    ],
    stories: LESSONS.map((l, i) => ({ id: sid(i + 1), title: l.nav, say: l.presenter })),
    documents: [
      { id: 'talk-track', path: 'docs/talk-track.md', title: 'Talk track (generated from the story data)' },
    ],
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(ROOT, 'content-pack.json'), `${JSON.stringify(buildPack(), null, 2)}\n`);
}
