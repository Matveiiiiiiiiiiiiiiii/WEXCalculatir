import React, { useState } from 'react';
import { UnitCategory, UNIT_CATEGORIES, convertUnitsWithSteps } from '../utils/converterEngine';
import { CalculationRecord } from '../types/calculator';
import { ArrowLeftRight, Check, Sparkles } from 'lucide-react';

interface ConverterViewProps {
  onAddRecord: (record: CalculationRecord) => void;
  triggerSound: (type: 'click' | 'operator' | 'equals' | 'clear' | 'error') => void;
  isDark: boolean;
}

export const ConverterView: React.FC<ConverterViewProps> = ({
  onAddRecord,
  triggerSound,
  isDark,
}) => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const cat = UNIT_CATEGORIES[category];

  const [fromUnit, setFromUnit] = useState<string>(cat.units[0].id);
  const [toUnit, setToUnit] = useState<string>(cat.units[1].id);
  const [inputValue, setInputValue] = useState<string>('100');

  // Perform live conversion
  const valNum = parseFloat(inputValue) || 0;
  const conversion = convertUnitsWithSteps(category, fromUnit, toUnit, valNum);

  const handleSwap = () => {
    triggerSound('click');
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleCategoryChange = (newCat: UnitCategory) => {
    triggerSound('click');
    setCategory(newCat);
    const newCatDef = UNIT_CATEGORIES[newCat];
    setFromUnit(newCatDef.units[0].id);
    setToUnit(newCatDef.units[1].id);
  };

  const handleLogToSolutions = () => {
    triggerSound('equals');
    const fromDef = cat.units.find((u) => u.id === fromUnit);
    const toDef = cat.units.find((u) => u.id === toUnit);

    const record: CalculationRecord = {
      id: `conv-${Date.now()}`,
      timestamp: Date.now(),
      expression: `${inputValue} ${fromDef?.symbol || ''} → ${toDef?.symbol || ''}`,
      result: conversion.formattedResult,
      rawResult: conversion.result,
      steps: conversion.steps,
      mode: 'converter',
      note: `Конвертер: ${cat.name}`,
    };

    onAddRecord(record);
  };

  const inputClass = `w-full px-3 py-2 rounded-lg font-mono text-sm outline-none transition-all ${
    isDark
      ? 'bg-slate-800 border border-slate-700 text-white focus:border-blue-500'
      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600'
  }`;

  const selectClass = `w-full px-3 py-2 rounded-lg text-xs font-medium outline-none cursor-pointer transition-colors ${
    isDark
      ? 'bg-slate-800 border border-slate-700 text-slate-200'
      : 'bg-white border border-slate-300 text-slate-800'
  }`;

  return (
    <div className="p-4 space-y-4">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-800/40">
        {(
          [
            { id: 'length', label: 'Длина' },
            { id: 'mass', label: 'Масса' },
            { id: 'temperature', label: 'Температура' },
            { id: 'speed', label: 'Скорость' },
            { id: 'data', label: 'Данные' },
            { id: 'volume', label: 'Объем' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => handleCategoryChange(item.id)}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              category === item.id
                ? 'bg-blue-600 text-white shadow-xs'
                : isDark
                ? 'bg-slate-800 text-slate-400 hover:text-white'
                : 'bg-slate-200/80 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Dual conversion fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Source */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Из величины
          </label>
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={inputClass}
            placeholder="Введите значение..."
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className={selectClass}
          >
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Target */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              В величину
            </label>
            <button
              onClick={handleSwap}
              className={`p-1 rounded text-xs flex items-center gap-1 ${
                isDark ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-200 text-blue-600'
              }`}
              title="Поменять местами"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="text-[10px]">Реверс</span>
            </button>
          </div>
          <div
            className={`px-3 py-2 rounded-lg font-mono font-bold text-sm truncate ${
              isDark ? 'bg-slate-900 border border-slate-800 text-emerald-400' : 'bg-slate-100 border border-slate-300 text-emerald-600'
            }`}
          >
            {conversion.formattedResult}
          </div>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className={selectClass}
          >
            {cat.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formula note */}
      <div
        className={`p-3 rounded-lg text-xs space-y-1 ${
          isDark ? 'bg-slate-900/60 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'
        }`}
      >
        <div className="font-semibold text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-blue-400" />
          Формула преобразования:
        </div>
        <div className="font-mono text-[11px]">{conversion.formula}</div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleLogToSolutions}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
      >
        <Check className="w-4 h-4" />
        Зафиксировать решение в журнале
      </button>
    </div>
  );
};
