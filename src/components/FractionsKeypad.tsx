import React, { useState } from 'react';
import { FractionOperator, calculateFractionsWithSteps, simplifyFraction, toMixed, decimalToFraction } from '../utils/fractionEngine';
import { CalculationRecord } from '../types/calculator';
import { ArrowLeftRight, Check, Sparkles, RefreshCw } from 'lucide-react';

interface FractionsKeypadProps {
  onAddRecord: (record: CalculationRecord) => void;
  triggerSound: (type: 'click' | 'operator' | 'equals' | 'clear' | 'error') => void;
  isDark: boolean;
  accentClass: string;
}

export const FractionsKeypad: React.FC<FractionsKeypadProps> = ({
  onAddRecord,
  triggerSound,
  isDark,
  accentClass,
}) => {
  // First fraction
  const [f1Whole, setF1Whole] = useState<string>('');
  const [f1Num, setF1Num] = useState<string>('3');
  const [f1Den, setF1Den] = useState<string>('4');

  // Operator
  const [op, setOp] = useState<FractionOperator>('+');

  // Second fraction
  const [f2Whole, setF2Whole] = useState<string>('');
  const [f2Num, setF2Num] = useState<string>('2');
  const [f2Den, setF2Den] = useState<string>('5');

  // Active field being edited: 'f1Whole' | 'f1Num' | 'f1Den' | 'f2Whole' | 'f2Num' | 'f2Den'
  const [activeField, setActiveField] = useState<'f1Whole' | 'f1Num' | 'f1Den' | 'f2Whole' | 'f2Num' | 'f2Den'>('f1Num');

  // Quick live result preview
  const [lastResult, setLastResult] = useState<{
    mixed: string;
    improper: string;
    decimal: number;
  } | null>(null);

  const calculate = () => {
    const f1 = {
      whole: f1Whole ? parseInt(f1Whole, 10) : undefined,
      n: parseInt(f1Num, 10) || 0,
      d: parseInt(f1Den, 10) || 1,
    };
    const f2 = {
      whole: f2Whole ? parseInt(f2Whole, 10) : undefined,
      n: parseInt(f2Num, 10) || 0,
      d: parseInt(f2Den, 10) || 1,
    };

    const res = calculateFractionsWithSteps(f1, op, f2);

    if (res.error) {
      triggerSound('error');
      return;
    }

    triggerSound('equals');
    setLastResult({
      mixed: res.mixedResult,
      improper: res.improperResult,
      decimal: res.decimalResult,
    });

    const f1Str = f1.whole ? `${f1.whole} ${f1.n}/${f1.d}` : `${f1.n}/${f1.d}`;
    const f2Str = f2.whole ? `${f2.whole} ${f2.n}/${f2.d}` : `${f2.n}/${f2.d}`;
    const fullExpr = `${f1Str} ${op} ${f2Str}`;

    const newRecord: CalculationRecord = {
      id: `frac-${Date.now()}`,
      timestamp: Date.now(),
      expression: fullExpr,
      result: `${res.mixedResult} (≈ ${res.decimalResult.toFixed(4)})`,
      rawResult: res.decimalResult,
      steps: res.steps,
      mode: 'fractions',
      note: 'Дроби',
    };

    onAddRecord(newRecord);
  };

  const handleDigit = (digit: string) => {
    triggerSound('click');
    const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
      f1Whole: setF1Whole,
      f1Num: setF1Num,
      f1Den: setF1Den,
      f2Whole: setF2Whole,
      f2Num: setF2Num,
      f2Den: setF2Den,
    };

    const setter = setters[activeField];
    setter((prev) => {
      if (prev === '0' || prev === '') return digit;
      if (prev.length >= 6) return prev;
      return prev + digit;
    });
  };

  const handleBackspace = () => {
    triggerSound('click');
    const setters: Record<string, React.Dispatch<React.SetStateAction<string>>> = {
      f1Whole: setF1Whole,
      f1Num: setF1Num,
      f1Den: setF1Den,
      f2Whole: setF2Whole,
      f2Num: setF2Num,
      f2Den: setF2Den,
    };
    const setter = setters[activeField];
    setter((prev) => (prev.length > 1 ? prev.slice(0, -1) : ''));
  };

  const handleClear = () => {
    triggerSound('clear');
    setF1Whole('');
    setF1Num('');
    setF1Den('');
    setF2Whole('');
    setF2Num('');
    setF2Den('');
    setLastResult(null);
  };

  const inputClass = (field: string) =>
    `text-center font-mono font-bold rounded-lg transition-all cursor-pointer ${
      activeField === field
        ? 'ring-2 ring-blue-500 bg-blue-500/10 text-blue-400 font-extrabold'
        : isDark
        ? 'bg-slate-800 hover:bg-slate-700/80 text-white'
        : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-300'
    }`;

  const btnClass = `h-10 sm:h-11 rounded-lg font-semibold text-sm flex items-center justify-center select-none transition-all active:scale-95 ${
    isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
  }`;

  return (
    <div className="p-3 sm:p-4 space-y-4">
      {/* Fraction Formula Visual Display */}
      <div
        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-4 select-none">
          {/* Fraction 1 */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={f1Whole}
              placeholder="Целое"
              onClick={() => setActiveField('f1Whole')}
              className={`w-14 h-12 text-base ${inputClass('f1Whole')}`}
              title="Целая часть первой дроби"
            />
            <div className="flex flex-col items-center gap-1">
              <input
                type="text"
                readOnly
                value={f1Num || '0'}
                onClick={() => setActiveField('f1Num')}
                className={`w-14 h-8 text-sm ${inputClass('f1Num')}`}
                title="Числитель первой дроби"
              />
              <div className="w-14 h-0.5 bg-slate-400 rounded-full" />
              <input
                type="text"
                readOnly
                value={f1Den || '1'}
                onClick={() => setActiveField('f1Den')}
                className={`w-14 h-8 text-sm ${inputClass('f1Den')}`}
                title="Знаменатель первой дроби"
              />
            </div>
          </div>

          {/* Operator Selector */}
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-2 gap-1">
              {(['+', '−', '×', '÷'] as FractionOperator[]).map((operator) => (
                <button
                  key={operator}
                  onClick={() => {
                    setOp(operator);
                    triggerSound('operator');
                  }}
                  className={`w-8 h-8 rounded-md font-bold text-base transition-colors ${
                    op === operator
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border'
                  }`}
                >
                  {operator}
                </button>
              ))}
            </div>
          </div>

          {/* Fraction 2 */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={f2Whole}
              placeholder="Целое"
              onClick={() => setActiveField('f2Whole')}
              className={`w-14 h-12 text-base ${inputClass('f2Whole')}`}
              title="Целая часть второй дроби"
            />
            <div className="flex flex-col items-center gap-1">
              <input
                type="text"
                readOnly
                value={f2Num || '0'}
                onClick={() => setActiveField('f2Num')}
                className={`w-14 h-8 text-sm ${inputClass('f2Num')}`}
                title="Числитель второй дроби"
              />
              <div className="w-14 h-0.5 bg-slate-400 rounded-full" />
              <input
                type="text"
                readOnly
                value={f2Den || '1'}
                onClick={() => setActiveField('f2Den')}
                className={`w-14 h-8 text-sm ${inputClass('f2Den')}`}
                title="Знаменатель второй дроби"
              />
            </div>
          </div>
        </div>

        {/* Live / Last Result Preview Banner */}
        {lastResult && (
          <div className="mt-4 pt-3 border-t w-full flex items-center justify-between text-xs">
            <span className="text-slate-400">Результат:</span>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-lg text-emerald-400">
                {lastResult.mixed}
              </span>
              <span className="text-slate-400 font-mono text-xs">
                ({lastResult.improper} = {lastResult.decimal.toFixed(4)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Direct Numerical Keypad for Fraction Entry */}
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={() => handleDigit('7')} className={btnClass}>7</button>
        <button onClick={() => handleDigit('8')} className={btnClass}>8</button>
        <button onClick={() => handleDigit('9')} className={btnClass}>9</button>
        <button onClick={handleBackspace} className={`${btnClass} text-rose-400`} title="Стереть символ">⌫</button>

        <button onClick={() => handleDigit('4')} className={btnClass}>4</button>
        <button onClick={() => handleDigit('5')} className={btnClass}>5</button>
        <button onClick={() => handleDigit('6')} className={btnClass}>6</button>
        <button onClick={handleClear} className={`${btnClass} text-amber-400`} title="Очистить всё">C</button>

        <button onClick={() => handleDigit('1')} className={btnClass}>1</button>
        <button onClick={() => handleDigit('2')} className={btnClass}>2</button>
        <button onClick={() => handleDigit('3')} className={btnClass}>3</button>
        <button
          onClick={() => {
            // Next field navigation
            const fields: ('f1Whole' | 'f1Num' | 'f1Den' | 'f2Whole' | 'f2Num' | 'f2Den')[] = [
              'f1Whole', 'f1Num', 'f1Den', 'f2Whole', 'f2Num', 'f2Den',
            ];
            const nextIdx = (fields.indexOf(activeField) + 1) % fields.length;
            setActiveField(fields[nextIdx]);
            triggerSound('click');
          }}
          className={`${btnClass} text-xs text-blue-400`}
          title="Перейти к следующему полю"
        >
          Tab ➔
        </button>

        <button onClick={() => handleDigit('0')} className={`col-span-2 ${btnClass}`}>0</button>
        <button
          onClick={calculate}
          className={`col-span-2 ${btnClass} bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-base shadow-md`}
        >
          = Решить с шагами
        </button>
      </div>
    </div>
  );
};
