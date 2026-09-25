import test from 'node:test';
import assert from 'node:assert/strict';
import { findUnsupportedClaims } from './check-core-claim-boundaries.mjs';

const denial = 'The repository does **not** currently contain a preserved, reproducible artifact supporting earlier claims of 2 ms P95 latency, 100% message delivery, 0% errors, a particular participant count, or live-performance validation.';
const cases = [
  ['existing explicit denial', denial, []],
  ['plain text denial', denial.replaceAll('**', ''), []],
  ['denial after preceding sentence', `Inspectable source exists. ${denial}`, []],
  ['ordinary positive delivery', 'We achieve 100% message delivery.', ['perfect-delivery']],
  ['ordinary positive errors', 'We achieve 0% errors.', ['zero-errors']],
  ['negation removed', denial.replace('**not** ', ''), ['two-ms-result', 'perfect-delivery', 'zero-errors']],
  ['affirmative same pattern after denied occurrence', `${denial} We achieve 100% message delivery.`, ['perfect-delivery']],
  ['affirmative errors after denied occurrence', `${denial} We achieve 0% errors.`, ['zero-errors']],
  ['affirmative before denial on same line', `We achieve 100% message delivery. ${denial}`, ['perfect-delivery']],
  ['same sentence appended affirmative clause', denial.replace('0% errors,', '0% errors, and we achieve 100% message delivery,'), ['two-ms-result', 'perfect-delivery', 'perfect-delivery', 'zero-errors']],
  ['semicolon appended affirmative clause', denial.replace('0% errors,', '0% errors; we achieve 100% message delivery,'), ['two-ms-result', 'perfect-delivery', 'perfect-delivery', 'zero-errors']],
  ['unrelated negative phrase', 'We do not measure audio. We achieve 100% message delivery.', ['perfect-delivery']],
  ['negation in quoted statement is not sentence denial', `We deny that "${denial}" We achieve 100% message delivery.`, ['two-ms-result', 'perfect-delivery', 'perfect-delivery', 'zero-errors']],
  ['different new line remains affirmative', `${denial}\nWe achieve 100% message delivery.`, ['perfect-delivery']],
  ['unknown list suffix fails closed', denial.replace('live-performance validation', 'zero-error operation and we achieve 100% message delivery'), ['two-ms-result', 'perfect-delivery', 'perfect-delivery', 'zero-errors']],
  ['repeated unsupported occurrences are all returned', '100% delivery and 100% message delivery.', ['perfect-delivery', 'perfect-delivery']],
  ['other prohibited rule unaffected', `${denial}\n\nValidated: P95 latency <5ms`, ['validated-p95', 'five-ms-result']],
];
for (const [name, source, expected] of cases) {
  test(name, () => assert.deepEqual(findUnsupportedClaims(source).map(({id}) => id), expected));
}
test('line numbers remain source-relative', () => {
  const [finding] = findUnsupportedClaims(`${denial}\n\nWe achieve 0% errors.`);
  assert.equal(finding.line, 3);
});

test('reverse-order latency is still prohibited', () => {
  assert.deepEqual(findUnsupportedClaims('We achieve 2 ms P95 latency.').map(x => x.id), ['two-ms-result']);
});
for (const separator of [' ', '\n']) {
  test(`quoted denial cannot be mistaken for authored disclaimer (${JSON.stringify(separator)})`, () => {
    const quoted = `We reject this statement as false: "Here is the statement.${separator}${denial}"`;
    assert.deepEqual(findUnsupportedClaims(quoted).map(x => x.id), ['two-ms-result', 'perfect-delivery', 'zero-errors']);
  });
}
test('denial does not shelter later reverse-order latency', () => {
  assert.deepEqual(findUnsupportedClaims(`${denial} We achieve 2 ms P95 latency.`).map(x => x.id), ['two-ms-result']);
});

for (const [name, text] of [
  ['quotation across blank paragraphs', `We reject this statement as false:\n"\n\n${denial}\n\n"`],
  ['fenced code across blank paragraphs', '```text\n\n' + denial + '\n\n```'],
  ['curly quotation', `We refute “A statement. ${denial}”`],
  ['initial unclosed quotation', `"A statement. ${denial}`],
]) {
  test(name, () => assert.deepEqual(findUnsupportedClaims(text).map(x => x.id), ['two-ms-result', 'perfect-delivery', 'zero-errors']));
}
