import { CalculationStep, AngleMode, WordSize } from '../types/calculator';

/**
 * Format a number cleanly without IEEE-754 precision artifacts.
 * e.g., 0.1 + 0.2 = 0.3 instead of 0.30000000000000004
 */
export function formatResultNumber(val: number, maxDecimals: number = 10): string {
  if (!Number.isFinite(val)) {
    if (Number.isNaN(val)) return 'Не число';
    return val > 0 ? 'Бесконечность' : '-Бесконечность';
  }

  // Handle -0
  if (Object.is(val, -0)) return '0';

  // For very large or very tiny numbers, use scientific notation
  const abs = Math.abs(val);
  if (abs !== 0 && (abs >= 1e16 || abs < 1e-10)) {
    return val.toExponential(6).replace('e+', 'e');
  }

  // Round off tiny float fuzz
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(val * factor) / factor;

  // Format with Russian space grouping if integer part is large
  const parts = rounded.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
}

/**
 * Strips whitespace formatting for calculations
 */
export function unformatNumber(str: string): number {
  const clean = str.replace(/\s+/g, '').replace(/,/g, '.');
  const num = Number(clean);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Clean round for float math
 */
export function roundClean(n: number, decimals: number = 12): number {
  if (!Number.isFinite(n)) return n;
  const factor = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

/**
 * Factorial calculation
 */
export function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n > 170) return Infinity; // JS max float limit
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) {
    res *= i;
  }
  return res;
}

/**
 * Evaluates an expression with step-by-step resolution logging.
 * Supports: +, -, ×, ÷, %, ^, √, sin, cos, tan, log, ln, 1/x, x², n!, and parentheses.
 */
export function evaluateExpressionWithSteps(
  rawExpr: string,
  angleMode: AngleMode = 'DEG'
): {
  result: number;
  formattedResult: string;
  steps: CalculationStep[];
  error?: string;
} {
  const steps: CalculationStep[] = [];
  let currentExpr = rawExpr
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  if (!currentExpr) {
    return {
      result: 0,
      formattedResult: '0',
      steps: [],
    };
  }

  let stepCounter = 1;

  function addStep(desc: string, subExpr: string, subRes: string, resExpr: string) {
    const readableSub = subExpr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/(?<=\d)\+(?=\d)/g, ' + ')
      .replace(/(?<=\d)-(?=\d)/g, ' − ');
    const readableResExpr = resExpr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ');
    steps.push({
      stepNumber: stepCounter++,
      description: desc,
      subExpression: readableSub,
      subResult: subRes,
      resultingExpression: readableResExpr,
    });
  }

  let safety = 0;

  // 1. First resolve functions with parentheses: func(...)
  const funcCallRegex = /(sqrt|√|sin|cos|tan|log|ln|sqr|recip|fact)\(([^()]+)\)/i;
  let funcMatch: RegExpExecArray | null;

  while ((funcMatch = funcCallRegex.exec(currentExpr)) !== null && safety++ < 60) {
    const funcName = funcMatch[1].toLowerCase();
    const argRaw = funcMatch[2];

    // Evaluate argument if it's an expression like 100 + 44
    let argVal = Number(argRaw);
    if (Number.isNaN(argVal)) {
      const innerEval = evaluateSimpleArithmetic(argRaw, angleMode);
      if (innerEval.error) {
        return { result: NaN, formattedResult: 'Ошибка', steps, error: innerEval.error };
      }
      argVal = innerEval.result;
    }

    let val = 0;
    let label = '';

    if (funcName === 'sqrt' || funcName === '√') {
      if (argVal < 0) return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Корень из отрицательного числа' };
      val = Math.sqrt(argVal);
      label = `Квадратный корень √(${argVal})`;
    } else if (funcName === 'sqr') {
      val = argVal * argVal;
      label = `Возведение в квадрат (${argVal})²`;
    } else if (funcName === 'recip') {
      if (argVal === 0) return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Деление на ноль (1/0)' };
      val = 1 / argVal;
      label = `Обратная величина 1/(${argVal})`;
    } else if (funcName === 'sin') {
      const rad = angleMode === 'DEG' ? (argVal * Math.PI) / 180 : argVal;
      val = Math.sin(rad);
      label = `Синус sin(${argVal}${angleMode === 'DEG' ? '°' : ' rad'})`;
    } else if (funcName === 'cos') {
      const rad = angleMode === 'DEG' ? (argVal * Math.PI) / 180 : argVal;
      val = Math.cos(rad);
      label = `Косинус cos(${argVal}${angleMode === 'DEG' ? '°' : ' rad'})`;
    } else if (funcName === 'tan') {
      const rad = angleMode === 'DEG' ? (argVal * Math.PI) / 180 : argVal;
      if (Math.abs(Math.cos(rad)) < 1e-12) return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Тангенс не определен (90°)' };
      val = Math.tan(rad);
      label = `Тангенс tan(${argVal}${angleMode === 'DEG' ? '°' : ' rad'})`;
    } else if (funcName === 'log') {
      if (argVal <= 0) return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Логарифм неположительного числа' };
      val = Math.log10(argVal);
      label = `Логарифм log₁₀(${argVal})`;
    } else if (funcName === 'ln') {
      if (argVal <= 0) return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Натуральный логарифм ln' };
      val = Math.log(argVal);
      label = `Натуральный логарифм ln(${argVal})`;
    } else if (funcName === 'fact') {
      if (argVal < 0 || !Number.isInteger(argVal)) return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Факториал целого неотрицательного числа' };
      val = factorial(argVal);
      label = `Факториал ${argVal}!`;
    }

    val = roundClean(val);
    const subStr = funcMatch[0];
    const resStr = val.toString();
    currentExpr = currentExpr.slice(0, funcMatch.index) + resStr + currentExpr.slice(funcMatch.index + subStr.length);
    addStep(label, subStr, formatResultNumber(val), currentExpr);
  }

  // 2. Resolve Grouping Parentheses: (expr)
  const parenRegex = /\(([^()]+)\)/;
  let parenMatch: RegExpExecArray | null;

  while ((parenMatch = parenRegex.exec(currentExpr)) !== null && safety++ < 120) {
    const innerRaw = parenMatch[1];
    const innerEval = evaluateSimpleArithmetic(innerRaw, angleMode, (desc, sub, res, cur) => {
      const tempFull = currentExpr.replace(sub, res);
      addStep(desc, sub, res, tempFull);
    });

    if (innerEval.error) {
      return { result: NaN, formattedResult: 'Ошибка', steps, error: innerEval.error };
    }

    const resVal = roundClean(innerEval.result);
    currentExpr = currentExpr.slice(0, parenMatch.index) + resVal.toString() + currentExpr.slice(parenMatch.index + parenMatch[0].length);
    addStep(
      'Вычисление скобок',
      `(${innerRaw})`,
      formatResultNumber(resVal),
      currentExpr
    );
  }

  // 3. Resolve Powers: a ^ b
  const powerRegex = /(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*\^\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/;
  let powerMatch: RegExpExecArray | null;
  while ((powerMatch = powerRegex.exec(currentExpr)) !== null && safety++ < 180) {
    const a = Number(powerMatch[1]);
    const b = Number(powerMatch[2]);
    const res = roundClean(Math.pow(a, b));
    const subStr = powerMatch[0];
    currentExpr = currentExpr.slice(0, powerMatch.index) + res.toString() + currentExpr.slice(powerMatch.index + subStr.length);
    addStep(`Возведение в степень ${a} ^ ${b}`, subStr, formatResultNumber(res), currentExpr);
  }

  // 4. Resolve Multiplication and Division: * and /
  const mulDivRegex = /(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([*\/%])\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/;
  let mulDivMatch: RegExpExecArray | null;

  while ((mulDivMatch = mulDivRegex.exec(currentExpr)) !== null && safety++ < 250) {
    const a = Number(mulDivMatch[1]);
    const op = mulDivMatch[2];
    const b = Number(mulDivMatch[3]);
    let res = 0;
    let label = '';

    if (op === '*') {
      res = roundClean(a * b);
      label = `Умножение ${a} × ${b}`;
    } else if (op === '/') {
      if (b === 0) {
        return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Деление на ноль невозможно' };
      }
      res = roundClean(a / b);
      label = `Деление ${a} ÷ ${b}`;
    } else if (op === '%') {
      res = roundClean((a * b) / 100);
      label = `Процент ${b}% от ${a}`;
    }

    const subStr = mulDivMatch[0];
    currentExpr = currentExpr.slice(0, mulDivMatch.index) + res.toString() + currentExpr.slice(mulDivMatch.index + subStr.length);
    addStep(label, subStr, formatResultNumber(res), currentExpr);
  }

  // 5. Resolve Addition and Subtraction
  const addSubRegex = /((?:^-)?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([+-])\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/;
  let addSubMatch: RegExpExecArray | null;

  while ((addSubMatch = addSubRegex.exec(currentExpr)) !== null && safety++ < 320) {
    const a = Number(addSubMatch[1]);
    const op = addSubMatch[2];
    const b = Number(addSubMatch[3]);
    let res = 0;
    let label = '';

    if (op === '+') {
      res = roundClean(a + b);
      label = `Сложение ${a} + ${b}`;
    } else {
      res = roundClean(a - b);
      label = `Вычитание ${a} − ${b}`;
    }

    const subStr = addSubMatch[0];
    currentExpr = currentExpr.slice(0, addSubMatch.index) + res.toString() + currentExpr.slice(addSubMatch.index + subStr.length);
    addStep(label, subStr, formatResultNumber(res), currentExpr);
  }

  const finalNumber = Number(currentExpr);
  if (Number.isNaN(finalNumber)) {
    return { result: NaN, formattedResult: 'Ошибка', steps, error: 'Некорректное математическое выражение' };
  }

  const roundedFinal = roundClean(finalNumber);

  return {
    result: roundedFinal,
    formattedResult: formatResultNumber(roundedFinal),
    steps,
  };
}

/**
 * Evaluates basic arithmetic string without outer parentheses
 */
function evaluateSimpleArithmetic(
  expr: string,
  angleMode: AngleMode,
  onStep?: (desc: string, sub: string, res: string, currentFull: string) => void
): { result: number; error?: string } {
  let cur = expr;
  let safety = 0;

  // Powers
  const powerRegex = /(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*\^\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/;
  let powerMatch: RegExpExecArray | null;
  while ((powerMatch = powerRegex.exec(cur)) !== null && safety++ < 50) {
    const a = Number(powerMatch[1]);
    const b = Number(powerMatch[2]);
    const res = roundClean(Math.pow(a, b));
    const subStr = powerMatch[0];
    cur = cur.slice(0, powerMatch.index) + res.toString() + cur.slice(powerMatch.index + subStr.length);
    onStep?.(`Возведение в степень ${a} ^ ${b}`, subStr, formatResultNumber(res), cur);
  }

  // Mul / Div
  const mulDivRegex = /(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([*\/%])\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/;
  let mulDivMatch: RegExpExecArray | null;
  while ((mulDivMatch = mulDivRegex.exec(cur)) !== null && safety++ < 100) {
    const a = Number(mulDivMatch[1]);
    const op = mulDivMatch[2];
    const b = Number(mulDivMatch[3]);
    let res = 0;
    let label = '';
    if (op === '*') {
      res = roundClean(a * b);
      label = `Умножение ${a} × ${b}`;
    } else if (op === '/') {
      if (b === 0) return { result: NaN, error: 'Деление на ноль невозможно' };
      res = roundClean(a / b);
      label = `Деление ${a} ÷ ${b}`;
    } else if (op === '%') {
      res = roundClean((a * b) / 100);
      label = `Процент ${b}% от ${a}`;
    }
    const subStr = mulDivMatch[0];
    cur = cur.slice(0, mulDivMatch.index) + res.toString() + cur.slice(mulDivMatch.index + subStr.length);
    onStep?.(label, subStr, formatResultNumber(res), cur);
  }

  // Add / Sub
  const addSubRegex = /((?:^-)?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s*([+-])\s*(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/;
  let addSubMatch: RegExpExecArray | null;
  while ((addSubMatch = addSubRegex.exec(cur)) !== null && safety++ < 150) {
    const a = Number(addSubMatch[1]);
    const op = addSubMatch[2];
    const b = Number(addSubMatch[3]);
    let res = 0;
    let label = '';
    if (op === '+') {
      res = roundClean(a + b);
      label = `Сложение ${a} + ${b}`;
    } else {
      res = roundClean(a - b);
      label = `Вычитание ${a} − ${b}`;
    }
    const subStr = addSubMatch[0];
    cur = cur.slice(0, addSubMatch.index) + res.toString() + cur.slice(addSubMatch.index + subStr.length);
    onStep?.(label, subStr, formatResultNumber(res), cur);
  }

  const finalNum = Number(cur);
  if (Number.isNaN(finalNum)) {
    return { result: NaN, error: 'Некорректное подвыражение' };
  }
  return { result: finalNum };
}

/**
 * Programmer Mode Utilities (Bitwise, HEX, BIN, OCT, bit-masking)
 */
export function getMaskForWordSize(size: WordSize): bigint {
  switch (size) {
    case 'BYTE':
      return 0xffn;
    case 'WORD':
      return 0xffffn;
    case 'DWORD':
      return 0xffffffffn;
    case 'QWORD':
    default:
      return 0xffffffffffffffffn;
  }
}

export function formatProgrammerBases(value: bigint, wordSize: WordSize = 'QWORD') {
  const mask = getMaskForWordSize(wordSize);
  const maskedVal = value & mask;

  const hex = maskedVal.toString(16).toUpperCase();
  const dec = maskedVal.toString(10);
  const oct = maskedVal.toString(8);
  const binRaw = maskedVal.toString(2);

  // Pad binary into groups of 4 for authentic system programmer look
  const binPadded = binRaw.padStart(Math.ceil(binRaw.length / 4) * 4 || 4, '0');
  const binGrouped = binPadded.match(/.{1,4}/g)?.join(' ') || binPadded;

  return {
    hex: hex || '0',
    dec: dec || '0',
    oct: oct || '0',
    bin: binGrouped || '0',
  };
}

/**
 * Web Audio API synthesizer for realistic mechanical calculator clicks and beeps
 */
let audioCtx: AudioContext | null = null;

export function playKeySound(type: 'click' | 'operator' | 'equals' | 'clear' | 'error') {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.start(now);
      osc.stop(now + 0.035);
    } else if (type === 'operator') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.045);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
      osc.start(now);
      osc.stop(now + 0.045);
    } else if (type === 'equals') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
    } else if (type === 'clear') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch {
    // Audio safe fallback
  }
}
