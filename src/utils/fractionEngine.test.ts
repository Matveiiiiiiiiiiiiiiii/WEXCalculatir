import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gcd,
  lcm,
  simplifyFraction,
  toImproper,
  toMixed,
  decimalToFraction,
  formatFractionText,
  calculateFractionsWithSteps,
  evaluateFractionStringWithSteps,
} from './fractionEngine.ts';

test('gcd and lcm calculate correctly', () => {
  assert.equal(gcd(12, 18), 6);
  assert.equal(gcd(17, 13), 1);
  assert.equal(lcm(4, 6), 12);
  assert.equal(lcm(3, 5), 15);
});

test('fraction reduction simplifies correctly', () => {
  assert.deepEqual(simplifyFraction(4, 8), { n: 1, d: 2 });
  assert.deepEqual(simplifyFraction(15, 25), { n: 3, d: 5 });
  assert.deepEqual(simplifyFraction(-6, 9), { n: -2, d: 3 });
});

test('conversion to improper and mixed fractions', () => {
  assert.deepEqual(toImproper(2, 3, 4), { n: 11, d: 4 });
  const mixed = toMixed(11, 4);
  assert.equal(mixed.whole, 2);
  assert.equal(mixed.n, 3);
  assert.equal(mixed.d, 4);
});

test('decimal to fraction converts accurately', () => {
  const f1 = decimalToFraction(0.75);
  assert.equal(f1.n, 3);
  assert.equal(f1.d, 4);

  const f2 = decimalToFraction(0.125);
  assert.equal(f2.n, 1);
  assert.equal(f2.d, 8);
});

test('fraction addition with step-by-step resolution', () => {
  // 1/4 + 1/6 = 3/12 + 2/12 = 5/12
  const res = calculateFractionsWithSteps({ n: 1, d: 4 }, '+', { n: 1, d: 6 });
  assert.equal(res.result.n, 5);
  assert.equal(res.result.d, 12);
  assert.ok(res.steps.length >= 2);
  assert.ok(res.steps.some((s) => s.description.includes('НОЗ')));
});

test('mixed fraction multiplication with steps', () => {
  // 1 1/2 × 2 2/3 = 3/2 × 8/3 = 24/6 = 4
  const res = calculateFractionsWithSteps(
    { whole: 1, n: 1, d: 2 },
    '×',
    { whole: 2, n: 2, d: 3 }
  );
  assert.equal(res.result.n, 4);
  assert.equal(res.result.d, 1);
  assert.equal(res.mixedResult, '4');
});

test('fraction division by zero reports error', () => {
  const res = calculateFractionsWithSteps({ n: 3, d: 4 }, '÷', { n: 0, d: 5 });
  assert.ok(res.error);
});

test('evaluateFractionStringWithSteps evaluates string expressions and unicode correctly', () => {
  // Test "1 3/4 + 2 1/6"
  const r1 = evaluateFractionStringWithSteps('1 3/4 + 2 1/6');
  assert.ok(r1.resultText.includes('3 11/12'));
  assert.ok(r1.steps.length >= 3);

  // Test Unicode symbols "1 ¾ + 2 ⅙"
  const r2 = evaluateFractionStringWithSteps('1 ¾ + 2 ⅙');
  assert.ok(r2.resultText.includes('3 11/12'));

  // Test single fraction simplification "15/25"
  const r3 = evaluateFractionStringWithSteps('15/25');
  assert.ok(r3.resultText.includes('3/5'));
});

