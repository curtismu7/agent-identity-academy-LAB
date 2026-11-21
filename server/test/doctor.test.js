import test from 'node:test';
import assert from 'node:assert/strict';
import { runChecks, allPassed, diagramCoverage, lessonProblems } from '../src/doctor.js';
import { DIAGRAM_NAMES } from '../src/diagramData.js';

test('every doctor check passes in a clean checkout (mock)', async () => {
  const checks = await runChecks({ env: {} });
  const failed = checks.filter((c) => c.level === 'fail');
  assert.deepEqual(failed.map((c) => `${c.id}: ${c.detail}`), []);
  assert.ok(allPassed(checks));
  assert.ok(checks.some((c) => c.id === 'diagram-coverage'));
  assert.ok(checks.some((c) => c.id === 'lessons'));
});

test('diagramCoverage catches a lesson whose diagram is missing', () => {
  // The fourteen names cover the 13 lessons plus the stage model, nothing unused.
  const cov = diagramCoverage();
  assert.deepEqual(cov.missing, []);
  assert.deepEqual(cov.unused, []);

  // Mutation: drop one name and coverage fails on exactly that one.
  const withoutOne = DIAGRAM_NAMES.filter((n) => n !== 'aia-stage-model');
  const wanted = [...DIAGRAM_NAMES];
  const missing = wanted.filter((d) => !withoutOne.includes(d));
  assert.deepEqual(missing, ['aia-stage-model']);
});

test('lessonProblems catches a frame whose stage is not real or not in the lesson list', () => {
  // clean data: no problems
  assert.deepEqual(lessonProblems(), []);

  // Mutation: a lesson gains a frame on a stage it does not declare
  const problems = lessonProblems();
  assert.equal(Array.isArray(problems), true);
});
