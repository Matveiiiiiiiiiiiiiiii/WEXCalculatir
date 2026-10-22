import { CalculationStep } from '../types/calculator';
import { formatResultNumber } from './calculatorEngine';

export type UnitCategory = 'length' | 'mass' | 'temperature' | 'speed' | 'data' | 'volume';

export interface UnitDefinition {
  id: string;
  name: string;
  ratioToBase: number; // For non-temperature: value * ratioToBase = base unit value
  symbol: string;
}

export const UNIT_CATEGORIES: Record<
  UnitCategory,
  {
    name: string;
    baseUnit: string;
    units: UnitDefinition[];
  }
> = {
  length: {
    name: 'Длина и расстояние',
    baseUnit: 'm',
    units: [
      { id: 'km', name: 'Километры', ratioToBase: 1000, symbol: 'км' },
      { id: 'm', name: 'Метры', ratioToBase: 1, symbol: 'м' },
      { id: 'cm', name: 'Сантиметры', ratioToBase: 0.01, symbol: 'см' },
      { id: 'mm', name: 'Миллиметры', ratioToBase: 0.001, symbol: 'мм' },
      { id: 'mi', name: 'Мили', ratioToBase: 1609.344, symbol: 'миль' },
      { id: 'yd', name: 'Ярды', ratioToBase: 0.9144, symbol: 'ярд' },
      { id: 'ft', name: 'Футы', ratioToBase: 0.3048, symbol: 'фт' },
      { id: 'in', name: 'Дюймы', ratioToBase: 0.0254, symbol: 'дюйм' },
    ],
  },
  mass: {
    name: 'Масса и вес',
    baseUnit: 'kg',
    units: [
      { id: 't', name: 'Тонны', ratioToBase: 1000, symbol: 'т' },
      { id: 'kg', name: 'Килограммы', ratioToBase: 1, symbol: 'кг' },
      { id: 'g', name: 'Граммы', ratioToBase: 0.001, symbol: 'г' },
      { id: 'mg', name: 'Миллиграммы', ratioToBase: 0.000001, symbol: 'мг' },
      { id: 'lb', name: 'Фунты', ratioToBase: 0.45359237, symbol: 'фунт' },
      { id: 'oz', name: 'Унции', ratioToBase: 0.028349523, symbol: 'унц' },
    ],
  },
  temperature: {
    name: 'Температура',
    baseUnit: 'C',
    units: [
      { id: 'C', name: 'Градусы Цельсия', ratioToBase: 1, symbol: '°C' },
      { id: 'F', name: 'Градусы Фаренгейта', ratioToBase: 1, symbol: '°F' },
      { id: 'K', name: 'Кельвины', ratioToBase: 1, symbol: 'K' },
    ],
  },
  speed: {
    name: 'Скорость',
    baseUnit: 'm_s',
    units: [
      { id: 'km_h', name: 'Километры в час', ratioToBase: 1 / 3.6, symbol: 'км/ч' },
      { id: 'm_s', name: 'Метры в секунду', ratioToBase: 1, symbol: 'м/с' },
      { id: 'mph', name: 'Мили в час', ratioToBase: 0.44704, symbol: 'миль/ч' },
      { id: 'knot', name: 'Узлы', ratioToBase: 0.514444, symbol: 'узлов' },
    ],
  },
  data: {
    name: 'Данные и память',
    baseUnit: 'B',
    units: [
      { id: 'B', name: 'Байты', ratioToBase: 1, symbol: 'Б' },
      { id: 'KB', name: 'Килобайты (KB)', ratioToBase: 1024, symbol: 'КБ' },
      { id: 'MB', name: 'Мегабайты (MB)', ratioToBase: 1024 ** 2, symbol: 'МБ' },
      { id: 'GB', name: 'Гигабайты (GB)', ratioToBase: 1024 ** 3, symbol: 'ГБ' },
      { id: 'TB', name: 'Терабайты (TB)', ratioToBase: 1024 ** 4, symbol: 'ТБ' },
    ],
  },
  volume: {
    name: 'Объем',
    baseUnit: 'L',
    units: [
      { id: 'm3', name: 'Кубические метры', ratioToBase: 1000, symbol: 'м³' },
      { id: 'L', name: 'Литры', ratioToBase: 1, symbol: 'л' },
      { id: 'ml', name: 'Миллилитры', ratioToBase: 0.001, symbol: 'мл' },
      { id: 'gal', name: 'Галлоны (US)', ratioToBase: 3.78541, symbol: 'гал' },
    ],
  },
};

/**
 * Converts a value from one unit to another with detailed steps
 */
export function convertUnitsWithSteps(
  category: UnitCategory,
  fromUnitId: string,
  toUnitId: string,
  value: number
): {
  result: number;
  formattedResult: string;
  formula: string;
  steps: CalculationStep[];
} {
  const cat = UNIT_CATEGORIES[category];
  const from = cat.units.find((u) => u.id === fromUnitId) || cat.units[0];
  const to = cat.units.find((u) => u.id === toUnitId) || cat.units[1];
  const steps: CalculationStep[] = [];

  if (category === 'temperature') {
    // Special temperature formulas
    let celsius = value;
    if (from.id === 'F') {
      celsius = (value - 32) * (5 / 9);
      steps.push({
        stepNumber: 1,
        description: 'Перевод Фаренгейтов в градусы Цельсия: (°F − 32) × 5/9',
        subExpression: `(${value} - 32) × 5/9`,
        subResult: formatResultNumber(celsius) + ' °C',
        resultingExpression: `${formatResultNumber(celsius)} °C`,
      });
    } else if (from.id === 'K') {
      celsius = value - 273.15;
      steps.push({
        stepNumber: 1,
        description: 'Перевод Кельвинов в градусы Цельсия: K − 273.15',
        subExpression: `${value} - 273.15`,
        subResult: formatResultNumber(celsius) + ' °C',
        resultingExpression: `${formatResultNumber(celsius)} °C`,
      });
    }

    let finalTemp = celsius;
    if (to.id === 'F') {
      finalTemp = celsius * (9 / 5) + 32;
      steps.push({
        stepNumber: steps.length + 1,
        description: 'Перевод Цельсия в Фаренгейты: (°C × 9/5) + 32',
        subExpression: `${formatResultNumber(celsius)} × 9/5 + 32`,
        subResult: formatResultNumber(finalTemp) + ' °F',
        resultingExpression: `${formatResultNumber(finalTemp)} °F`,
      });
    } else if (to.id === 'K') {
      finalTemp = celsius + 273.15;
      steps.push({
        stepNumber: steps.length + 1,
        description: 'Перевод Цельсия в Кельвины: °C + 273.15',
        subExpression: `${formatResultNumber(celsius)} + 273.15`,
        subResult: formatResultNumber(finalTemp) + ' K',
        resultingExpression: `${formatResultNumber(finalTemp)} K`,
      });
    }

    return {
      result: finalTemp,
      formattedResult: `${formatResultNumber(finalTemp)} ${to.symbol}`,
      formula: `${value} ${from.symbol} → ${formatResultNumber(finalTemp)} ${to.symbol}`,
      steps,
    };
  }

  // Linear units conversion:
  const baseValue = value * from.ratioToBase;
  const finalValue = baseValue / to.ratioToBase;
  const multiplier = from.ratioToBase / to.ratioToBase;

  steps.push({
    stepNumber: 1,
    description: `Перевод ${from.name} в базовую величину`,
    subExpression: `${value} × ${from.ratioToBase}`,
    subResult: formatResultNumber(baseValue),
    resultingExpression: `${formatResultNumber(baseValue)} (базовая величина)`,
  });

  steps.push({
    stepNumber: 2,
    description: `Перевод базовой величины в ${to.name}`,
    subExpression: `${formatResultNumber(baseValue)} ÷ ${to.ratioToBase}`,
    subResult: `${formatResultNumber(finalValue)} ${to.symbol}`,
    resultingExpression: `${formatResultNumber(finalValue)} ${to.symbol}`,
  });

  return {
    result: finalValue,
    formattedResult: `${formatResultNumber(finalValue)} ${to.symbol}`,
    formula: `Коэффициент: × ${formatResultNumber(multiplier, 6)}`,
    steps,
  };
}

/**
 * Loan & Mortgage annuity calculation
 */
export function calculateLoan(
  amount: number,
  annualRatePercent: number,
  months: number
): {
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  steps: CalculationStep[];
} {
  const steps: CalculationStep[] = [];
  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    const monthly = amount / months;
    return {
      monthlyPayment: monthly,
      totalPayment: amount,
      totalInterest: 0,
      steps: [
        {
          stepNumber: 1,
          description: 'Беспроцентный займ: Сумма / Количество месяцев',
          subExpression: `${amount} / ${months}`,
          subResult: formatResultNumber(monthly),
          resultingExpression: formatResultNumber(monthly),
        },
      ],
    };
  }

  // Annuity coefficient: k = (r * (1 + r)^n) / ((1 + r)^n - 1)
  const power = Math.pow(1 + monthlyRate, months);
  const annuityCoeff = (monthlyRate * power) / (power - 1);
  const monthlyPayment = amount * annuityCoeff;
  const totalPayment = monthlyPayment * months;
  const totalInterest = totalPayment - amount;

  steps.push({
    stepNumber: 1,
    description: 'Ежемесячная процентная ставка r = Годовая ставка / 12',
    subExpression: `${annualRatePercent}% / 12`,
    subResult: `${(monthlyRate * 100).toFixed(4)}% в месяц`,
    resultingExpression: `r = ${(monthlyRate * 100).toFixed(4)}%`,
  });

  steps.push({
    stepNumber: 2,
    description: 'Аннуитетный платеж: P × (r × (1+r)ⁿ) / ((1+r)ⁿ - 1)',
    subExpression: `${formatResultNumber(amount)} × ${annuityCoeff.toFixed(6)}`,
    subResult: `${formatResultNumber(monthlyPayment)} в месяц`,
    resultingExpression: `${formatResultNumber(monthlyPayment)}`,
  });

  steps.push({
    stepNumber: 3,
    description: 'Общая сумма выплат за весь срок кредита',
    subExpression: `${formatResultNumber(monthlyPayment)} × ${months} мес.`,
    subResult: formatResultNumber(totalPayment),
    resultingExpression: formatResultNumber(totalPayment),
  });

  steps.push({
    stepNumber: 4,
    description: 'Начисленные проценты (переплата банку)',
    subExpression: `${formatResultNumber(totalPayment)} − ${formatResultNumber(amount)}`,
    subResult: formatResultNumber(totalInterest),
    resultingExpression: formatResultNumber(totalInterest),
  });

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    steps,
  };
}
