import { CalculationStep } from '../types/calculator';

export interface Fraction {
  whole?: number; // integer part for mixed fraction
  n: number;     // numerator (числитель)
  d: number;     // denominator (знаменатель, > 0)
}

/**
 * Greatest common divisor using Euclidean algorithm
 */
export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Least common multiple
 */
export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs((a * b) / gcd(a, b));
}

/**
 * Simplifies a fraction to lowest terms
 */
export function simplifyFraction(n: number, d: number): { n: number; d: number } {
  if (d === 0) return { n: NaN, d: 0 };
  if (n === 0) return { n: 0, d: 1 };

  const sign = (n < 0 ? -1 : 1) * (d < 0 ? -1 : 1);
  const absN = Math.abs(Math.round(n));
  const absD = Math.abs(Math.round(d));
  const common = gcd(absN, absD);

  return {
    n: sign * (absN / common),
    d: absD / common,
  };
}

/**
 * Converts a mixed fraction to improper: e.g., 2 3/4 -> 11/4
 */
export function toImproper(whole: number, n: number, d: number): { n: number; d: number } {
  const sign = whole < 0 ? -1 : 1;
  const absWhole = Math.abs(whole);
  const improperN = sign * (absWhole * d + Math.abs(n));
  return simplifyFraction(improperN, d);
}

/**
 * Converts an improper fraction to mixed fraction: e.g., 11/4 -> 2 3/4
 */
export function toMixed(n: number, d: number): { whole: number; n: number; d: number; isProper: boolean } {
  const simplified = simplifyFraction(n, d);
  if (simplified.d === 0 || Number.isNaN(simplified.n)) {
    return { whole: 0, n: NaN, d: 0, isProper: false };
  }

  const sign = simplified.n < 0 ? -1 : 1;
  const absN = Math.abs(simplified.n);
  const whole = Math.floor(absN / simplified.d) * sign;
  const remN = absN % simplified.d;

  return {
    whole,
    n: remN,
    d: simplified.d,
    isProper: whole === 0,
  };
}

/**
 * Converts a decimal number to an exact or closest fraction
 */
export function decimalToFraction(val: number, tolerance: number = 1e-6): { n: number; d: number } {
  if (!Number.isFinite(val)) return { n: NaN, d: 0 };
  if (val === 0) return { n: 0, d: 1 };

  const sign = val < 0 ? -1 : 1;
  const absVal = Math.abs(val);

  // Continued fraction expansion
  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;
  let b = absVal;

  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(absVal - h1 / k1) > absVal * tolerance && k1 < 100000);

  return simplifyFraction(sign * h1, k1);
}

/**
 * Formats a fraction to readable string
 */
export function formatFractionText(n: number, d: number, preferMixed: boolean = true): string {
  if (d === 0) return 'Ошибка (деление на ноль)';
  if (Number.isNaN(n)) return 'Ошибка';
  if (n === 0) return '0';

  const simplified = simplifyFraction(n, d);
  if (simplified.d === 1) return simplified.n.toString();

  if (preferMixed && Math.abs(simplified.n) > simplified.d) {
    const mixed = toMixed(simplified.n, simplified.d);
    return `${mixed.whole} ${mixed.n}/${mixed.d}`;
  }

  return `${simplified.n}/${simplified.d}`;
}

export type FractionOperator = '+' | '−' | '×' | '÷';

/**
 * Evaluates binary fraction operation with full step-by-step breakdown
 */
export function calculateFractionsWithSteps(
  f1: { whole?: number; n: number; d: number },
  op: FractionOperator,
  f2: { whole?: number; n: number; d: number }
): {
  result: { n: number; d: number };
  mixedResult: string;
  improperResult: string;
  decimalResult: number;
  steps: CalculationStep[];
  error?: string;
} {
  const steps: CalculationStep[] = [];
  let stepNum = 1;

  if (f1.d === 0 || f2.d === 0) {
    return {
      result: { n: NaN, d: 0 },
      mixedResult: 'Ошибка',
      improperResult: 'Ошибка',
      decimalResult: NaN,
      steps: [],
      error: 'Знаменатель дроби не может быть равен нулю',
    };
  }

  // 1. Convert any mixed fractions to improper
  let f1Imp = f1.whole ? toImproper(f1.whole, f1.n, f1.d) : simplifyFraction(f1.n, f1.d);
  let f2Imp = f2.whole ? toImproper(f2.whole, f2.n, f2.d) : simplifyFraction(f2.n, f2.d);

  if (f1.whole) {
    steps.push({
      stepNumber: stepNum++,
      description: `Перевод первой смешанной дроби ${f1.whole} ${f1.n}/${f1.d} в неправильную`,
      subExpression: `${f1.whole} × ${f1.d} + ${f1.n}`,
      subResult: `${f1Imp.n}/${f1Imp.d}`,
      resultingExpression: `${f1Imp.n}/${f1Imp.d} ${op} ${f2.whole ? `${f2.whole} ${f2.n}/${f2.d}` : `${f2.n}/${f2.d}`}`,
    });
  }

  if (f2.whole) {
    steps.push({
      stepNumber: stepNum++,
      description: `Перевод второй смешанной дроби ${f2.whole} ${f2.n}/${f2.d} в неправильную`,
      subExpression: `${f2.whole} × ${f2.d} + ${f2.n}`,
      subResult: `${f2Imp.n}/${f2Imp.d}`,
      resultingExpression: `${f1Imp.n}/${f1Imp.d} ${op} ${f2Imp.n}/${f2Imp.d}`,
    });
  }

  let rawN = 0;
  let rawD = 1;

  if (op === '+' || op === '−') {
    const commonDenom = lcm(f1Imp.d, f2Imp.d);
    const m1 = commonDenom / f1Imp.d;
    const m2 = commonDenom / f2Imp.d;
    const newN1 = f1Imp.n * m1;
    const newN2 = f2Imp.n * m2;

    steps.push({
      stepNumber: stepNum++,
      description: `Приведение к общему знаменателю (НОЗ = ${commonDenom})`,
      subExpression: `НОК(${f1Imp.d}, ${f2Imp.d})`,
      subResult: `${commonDenom}`,
      resultingExpression: `${newN1}/${commonDenom} ${op} ${newN2}/${commonDenom}`,
    });

    if (op === '+') {
      rawN = newN1 + newN2;
      steps.push({
        stepNumber: stepNum++,
        description: `Сложение числителей: ${newN1} + ${newN2}`,
        subExpression: `${newN1} + ${newN2}`,
        subResult: `${rawN}`,
        resultingExpression: `${rawN}/${commonDenom}`,
      });
    } else {
      rawN = newN1 - newN2;
      steps.push({
        stepNumber: stepNum++,
        description: `Вычитание числителей: ${newN1} − ${newN2}`,
        subExpression: `${newN1} - ${newN2}`,
        subResult: `${rawN}`,
        resultingExpression: `${rawN}/${commonDenom}`,
      });
    }
    rawD = commonDenom;
  } else if (op === '×') {
    rawN = f1Imp.n * f2Imp.n;
    rawD = f1Imp.d * f2Imp.d;

    steps.push({
      stepNumber: stepNum++,
      description: `Перемножение числителей (${f1Imp.n} × ${f2Imp.n}) и знаменателей (${f1Imp.d} × ${f2Imp.d})`,
      subExpression: `(${f1Imp.n} × ${f2Imp.n}) / (${f1Imp.d} × ${f2Imp.d})`,
      subResult: `${rawN}/${rawD}`,
      resultingExpression: `${rawN}/${rawD}`,
    });
  } else if (op === '÷') {
    if (f2Imp.n === 0) {
      return {
        result: { n: NaN, d: 0 },
        mixedResult: 'Ошибка (деление на 0)',
        improperResult: 'Ошибка',
        decimalResult: NaN,
        steps,
        error: 'Деление на нулевую дробь невозможно',
      };
    }

    const invertedN = f2Imp.d;
    const invertedD = f2Imp.n;

    steps.push({
      stepNumber: stepNum++,
      description: `Деление заменяется умножением на обратную дробь (${invertedN}/${invertedD})`,
      subExpression: `${f1Imp.n}/${f1Imp.d} × ${invertedN}/${invertedD}`,
      subResult: `${invertedN}/${invertedD}`,
      resultingExpression: `${f1Imp.n}/${f1Imp.d} × ${invertedN}/${invertedD}`,
    });

    rawN = f1Imp.n * invertedN;
    rawD = f1Imp.d * invertedD;

    steps.push({
      stepNumber: stepNum++,
      description: `Умножение числителей и знаменателей`,
      subExpression: `(${f1Imp.n} × ${invertedN}) / (${f1Imp.d} × ${invertedD})`,
      subResult: `${rawN}/${rawD}`,
      resultingExpression: `${rawN}/${rawD}`,
    });
  }

  // Final reduction step
  const finalFraction = simplifyFraction(rawN, rawD);
  const commonDiv = gcd(Math.abs(rawN), Math.abs(rawD));

  if (commonDiv > 1) {
    steps.push({
      stepNumber: stepNum++,
      description: `Сокращение дроби на наибольший общий делитель (НОД = ${commonDiv})`,
      subExpression: `(${rawN} ÷ ${commonDiv}) / (${rawD} ÷ ${commonDiv})`,
      subResult: `${finalFraction.n}/${finalFraction.d}`,
      resultingExpression: `${finalFraction.n}/${finalFraction.d}`,
    });
  }

  const mixed = toMixed(finalFraction.n, finalFraction.d);
  let mixedStr = formatFractionText(finalFraction.n, finalFraction.d, true);
  let improperStr = `${finalFraction.n}/${finalFraction.d}`;
  let dec = finalFraction.n / finalFraction.d;

  if (mixed.whole !== 0 && mixed.n !== 0) {
    steps.push({
      stepNumber: stepNum++,
      description: `Выделение целой части: ${mixed.whole} целых и ${mixed.n}/${mixed.d}`,
      subExpression: `${finalFraction.n} ÷ ${finalFraction.d}`,
      subResult: mixedStr,
      resultingExpression: mixedStr,
    });
  }

  return {
    result: finalFraction,
    mixedResult: mixedStr,
    improperResult: improperStr,
    decimalResult: dec,
    steps,
  };
}

/**
 * Normalizes Unicode vulgar fractions (e.g. ¾ -> 3/4)
 */
export function normalizeUnicodeFractions(str: string): string {
  const map: Record<string, string> = {
    '½': ' 1/2',
    '⅓': ' 1/3',
    '⅔': ' 2/3',
    '¼': ' 1/4',
    '¾': ' 3/4',
    '⅕': ' 1/5',
    '⅖': ' 2/5',
    '⅗': ' 3/5',
    '⅘': ' 4/5',
    '⅙': ' 1/6',
    '⅚': ' 5/6',
    '⅛': ' 1/8',
    '⅜': ' 3/8',
    '⅝': ' 5/8',
    '⅞': ' 7/8',
  };

  let res = str;
  for (const [char, repl] of Object.entries(map)) {
    res = res.replaceAll(char, repl);
  }
  return res.replace(/\s+/g, ' ').trim();
}

/**
 * Parses a single fraction term:
 * e.g. "1 3/4" -> { whole: 1, n: 3, d: 4 }
 * "3/4" -> { whole: 0, n: 3, d: 4 }
 * "5" -> { whole: 5, n: 0, d: 1 }
 */
export function parseFractionTerm(raw: string): { whole?: number; n: number; d: number } | null {
  const clean = normalizeUnicodeFractions(raw.trim());
  if (!clean) return null;

  // Mixed fraction: "1 3/4" or "-2 1/5"
  const mixedMatch = clean.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const n = parseInt(mixedMatch[2], 10);
    const d = parseInt(mixedMatch[3], 10);
    return { whole, n, d };
  }

  // Simple fraction: "3/4" or "-5/8"
  const fracMatch = clean.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (fracMatch) {
    const n = parseInt(fracMatch[1], 10);
    const d = parseInt(fracMatch[2], 10);
    return { n, d };
  }

  // Integer: "5" or "-3"
  const intMatch = clean.match(/^(-?\d+)$/);
  if (intMatch) {
    const whole = parseInt(intMatch[1], 10);
    return { whole, n: 0, d: 1 };
  }

  // Decimal: e.g. "0.75"
  const floatVal = parseFloat(clean);
  if (!Number.isNaN(floatVal)) {
    const converted = decimalToFraction(floatVal);
    return { n: converted.n, d: converted.d };
  }

  return null;
}

/**
 * Evaluates a full fraction expression string with detailed step-by-step resolution.
 * Handles binary expressions like "1 3/4 + 2 1/6", "3/4 * 5/8", "1 ¾ + 2 ⅙",
 * and single fraction reductions like "15/25" or "11/4".
 */
export function evaluateFractionStringWithSteps(rawExpr: string): {
  resultText: string;
  rawResult: number;
  steps: CalculationStep[];
  error?: string;
} {
  const normalized = normalizeUnicodeFractions(rawExpr.trim());

  // Check for binary operations (+, -, −, *, ×, ÷, or " / " with spaces)
  // We use regex to identify the operator splitting two fractions
  const opMatch = normalized.match(/^(.*?)\s*([+\-−*×÷]|\s\/\s)\s*(.*?)$/);

  if (opMatch && opMatch[1].trim() && opMatch[3].trim()) {
    const leftRaw = opMatch[1].trim();
    let opChar = opMatch[2].trim();
    const rightRaw = opMatch[3].trim();

    // Map operator
    let op: FractionOperator = '+';
    if (opChar === '+' ) op = '+';
    else if (opChar === '-' || opChar === '−') op = '−';
    else if (opChar === '*' || opChar === '×') op = '×';
    else if (opChar === '/' || opChar === '÷') op = '÷';

    const f1 = parseFractionTerm(leftRaw);
    const f2 = parseFractionTerm(rightRaw);

    if (f1 && f2) {
      const calc = calculateFractionsWithSteps(f1, op, f2);
      if (calc.error) {
        return {
          resultText: 'Ошибка',
          rawResult: NaN,
          steps: calc.steps,
          error: calc.error,
        };
      }
      return {
        resultText: `${calc.mixedResult} (≈ ${formatResultNumber(calc.decimalResult)})`,
        rawResult: calc.decimalResult,
        steps: calc.steps,
      };
    }
  }

  // Single fraction term (reduction or mixed conversion)
  const single = parseFractionTerm(normalized);
  if (single) {
    const steps: CalculationStep[] = [];
    let stepCount = 1;

    if (single.whole && single.n > 0) {
      const imp = toImproper(single.whole, single.n, single.d);
      steps.push({
        stepNumber: stepCount++,
        description: `Перевод смешанной дроби ${single.whole} ${single.n}/${single.d} в неправильную`,
        subExpression: `${single.whole} × ${single.d} + ${single.n}`,
        subResult: `${imp.n}/${imp.d}`,
        resultingExpression: `${imp.n}/${imp.d}`,
      });
      const dec = (single.whole * single.d + single.n) / single.d;
      return {
        resultText: `${single.whole} ${single.n}/${single.d} = ${imp.n}/${imp.d} (≈ ${formatResultNumber(dec)})`,
        rawResult: dec,
        steps,
      };
    }

    const simp = simplifyFraction(single.n, single.d);
    const common = gcd(Math.abs(single.n), Math.abs(single.d));
    if (common > 1) {
      steps.push({
        stepNumber: stepCount++,
        description: `Сокращение дроби ${single.n}/${single.d} на НОД = ${common}`,
        subExpression: `(${single.n} ÷ ${common}) / (${single.d} ÷ ${common})`,
        subResult: `${simp.n}/${simp.d}`,
        resultingExpression: `${simp.n}/${simp.d}`,
      });
    }

    const mixed = toMixed(simp.n, simp.d);
    let finalStr = `${simp.n}/${simp.d}`;
    if (mixed.whole !== 0 && mixed.n !== 0) {
      finalStr = `${mixed.whole} ${mixed.n}/${mixed.d}`;
      steps.push({
        stepNumber: stepCount++,
        description: `Выделение целой части: ${mixed.whole} целых и ${mixed.n}/${mixed.d}`,
        subExpression: `${simp.n} ÷ ${simp.d}`,
        subResult: finalStr,
        resultingExpression: finalStr,
      });
    }

    const dec = simp.n / simp.d;
    return {
      resultText: `${finalStr} (≈ ${formatResultNumber(dec)})`,
      rawResult: dec,
      steps,
    };
  }

  return {
    resultText: 'Ошибка разбора дроби',
    rawResult: NaN,
    steps: [],
    error: 'Не удалось разобрать выражение с дробями',
  };
}

function formatResultNumber(val: number): string {
  if (Number.isNaN(val)) return 'NaN';
  if (!Number.isFinite(val)) return '∞';
  const rounded = Number(Math.round(Number(val + 'e+6')) + 'e-6');
  return rounded.toLocaleString('ru-RU');
}

