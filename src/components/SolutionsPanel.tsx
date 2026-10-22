import React, { useState, useMemo } from 'react';
import { CalculationRecord, CalculationStep } from '../types/calculator';
import { formatResultNumber } from '../utils/calculatorEngine';
import {
  History,
  Trash2,
  Copy,
  Check,
  Download,
  Share2,
  Search,
  ChevronDown,
  ChevronUp,
  Tag,
  CornerDownLeft,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Language, getTranslation } from '../utils/i18n';

interface SolutionsPanelProps {
  records: CalculationRecord[];
  onClearAll: () => void;
  onDeleteRecord: (id: string) => void;
  onUseResult: (resultStr: string) => void;
  onLoadExpression: (expr: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onAddSample: (sampleExpr: string) => void;
  onClose: () => void;
  isDark: boolean;
  lang?: Language;
}

export const SolutionsPanel: React.FC<SolutionsPanelProps> = ({
  records,
  onClearAll,
  onDeleteRecord,
  onUseResult,
  onLoadExpression,
  onUpdateNote,
  onAddSample,
  onClose,
  isDark,
  lang = 'ru',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'standard' | 'scientific' | 'programmer'>('all');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  // Toggle step expansion for a record
  const toggleSteps = (id: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (filterMode !== 'all' && rec.mode !== filterMode) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        rec.expression.toLowerCase().includes(query) ||
        rec.result.toLowerCase().includes(query) ||
        (rec.note && rec.note.toLowerCase().includes(query)) ||
        rec.steps.some(
          (s) =>
            s.description.toLowerCase().includes(query) ||
            s.subExpression.toLowerCase().includes(query)
        )
      );
    });
  }, [records, filterMode, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    if (records.length === 0) return null;
    const nums = records.map((r) => r.rawResult).filter(Number.isFinite);
    if (nums.length === 0) return null;
    const sum = nums.reduce((acc, n) => acc + n, 0);
    const avg = sum / nums.length;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return {
      count: records.length,
      sum: formatResultNumber(sum),
      avg: formatResultNumber(avg),
      min: formatResultNumber(min),
      max: formatResultNumber(max),
    };
  }, [records]);

  // Copy single record to clipboard
  const handleCopyRecord = (rec: CalculationRecord) => {
    const text = `${rec.expression} = ${rec.result}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(rec.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Copy full tape breakdown to clipboard
  const handleCopyAll = () => {
    if (records.length === 0) return;
    const lines = records.map((rec, i) => {
      const header = `#${i + 1} [${new Date(rec.timestamp).toLocaleTimeString()}] ${rec.expression} = ${rec.result}`;
      const noteLine = rec.note ? `  Заметка: ${rec.note}` : '';
      const stepsLines = rec.steps
        .map((s) => `  Шаг ${s.stepNumber}: ${s.description} -> ${s.subResult}`)
        .join('\n');
      return [header, noteLine, stepsLines].filter(Boolean).join('\n');
    });
    navigator.clipboard?.writeText(lines.join('\n\n'));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1500);
  };

  // Export as TXT file
  const handleExportTxt = () => {
    if (records.length === 0) return;
    let content = `ЖУРНАЛ ВЫЧИСЛЕНИЙ И ВСЕХ РЕШЕНИЙ\nСоздано: ${new Date().toLocaleString()}\nВсего вычислений: ${records.length}\n`;
    if (stats) {
      content += `Сумма: ${stats.sum} | Среднее: ${stats.avg} | Мин: ${stats.min} | Макс: ${stats.max}\n`;
    }
    content += `----------------------------------------------------\n\n`;

    records.forEach((rec, idx) => {
      content += `[Решение #${idx + 1}] (${new Date(rec.timestamp).toLocaleTimeString()})\n`;
      if (rec.note) content += `Заметка: ${rec.note}\n`;
      content += `Выражение: ${rec.expression}\n`;
      content += `Результат: ${rec.result}\n`;
      if (rec.steps.length > 0) {
        content += `Шаги решения:\n`;
        rec.steps.forEach((s) => {
          content += `  - Шаг ${s.stepNumber}: ${s.description} [${s.subExpression} = ${s.subResult}] => ${s.resultingExpression}\n`;
        });
      }
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculator_solutions_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const rows = [
      ['ID', 'Время', 'Режим', 'Выражение', 'Результат', 'Заметка', 'Кол-во шагов'],
      ...records.map((r, i) => [
        (i + 1).toString(),
        new Date(r.timestamp).toLocaleTimeString(),
        r.mode,
        `"${r.expression.replace(/"/g, '""')}"`,
        `"${r.result.replace(/"/g, '""')}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`,
        r.steps.length.toString(),
      ]),
    ];
    const csvContent = '\uFEFF' + rows.map((e) => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculator_solutions_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const startEditNote = (rec: CalculationRecord) => {
    setEditingNoteId(rec.id);
    setTempNote(rec.note || '');
  };

  const saveNote = (id: string) => {
    onUpdateNote(id, tempNote);
    setEditingNoteId(null);
  };

  return (
    <aside
      className={`flex flex-col h-full border-l select-text transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-slate-50/95 border-slate-200 text-slate-800'
      } backdrop-blur-md`}
      aria-label="Панель всех решений и истории"
    >
      {/* Top Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/20 text-blue-500 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              {getTranslation('allSolutions', lang)}
              {records.length > 0 && (
                <span className="text-[11px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 font-bold">
                  {records.length}
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400">
              {getTranslation('allSolutionsSub', lang)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {records.length > 0 && (
            <button
              onClick={onClearAll}
              className={`p-1.5 rounded text-rose-500 hover:bg-rose-500/10 transition-colors text-xs flex items-center gap-1`}
              title={getTranslation('clearAll', lang)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">{getTranslation('clear', lang)}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`p-1.5 rounded transition-colors text-xs ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="Закрыть"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Aggregate Statistics Ribbon */}
      {stats && (
        <div
          className={`px-4 py-2 border-b grid grid-cols-4 gap-2 text-center text-xs ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white/60'
          }`}
        >
          <div>
            <div className="text-[10px] text-slate-400 font-medium">{getTranslation('sum', lang)}</div>
            <div className="font-mono font-bold text-[11px] truncate text-blue-500" title={stats.sum}>
              {stats.sum}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">{getTranslation('avg', lang)}</div>
            <div className="font-mono font-semibold text-[11px] truncate" title={stats.avg}>
              {stats.avg}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">{getTranslation('min', lang)}</div>
            <div className="font-mono text-[11px] truncate" title={stats.min}>
              {stats.min}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-medium">{getTranslation('max', lang)}</div>
            <div className="font-mono text-[11px] truncate" title={stats.max}>
              {stats.max}
            </div>
          </div>
        </div>
      )}

      {/* Search & Mode Filters */}
      {records.length > 0 && (
        <div
          className={`px-3 py-2 border-b space-y-1.5 ${
            isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-100/50'
          }`}
        >
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslation('searchPlaceholder', lang)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-md text-xs outline-none transition-all ${
                isDark
                  ? 'bg-slate-800/80 focus:bg-slate-800 text-white placeholder-slate-500 border border-slate-700/60'
                  : 'bg-white focus:bg-white text-slate-900 placeholder-slate-400 border border-slate-300'
              }`}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 text-[11px]">
            {(
              [
                { id: 'all', label: 'Все' },
                { id: 'standard', label: 'Обычные' },
                { id: 'scientific', label: 'Инженерные' },
                { id: 'programmer', label: 'Программист' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  filterMode === tab.id
                    ? isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDark
                    ? 'text-slate-400 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Solution Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {records.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <History className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Пока нет вычислений</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Выполните любое вычисление на калькуляторе — здесь появится его подробная история и каждый шаг решения!
              </p>
            </div>

            {/* Quick interactive test samples */}
            <div className="w-full pt-2 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Попробовать примеры:
              </span>
              <button
                onClick={() => onAddSample('(125 + 75) × 4 - 50')}
                className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <span>(125 + 75) × 4 − 50</span>
                <span className="text-blue-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                  = 750 <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <button
                onClick={() => onAddSample('sqrt(144) + 2 ^ 4')}
                className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <span>√(144) + 2⁴</span>
                <span className="text-blue-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                  = 28 <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <button
                onClick={() => onAddSample('5000 × 20% + 250')}
                className={`w-full py-2 px-3 text-left rounded-lg text-xs font-mono transition-all flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                <span>5000 × 20% + 250</span>
                <span className="text-blue-500 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1 text-[11px]">
                  = 1 250 <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            </div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            По запросу "{searchQuery}" ничего не найдено.
          </div>
        ) : (
          filteredRecords.map((rec, index) => {
            const isExpanded = expandedSteps[rec.id] ?? true; // expanded by default to clearly show steps
            const isEditingNote = editingNoteId === rec.id;
            const isCopied = copiedId === rec.id;

            return (
              <div
                key={rec.id}
                className={`rounded-xl border transition-all ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/80 shadow-xs'
                    : 'bg-white border-slate-200/90 shadow-xs'
                }`}
              >
                {/* Card Top: Index, Time, and Actions */}
                <div
                  className={`px-3 py-2 border-b flex items-center justify-between text-xs ${
                    isDark ? 'border-slate-700/60 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-blue-500">
                      #{records.length - index}
                    </span>
                    <span className="text-[10px]">
                      {new Date(rec.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                        isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rec.mode}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopyRecord(rec)}
                      className={`p-1 rounded transition-colors ${
                        isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                      }`}
                      title="Копировать выражение и ответ"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeleteRecord(rec.id)}
                      className="p-1 rounded hover:text-rose-500 transition-colors"
                      title="Удалить это решение"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Card Content: Equation & Result */}
                <div className="p-3">
                  {/* Note / Label */}
                  {isEditingNote ? (
                    <div className="flex items-center gap-1 mb-2">
                      <input
                        type="text"
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="Название или заметка (например: Аренда)..."
                        className={`text-xs px-2 py-1 rounded flex-1 outline-none ${
                          isDark
                            ? 'bg-slate-900 border border-slate-700 text-white'
                            : 'bg-slate-50 border border-slate-300 text-slate-900'
                        }`}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && saveNote(rec.id)}
                      />
                      <button
                        onClick={() => saveNote(rec.id)}
                        className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-semibold"
                      >
                        OK
                      </button>
                    </div>
                  ) : rec.note ? (
                    <div
                      onClick={() => startEditNote(rec)}
                      className="mb-1.5 flex items-center gap-1.5 text-xs text-amber-500 hover:underline cursor-pointer"
                    >
                      <Tag className="w-3 h-3" />
                      <span className="font-medium text-[11px]">{rec.note}</span>
                    </div>
                  ) : null}

                  {/* Math Expression */}
                  <div className="text-xs font-mono text-slate-400 mb-1 tracking-wide break-words">
                    {rec.expression} =
                  </div>

                  {/* Final big result */}
                  <div className="font-mono font-bold text-xl sm:text-2xl text-blue-500 tracking-tight mb-2.5">
                    {rec.result}
                  </div>

                  {/* Step-by-Step Breakdown Accordion */}
                  {rec.steps.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dashed border-slate-700/40">
                      <button
                        onClick={() => toggleSteps(rec.id)}
                        className={`w-full flex items-center justify-between text-xs font-medium py-1 transition-colors ${
                          isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                          <Sparkles className="w-3 h-3" />
                          Пошаговое решение ({rec.steps.length} {rec.steps.length === 1 ? 'действие' : 'действия'})
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div
                          className={`mt-2 p-2 rounded-lg space-y-2 text-xs font-mono ${
                            isDark ? 'bg-slate-900/80 border border-slate-800' : 'bg-slate-50 border border-slate-200'
                          }`}
                        >
                          {rec.steps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="flex items-start gap-2 border-b border-dashed border-slate-800/40 last:border-b-0 pb-1.5 last:pb-0"
                            >
                              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                {step.stepNumber}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] text-slate-400 font-sans font-medium">
                                  {step.description}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                                  <span className="font-semibold text-slate-200">
                                    {step.subExpression}
                                  </span>
                                  <span className="text-slate-400">=</span>
                                  <span className="font-bold text-emerald-400">
                                    {step.subResult}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Card Toolbar */}
                  <div className="mt-3 pt-2 border-t flex flex-wrap items-center gap-1.5 text-[11px]">
                    <button
                      onClick={() => onUseResult(rec.result)}
                      className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                        isDark ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={getTranslation('insertResult', lang)}
                    >
                      <CornerDownLeft className="w-3 h-3 text-blue-400" />
                      <span>{getTranslation('insertResult', lang)}</span>
                    </button>

                    <button
                      onClick={() => onLoadExpression(rec.expression)}
                      className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                        isDark ? 'bg-slate-700/60 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title={getTranslation('loadFormula', lang)}
                    >
                      <RotateCcw className="w-3 h-3 text-amber-400" />
                      <span>{getTranslation('loadFormula', lang)}</span>
                    </button>

                    {!rec.note && !isEditingNote && (
                      <button
                        onClick={() => startEditNote(rec)}
                        className={`px-2 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                          isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-slate-200 text-slate-500'
                        }`}
                        title={getTranslation('addNote', lang)}
                      >
                        <Tag className="w-3 h-3" />
                        <span>{getTranslation('addNote', lang)}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Toolbar: Export & Actions */}
      {records.length > 0 && (
        <div
          className={`p-3 border-t flex items-center justify-between gap-2 text-xs ${
            isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-100/60'
          }`}
        >
          <button
            onClick={handleCopyAll}
            className={`flex-1 py-1.5 px-2 rounded-md font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
              allCopied
                ? 'bg-emerald-600 text-white'
                : isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            {allCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{allCopied ? 'Скопировано!' : 'Копировать всё'}</span>
          </button>

          <button
            onClick={handleExportTxt}
            className={`py-1.5 px-2.5 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title="Экспорт в текстовый файл (.txt)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TXT</span>
          </button>

          <button
            onClick={handleExportCsv}
            className={`py-1.5 px-2.5 rounded-md font-medium text-[11px] flex items-center gap-1 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
            title="Экспорт в таблицу CSV (.csv)"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      )}
    </aside>
  );
};
