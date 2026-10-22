import React from 'react';
import { AppSettings, AppTheme, AccentColor } from '../types/calculator';
import { Language, LANGUAGES, getTranslation } from '../utils/i18n';
import { Settings, Palette, Volume2, Sliders, X, Check, RotateCcw, Globe } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onResetSettings: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  isDark: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetSettings,
  lang,
  setLang,
  isDark,
}) => {
  if (!isOpen) return null;

  const themes: { id: AppTheme; name: string; preview: string; isDark: boolean }[] = [
    { id: 'win-dark', name: 'Windows 11 Dark', preview: 'bg-slate-900 border-slate-700 text-white', isDark: true },
    { id: 'win-light', name: 'Windows 11 Light', preview: 'bg-slate-100 border-slate-300 text-slate-900', isDark: false },
    { id: 'mac-dark', name: 'macOS Sonoma Dark', preview: 'bg-neutral-900 border-neutral-700 text-white', isDark: true },
    { id: 'mac-light', name: 'macOS Sonoma Light', preview: 'bg-stone-100 border-stone-300 text-stone-900', isDark: false },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', preview: 'bg-black border-emerald-500 text-emerald-400 font-mono', isDark: true },
    { id: 'retro-win98', name: 'Retro Windows 98', preview: 'bg-[#c0c0c0] border-gray-400 text-black', isDark: false },
    { id: 'nordic', name: 'Nordic Frost', preview: 'bg-slate-950 border-cyan-800 text-cyan-200', isDark: true },
    { id: 'oled', name: 'OLED Pure Black', preview: 'bg-black border-neutral-800 text-white', isDark: true },
    { id: 'sakura', name: 'Sakura Blush', preview: 'bg-rose-950/70 border-rose-800 text-rose-100', isDark: true },
  ];

  const accents: { id: AccentColor; name: string; bg: string }[] = [
    { id: 'blue', name: 'Синий', bg: 'bg-blue-600' },
    { id: 'emerald', name: 'Изумрудный', bg: 'bg-emerald-600' },
    { id: 'amber', name: 'Янтарный', bg: 'bg-amber-600' },
    { id: 'purple', name: 'Фиолетовый', bg: 'bg-purple-600' },
    { id: 'rose', name: 'Розовый', bg: 'bg-rose-600' },
    { id: 'cyan', name: 'Бирюзовый', bg: 'bg-cyan-600' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border p-5 select-none max-h-[90vh] flex flex-col ${
          isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-500 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{getTranslation('settings', lang)}</h3>
              <p className="text-[11px] text-slate-400">
                Темы, язык интерфейса, точность и звук
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

        {/* Scrollable Settings Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Section: Language */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Язык интерфейса / Language</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-0.5">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-1.5 transition-all ${
                    lang === l.code
                      ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{l.flag}</span>
                    <span className="truncate text-[11px]">{l.nativeName}</span>
                  </span>
                  {lang === l.code && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Themes */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>{getTranslation('theme', lang)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-16 ${
                    t.preview
                  } ${
                    settings.theme === t.id
                      ? 'ring-2 ring-blue-500 shadow-md'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <span className="text-[11px] font-semibold truncate">{t.name}</span>
                  {settings.theme === t.id && (
                    <div className="self-end bg-blue-600 text-white p-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Accent Color */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {getTranslation('accentColor', lang)}
            </div>
            <div className="flex flex-wrap gap-2">
              {accents.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => onUpdateSettings({ accentColor: acc.id })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    settings.accentColor === acc.id
                      ? isDark
                        ? 'border-white bg-slate-800 font-bold'
                        : 'border-slate-800 bg-slate-100 font-bold'
                      : isDark
                      ? 'border-slate-800 hover:bg-slate-800'
                      : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${acc.bg}`} />
                  <span>{acc.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Sound */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{getTranslation('sound', lang)}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'mechanical', label: 'Механический' },
                  { id: 'soft', label: 'Мягкий тап' },
                  { id: 'beep', label: 'Электронный' },
                  { id: 'off', label: 'Выключен' },
                ] as const
              ).map((snd) => (
                <button
                  key={snd.id}
                  onClick={() => onUpdateSettings({ keySoundType: snd.id })}
                  className={`p-2 rounded-lg border text-xs font-medium text-center transition-all ${
                    settings.keySoundType === snd.id
                      ? isDark
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold'
                        : 'bg-blue-50 border-blue-600 text-blue-700 font-bold'
                      : isDark
                      ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Precision & Solutions */}
          <div className="space-y-3 pt-1 border-t border-slate-800/40">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>{getTranslation('decimalPlaces', lang)}</span>
            </div>

            {/* Decimals */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">
                {getTranslation('decimalPlaces', lang)}: {settings.decimalPlaces}
              </span>
              <input
                type="range"
                min="2"
                max="12"
                value={settings.decimalPlaces}
                onChange={(e) =>
                  onUpdateSettings({ decimalPlaces: parseInt(e.target.value, 10) })
                }
                className="w-32 accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Auto Expand Steps */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-300 block">
                  {getTranslation('autoExpandSteps', lang)}
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoExpandSteps}
                onChange={(e) => onUpdateSettings({ autoExpandSteps: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <button
            onClick={onResetSettings}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить настройки</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
