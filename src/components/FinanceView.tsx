import React, { useState } from 'react';
import { calculateLoan } from '../utils/converterEngine';
import { formatResultNumber } from '../utils/calculatorEngine';
import { CalculationRecord } from '../types/calculator';
import { Landmark, TrendingUp, Check, Percent } from 'lucide-react';

interface FinanceViewProps {
  onAddRecord: (record: CalculationRecord) => void;
  triggerSound: (type: 'click' | 'operator' | 'equals' | 'clear' | 'error') => void;
  isDark: boolean;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  onAddRecord,
  triggerSound,
  isDark,
}) => {
  const [amount, setAmount] = useState<string>('1000000');
  const [rate, setRate] = useState<string>('16.5');
  const [months, setMonths] = useState<string>('36');

  const amountNum = parseFloat(amount) || 0;
  const rateNum = parseFloat(rate) || 0;
  const monthsNum = parseInt(months, 10) || 1;

  const loan = calculateLoan(amountNum, rateNum, monthsNum);

  const handleLogRecord = () => {
    triggerSound('equals');
    const record: CalculationRecord = {
      id: `loan-${Date.now()}`,
      timestamp: Date.now(),
      expression: `Кредит ${formatResultNumber(amountNum)} руб. под ${rateNum}% на ${monthsNum} мес.`,
      result: `Платеж: ${formatResultNumber(loan.monthlyPayment)} руб./мес.`,
      rawResult: loan.monthlyPayment,
      steps: loan.steps,
      mode: 'finance',
      note: 'Финансовый расчет',
    };
    onAddRecord(record);
  };

  const inputClass = `w-full px-3 py-2 rounded-lg font-mono text-sm outline-none transition-all ${
    isDark
      ? 'bg-slate-800 border border-slate-700 text-white focus:border-blue-500'
      : 'bg-white border border-slate-300 text-slate-900 focus:border-blue-600'
  }`;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/40">
        <Landmark className="w-4 h-4 text-blue-500" />
        <h3 className="font-bold text-xs uppercase tracking-wider">
          Кредитный и ипотечный калькулятор
        </h3>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Сумма займа (руб.)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            step="10000"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Ставка (% годовых)
          </label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className={inputClass}
            step="0.1"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">
            Срок (в месяцах)
          </label>
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className={inputClass}
            step="6"
          />
        </div>
      </div>

      {/* Calculated Results Banner */}
      <div
        className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-3 text-center ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            Ежемесячный платеж
          </div>
          <div className="font-mono font-bold text-lg text-blue-500 truncate">
            {formatResultNumber(loan.monthlyPayment)} ₽
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            Переплата по процентам
          </div>
          <div className="font-mono font-bold text-lg text-amber-500 truncate">
            {formatResultNumber(loan.totalInterest)} ₽
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-[11px] text-slate-400 font-medium">
            Всего выплат
          </div>
          <div className="font-mono font-bold text-lg text-emerald-500 truncate">
            {formatResultNumber(loan.totalPayment)} ₽
          </div>
        </div>
      </div>

      {/* Add to Solutions */}
      <button
        onClick={handleLogRecord}
        className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
      >
        <Check className="w-4 h-4" />
        Зафиксировать финансовый расчет в решениях
      </button>
    </div>
  );
};
