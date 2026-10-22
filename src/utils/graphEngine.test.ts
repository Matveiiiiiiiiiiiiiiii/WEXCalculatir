import { test } from 'node:test';
import assert from 'node:assert';
import {
  compileFunction,
  computeDerivative,
  findRoots,
  findExtrema,
  computeDefiniteIntegral,
  generateTableOfValues,
} from './graphEngine.ts';

test('compileFunction evaluates basic linear and polynomial functions', () => {
  const f1 = compileFunction('2x + 1');
  assert.strictEqual(f1.isValid, true);
  assert.strictEqual(f1.evaluate(0), 1);
  assert.strictEqual(f1.evaluate(3), 7);
  assert.strictEqual(f1.evaluate(-2), -3);

  const f2 = compileFunction('x^2 - 4');
  assert.strictEqual(f2.isValid, true);
  assert.strictEqual(f2.evaluate(2), 0);
  assert.strictEqual(f2.evaluate(0), -4);
  assert.strictEqual(f2.evaluate(-3), 5);
});

test('compileFunction evaluates trigonometric and transcendental functions', () => {
  const fSin = compileFunction('sin(x)');
  assert.strictEqual(fSin.isValid, true);
  assert.ok(Math.abs(fSin.evaluate(0)) < 1e-6);
  assert.ok(Math.abs(fSin.evaluate(Math.PI / 2) - 1) < 1e-6);

  const fExp = compileFunction('e^x');
  assert.strictEqual(fExp.isValid, true);
  assert.ok(Math.abs(fExp.evaluate(0) - 1) < 1e-6);
  assert.ok(Math.abs(fExp.evaluate(1) - Math.E) < 1e-6);

  const fAbs = compileFunction('|x - 3|');
  assert.strictEqual(fAbs.isValid, true);
  assert.strictEqual(fAbs.evaluate(3), 0);
  assert.strictEqual(fAbs.evaluate(1), 2);
  assert.strictEqual(fAbs.evaluate(5), 2);
});

test('computeDerivative computes accurate numerical derivative', () => {
  // f(x) = x^2, f'(x) = 2x
  const f = compileFunction('x^2').evaluate;
  const dAt3 = computeDerivative(f, 3);
  assert.ok(Math.abs(dAt3 - 6) < 1e-4);

  // f(x) = sin(x), f'(x) = cos(x)
  const fSin = compileFunction('sin(x)').evaluate;
  const dAt0 = computeDerivative(fSin, 0);
  assert.ok(Math.abs(dAt0 - 1) < 1e-4);
});

test('findRoots finds roots of parabola', () => {
  // f(x) = x^2 - 4 -> roots at -2 and 2
  const f = compileFunction('x^2 - 4').evaluate;
  const roots = findRoots(f, -5, 5);
  assert.ok(roots.some((r) => Math.abs(r - -2) < 0.05));
  assert.ok(roots.some((r) => Math.abs(r - 2) < 0.05));
});

test('findExtrema finds minimum of parabola', () => {
  // f(x) = x^2 - 4 -> min at (0, -4)
  const f = compileFunction('x^2 - 4').evaluate;
  const extrema = findExtrema(f, -3, 3);
  assert.ok(extrema.length >= 1);
  const min = extrema.find((e) => e.type === 'min');
  assert.ok(min);
  assert.ok(Math.abs(min.x - 0) < 0.1);
  assert.ok(Math.abs(min.y - -4) < 0.1);
});

test('computeDefiniteIntegral calculates area accurately', () => {
  // \int_0^2 x^2 dx = [x^3/3]_0^2 = 8/3 ≈ 2.6667
  const f = compileFunction('x^2').evaluate;
  const integral = computeDefiniteIntegral(f, 0, 2);
  assert.ok(Math.abs(integral.value - 8 / 3) < 0.01);
});

test('generateTableOfValues generates correct sample grid', () => {
  const f = compileFunction('2x').evaluate;
  const table = generateTableOfValues(f, -2, 2, 1);
  assert.strictEqual(table.length, 5);
  assert.strictEqual(table[0].x, -2);
  assert.strictEqual(table[0].y, -4);
  assert.strictEqual(table[4].x, 2);
  assert.strictEqual(table[4].y, 4);
});

test('compileFunction handles leading assignments, negative powers, and Russian aliases', () => {
  const fNeg = compileFunction('-x^2 + 4');
  assert.strictEqual(fNeg.isValid, true);
  assert.strictEqual(fNeg.evaluate(2), 0);
  assert.strictEqual(fNeg.evaluate(0), 4);

  const fAssign = compileFunction('y = 3x - 1');
  assert.strictEqual(fAssign.isValid, true);
  assert.strictEqual(fAssign.evaluate(2), 5);

  const fFuncAssign = compileFunction('f(x) = x^2');
  assert.strictEqual(fFuncAssign.isValid, true);
  assert.strictEqual(fFuncAssign.evaluate(3), 9);

  const fImplicit = compileFunction('x sin(x)');
  assert.strictEqual(fImplicit.isValid, true);

  const fRussian = compileFunction('tg(x)');
  assert.strictEqual(fRussian.isValid, true);
  assert.ok(Math.abs(fRussian.evaluate(Math.PI / 4) - 1) < 1e-4);

  const fSci = compileFunction('1e-5 * x');
  assert.strictEqual(fSci.isValid, true);
  assert.ok(Math.abs(fSci.evaluate(2) - 0.00002) < 1e-8);
});

