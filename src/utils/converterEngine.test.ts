import test from 'node:test';
import assert from 'node:assert/strict';
import { convertUnitsWithSteps, calculateLoan } from './converterEngine.ts';

test('converts length units accurately with steps', () => {
  // 5 km -> meters = 5000 m
  const res = convertUnitsWithSteps('length', 'km', 'm', 5);
  assert.equal(res.result, 5000);
  assert.ok(res.steps.length >= 2);
});

test('converts temperatures (Celsius to Fahrenheit and Kelvin)', () => {
  // 100 C -> 212 F
  const fRes = convertUnitsWithSteps('temperature', 'C', 'F', 100);
  assert.equal(Math.round(fRes.result), 212);

  // 0 C -> 273.15 K
  const kRes = convertUnitsWithSteps('temperature', 'C', 'K', 0);
  assert.equal(kRes.result, 273.15);
});

test('calculates loan annuity and steps', () => {
  // 1 000 000 at 12% for 12 months
  const loan = calculateLoan(1000000, 12, 12);
  assert.ok(loan.monthlyPayment > 88000 && loan.monthlyPayment < 90000);
  assert.ok(loan.totalInterest > 50000 && loan.totalInterest < 70000);
  assert.equal(loan.steps.length, 4);
});
