import React, { useState } from 'react';
import { CalculatorMode, ProgrammerBase, WordSize } from '../types/calculator';
import { formatProgrammerBases } from '../utils/calculatorEngine';
import { Copy, Check } from 'lucide-react';

interface DisplayProps {
  expression: string;
  displayValue: string;
  mode: CalculatorMode;
  programmerBase: ProgrammerBase;
  setProgrammerBase: (base: ProgrammerBase) => void;
  wordSize: WordSize;
  hasMemory: boolean;
  isDark: boolean;
  errorMessage?: string | null;
}

export const Display: React.FC<DisplayProps> = ({
  expression,
  displayValue,
  mode,
  programmerBase,
  setProgrammerBase,
  wordSize,
  hasMemory,
  isDark,
  errorMessage,
}) => {
  const [copied, setCopied] = useState(false);

  // Copy display value to clipboard
  const handleCopy = () => {
    navigator.clipboard?.writeText(displayValue.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Calculate dynamic font size based on string length
  const getFontSize = (text: string) => {
    const len = text.length;
    if (len <= 9) return 'text-4xl sm:text-5xl';
    if (len <= 13) return 'text-3xl sm:text-4xl';
    if (len <= 18) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  // Convert for programmer mode
  let programmerBases = { hex: '0', dec: '0', oct: '0', bin: '0' };
  if (mode === 'programmer') {
    try {
      const cleanVal = displayValue.replace(/\s+/g, '').replace(/,/g, '.');
      const big = BigInt(Math.trunc(Number(cleanVal) || 0));
      programmerBases = formatProgrammerBases(big, wordSize);
    } catch {
      programmerBases = { hex: '0', dec: '0', oct: '0', bin: '0' };
    }
  }

  return (
    <div
      className={`relative px-5 pt-3 pb-4 flex flex-col justify-end select-text transition-colors border-b ${
        isDark
          ? 'bg-slate-900/60 border-slate-800/80 text-white'
          : 'bg-white/80 border-slate-200/80 text-slate-900'
      }`}
    >
      {/* Top status bar: Memory indicator & Quick Copy */}
      <div className="flex items-center justify-between text-xs mb-1">
        <div className="flex items-center gap-2">
          {hasMemory && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
              }`}
              title="В памяти сохранены числа"
            >
              M
            </span>
          )}
          {errorMessage && (
            <span className="text-rose-500 text-xs font-medium animate-pulse">
              {errorMessage}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className={`p-1 rounded opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
          }`}
          title="Скопировать значение"
          aria-label="Скопировать результат"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 font-medium">Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Копировать</span>
            </>
          )}
        </button>
      </div>

      {/* History / pending formula line */}
      <div
        className={`h-6 text-sm font-mono text-right overflow-hidden text-ellipsis whitespace-nowrap tracking-wide ${
          isDark ? 'text-slate-400' : 'text-slate-500'
        }`}
        title={expression}
      >
        {expression || '\u00A0'}
      </div>

      {/* Main big numeric display */}
      <div
        className={`font-semibold tracking-tight text-right overflow-hidden text-ellipsis whitespace-nowrap font-mono transition-all ${getFontSize(
          displayValue
        )}`}
        aria-live="polite"
        role="status"
        aria-label={`Текущее значение: ${displayValue}`}
      >
        {displayValue}
      </div>

      {/* Programmer Mode Bases Bar */}
      {mode === 'programmer' && (
        <div
          className={`mt-3 pt-2 border-t grid grid-cols-1 gap-1 font-mono text-xs ${
            isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
          }`}
        >
          {(
            [
              { key: 'HEX', val: programmerBases.hex },
              { key: 'DEC', val: programmerBases.dec },
              { key: 'OCT', val: programmerBases.oct },
              { key: 'BIN', val: programmerBases.bin },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setProgrammerBase(item.key)}
              className={`flex items-center justify-between px-2 py-0.5 rounded text-left transition-colors ${
                programmerBase === item.key
                  ? isDark
                    ? 'bg-blue-600/20 text-blue-400 font-bold'
                    : 'bg-blue-50 text-blue-700 font-bold'
                  : isDark
                  ? 'hover:bg-slate-800/60 text-slate-400'
                  : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <span className="font-semibold text-[11px] w-9">{item.key}</span>
              <span className="truncate max-w-[280px] sm:max-w-none text-right">
                {item.val}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
