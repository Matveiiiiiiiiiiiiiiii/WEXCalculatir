import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { Language, getTranslation } from '../utils/i18n';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  lang?: Language;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  lang = 'ru',
}) => {
  if (!isOpen) return null;

  const isRu = lang === 'ru' || lang === 'uk';

  const shortcuts = [
    { key: '0 - 9', desc: isRu ? 'Ввод цифр' : 'Enter numbers' },
    { key: '+ , - , * , /', desc: isRu ? 'Основные операции (+, −, ×, ÷)' : 'Arithmetic operators (+, −, ×, ÷)' },
    { key: 'Enter / =', desc: isRu ? 'Вычислить результат с шагами' : 'Calculate result with steps' },
    { key: 'Backspace', desc: isRu ? 'Удалить символ' : 'Backspace / Delete character' },
    { key: 'Escape / C', desc: isRu ? 'Очистить всё (Clear All)' : 'Clear All (AC)' },
    { key: 'Delete', desc: isRu ? 'Очистить ввод (CE)' : 'Clear entry (CE)' },
    { key: '. / ,', desc: isRu ? 'Десятичный разделитель' : 'Decimal point' },
    { key: '( / )', desc: isRu ? 'Круглые скобки (приоритет)' : 'Parentheses' },
    { key: '%', desc: isRu ? 'Вычисление процентов' : 'Percentage calculation' },
    { key: '^', desc: isRu ? 'Степень (x^y)' : 'Power exponent (x^y)' },
    { key: 'H', desc: isRu ? 'Открыть/скрыть решения' : 'Toggle solutions panel' },
    { key: 'S', desc: isRu ? 'Звук клавиш' : 'Toggle key click sounds' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 select-none ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{getTranslation('shortcuts', lang)}</h3>
              <p className="text-[11px] text-slate-400">
                {isRu ? 'Управление калькулятором с клавиатуры' : 'Full physical keyboard support'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs max-h-80 overflow-y-auto pr-1">
          {shortcuts.map((item) => (
            <div
              key={item.key}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isDark ? 'bg-slate-800/60' : 'bg-slate-50'
              }`}
            >
              <span className="text-slate-400">{item.desc}</span>
              <kbd
                className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow-xs ${
                  isDark
                    ? 'bg-slate-700 border border-slate-600 text-amber-300'
                    : 'bg-white border border-slate-300 text-slate-800'
                }`}
              >
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
