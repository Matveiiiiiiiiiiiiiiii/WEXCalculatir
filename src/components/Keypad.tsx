import React from 'react';
import { CalculatorMode, ProgrammerBase } from '../types/calculator';
import { Delete } from 'lucide-react';

interface KeypadProps {
  mode: CalculatorMode;
  programmerBase: ProgrammerBase;
  onDigit: (digit: string) => void;
  onOperator: (op: string) => void;
  onScientificFunc: (func: string) => void;
  onBitwise: (op: string) => void;
  onEquals: () => void;
  onClear: () => void;
  onClearEntry: () => void;
  onBackspace: () => void;
  onDecimal: () => void;
  onToggleSign: () => void;
  isDark: boolean;
  osTheme: 'windows' | 'macos';
}

export const Keypad: React.FC<KeypadProps> = ({
  mode,
  programmerBase,
  onDigit,
  onOperator,
  onScientificFunc,
  onBitwise,
  onEquals,
  onClear,
  onClearEntry,
  onBackspace,
  onDecimal,
  onToggleSign,
  isDark,
  osTheme,
}) => {
  // Common button styling classes
  const btnBase =
    'h-11 sm:h-12 flex items-center justify-center font-medium text-sm sm:text-base select-none transition-all active:scale-[0.96] focus:outline-none';
  const roundedClass = osTheme === 'macos' ? 'rounded-full' : 'rounded-lg';

  // Key variants
  const digitClass = `${btnBase} ${roundedClass} font-semibold ${
    isDark
      ? 'bg-slate-800/80 hover:bg-slate-700/80 text-white shadow-xs'
      : 'bg-white hover:bg-slate-100 text-slate-900 shadow-xs border border-slate-200/60'
  }`;

  const operatorClass = `${btnBase} ${roundedClass} font-semibold text-lg ${
    isDark
      ? 'bg-slate-800/40 hover:bg-slate-700/60 text-blue-400'
      : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
  }`;

  const funcClass = `${btnBase} ${roundedClass} text-xs sm:text-sm font-medium ${
    isDark
      ? 'bg-slate-800/30 hover:bg-slate-800 text-slate-300'
      : 'bg-slate-100/70 hover:bg-slate-200 text-slate-700'
  }`;

  const equalsClass = `${btnBase} ${roundedClass} font-bold text-lg text-white shadow-md shadow-blue-500/20 ${
    osTheme === 'macos'
      ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700'
      : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
  }`;

  // Disabled button class for programmer base constraints
  const disabledClass = `${btnBase} ${roundedClass} opacity-30 cursor-not-allowed ${
    isDark ? 'bg-slate-900 text-slate-600' : 'bg-slate-100 text-slate-400'
  }`;

  const isHexDigitAllowed = (hex: string) => {
    if (programmerBase === 'HEX') return true;
    return false;
  };

  const isDecDigitAllowed = (d: number) => {
    if (programmerBase === 'BIN') return d === 0 || d === 1;
    if (programmerBase === 'OCT') return d >= 0 && d <= 7;
    return true; // DEC or HEX
  };

  if (mode === 'standard') {
    return (
      <div className="p-3 grid grid-cols-4 gap-1.5 sm:gap-2">
        {/* Row 1 */}
        <button onClick={() => onOperator('%')} className={funcClass} title="Процент (%)">
          %
        </button>
        <button onClick={onClearEntry} className={funcClass} title="Очистить ввод (CE)">
          CE
        </button>
        <button onClick={onClear} className={funcClass} title="Очистить всё (C / Escape)">
          C
        </button>
        <button onClick={onBackspace} className={funcClass} title="Стереть символ (Backspace)">
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 2 */}
        <button onClick={() => onScientificFunc('recip')} className={funcClass} title="Обратная величина (1/x)">
          1/x
        </button>
        <button onClick={() => onScientificFunc('sqr')} className={funcClass} title="Квадрат числа (x²)">
          x²
        </button>
        <button onClick={() => onScientificFunc('sqrt')} className={funcClass} title="Квадратный корень (√x)">
          √x
        </button>
        <button onClick={() => onOperator('÷')} className={operatorClass} title="Разделить (÷)">
          ÷
        </button>

        {/* Row 3 */}
        <button onClick={() => onDigit('7')} className={digitClass}>
          7
        </button>
        <button onClick={() => onDigit('8')} className={digitClass}>
          8
        </button>
        <button onClick={() => onDigit('9')} className={digitClass}>
          9
        </button>
        <button onClick={() => onOperator('×')} className={operatorClass} title="Умножить (×)">
          ×
        </button>

        {/* Row 4 */}
        <button onClick={() => onDigit('4')} className={digitClass}>
          4
        </button>
        <button onClick={() => onDigit('5')} className={digitClass}>
          5
        </button>
        <button onClick={() => onDigit('6')} className={digitClass}>
          6
        </button>
        <button onClick={() => onOperator('−')} className={operatorClass} title="Вычесть (−)">
          −
        </button>

        {/* Row 5 */}
        <button onClick={() => onDigit('1')} className={digitClass}>
          1
        </button>
        <button onClick={() => onDigit('2')} className={digitClass}>
          2
        </button>
        <button onClick={() => onDigit('3')} className={digitClass}>
          3
        </button>
        <button onClick={() => onOperator('+')} className={operatorClass} title="Прибавить (+)">
          +
        </button>

        {/* Row 6 */}
        <button onClick={onToggleSign} className={funcClass} title="Сменить знак (±)">
          ±
        </button>
        <button onClick={() => onDigit('0')} className={digitClass}>
          0
        </button>
        <button onClick={onDecimal} className={digitClass}>
          ,
        </button>
        <button onClick={onEquals} className={equalsClass} title="Вычислить результат (= / Enter)">
          =
        </button>
      </div>
    );
  }

  if (mode === 'scientific') {
    return (
      <div className="p-3 space-y-2">
        {/* Top Trig & Advanced row */}
        <div className="grid grid-cols-6 gap-1">
          <button onClick={() => onScientificFunc('sin')} className={funcClass} title="Синус">
            sin
          </button>
          <button onClick={() => onScientificFunc('cos')} className={funcClass} title="Косинус">
            cos
          </button>
          <button onClick={() => onScientificFunc('tan')} className={funcClass} title="Тангенс">
            tan
          </button>
          <button onClick={() => onScientificFunc('log')} className={funcClass} title="Десятичный логарифм log₁₀">
            log
          </button>
          <button onClick={() => onScientificFunc('ln')} className={funcClass} title="Натуральный логарифм ln">
            ln
          </button>
          <button onClick={() => onScientificFunc('fact')} className={funcClass} title="Факториал (n!)">
            n!
          </button>
        </div>

        {/* Main 5-column Scientific Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {/* Row 1 */}
          <button onClick={() => onScientificFunc('pi')} className={funcClass} title="Число Пи (π = 3.14159...)">
            π
          </button>
          <button onClick={() => onScientificFunc('e')} className={funcClass} title="Число Эйлера (e = 2.71828...)">
            e
          </button>
          <button onClick={onClearEntry} className={funcClass}>
            CE
          </button>
          <button onClick={onClear} className={funcClass}>
            C
          </button>
          <button onClick={onBackspace} className={funcClass}>
            <Delete className="w-4 h-4" />
          </button>

          {/* Row 2 */}
          <button onClick={() => onScientificFunc('sqr')} className={funcClass}>
            x²
          </button>
          <button onClick={() => onScientificFunc('recip')} className={funcClass}>
            1/x
          </button>
          <button onClick={() => onScientificFunc('abs')} className={funcClass} title="Модуль числа |x|">
            |x|
          </button>
          <button onClick={() => onScientificFunc('exp')} className={funcClass} title="Экспонента (exp)">
            exp
          </button>
          <button onClick={() => onOperator('mod')} className={funcClass} title="Остаток от деления (mod)">
            mod
          </button>

          {/* Row 3 */}
          <button onClick={() => onScientificFunc('sqrt')} className={funcClass}>
            √x
          </button>
          <button onClick={() => onOperator('(')} className={funcClass}>
            (
          </button>
          <button onClick={() => onOperator(')')} className={funcClass}>
            )
          </button>
          <button onClick={() => onScientificFunc('fact')} className={funcClass}>
            n!
          </button>
          <button onClick={() => onOperator('÷')} className={operatorClass}>
            ÷
          </button>

          {/* Row 4 */}
          <button onClick={() => onOperator('^')} className={funcClass} title="Возведение в степень (x^y)">
            x^y
          </button>
          <button onClick={() => onDigit('7')} className={digitClass}>
            7
          </button>
          <button onClick={() => onDigit('8')} className={digitClass}>
            8
          </button>
          <button onClick={() => onDigit('9')} className={digitClass}>
            9
          </button>
          <button onClick={() => onOperator('×')} className={operatorClass}>
            ×
          </button>

          {/* Row 5 */}
          <button onClick={() => onScientificFunc('tenPower')} className={funcClass} title="10 в степени x">
            10ˣ
          </button>
          <button onClick={() => onDigit('4')} className={digitClass}>
            4
          </button>
          <button onClick={() => onDigit('5')} className={digitClass}>
            5
          </button>
          <button onClick={() => onDigit('6')} className={digitClass}>
            6
          </button>
          <button onClick={() => onOperator('−')} className={operatorClass}>
            −
          </button>

          {/* Row 6 */}
          <button onClick={() => onScientificFunc('log')} className={funcClass}>
            log
          </button>
          <button onClick={() => onDigit('1')} className={digitClass}>
            1
          </button>
          <button onClick={() => onDigit('2')} className={digitClass}>
            2
          </button>
          <button onClick={() => onDigit('3')} className={digitClass}>
            3
          </button>
          <button onClick={() => onOperator('+')} className={operatorClass}>
            +
          </button>

          {/* Row 7 */}
          <button onClick={() => onScientificFunc('ln')} className={funcClass}>
            ln
          </button>
          <button onClick={onToggleSign} className={funcClass}>
            ±
          </button>
          <button onClick={() => onDigit('0')} className={digitClass}>
            0
          </button>
          <button onClick={onDecimal} className={digitClass}>
            ,
          </button>
          <button onClick={onEquals} className={equalsClass}>
            =
          </button>
        </div>
      </div>
    );
  }

  // Programmer Mode Keypad
  return (
    <div className="p-3 space-y-2">
      {/* Bitwise Operations row */}
      <div className="grid grid-cols-6 gap-1">
        <button onClick={() => onBitwise('AND')} className={funcClass} title="Побитовое И (AND)">
          AND
        </button>
        <button onClick={() => onBitwise('OR')} className={funcClass} title="Побитовое ИЛИ (OR)">
          OR
        </button>
        <button onClick={() => onBitwise('NOT')} className={funcClass} title="Побитовое НЕ (NOT)">
          NOT
        </button>
        <button onClick={() => onBitwise('XOR')} className={funcClass} title="Исключающее ИЛИ (XOR)">
          XOR
        </button>
        <button onClick={() => onBitwise('LSH')} className={funcClass} title="Битовый сдвиг влево (<<)">
          Lsh
        </button>
        <button onClick={() => onBitwise('RSH')} className={funcClass} title="Битовый сдвиг вправо (>>)">
          Rsh
        </button>
      </div>

      {/* Hex & Digits Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {/* Row 1 */}
        <button
          onClick={() => onDigit('A')}
          disabled={!isHexDigitAllowed('A')}
          className={isHexDigitAllowed('A') ? funcClass : disabledClass}
        >
          A
        </button>
        <button onClick={() => onOperator('(')} className={funcClass}>
          (
        </button>
        <button onClick={() => onOperator(')')} className={funcClass}>
          )
        </button>
        <button onClick={onClear} className={funcClass}>
          C
        </button>
        <button onClick={onBackspace} className={funcClass}>
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 2 */}
        <button
          onClick={() => onDigit('B')}
          disabled={!isHexDigitAllowed('B')}
          className={isHexDigitAllowed('B') ? funcClass : disabledClass}
        >
          B
        </button>
        <button
          onClick={() => onDigit('7')}
          disabled={!isDecDigitAllowed(7)}
          className={isDecDigitAllowed(7) ? digitClass : disabledClass}
        >
          7
        </button>
        <button
          onClick={() => onDigit('8')}
          disabled={!isDecDigitAllowed(8)}
          className={isDecDigitAllowed(8) ? digitClass : disabledClass}
        >
          8
        </button>
        <button
          onClick={() => onDigit('9')}
          disabled={!isDecDigitAllowed(9)}
          className={isDecDigitAllowed(9) ? digitClass : disabledClass}
        >
          9
        </button>
        <button onClick={() => onOperator('÷')} className={operatorClass}>
          ÷
        </button>

        {/* Row 3 */}
        <button
          onClick={() => onDigit('C')}
          disabled={!isHexDigitAllowed('C')}
          className={isHexDigitAllowed('C') ? funcClass : disabledClass}
        >
          C
        </button>
        <button
          onClick={() => onDigit('4')}
          disabled={!isDecDigitAllowed(4)}
          className={isDecDigitAllowed(4) ? digitClass : disabledClass}
        >
          4
        </button>
        <button
          onClick={() => onDigit('5')}
          disabled={!isDecDigitAllowed(5)}
          className={isDecDigitAllowed(5) ? digitClass : disabledClass}
        >
          5
        </button>
        <button
          onClick={() => onDigit('6')}
          disabled={!isDecDigitAllowed(6)}
          className={isDecDigitAllowed(6) ? digitClass : disabledClass}
        >
          6
        </button>
        <button onClick={() => onOperator('×')} className={operatorClass}>
          ×
        </button>

        {/* Row 4 */}
        <button
          onClick={() => onDigit('D')}
          disabled={!isHexDigitAllowed('D')}
          className={isHexDigitAllowed('D') ? funcClass : disabledClass}
        >
          D
        </button>
        <button
          onClick={() => onDigit('1')}
          disabled={!isDecDigitAllowed(1)}
          className={isDecDigitAllowed(1) ? digitClass : disabledClass}
        >
          1
        </button>
        <button
          onClick={() => onDigit('2')}
          disabled={!isDecDigitAllowed(2)}
          className={isDecDigitAllowed(2) ? digitClass : disabledClass}
        >
          2
        </button>
        <button
          onClick={() => onDigit('3')}
          disabled={!isDecDigitAllowed(3)}
          className={isDecDigitAllowed(3) ? digitClass : disabledClass}
        >
          3
        </button>
        <button onClick={() => onOperator('−')} className={operatorClass}>
          −
        </button>

        {/* Row 5 */}
        <button
          onClick={() => onDigit('E')}
          disabled={!isHexDigitAllowed('E')}
          className={isHexDigitAllowed('E') ? funcClass : disabledClass}
        >
          E
        </button>
        <button
          onClick={() => onDigit('F')}
          disabled={!isHexDigitAllowed('F')}
          className={isHexDigitAllowed('F') ? funcClass : disabledClass}
        >
          F
        </button>
        <button
          onClick={() => onDigit('0')}
          disabled={!isDecDigitAllowed(0)}
          className={isDecDigitAllowed(0) ? digitClass : disabledClass}
        >
          0
        </button>
        <button onClick={onToggleSign} className={funcClass}>
          ±
        </button>
        <button onClick={() => onOperator('+')} className={operatorClass}>
          +
        </button>

        {/* Row 6 */}
        <div className="col-span-5 flex justify-end">
          <button onClick={onEquals} className={`${equalsClass} w-full`}>
            =
          </button>
        </div>
      </div>
    </div>
  );
};
