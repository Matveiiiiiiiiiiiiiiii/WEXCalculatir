import React, { useState } from 'react';
import { Language, LANGUAGES, getTranslation } from '../utils/i18n';
import {
  Calculator,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
  History,
  HelpCircle,
  Pin,
  Settings,
  Camera,
  Globe
} from 'lucide-react';

interface TitleBarProps {
  osTheme: 'windows' | 'macos';
  setOsTheme: (theme: 'windows' | 'macos') => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  isPinned: boolean;
  setIsPinned: (val: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  showHistory: boolean;
  setShowHistory: (val: boolean) => void;
  historyCount: number;
  onOpenShortcuts: () => void;
  onOpenSettings: () => void;
  onOpenPhotoMath: () => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  osTheme,
  setOsTheme,
  isDark,
  setIsDark,
  soundEnabled,
  setSoundEnabled,
  isPinned,
  setIsPinned,
  isFullscreen,
  setIsFullscreen,
  showHistory,
  setShowHistory,
  historyCount,
  onOpenShortcuts,
  onOpenSettings,
  onOpenPhotoMath,
  lang,
  setLang,
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header
      className={`flex items-center justify-between px-3.5 py-2.5 border-b select-none transition-colors ${
        isDark
          ? 'bg-slate-900/80 border-slate-800 text-slate-200'
          : 'bg-slate-100/90 border-slate-200 text-slate-800'
      } backdrop-blur-md relative`}
    >
      {/* Left side: Window Controls & Title */}
      <div className="flex items-center gap-2.5">
        {osTheme === 'macos' ? (
          <div className="flex items-center gap-1.5 mr-1" aria-label="macOS Controls">
            <span
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
              title="Close"
            />
            <span
              className="w-3 h-3 rounded-full bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
              title="Minimize"
            />
            <span
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
              title="Fullscreen"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Calculator className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-xs tracking-tight truncate">
            {getTranslation('appTitle', lang)}
          </span>
          <span
            className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
              isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {osTheme === 'windows' ? 'Win' : 'Mac'}
          </span>
        </div>
      </div>

      {/* Right side: App Actions & System Toggles */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Photo Math Scanner Button */}
        <button
          onClick={onOpenPhotoMath}
          className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xs`}
          title={getTranslation('photoMathDesc', lang)}
          aria-label={getTranslation('photoMath', lang)}
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{getTranslation('photoMath', lang)}</span>
        </button>

        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className={`px-1.5 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
            }`}
            title="Сменить язык (Language)"
          >
            <span>{currentLang.flag}</span>
            <span className="hidden sm:inline uppercase font-bold text-[10px]">{currentLang.code}</span>
          </button>

          {showLangMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLangMenu(false)}
              />
              <div
                className={`absolute right-0 top-full mt-1 z-50 py-1.5 rounded-xl shadow-2xl border min-w-[160px] max-h-72 overflow-y-auto backdrop-blur-md ${
                  isDark ? 'bg-slate-900/95 border-slate-700 text-slate-200' : 'bg-white/95 border-slate-200 text-slate-800'
                }`}
              >
                <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 border-b border-slate-700/30 mb-1">
                  Language / Язык
                </div>
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors ${
                      lang === l.code
                        ? 'bg-blue-600 text-white font-bold'
                        : isDark
                        ? 'hover:bg-slate-800'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{l.flag}</span>
                      <span className="truncate">{l.nativeName}</span>
                    </span>
                    <span className="text-[10px] uppercase opacity-60 font-mono">{l.code}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Toggle OS Style */}
        <button
          onClick={() => setOsTheme(osTheme === 'windows' ? 'macos' : 'windows')}
          className={`px-1.5 sm:px-2 py-1 text-[11px] font-medium rounded-md transition-all flex items-center gap-1 ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-700'
          }`}
          title="Сменить стиль интерфейса (Windows 11 / macOS)"
          aria-label="Сменить тему ОС"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {osTheme === 'windows' ? 'Win' : 'Mac'}
          </span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className={`p-1.5 rounded-md transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title={getTranslation('settings', lang)}
          aria-label={getTranslation('settings', lang)}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Shortcuts Guide */}
        <button
          onClick={onOpenShortcuts}
          className={`p-1.5 rounded-md transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title={getTranslation('shortcuts', lang)}
          aria-label={getTranslation('shortcuts', lang)}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-md transition-colors ${
            soundEnabled
              ? 'text-blue-500 hover:bg-blue-500/10'
              : isDark
              ? 'hover:bg-slate-800 text-slate-400'
              : 'hover:bg-slate-200 text-slate-500'
          }`}
          title={soundEnabled ? 'Звук включен' : 'Звук выключен'}
          aria-label={getTranslation('sound', lang)}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className={`p-1.5 rounded-md transition-colors ${
            isDark ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-200 text-indigo-600'
          }`}
          title={getTranslation('theme', lang)}
          aria-label={getTranslation('theme', lang)}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* History Tape button with count badge */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${
            showHistory
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
              : isDark
              ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-200'
              : 'bg-slate-200/80 hover:bg-slate-200 text-slate-800'
          }`}
          title={getTranslation('allSolutions', lang)}
          aria-label={getTranslation('allSolutions', lang)}
        >
          <History className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold hidden sm:inline">
            {getTranslation('allSolutions', lang)}
          </span>
          {historyCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                showHistory ? 'bg-white/20 text-white' : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {historyCount}
            </span>
          )}
        </button>

        {/* Pin toggle */}
        <button
          onClick={() => setIsPinned(!isPinned)}
          className={`p-1.5 rounded-md transition-colors hidden sm:inline-flex ${
            isPinned
              ? 'text-blue-500 bg-blue-500/10'
              : isDark
              ? 'hover:bg-slate-800 text-slate-400'
              : 'hover:bg-slate-200 text-slate-500'
          }`}
          title="Закрепить окно"
          aria-label="Закрепить окно"
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {/* Fullscreen / expand */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`p-1.5 rounded-md transition-colors hidden sm:inline-flex ${
            isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
          }`}
          title="Полный экран"
          aria-label="Полный экран"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
};
