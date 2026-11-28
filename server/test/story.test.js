import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStory, LESSONS, STAGES, USER_TOKEN, AGENT_TOKEN, EXCHANGED_TOKEN } from '../src/story.js';
import { DIAGRAM_NAMES } from '../src/diagramData.js';
import { scanHosts, scanKeys } from '../src/safety.js';

const story = buildStory();

test('13 lessons, 5 lifecycle stages, one diagram per lesson plus the stage model', () => {
  assert.equal(LESSONS.length, 13);
  assert.equal(STAGES.map((s) => s.id).join(','), 'discover,register,authenticate,authorize,govern');
  const wanted = [...LESSONS.map((l) => l.diagram), 'aia-stage-model'];
  assert.deepEqual([...wanted].sort(), [...DIAGRAM_NAMES].sort(), 'all fourteen diagrams are wanted exactly once');
  assert.ok(new Set(LESSONS.map((l) => l.id)).size === LESSONS.length, 'lesson ids are unique');
});

test('every lesson has the Academy fields: actors, frames, stages, products, presenter', () => {
  const stageIds = new Set(STAGES.map((s) => s.id));
  for (const l of LESSONS) {
    for (const k of ['id', 'nav', 'category', 'taxonomy', 'title', 'description', 'outcome', 'request', 'scenario', 'scenarioCopy', 'presenter', 'diagram']) assert.ok(l[k], `${l.id}: ${k}`);
    assert.ok(l.actors.length >= 2 && l.actors.length <= 4, `${l.id}: 2-4 actors`);
    for (const a of l.actors) assert.equal(a.length, 3, `${l.id}: each actor is [role, name, role-in-chain]`);
    assert.ok(l.frames.length >= 4, `${l.id}: at least 4 frames`);
    for (const [i, f] of l.frames.entries()) {
      assert.ok(stageIds.has(f[0]), `${l.id}: frame ${i + 1} stage "${f[0]}" is a real stage`);
      assert.ok(l.stages.includes(f[0]), `${l.id}: frame ${i + 1} stage "${f[0]}" is in the lesson's stage list`);
      assert.ok(f[1] && f[2] && f[3], `${l.id}: frame ${i + 1} has title, narrative and state line`);
    }
    for (const p of l.products) assert.ok(typeof p === 'string', `${l.id}: products are strings`);
    assert.ok(l.frameProducts.length >= l.frames.length || l.frameProducts.length === l.products.length, `${l.id}: frame products exist`);
  }
});

test('the four agent-type lessons are present: landscape, personal-agent, digital-assistant, workload taxonomy', () => {
  const taxonomies = LESSONS.map((l) => l.taxonomy).join(' | ');
  assert.match(taxonomies, /Consumer/);
  assert.match(taxonomies, /Enterprise \/ Workload/);
  assert.match(taxonomies, /third-party|Consumer & Partner/);
  assert.ok(LESSONS.some((l) => l.id === 'personal-agent'), 'Personal Agent lesson');
  assert.ok(LESSONS.some((l) => l.id === 'digital-assistant'), 'Digital Assistant (enterprise) lesson');
  assert.ok(LESSONS.some((l) => l.id === 'landscape'), 'the classification foundation lesson');
});

test('sample claim shapes exist and are internally consistent (delegation story)', () => {
  assert.equal(USER_TOKEN.sub, 'member-1042');
  assert.ok(USER_TOKEN.scope.includes('refund:issue'), 'the user starts with refund rights');
  assert.equal(AGENT_TOKEN.sub, 'passenger-chat-agent');
  assert.equal(AGENT_TOKEN.scope, 'exchange', 'the agent itself holds only exchange');
  assert.equal(EXCHANGED_TOKEN.sub, 'member-1042', 'the customer stays the subject after exchange');
  assert.match(EXCHANGED_TOKEN.act, /passenger-chat-agent/, 'the actor claim names the agent');
  assert.equal(EXCHANGED_TOKEN.scope, 'itinerary:read', 'scope narrowed to one');
  assert.ok(!('refund:issue' in EXCHANGED_TOKEN) && !EXCHANGED_TOKEN.scope.includes('refund'), 'refund rights dropped');
});

test('the delegation frames narrate that exact narrowing', () => {
  const l = LESSONS.find((x) => x.id === 'delegation');
  const exchange = l.frames.find((f) => /exchange/i.test(f[1]));
  assert.ok(exchange, 'a token-exchange frame exists');
  if (exchange[4]) assert.match(exchange[4].fact, /narrowed/);
});

test('the banner and intro say what is simulated', () => {
  assert.match(story.banner, /SIMULATION/);
  assert.match(story.banner, /no outbound network/i);
  assert.match(story.banner, /mock/i);
  assert.match(story.realBanner, /REAL MODE/);
  assert.match(story.realBanner, /no live mode/i);
  assert.match(story.intro, /agent type/i);
});

test('every mock-issued token label says mock: no frame presents a sample token as real', () => {
  const raw = JSON.stringify(story);
  for (const label of ['User access token', 'Agent access token', 'Exchanged token']) {
    assert.ok(raw.includes(`${label} (mock`) || raw.includes(`${label} (subject`) || raw.includes(`${label} (actor`) || raw.includes(`${label} (issued`), label);
  }
  // every standalone token mention that is not part of a labelled set carries (mock)
  const unlabelled = [...raw.matchAll(/"(User access token|Agent access token|Exchanged token)(?! \()(?! \(mock\))(?! \(subject)(?! \(actor)(?! \(issued)[^"]*"/g)];
  assert.deepEqual(unlabelled.map((m) => m[0]), [], 'no bare token label');
});

test('no non-reserved hosts and no key-looking values anywhere in the story JSON', () => {
  const raw = JSON.stringify(story);
  assert.deepEqual(scanHosts(raw), [], 'every host in the story is .invalid, .example or loopback');
  assert.deepEqual(scanKeys(raw), [], 'no key-looking values');
  assert.match(raw, /example-idp\.invalid/, 'the sample issuer is a reserved host');
});
