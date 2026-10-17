import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { findFailures } from './check-core-claim-boundaries.mjs';
const current = await readFile(new URL('../examples/generative-music/README.md', import.meta.url), 'utf8');
const disclaimer = current.split('\n')[6];
const cases = [
  ['exact current disclaimer', disclaimer, 0],
  ['affirmative delivery', 'We achieve 100% message delivery.', 1],
  ['affirmative errors', 'We achieve 0% errors.', 1],
  ['unrelated not', 'Not only fast: we achieve 100% message delivery and 0% errors.', 2],
  ['multiline disclaimer', disclaimer.replaceAll(' ', '\n'), 0],
  ['emphasized affirmative', 'We achieve **100% message delivery** and **0% errors**.', 2],
  ['multiline affirmative', '100%\nmessage delivery; 0%\nerrors.', 2],
  ['repeated matches', '100% message delivery. 100% delivery. 0% errors. 0% errors.', 4],
  ['affirmative after disclaimer', disclaimer + ' We achieve 100% message delivery.', 1],
  ['adversative inside disclaimer', disclaimer.replace('100% message delivery', '100% message delivery but we achieve 0% errors'), 3],
  ['unrecognized disclaimer fails closed', 'We do not claim 100% message delivery.', 1],
];
for (const [name, source, count] of cases) test(name, () => assert.equal(findFailures(source).length, count));
test('normalized offsets preserve source line numbers', () => {
  assert.deepEqual(findFailures('Heading\n**100% message delivery**\n0% errors').map(f => f.line), [2, 3]);
});
test('a negation of the disclaimer grants no exemption', () => {
  assert.equal(findFailures('It is false that The repository does not currently contain a preserved, reproducible artifact supporting earlier claims of 100% message delivery.').length, 1);
  assert.equal(findFailures('It is false that\nThe repository does not currently contain a preserved, reproducible artifact supporting earlier claims of 100% message delivery.').length, 1);
});
