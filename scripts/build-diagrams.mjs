// Generates the diagram-studio/1 documents in server/diagrams/ from the lesson data in
// server/src/story.js, so every lesson's diagram is derived from the same data the page shows
// and can never drift from it. Run: node scripts/build-diagrams.mjs
//   - One diagram per lesson: the actors become boxes in trust order, the frames become the
//     steps that walk the chain (frame k hops actor k → actor k+1, wrapping).
//   - aia-stage-model: the five lifecycle stages as one chain.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LESSONS, STAGES } from '../server/src/story.js';
import { validateDiagram } from '../server/src/diagramStudioValidate.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'server/diagrams');

const COLORS = ['blue', 'green', 'amber', 'red', 'dark'];

function lessonDiagram(lesson) {
  const actors = lesson.actors;
  const nodes = actors.map(([role, name, does], i) => ({
    id: `a${i + 1}`,
    label: name,
    group: `g${i + 1}`,
    x: 80 + i * 250,
    y: 240,
    sub: [role, does].filter(Boolean).slice(0, 2),
  }));
  const groups = Object.fromEntries(actors.map(([, name], i) => [`g${i + 1}`, { label: name, color: COLORS[i % COLORS.length] }]));
  const edges = [];
  const steps = [];
  lesson.frames.forEach((frame, k) => {
    const from = `a${(k % actors.length) + 1}`;
    const to = `a${((k + 1) % actors.length) + 1}`;
    edges.push({ source: from, target: to, label: frame[1].slice(0, 160) });
    steps.push({ title: `${k + 1}. ${frame[1]}`.slice(0, 120), what: `${frame[2]} (${frame[0]})`.slice(0, 600), edges: [k] });
  });
  return {
    schema: 'diagram-studio/1',
    id: lesson.diagram,
    title: lesson.title.slice(0, 120),
    lede: lesson.description.slice(0, 600),
    groups,
    nodes,
    edges,
    steps,
  };
}

const stageModel = {
  schema: 'diagram-studio/1',
  id: 'aia-stage-model',
  title: 'The agent identity lifecycle',
  lede: 'Every lesson walks the same five questions: where is the agent, who owns it, is it genuine, what can it do, and can we prove and stop it. Each lesson activates only the stages it touches.',
  groups: {
    agent: { label: 'The agent', color: 'dark' },
    lifecycle: { label: 'The five stages', color: 'blue' },
    outcome: { label: 'The outcome', color: 'green' },
  },
  nodes: [
    { id: 'agent', label: 'The agent', group: 'agent', x: 80, y: 240, sub: ['unknown until observed'] },
    ...STAGES.map((s, i) => ({ id: `s${i + 1}`, label: s.label, group: 'lifecycle', x: 320 + i * 210, y: 240, sub: [s.question] })),
    { id: 'evidence', label: 'Evidence timeline', group: 'outcome', x: 1450, y: 240, sub: ['who acted, under whose authority', 'what was allowed, what happened'] },
  ],
  edges: [
    { source: 'agent', target: 's1', label: 'first observation' },
    ...STAGES.slice(1).map((s, i) => ({ source: `s${i + 1}`, target: `s${i + 2}`, label: `${STAGES[i].label} → ${s.label}` })),
    { source: 's5', target: 'evidence', label: 'proof' },
  ],
  steps: [
    { title: 'Discover', what: 'Where are the agents? Traffic, signals and classification produce the first evidence.', edges: [0] },
    { title: 'Register', what: 'Who owns each identity? A known agent gains an owner and a bounded relationship.', edges: [1] },
    { title: 'Authenticate', what: 'Is the identity genuine? Person and agent identities are proven and preserved.', edges: [2] },
    { title: 'Authorize', what: 'What can it do? Policy, consent, scope, audience and Privilege bound the action.', edges: [3] },
    { title: 'Govern', what: 'Can we prove and stop it? Audit, lifecycle and revocation close the loop.', edges: [4, 5] },
  ],
};

fs.mkdirSync(DIR, { recursive: true });
const wanted = [...LESSONS.map((l) => l.diagram), 'aia-stage-model'];
const docs = [...LESSONS.map(lessonDiagram), stageModel];
const problems = [];
docs.forEach((d, i) => {
  const errs = validateDiagram(d);
  if (errs.length) problems.push(`${d.id}: ${errs.join('; ')}`);
  fs.writeFileSync(path.join(DIR, `${wanted[i]}.json`), `${JSON.stringify(d, null, 2)}\n`);
});
// remove stale diagrams the lessons no longer name
for (const f of fs.readdirSync(DIR)) {
  const name = f.replace(/\.json$/, '');
  if (name !== 'aia-stage-model' && !LESSONS.some((l) => l.diagram === name)) {
    fs.unlinkSync(path.join(DIR, f));
    console.log(`removed stale diagram ${f}`);
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`wrote ${docs.length} diagrams: ${wanted.join(', ')}`);
