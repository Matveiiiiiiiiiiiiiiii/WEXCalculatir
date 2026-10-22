import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatResultNumber,
  evaluateExpressionWithSteps,
  factorial,
  formatProgrammerBases,
  getMaskForWordSize
} from './calculatorEngine.ts';

test('formatResultNumber removes IEEE float rounding errors', () => {
  assert.equal(formatResultNumber(0.1 + 0.2), '0.3');
  assert.equal(formatResultNumber(1000000), '1 000 000');
  assert.equal(formatResultNumber(12345.678), '12 345.678');
  assert.equal(formatResultNumber(0), '0');
});

test('factorial calculates correctly', () => {
  assert.equal(factorial(0), 1);
  assert.equal(factorial(1), 1);
  assert.equal(factorial(5), 120);
  assert.equal(factorial(6), 720);
});

test('evaluates simple arithmetic with steps', () => {
  const result = evaluateExpressionWithSteps('25 + 75');
  assert.equal(result.result, 100);
  assert.equal(result.formattedResult, '100');
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].subResult, '100');
});

test('evaluates operator precedence (multiplication before addition)', () => {
  const result = evaluateExpressionWithSteps('10 + 5 × 4');
  assert.equal(result.result, 30);
  assert.ok(result.steps.length >= 2);
  assert.equal(result.steps[0].description, 'Умножение 5 × 4');
  assert.equal(result.steps[0].subResult, '20');
  assert.equal(result.steps[1].description, 'Сложение 10 + 20');
  assert.equal(result.steps[1].subResult, '30');
});

test('evaluates parentheses correctly with step logs', () => {
  const result = evaluateExpressionWithSteps('(10 + 5) × 4');
  assert.equal(result.result, 60);
  assert.ok(result.steps.length >= 2);
  const parenStep = result.steps.find((s) => s.subExpression.includes('10 + 5') || s.description.includes('скобок'));
  assert.ok(parenStep, 'Parentheses resolution step should exist');
});

test('handles complex multi-operator expressions with detailed steps', () => {
  const result = evaluateExpressionWithSteps('(50 + 50) ÷ 2 - 10 × 3');
  // (100) / 2 - 30 = 50 - 30 = 20
  assert.equal(result.result, 20);
  assert.ok(result.steps.length >= 4, 'Should record all steps in execution chain');
});

test('handles division by zero gracefully without throwing', () => {
  const result = evaluateExpressionWithSteps('15 ÷ 0');
  assert.ok(Number.isNaN(result.result) || !Number.isFinite(result.result));
  assert.ok(result.error?.includes('ноль'));
});

test('evaluates square root and powers with steps', () => {
  const result = evaluateExpressionWithSteps('sqrt(144) + 2 ^ 3');
  assert.equal(result.result, 20);
  assert.ok(result.steps.some((s) => s.description.includes('корень')));
  assert.ok(result.steps.some((s) => s.description.includes('степень')));
});

test('programmer mode base formatting and bit masks work', () => {
  const bases = formatProgrammerBases(255n, 'BYTE');
  assert.equal(bases.hex, 'FF');
  assert.equal(bases.dec, '255');
  assert.equal(bases.bin, '1111 1111');

  const mask16 = getMaskForWordSize('WORD');
  assert.equal(mask16, 0xffffn);
});
