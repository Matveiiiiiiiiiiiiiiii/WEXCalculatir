import React, { useState } from 'react';
import { MemoryItem } from '../types/calculator';
import { formatResultNumber } from '../utils/calculatorEngine';
import { Trash2 } from 'lucide-react';

interface MemoryBarProps {
  memoryList: MemoryItem[];
  onMemoryClear: () => void;
  onMemoryRecall: () => void;
  onMemoryAdd: () => void;
  onMemorySub: () => void;
  onMemoryStore: () => void;
  onSelectMemoryItem: (val: number) => void;
  onDeleteMemoryItem: (id: string) => void;
  isDark: boolean;
}

export const MemoryBar: React.FC<MemoryBarProps> = ({
  memoryList,
  onMemoryClear,
  onMemoryRecall,
  onMemoryAdd,
  onMemorySub,
  onMemoryStore,
  onSelectMemoryItem,
  onDeleteMemoryItem,
  isDark,
}) => {
  const [showFlyout, setShowFlyout] = useState(false);
  const hasMemory = memoryList.length > 0;

  return (
    <div className="relative select-none">
      <div
        className={`grid grid-cols-6 text-xs font-semibold px-2 py-1 border-b ${
          isDark ? 'border-slate-800/80 bg-slate-900/30' : 'border-slate-200/80 bg-slate-50/50'
        }`}
      >
        <button
          onClick={onMemoryClear}
          disabled={!hasMemory}
          className={`py-1.5 rounded transition-colors ${
            hasMemory
              ? isDark
                ? 'hover:bg-slate-800 text-slate-200'
                : 'hover:bg-slate-200 text-slate-800'
              : isDark
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Очистить всю память (MC)"
        >
          MC
        </button>

        <button
          onClick={onMemoryRecall}
          disabled={!hasMemory}
          className={`py-1.5 rounded transition-colors ${
            hasMemory
              ? isDark
                ? 'hover:bg-slate-800 text-slate-200'
                : 'hover:bg-slate-200 text-slate-800'
              : isDark
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Вызов из памяти (MR)"
        >
          MR
        </button>

        <button
          onClick={onMemoryAdd}
          className={`py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-200 text-slate-800'
          }`}
          title="Прибавить к памяти (M+)"
        >
          M+
        </button>

        <button
          onClick={onMemorySub}
          className={`py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-200 text-slate-800'
          }`}
          title="Вычесть из памяти (M-)"
        >
          M-
        </button>

        <button
          onClick={onMemoryStore}
          className={`py-1.5 rounded transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-200 text-slate-800'
          }`}
          title="Сохранить в память (MS)"
        >
          MS
        </button>

        <button
          onClick={() => setShowFlyout(!showFlyout)}
          disabled={!hasMemory}
          className={`py-1.5 rounded transition-colors flex items-center justify-center gap-0.5 ${
            hasMemory
              ? isDark
                ? 'hover:bg-slate-800 text-blue-400'
                : 'hover:bg-slate-200 text-blue-600'
              : isDark
              ? 'text-slate-600 cursor-not-allowed'
              : 'text-slate-300 cursor-not-allowed'
          }`}
          title="Список значений в памяти"
        >
          <span>M</span>
          <span className="text-[9px]">▼</span>
        </button>
      </div>

      {/* Memory Flyout Popover */}
      {showFlyout && hasMemory && (
        <div
          className={`absolute left-2 right-2 top-full mt-1 z-30 p-2 rounded-lg shadow-xl border backdrop-blur-md max-h-48 overflow-y-auto ${
            isDark
              ? 'bg-slate-900/95 border-slate-700 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b text-[11px] font-semibold">
            <span>Значения в памяти ({memoryList.length})</span>
            <button
              onClick={() => {
                onMemoryClear();
                setShowFlyout(false);
              }}
              className="text-rose-500 hover:text-rose-600 flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Очистить всё</span>
            </button>
          </div>
          <div className="space-y-1">
            {memoryList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-1.5 rounded text-xs transition-colors ${
                  isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                }`}
              >
                <button
                  onClick={() => {
                    onSelectMemoryItem(item.value);
                    setShowFlyout(false);
                  }}
                  className="font-mono font-semibold text-left flex-1"
                >
                  {formatResultNumber(item.value)}
                </button>
                <button
                  onClick={() => onDeleteMemoryItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Удалить значение"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
