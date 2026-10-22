import React from 'react';
import { CalculatorMode, AngleMode, WordSize } from '../types/calculator';
import { Binary, FlaskConical, Calculator, Divide, ArrowLeftRight, Landmark } from 'lucide-react';
import { Language, getTranslation } from '../utils/i18n';

interface ModeSelectorProps {
  mode: CalculatorMode;
  setMode: (mode: CalculatorMode) => void;
  angleMode: AngleMode;
  setAngleMode: (angle: AngleMode) => void;
  wordSize: WordSize;
  setWordSize: (size: WordSize) => void;
  isDark: boolean;
  lang?: Language;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  setMode,
  angleMode,
  setAngleMode,
  wordSize,
  setWordSize,
  isDark,
  lang = 'ru',
}) => {
  const modes: { id: CalculatorMode; icon: React.ReactNode }[] = [
    { id: 'standard', icon: <Calculator className="w-3.5 h-3.5" /> },
    { id: 'fractions', icon: <Divide className="w-3.5 h-3.5" /> },
    { id: 'scientific', icon: <FlaskConical className="w-3.5 h-3.5" /> },
    { id: 'programmer', icon: <Binary className="w-3.5 h-3.5" /> },
    { id: 'converter', icon: <ArrowLeftRight className="w-3.5 h-3.5" /> },
    { id: 'finance', icon: <Landmark className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className={`px-3 py-2 flex items-center justify-between border-b gap-2 text-xs select-none overflow-x-auto ${
        isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-slate-200/80 bg-slate-50/50'
      }`}
    >
      {/* Mode navigation buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {modes.map((m) => {
          const label = getTranslation(m.id, lang);
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md font-medium text-[11px] sm:text-xs transition-all shrink-0 ${
                mode === m.id
                  ? isDark
                    ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs'
                    : 'bg-white text-blue-600 font-semibold shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              aria-label={`${label} mode`}
            >
              {m.icon}
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual sub-controls depending on active mode */}
      <div className="flex items-center gap-1.5 shrink-0">
        {mode === 'scientific' && (
          <button
            onClick={() => setAngleMode(angleMode === 'DEG' ? 'RAD' : 'DEG')}
            className={`px-2 py-1 rounded text-[11px] font-bold tracking-wider transition-colors ${
              isDark
                ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-200 text-amber-700 hover:bg-slate-300'
            }`}
            title="Переключить Градусы (DEG) / Радианы (RAD)"
          >
            {angleMode}
          </button>
        )}

        {mode === 'programmer' && (
          <div className="flex items-center gap-1">
            {(['QWORD', 'DWORD', 'WORD', 'BYTE'] as WordSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setWordSize(size)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
                  wordSize === size
                    ? 'bg-blue-600 text-white'
                    : isDark
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
                title={`Разрядность: ${size}`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
