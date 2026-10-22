/**
 * Mathematical Engine for Function Graphing
 * Supports evaluating f(x) for polynomials, trigonometric, exponential,
 * logarithmic, absolute, roots, constants, and basic calculus operations (derivative, roots, integral).
 */

export interface CompiledFunction {
  raw: string;
  evaluate: (x: number) => number;
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes user-typed mathematical expressions for evaluation with variable x.
 * Examples:
 * - "2x" -> "2*x"
 * - "x^2" -> "Math.pow(x, 2)"
 * - "sin(x)" -> "Math.sin(x)"
 * - "ln(x)" -> "Math.log(x)"
 * - "e^x" -> "Math.exp(x)"
 * - "|x|" -> "Math.abs(x)"
 * - "π" -> "Math.PI"
 */
export function normalizeMathExpression(raw: string): string {
  let expr = raw.trim();

  // Strip leading variable assignments like "y =", "y = ", "f(x) =", "f(x) = "
  expr = expr.replace(/^(?:[fghy]\s*(?:\([a-zA-Z]\))?\s*=\s*)/i, '');

  expr = expr.toLowerCase();

  // Replace unicode symbols
  expr = expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'Math.PI')
    .replace(/\bpi\b/g, 'Math.PI');

  // Replace Russian / alternative trigonometry & hyperbolic names
  expr = expr
    .replace(/\barctg\b/g, 'atan')
    .replace(/\barcctg\b/g, '(Math.PI/2 - Math.atan)')
    .replace(/\btg\b/g, 'tan')
    .replace(/\bctg\(([^)]+)\)/g, '(1 / Math.tan($1))')
    .replace(/\bsh\b/g, 'sinh')
    .replace(/\bch\b/g, 'cosh')
    .replace(/\bth\b/g, 'tanh')
    .replace(/\blg\b/g, 'log10');

  // Replace |expr| with abs(expr)
  expr = expr.replace(/\|([^|]+)\|/g, 'abs($1)');

  // Support square root √
  expr = expr.replace(/√\(([^)]+)\)/g, 'sqrt($1)');
  expr = expr.replace(/√([a-zA-Z0-9.]+)/g, 'sqrt($1)');

  // Implicit multiplication:
  // digit followed by letter (except scientific notation like 1e-5 or 2e3) or paren
  expr = expr.replace(/(\d+)\s*(?!(?:e[+-]?\d+)\b)([a-zA-Z(])/gi, '$1*$2');
  // x followed by letter, function or open paren: e.g. x sin(x) -> x*sin(x), x(x+1) -> x*(x+1)
  expr = expr.replace(/\bx\b\s*([a-zA-Z(])/gi, 'x*$1');
  // x followed by digit: x2 -> x*2
  expr = expr.replace(/\bx\b\s*(\d+)/gi, 'x*$1');
  // close paren followed by open paren or variable/func: (x+1)(x-1) -> (x+1)*(x-1)
  expr = expr.replace(/\)\s*([(\w])/g, ')*$1');

  // Replace standard function names with Math.*
  const mathFunctions = [
    'sin',
    'cos',
    'tan',
    'asin',
    'acos',
    'atan',
    'sinh',
    'cosh',
    'tanh',
    'sqrt',
    'cbrt',
    'abs',
    'exp',
    'log10',
    'log2',
    'floor',
    'ceil',
    'round',
  ];

  mathFunctions.forEach((fn) => {
    const regex = new RegExp(`(?<!Math\\.)\\b${fn}\\b`, 'g');
    expr = expr.replace(regex, `Math.${fn}`);
  });

  // Handle ln(x) -> Math.log(x), and log(x) -> Math.log10(x)
  expr = expr.replace(/(?<!Math\.)\bln\b/g, 'Math.log');
  expr = expr.replace(/(?<!Math\.)\blog\b/g, 'Math.log10');

  // Handle isolated constant e -> Math.E (make sure it's not part of exp or 1e-5)
  expr = expr.replace(/(?<![a-zA-Z0-9_])e(?![a-zA-Z0-9_])/g, 'Math.E');

  // Replace powers with Math.pow to prevent JS syntax error on unary minus (e.g. -x^2)
  const powPattern = /([a-zA-Z0-9_.]+(?:\([^\(\)]*\))?|\([^\(\)]+\)|[a-zA-Z0-9_.]+)\s*\^\s*([a-zA-Z0-9_.]+(?:\([^\(\)]*\))?|\([^\(\)]+\)|[a-zA-Z0-9_.]+)/;
  let prev = '';
  let count = 0;
  while (powPattern.test(expr) && count++ < 30) {
    prev = expr;
    expr = expr.replace(powPattern, 'Math.pow($1, $2)');
    if (expr === prev) break;
  }
  // Any leftover ^ replace with **
  expr = expr.replace(/\^/g, '**');

  return expr;
}

/**
 * Compiles a mathematical expression into a fast evaluator function f(x).
 */
export function compileFunction(raw: string): CompiledFunction {
  if (!raw || !raw.trim()) {
    return {
      raw,
      evaluate: () => NaN,
      isValid: false,
      error: 'Пустое выражение',
    };
  }

  try {
    const normalized = normalizeMathExpression(raw);

    // Validate that only x is used as variable (excluding scientific notation e and Math functions)
    const stripped = normalized
      .replace(/Math\.[a-zA-Z0-9]+/g, '')
      .replace(/(?<=\d)e[+-]?\d+/gi, '');
    const unknownVar = stripped.match(/[a-wyzA-WYZ]/);
    if (unknownVar) {
      return {
        raw,
        evaluate: () => NaN,
        isValid: false,
        error: `Неизвестная переменная: '${unknownVar[0]}'. Используйте 'x'.`,
      };
    }

    // Create function runner
    const fn = new Function('x', `
      try {
        const y = (${normalized});
        if (typeof y !== 'number') return NaN;
        return y;
      } catch (e) {
        return NaN;
      }
    `) as (x: number) => number;

    // Test run with sample points
    const test1 = fn(0);
    const test2 = fn(1);
    if (Number.isNaN(test1) && Number.isNaN(test2) && Number.isNaN(fn(2))) {
      // Expression might have error or only valid on specific domain (like sqrt(x-5)), so allow if no exception
    }

    return {
      raw,
      evaluate: (x: number) => {
        try {
          const res = fn(x);
          return Number.isFinite(res) ? res : NaN;
        } catch {
          return NaN;
        }
      },
      isValid: true,
    };
  } catch (err: any) {
    return {
      raw,
      evaluate: () => NaN,
      isValid: false,
      error: err.message || 'Ошибка в формуле',
    };
  }
}

/**
 * Computes numerical derivative f'(x) using symmetric difference quotient.
 */
export function computeDerivative(
  fn: (x: number) => number,
  x: number,
  h: number = 1e-5
): number {
  const yPlus = fn(x + h);
  const yMinus = fn(x - h);
  if (!Number.isFinite(yPlus) || !Number.isFinite(yMinus)) return NaN;
  return (yPlus - yMinus) / (2 * h);
}

/**
 * Finds roots (zeros) where f(x) ≈ 0 in the range [xMin, xMax].
 */
export function findRoots(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  samples: number = 200
): number[] {
  const roots: number[] = [];
  const step = (xMax - xMin) / samples;
  let prevX = xMin;
  let prevY = fn(prevX);

  for (let i = 1; i <= samples; i++) {
    const curX = xMin + i * step;
    const curY = fn(curX);

    if (Number.isFinite(prevY) && Number.isFinite(curY)) {
      // Exact root
      if (Math.abs(curY) < 1e-7) {
        if (!roots.some((r) => Math.abs(r - curX) < step / 2)) {
          roots.push(roundTo(curX, 4));
        }
      } else if (prevY * curY < 0 && Math.abs(curY - prevY) < 50) {
        // Sign change and not a huge jump (asymptote)
        // Refine with bisection
        let a = prevX;
        let b = curX;
        for (let iter = 0; iter < 16; iter++) {
          const mid = (a + b) / 2;
          const midY = fn(mid);
          if (Math.abs(midY) < 1e-6) {
            a = mid;
            break;
          }
          if (fn(a) * midY < 0) {
            b = mid;
          } else {
            a = mid;
          }
        }
        const root = (a + b) / 2;
        if (!roots.some((r) => Math.abs(r - root) < step / 2)) {
          roots.push(roundTo(root, 4));
        }
      }
    }
    prevX = curX;
    prevY = curY;
  }

  return roots;
}

/**
 * Finds local extrema (minima and maxima) in [xMin, xMax].
 */
export function findExtrema(
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  samples: number = 200
): { x: number; y: number; type: 'min' | 'max' }[] {
  const extrema: { x: number; y: number; type: 'min' | 'max' }[] = [];
  const step = (xMax - xMin) / samples;

  let prevD = computeDerivative(fn, xMin);

  for (let i = 1; i <= samples; i++) {
    const x = xMin + i * step;
    const curD = computeDerivative(fn, x);

    if (Number.isFinite(prevD) && Number.isFinite(curD)) {
      const prevSign = Math.sign(Math.abs(prevD) < 1e-6 ? 0 : prevD);
      const curSign = Math.sign(Math.abs(curD) < 1e-6 ? 0 : curD);

      if ((prevD * curD <= 0 && (prevSign !== curSign || Math.abs(curD) < 1e-5)) && Math.abs(curD - prevD) < 100) {
        // Derivative changed sign or hit 0 -> local extremum
        const type = prevD > 0 || (prevD >= 0 && curD < 0) ? 'max' : 'min';
        const extremumX = Math.abs(curD) < 1e-5 ? x : (x - step / 2);
        const yVal = fn(extremumX);
        if (Number.isFinite(yVal) && !extrema.some(e => Math.abs(e.x - extremumX) < step)) {
          extrema.push({
            x: roundTo(extremumX, 4),
            y: roundTo(yVal, 4),
            type,
          });
        }
      }
    }
    prevD = curD;
  }

  return extrema;
}

/**
 * Calculates numerical definite integral using Simpson's 1/3 Rule.
 */
export function computeDefiniteIntegral(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number = 200
): { value: number; error?: string } {
  if (a === b) return { value: 0 };
  const sign = a < b ? 1 : -1;
  const start = Math.min(a, b);
  const end = Math.max(a, b);

  // Even number of intervals
  const intervals = n % 2 === 0 ? n : n + 1;
  const h = (end - start) / intervals;

  let sum = fn(start) + fn(end);
  if (!Number.isFinite(sum)) return { value: NaN, error: 'Разрыв в границах интегрирования' };

  for (let i = 1; i < intervals; i++) {
    const x = start + i * h;
    const y = fn(x);
    if (!Number.isFinite(y)) return { value: NaN, error: 'Разрыв подынтегральной функции' };
    sum += i % 2 === 0 ? 2 * y : 4 * y;
  }

  return { value: sign * (h / 3) * sum };
}

/**
 * Generates a table of values for f(x).
 */
export function generateTableOfValues(
  fn: (x: number) => number,
  start: number,
  end: number,
  step: number = 1
): { x: number; y: number | null }[] {
  const result: { x: number; y: number | null }[] = [];
  const safeStep = Math.max(step, 0.001);
  const total = Math.min(Math.round((end - start) / safeStep) + 1, 500);

  for (let i = 0; i < total; i++) {
    const x = roundTo(start + i * safeStep, 4);
    const y = fn(x);
    result.push({
      x,
      y: Number.isFinite(y) ? roundTo(y, 6) : null,
    });
  }

  return result;
}

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}
