import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VERTICALS, DEFAULT_VERTICAL, DEFAULT_CAST, verticalFrom, loadCast, fill, unfilled } from '../src/cast.js';
import { buildStory, USER_TOKEN, AGENT_TOKEN, EXCHANGED_TOKEN } from '../src/story.js';
import { DIAGRAM_NAMES, buildDiagram, rawDiagram } from '../src/diagramData.js';

const ROOT = new URL('../../', import.meta.url);
const readRoot = (p) => fs.readFileSync(new URL(p, ROOT), 'utf8');

// Brands and words that belong to the other packs, the earlier airline names and the earlier banking story.
const RETIRED = /Fabrikam|Northwind|Contoso|Harbor|Vellum|Meridian|Skyline Air|Tessera|bank|accounts:|portfolio|investment/i;

const TOKENS = ['castBrand', 'castAgentId', 'castClientId', 'castHost'];

test('there are four packs and airlines is the default (AirGuard Airlines)', () => {
  assert.deepEqual(Object.keys(VERTICALS).sort(), ['airlines', 'finance', 'health', 'retail']);
  assert.equal(DEFAULT_VERTICAL, 'airlines');
  assert.equal(fill('{{castBrand}}', DEFAULT_CAST), 'AirGuard Airlines');
  assert.equal(DEFAULT_CAST.castHost, 'airguard');
});

test('every pack defines exactly the four tokens, and the airlines pack fills them with no undefined token', () => {
  for (const [id, pack] of Object.entries(VERTICALS)) assert.deepEqual(Object.keys(pack).sort(), [...TOKENS].sort(), id);
  const text = TOKENS.map((t) => `{{${t}}}`).join(' ');
  assert.deepEqual(unfilled(text, VERTICALS.airlines), []);
  assert.ok(!/\{\{/.test(fill(text, VERTICALS.airlines)));
});

test('an unknown vertical falls back to airlines; the older packs still render their own brand', () => {
  assert.equal(verticalFrom('no-such-vertical'), 'airlines');
  assert.equal(loadCast(null, 'no-such-vertical').castBrand, 'AirGuard Airlines');
  assert.equal(loadCast(null, 'finance').castBrand, 'Fabrikam Bank');
  assert.equal(loadCast(null, 'health').castBrand, 'Contoso Health');
  assert.equal(loadCast(null, 'retail').castBrand, 'Northwind Retail');
});

test('a saved customer config still overrides the brand on top of a pack', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'aia-cast-')), 'customer.config.json');
  fs.writeFileSync(f, JSON.stringify({ cast: { brand: 'Example Co', host: 'exampleco' } }));
  const c = loadCast(f, 'finance');
  assert.equal(c.castBrand, 'Example Co');
  assert.equal(c.castHost, 'exampleco');
  assert.equal(c.castAgentId, 'payments-agent');
});

test('the default story is the airline story: brand, agent id and sample claims', () => {
  const s = JSON.stringify(buildStory());
  assert.match(s, /AirGuard Airlines/);
  assert.ok(!/\{\{/.test(s), 'no unfilled token reaches the page');
  assert.equal(AGENT_TOKEN.sub, DEFAULT_CAST.castAgentId);
  assert.equal(AGENT_TOKEN.sub, 'passenger-chat-agent');
  assert.equal(USER_TOKEN.client_id, 'airguard-web');
  assert.equal(EXCHANGED_TOKEN.scope, 'itinerary:read');
});

test('no old-brand, retired-airline or banking wording anywhere in the airline run (story, diagrams, talk track, content pack)', () => {
  const story = JSON.stringify(buildStory());
  assert.doesNotMatch(story, RETIRED);
  for (const name of DIAGRAM_NAMES) {
    assert.doesNotMatch(JSON.stringify(rawDiagram(name)), RETIRED, `diagram ${name}`);
    assert.doesNotMatch(JSON.stringify(buildDiagram(DEFAULT_CAST, name)), RETIRED, `built diagram ${name}`);
  }
  assert.doesNotMatch(readRoot('docs/talk-track.md'), RETIRED, 'docs/talk-track.md');
  assert.doesNotMatch(readRoot('content-pack.json'), RETIRED, 'content-pack.json');
  assert.doesNotMatch(readRoot('README.md'), RETIRED, 'README.md');
});
