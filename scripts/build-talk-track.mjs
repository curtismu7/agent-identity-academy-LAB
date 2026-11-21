// Writes docs/talk-track.md from the talk-track data (so the doc and the web talk-track view cannot drift).
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildStory } from '../server/src/story.js';

const story = buildStory();
const lines = [
  '# Talk track',
  '',
  '<!-- Generated from server/src/story.js by `npm run talk-track`. Do not edit by hand. -->',
  '',
  '## What this page is',
  '',
  story.intro,
  '',
  '## The beats',
  '',
  ...story.talkTrack.map((t, i) => `${i + 1}. **${t.title}.** ${t.say}`),
  '',
  '## What to leave with',
  '',
  '- Every lesson answers the same five questions: discover, register, authenticate, authorize, govern.',
  '- Delegation is not impersonation: sub stays the person, act names the agent, scope narrows.',
  '- The model cannot manufacture authority; policy and the gateway decide, and every decision leaves evidence.',
  '',
];
fs.writeFileSync(fileURLToPath(new URL('../docs/talk-track.md', import.meta.url)), `${lines.join('\n')}\n`);
console.log('wrote docs/talk-track.md');
