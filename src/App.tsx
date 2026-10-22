import React, { useState, useEffect, useCallback, useTransition } from 'react';
import {
  CalculatorMode,
  AngleMode,
  ProgrammerBase,
  WordSize,
  CalculationRecord,
  CalculationStep,
  MemoryItem,
  AppSettings,
  AppTheme,
  AccentColor,
  UserProfile,
} from './types/calculator';
import {
  formatResultNumber,
  unformatNumber,
  evaluateExpressionWithSteps,
  playKeySound,
  factorial,
  getMaskForWordSize,
} from './utils/calculatorEngine';
import { evaluateFractionStringWithSteps } from './utils/fractionEngine';
import { TitleBar } from './components/TitleBar';
import { ModeSelector } from './components/ModeSelector';
import { Display } from './components/Display';
import { MemoryBar } from './components/MemoryBar';
import { Keypad } from './components/Keypad';
import { FractionsKeypad } from './components/FractionsKeypad';
import { ConverterView } from './components/ConverterView';
import { FinanceView } from './components/FinanceView';
import { GraphingView } from './components/GraphingView';
import { SolutionsPanel } from './components/SolutionsPanel';
import { ShortcutsModal } from './components/ShortcutsModal';
import { SettingsModal } from './components/SettingsModal';
import { PhotoMathModal } from './components/PhotoMathModal';
import { AccountModal } from './components/AccountModal';
import { GmailSendConfirmModal } from './components/GmailSendConfirmModal';
import { initAuth, mapFirebaseUser } from './utils/googleAuth';
import { Language, getTranslation } from './utils/i18n';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'win-dark',
  accentColor: 'blue',
  keySoundType: 'mechanical',
  decimalPlaces: 10,
  autoExpandSteps: true,
  historyLimit: 50,
};

// Seed initial realistic solutions including fractions and conversions
const SEED_RECORDS: CalculationRecord[] = [
  {
    id: 'seed-frac',
    timestamp: Date.now() - 1000 * 60 * 3,
    expression: '1 3/4 + 2 1/6',
    result: '3 11/12 (≈ 3.9167)',
    rawResult: 3.9166667,
    steps: [
      {
        stepNumber: 1,
        description: 'Перевод 1 3/4 в неправильную дробь: (1 × 4 + 3)/4',
        subExpression: '1 × 4 + 3',
        subResult: '7/4',
        resultingExpression: '7/4 + 2 1/6',
      },
      {
        stepNumber: 2,
        description: 'Перевод 2 1/6 в неправильную дробь: (2 × 6 + 1)/6',
        subExpression: '2 × 6 + 1',
        subResult: '13/6',
        resultingExpression: '7/4 + 13/6',
      },
      {
        stepNumber: 3,
        description: 'Приведение к общему знаменателю (НОЗ = 12)',
        subExpression: 'НОК(4, 6)',
        subResult: '12',
        resultingExpression: '21/12 + 26/12',
      },
      {
        stepNumber: 4,
        description: 'Сложение числителей: 21 + 26 = 47',
        subExpression: '21 + 26',
        subResult: '47',
        resultingExpression: '47/12',
      },
      {
        stepNumber: 5,
        description: 'Выделение целой части: 47 ÷ 12 = 3 целых и 11/12',
        subExpression: '47 ÷ 12',
        subResult: '3 11/12',
        resultingExpression: '3 11/12',
      },
    ],
    note: 'Сложение дробей',
    mode: 'fractions',
  },
  {
    id: 'seed-1',
    timestamp: Date.now() - 1000 * 60 * 12,
    expression: '(250 + 150) × 4 - 300',
    result: '1 300',
    rawResult: 1300,
    steps: [
      {
        stepNumber: 1,
        description: 'Вычисление выражения в скобках',
        subExpression: '250 + 150',
        subResult: '400',
        resultingExpression: '400 × 4 - 300',
      },
      {
        stepNumber: 2,
        description: 'Умножение 400 × 4',
        subExpression: '400 × 4',
        subResult: '1 600',
        resultingExpression: '1600 - 300',
      },
      {
        stepNumber: 3,
        description: 'Вычитание 1600 − 300',
        subExpression: '1600 − 300',
        subResult: '1 300',
        resultingExpression: '1300',
      },
    ],
    note: 'Расчет проекта',
    mode: 'standard',
  },
  {
    id: 'seed-2',
    timestamp: Date.now() - 1000 * 60 * 18,
    expression: 'sqrt(144) + 5 ^ 2',
    result: '37',
    rawResult: 37,
    steps: [
      {
        stepNumber: 1,
        description: 'Квадратный корень √(144)',
        subExpression: 'sqrt(144)',
        subResult: '12',
        resultingExpression: '12 + 5 ^ 2',
      },
      {
        stepNumber: 2,
        description: 'Возведение в степень 5 ^ 2',
        subExpression: '5 ^ 2',
        subResult: '25',
        resultingExpression: '12 + 25',
      },
      {
        stepNumber: 3,
        description: 'Сложение 12 + 25',
        subExpression: '12 + 25',
        subResult: '37',
        resultingExpression: '37',
      },
    ],
    note: 'Теорема Пифагора',
    mode: 'scientific',
  },
];

export default function App() {
  const [, startTransition] = useTransition();

  // App settings state with persistent storage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('calc_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('calc_settings', JSON.stringify(settings));
    } catch {
      // Safe fallback
    }
  }, [settings]);

  // Derived OS theme and dark mode
  const isDark = ['win-dark', 'mac-dark', 'cyberpunk', 'nordic', 'oled', 'sakura'].includes(
    settings.theme
  );
  const osTheme = settings.theme.startsWith('mac') ? 'macos' : 'windows';

  // Language state
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('calc_lang');
      return (saved as Language) || 'ru';
    } catch {
      return 'ru';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('calc_lang', lang);
    } catch {
      // Safe fallback
    }
  }, [lang]);

  // Window state
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(true);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPhotoMath, setShowPhotoMath] = useState<boolean>(false);

  // Calculator logic state
  const [mode, setMode] = useState<CalculatorMode>('standard');
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
  const [programmerBase, setProgrammerBase] = useState<ProgrammerBase>('DEC');
  const [wordSize, setWordSize] = useState<WordSize>('QWORD');

  const [displayValue, setDisplayValue] = useState<string>('0');
  const [formula, setFormula] = useState<string>('');
  const [awaitingNewOperand, setAwaitingNewOperand] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Memory registers
  const [memoryList, setMemoryList] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('calc_memory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // History and Solutions Tape
  const [records, setRecords] = useState<CalculationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('calc_records');
      return saved ? JSON.parse(saved) : SEED_RECORDS;
    } catch {
      return SEED_RECORDS;
    }
  });

  // Persist records
  useEffect(() => {
    try {
      localStorage.setItem('calc_records', JSON.stringify(records));
    } catch {
      // Safe fallback
    }
  }, [records]);

  // Persist memory
  useEffect(() => {
    try {
      localStorage.setItem('calc_memory', JSON.stringify(memoryList));
    } catch {
      // Safe fallback
    }
  }, [memoryList]);

  // User Profile state (Firebase Auth with Gmail scopes)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showAccount, setShowAccount] = useState<boolean>(false);
  const [gmailModalData, setGmailModalData] = useState<{
    isOpen: boolean;
    defaultRecipient?: string;
    defaultSubject: string;
    defaultBody: string;
    defaultHtml?: string;
  }>({
    isOpen: false,
    defaultRecipient: '',
    defaultSubject: '',
    defaultBody: '',
    defaultHtml: '',
  });

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (fbUser) => {
        setUser(mapFirebaseUser(fbUser));
      },
      () => {
        setUser(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleShareCalculationViaGmail = useCallback(
    (rec: CalculationRecord) => {
      const subject = `ВексКалькулятор: Решение ${rec.expression} = ${rec.result}`;
      const stepsText = rec.steps
        .map(
          (s) =>
            `Шаг ${s.stepNumber}: ${s.description}\n  ${s.subExpression} = ${s.subResult}\n  Итог: ${s.resultingExpression}`
        )
        .join('\n\n');

      const body = `Здравствуйте!\n\nНаправляю подробный пошаговый расчет из ВексКалькулятора:\n\nВыражение: ${rec.expression}\nРезультат: ${rec.result}\n\nПошаговое решение:\n${stepsText}\n\n${rec.note ? `Заметка: ${rec.note}\n` : ''}\nДата: ${new Date(rec.timestamp).toLocaleString()}\nСоздано в ВексКалькуляторе.`;

      const stepsHtml = rec.steps
        .map(
          (s) =>
            `<div style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #2563eb;">
              <strong style="color: #1e293b;">Шаг ${s.stepNumber}:</strong> ${s.description}<br/>
              <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${s.subExpression} = ${s.subResult}</code>
            </div>`
        )
        .join('');

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #cbd5e1; border-radius: 14px;">
          <h2 style="color: #2563eb; margin-top: 0;">ВексКалькулятор — Пошаговое решение</h2>
          <div style="background: #eff6ff; padding: 16px; border-radius: 10px; margin-bottom: 18px;">
            <div style="font-size: 14px; color: #475569;">Выражение:</div>
            <div style="font-size: 18px; font-weight: bold; color: #1e293b; font-family: monospace;">${rec.expression}</div>
            <div style="font-size: 14px; color: #475569; margin-top: 8px;">Результат:</div>
            <div style="font-size: 24px; font-weight: bold; color: #16a34a; font-family: monospace;">${rec.result}</div>
          </div>
          <h3 style="color: #334155; font-size: 15px;">Шаги решения:</h3>
          ${stepsHtml}
          ${rec.note ? `<p style="margin-top: 14px; font-style: italic; color: #64748b;">Заметка: ${rec.note}</p>` : ''}
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px;" />
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">Отправлено с помощью Google Workspace Gmail API из ВексКалькулятора</p>
        </div>
      `;

      setGmailModalData({
        isOpen: true,
        defaultRecipient: user?.email || '',
        defaultSubject: subject,
        defaultBody: body,
        defaultHtml: html,
      });
    },
    [user]
  );

  const handleShareGraphViaGmail = useCallback(
    (subject: string, body: string, htmlBody?: string) => {
      setGmailModalData({
        isOpen: true,
        defaultRecipient: user?.email || '',
        defaultSubject: subject,
        defaultBody: body,
        defaultHtml: htmlBody,
      });
    },
    [user]
  );

  const handleOpenGmailCompose = useCallback(
    (type: 'calculation' | 'graph') => {
      if (type === 'graph') {
        setMode('graphs');
        handleShareGraphViaGmail(
          'ВексКалькулятор: Математический график',
          'Делюсь математическим графиком функций из ВексКалькулятора.'
        );
      } else {
        const topRec = records[0];
        if (topRec) {
          handleShareCalculationViaGmail(topRec);
        } else {
          setGmailModalData({
            isOpen: true,
            defaultRecipient: user?.email || '',
            defaultSubject: 'ВексКалькулятор: Вычисления',
            defaultBody: 'Здравствуйте!\n\nДелюсь математическими расчетами из ВексКалькулятора.',
          });
        }
      }
    },
    [records, user, handleShareCalculationViaGmail, handleShareGraphViaGmail]
  );

  // Sound feedback helper
  const triggerSound = useCallback(
    (type: 'click' | 'operator' | 'equals' | 'clear' | 'error') => {
      if (settings.keySoundType !== 'off') {
        playKeySound(type);
      }
    },
    [settings.keySoundType]
  );

  const clearError = () => {
    if (errorMessage) setErrorMessage(null);
  };

  // --- Calculator Input Handlers ---
  const handleDigit = useCallback(
    (digit: string) => {
      clearError();
      triggerSound('click');

      if (displayValue === '0' || awaitingNewOperand) {
        setDisplayValue(digit);
        setAwaitingNewOperand(false);
      } else {
        if (displayValue.replace(/\s+/g, '').length >= 16) return;
        setDisplayValue(displayValue + digit);
      }
    },
    [displayValue, awaitingNewOperand, triggerSound]
  );

  const handleDecimal = useCallback(() => {
    clearError();
    triggerSound('click');

    if (awaitingNewOperand) {
      setDisplayValue('0.');
      setAwaitingNewOperand(false);
      return;
    }

    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  }, [displayValue, awaitingNewOperand, triggerSound]);

  const handleToggleSign = useCallback(() => {
    clearError();
    triggerSound('click');
    const num = unformatNumber(displayValue);
    if (num === 0) return;
    const toggled = -num;
    setDisplayValue(formatResultNumber(toggled, settings.decimalPlaces));
  }, [displayValue, settings.decimalPlaces, triggerSound]);

  const handleBackspace = useCallback(() => {
    clearError();
    triggerSound('click');

    if (awaitingNewOperand) return;

    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  }, [displayValue, awaitingNewOperand, triggerSound]);

  const handleClearEntry = useCallback(() => {
    clearError();
    triggerSound('clear');
    setDisplayValue('0');
  }, [triggerSound]);

  const handleClear = useCallback(() => {
    clearError();
    triggerSound('clear');
    setDisplayValue('0');
    setFormula('');
    setAwaitingNewOperand(false);
  }, [triggerSound]);

  const handleOperator = useCallback(
    (op: string) => {
      clearError();
      triggerSound('operator');

      if (op === '(') {
        setFormula((prev) => prev + '(');
        setAwaitingNewOperand(false);
        return;
      }

      if (op === ')') {
        setFormula((prev) => prev + displayValue + ')');
        setAwaitingNewOperand(true);
        return;
      }

      const trimmedFormula = formula.trim();
      const lastChar = trimmedFormula.slice(-1);
      const isLastOp = ['+', '−', '×', '÷', '^', '%'].includes(lastChar);

      if (awaitingNewOperand && isLastOp && !trimmedFormula.endsWith(')')) {
        setFormula(trimmedFormula.slice(0, -1) + ' ' + op + ' ');
      } else {
        setFormula((prev) => prev + (prev.endsWith(')') ? '' : displayValue) + ' ' + op + ' ');
        setAwaitingNewOperand(true);
      }
    },
    [formula, displayValue, awaitingNewOperand, triggerSound]
  );

  const handleEquals = useCallback(() => {
    clearError();

    let fullExpr = formula + (formula.endsWith(')') ? '' : displayValue);
    fullExpr = fullExpr.trim();

    if (!fullExpr) return;

    const openParens = (fullExpr.match(/\(/g) || []).length;
    const closeParens = (fullExpr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      fullExpr += ')'.repeat(openParens - closeParens);
    }

    const evalResult = evaluateExpressionWithSteps(fullExpr, angleMode);

    if (evalResult.error) {
      triggerSound('error');
      setErrorMessage(evalResult.error);
      setDisplayValue('Ошибка');
      setAwaitingNewOperand(true);
      return;
    }

    triggerSound('equals');

    const newRecord: CalculationRecord = {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      expression: fullExpr,
      result: evalResult.formattedResult,
      rawResult: evalResult.result,
      steps: evalResult.steps,
      mode,
    };

    startTransition(() => {
      setRecords((prev) => [newRecord, ...prev]);
      setDisplayValue(evalResult.formattedResult);
      setFormula('');
      setAwaitingNewOperand(true);
    });
  }, [formula, displayValue, angleMode, mode, triggerSound]);

  const handleScientificFunc = useCallback(
    (func: string) => {
      clearError();
      triggerSound('operator');

      const currentNum = unformatNumber(displayValue);

      if (func === 'pi') {
        setDisplayValue(Math.PI.toString());
        setAwaitingNewOperand(true);
        return;
      }

      if (func === 'e') {
        setDisplayValue(Math.E.toString());
        setAwaitingNewOperand(true);
        return;
      }

      let subExpr = '';
      let immediateResult = 0;
      let label = '';

      switch (func) {
        case 'sqrt':
          if (currentNum < 0) {
            triggerSound('error');
            setErrorMessage('Корень из отрицательного числа');
            return;
          }
          subExpr = `sqrt(${currentNum})`;
          immediateResult = Math.sqrt(currentNum);
          label = `Квадратный корень √(${currentNum})`;
          break;
        case 'sqr':
          subExpr = `(${currentNum})²`;
          immediateResult = currentNum * currentNum;
          label = `Возведение в квадрат (${currentNum})²`;
          break;
        case 'recip':
          if (currentNum === 0) {
            triggerSound('error');
            setErrorMessage('Деление на ноль');
            return;
          }
          subExpr = `1/(${currentNum})`;
          immediateResult = 1 / currentNum;
          label = `Обратная величина 1/(${currentNum})`;
          break;
        case 'sin': {
          const rad = angleMode === 'DEG' ? (currentNum * Math.PI) / 180 : currentNum;
          subExpr = `sin(${currentNum})`;
          immediateResult = Math.sin(rad);
          label = `Синус sin(${currentNum}${angleMode === 'DEG' ? '°' : ''})`;
          break;
        }
        case 'cos': {
          const rad = angleMode === 'DEG' ? (currentNum * Math.PI) / 180 : currentNum;
          subExpr = `cos(${currentNum})`;
          immediateResult = Math.cos(rad);
          label = `Косинус cos(${currentNum}${angleMode === 'DEG' ? '°' : ''})`;
          break;
        }
        case 'tan': {
          const rad = angleMode === 'DEG' ? (currentNum * Math.PI) / 180 : currentNum;
          subExpr = `tan(${currentNum})`;
          immediateResult = Math.tan(rad);
          label = `Тангенс tan(${currentNum}${angleMode === 'DEG' ? '°' : ''})`;
          break;
        }
        case 'log':
          if (currentNum <= 0) {
            triggerSound('error');
            setErrorMessage('Логарифм неположительного числа');
            return;
          }
          subExpr = `log(${currentNum})`;
          immediateResult = Math.log10(currentNum);
          label = `Десятичный логарифм log₁₀(${currentNum})`;
          break;
        case 'ln':
          if (currentNum <= 0) {
            triggerSound('error');
            setErrorMessage('Натуральный логарифм неположительного числа');
            return;
          }
          subExpr = `ln(${currentNum})`;
          immediateResult = Math.log(currentNum);
          label = `Натуральный логарифм ln(${currentNum})`;
          break;
        case 'fact':
          if (currentNum < 0 || !Number.isInteger(currentNum)) {
            triggerSound('error');
            setErrorMessage('Факториал целого неотрицательного числа');
            return;
          }
          subExpr = `${currentNum}!`;
          immediateResult = factorial(currentNum);
          label = `Факториал ${currentNum}!`;
          break;
        case 'abs':
          subExpr = `|${currentNum}|`;
          immediateResult = Math.abs(currentNum);
          label = `Модуль |${currentNum}|`;
          break;
        case 'exp':
          subExpr = `e^(${currentNum})`;
          immediateResult = Math.exp(currentNum);
          label = `Экспонента e^(${currentNum})`;
          break;
        case 'tenPower':
          subExpr = `10^(${currentNum})`;
          immediateResult = Math.pow(10, currentNum);
          label = `10 в степени ${currentNum}`;
          break;
        default:
          return;
      }

      const formatted = formatResultNumber(immediateResult, settings.decimalPlaces);

      const record: CalculationRecord = {
        id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        expression: subExpr,
        result: formatted,
        rawResult: immediateResult,
        steps: [
          {
            stepNumber: 1,
            description: label,
            subExpression: subExpr,
            subResult: formatted,
            resultingExpression: formatted,
          },
        ],
        mode,
      };

      setRecords((prev) => [record, ...prev]);
      setDisplayValue(formatted);
      setAwaitingNewOperand(true);
    },
    [displayValue, angleMode, mode, settings.decimalPlaces, triggerSound]
  );

  const handleBitwise = useCallback(
    (op: string) => {
      clearError();
      triggerSound('operator');

      const mask = getMaskForWordSize(wordSize);
      const val = BigInt(Math.trunc(unformatNumber(displayValue))) & mask;

      if (op === 'NOT') {
        const res = (~val) & mask;
        const resFormatted = formatResultNumber(Number(res));
        setDisplayValue(resFormatted);
        setAwaitingNewOperand(true);
        return;
      }

      const symbolMap: Record<string, string> = {
        AND: '&',
        OR: '|',
        XOR: '^',
        LSH: '<<',
        RSH: '>>',
      };

      setFormula(`${val} ${symbolMap[op] || op} `);
      setAwaitingNewOperand(true);
    },
    [displayValue, wordSize, triggerSound]
  );

  // --- Memory Register Handlers ---
  const handleMemoryClear = () => {
    triggerSound('clear');
    setMemoryList([]);
  };

  const handleMemoryRecall = () => {
    triggerSound('click');
    if (memoryList.length > 0) {
      setDisplayValue(formatResultNumber(memoryList[0].value, settings.decimalPlaces));
      setAwaitingNewOperand(true);
    }
  };

  const handleMemoryAdd = () => {
    triggerSound('operator');
    const val = unformatNumber(displayValue);
    setMemoryList((prev) => {
      if (prev.length === 0) {
        return [{ id: Date.now().toString(), value: val, timestamp: Date.now() }];
      }
      const updated = [...prev];
      updated[0] = { ...updated[0], value: updated[0].value + val };
      return updated;
    });
  };

  const handleMemorySub = () => {
    triggerSound('operator');
    const val = unformatNumber(displayValue);
    setMemoryList((prev) => {
      if (prev.length === 0) {
        return [{ id: Date.now().toString(), value: -val, timestamp: Date.now() }];
      }
      const updated = [...prev];
      updated[0] = { ...updated[0], value: updated[0].value - val };
      return updated;
    });
  };

  const handleMemoryStore = () => {
    triggerSound('operator');
    const val = unformatNumber(displayValue);
    setMemoryList((prev) => [
      { id: Date.now().toString(), value: val, timestamp: Date.now() },
      ...prev,
    ]);
  };

  const handleSelectMemoryItem = (val: number) => {
    triggerSound('click');
    setDisplayValue(formatResultNumber(val, settings.decimalPlaces));
    setAwaitingNewOperand(true);
  };

  const handleDeleteMemoryItem = (id: string) => {
    setMemoryList((prev) => prev.filter((item) => item.id !== id));
  };

  // --- Solutions Panel Interaction Handlers ---
  const handleUseResult = (resultStr: string) => {
    triggerSound('click');
    setDisplayValue(resultStr);
    setAwaitingNewOperand(true);
  };

  const handleLoadExpression = (expr: string) => {
    triggerSound('click');
    setFormula(expr);
    setDisplayValue('0');
    setAwaitingNewOperand(false);
  };

  const handleUpdateNote = (id: string, note: string) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, note } : r)));
  };

  const handleAddSample = (sampleExpr: string) => {
    const res = evaluateExpressionWithSteps(sampleExpr, angleMode);
    const newRecord: CalculationRecord = {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      expression: sampleExpr,
      result: res.formattedResult,
      rawResult: res.result,
      steps: res.steps,
      mode: sampleExpr.includes('sqrt') || sampleExpr.includes('^') ? 'scientific' : 'standard',
    };
    setRecords((prev) => [newRecord, ...prev]);
    setDisplayValue(res.formattedResult);
    setFormula('');
    setAwaitingNewOperand(true);
    triggerSound('equals');
  };

  const handleClearAllRecords = () => {
    triggerSound('clear');
    setRecords([]);
  };

  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const handlePhotoMathSolve = (
    expr: string,
    targetMode: 'standard' | 'scientific' | 'fractions' | 'finance',
    note?: string
  ) => {
    let finalResult = '';
    let rawResult = 0;
    let steps: CalculationStep[] = [];
    let effectiveMode = targetMode;

    if (
      targetMode === 'fractions' ||
      expr.includes('/') ||
      /[½⅓⅔¼¾⅕⅙⅚⅛⅜⅝⅞]/.test(expr)
    ) {
      effectiveMode = 'fractions';
      const fracRes = evaluateFractionStringWithSteps(expr);
      finalResult = fracRes.resultText;
      rawResult = fracRes.rawResult;
      steps = fracRes.steps;
    } else {
      const res = evaluateExpressionWithSteps(expr, angleMode);
      finalResult = res.formattedResult;
      rawResult = res.result;
      steps = res.steps;
    }

    setMode(effectiveMode);

    const newRecord: CalculationRecord = {
      id: `photo-${Date.now()}`,
      timestamp: Date.now(),
      expression: expr,
      result: finalResult,
      rawResult: rawResult,
      steps: steps,
      mode: effectiveMode,
      note: note || getTranslation('photoMath', lang),
    };

    setRecords((prev) => [newRecord, ...prev]);
    setDisplayValue(finalResult);
    setFormula('');
    setAwaitingNewOperand(true);
    triggerSound('equals');
  };

  // Global physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key;

      if (key >= '0' && key <= '9') {
        e.preventDefault();
        handleDigit(key);
      } else if (key === '.' || key === ',') {
        e.preventDefault();
        handleDecimal();
      } else if (key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (key === '-') {
        e.preventDefault();
        handleOperator('−');
      } else if (key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (key === '%') {
        e.preventDefault();
        handleOperator('%');
      } else if (key === '(' || key === ')') {
        e.preventDefault();
        handleOperator(key);
      } else if (key === '^') {
        e.preventDefault();
        handleOperator('^');
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (key === 'Escape' || key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      } else if (key === 'Delete') {
        e.preventDefault();
        handleClearEntry();
      } else if (key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowHistory((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleDigit,
    handleDecimal,
    handleOperator,
    handleEquals,
    handleBackspace,
    handleClear,
    handleClearEntry,
  ]);

  // Dynamic Theme Container & Background Classes
  const getThemeClasses = () => {
    switch (settings.theme) {
      case 'win-light':
        return {
          bg: 'bg-gradient-to-br from-slate-100 via-slate-200 to-blue-50 text-slate-900',
          window: 'bg-white/95 border-slate-200 shadow-slate-300/60 text-slate-900',
        };
      case 'mac-dark':
        return {
          bg: 'bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 text-white',
          window: 'bg-neutral-900/95 border-neutral-800 shadow-black/70 text-white',
        };
      case 'mac-light':
        return {
          bg: 'bg-gradient-to-br from-stone-100 via-stone-200 to-amber-50 text-stone-900',
          window: 'bg-stone-50/95 border-stone-200 shadow-stone-300/60 text-stone-900',
        };
      case 'cyberpunk':
        return {
          bg: 'bg-gradient-to-br from-zinc-950 via-black to-emerald-950 text-emerald-400 font-mono',
          window: 'bg-black/95 border-emerald-500 shadow-emerald-500/20 text-emerald-400',
        };
      case 'retro-win98':
        return {
          bg: 'bg-[#008080] text-black font-sans',
          window: 'bg-[#c0c0c0] border-gray-400 shadow-2xl text-black',
        };
      case 'nordic':
        return {
          bg: 'bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 text-cyan-100',
          window: 'bg-slate-900/95 border-cyan-800/80 shadow-cyan-950/40 text-cyan-100',
        };
      case 'oled':
        return {
          bg: 'bg-black text-white',
          window: 'bg-black border-neutral-800 shadow-none text-white',
        };
      case 'sakura':
        return {
          bg: 'bg-gradient-to-br from-rose-950 via-slate-950 to-pink-950 text-rose-100',
          window: 'bg-rose-950/90 border-rose-900/60 shadow-rose-950/40 text-rose-100',
        };
      case 'win-dark':
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100',
          window: 'bg-slate-900/90 border-slate-800 shadow-black/60 text-slate-100',
        };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-2 sm:p-4 md:p-6 transition-colors duration-200 ${themeClasses.bg}`}
    >
      {/* Main Window Frame Container */}
      <main
        className={`w-full transition-all duration-300 overflow-hidden shadow-2xl border backdrop-blur-xl ${
          isFullscreen
            ? 'fixed inset-0 z-40 rounded-none'
            : isPinned
            ? 'max-w-5xl rounded-2xl ring-2 ring-blue-500/50 shadow-blue-500/10'
            : 'max-w-5xl rounded-2xl'
        } ${themeClasses.window}`}
      >
        {/* Title Bar */}
        <TitleBar
          osTheme={osTheme}
          setOsTheme={(t) =>
            setSettings((prev) => ({
              ...prev,
              theme: t === 'macos' ? 'mac-dark' : 'win-dark',
            }))
          }
          isDark={isDark}
          setIsDark={(d) =>
            setSettings((prev) => ({
              ...prev,
              theme: d ? 'win-dark' : 'win-light',
            }))
          }
          soundEnabled={settings.keySoundType !== 'off'}
          setSoundEnabled={(val) =>
            setSettings((prev) => ({
              ...prev,
              keySoundType: val ? 'mechanical' : 'off',
            }))
          }
          isPinned={isPinned}
          setIsPinned={setIsPinned}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          historyCount={records.length}
          onOpenShortcuts={() => setShowShortcuts(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenPhotoMath={() => setShowPhotoMath(true)}
          lang={lang}
          setLang={setLang}
          user={user}
          onOpenAccount={() => setShowAccount(true)}
          activeMode={mode}
          onSelectMode={setMode}
        />

        {/* Dual-Pane Layout: Calculator & Solutions Tape */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
          {/* Left Column: Calculator Core / Mode Views */}
          <div
            className={`flex flex-col transition-all ${
              showHistory ? 'md:col-span-7 lg:col-span-6' : 'md:col-span-12'
            }`}
          >
            {/* Mode Selector */}
            <ModeSelector
              mode={mode}
              setMode={setMode}
              angleMode={angleMode}
              setAngleMode={setAngleMode}
              wordSize={wordSize}
              setWordSize={setWordSize}
              isDark={isDark}
              lang={lang}
            />

            {/* View Switching based on active mode */}
            {mode === 'graphs' ? (
              <GraphingView
                isDark={isDark}
                lang={lang}
                onShareViaGmail={handleShareGraphViaGmail}
              />
            ) : mode === 'fractions' ? (
              <FractionsKeypad
                onAddRecord={(rec) => setRecords((prev) => [rec, ...prev])}
                triggerSound={triggerSound}
                isDark={isDark}
                accentClass={settings.accentColor}
              />
            ) : mode === 'converter' ? (
              <ConverterView
                onAddRecord={(rec) => setRecords((prev) => [rec, ...prev])}
                triggerSound={triggerSound}
                isDark={isDark}
              />
            ) : mode === 'finance' ? (
              <FinanceView
                onAddRecord={(rec) => setRecords((prev) => [rec, ...prev])}
                triggerSound={triggerSound}
                isDark={isDark}
              />
            ) : (
              <>
                {/* Display screen */}
                <Display
                  expression={formula}
                  displayValue={displayValue}
                  mode={mode}
                  programmerBase={programmerBase}
                  setProgrammerBase={setProgrammerBase}
                  wordSize={wordSize}
                  hasMemory={memoryList.length > 0}
                  isDark={isDark}
                  errorMessage={errorMessage}
                />

                {/* Memory Bar */}
                {mode !== 'programmer' && (
                  <MemoryBar
                    memoryList={memoryList}
                    onMemoryClear={handleMemoryClear}
                    onMemoryRecall={handleMemoryRecall}
                    onMemoryAdd={handleMemoryAdd}
                    onMemorySub={handleMemorySub}
                    onMemoryStore={handleMemoryStore}
                    onSelectMemoryItem={handleSelectMemoryItem}
                    onDeleteMemoryItem={handleDeleteMemoryItem}
                    isDark={isDark}
                  />
                )}

                {/* Standard / Scientific / Programmer Keypad */}
                <div className="flex-1 flex flex-col justify-end">
                  <Keypad
                    mode={mode}
                    programmerBase={programmerBase}
                    onDigit={handleDigit}
                    onOperator={handleOperator}
                    onScientificFunc={handleScientificFunc}
                    onBitwise={handleBitwise}
                    onEquals={handleEquals}
                    onClear={handleClear}
                    onClearEntry={handleClearEntry}
                    onBackspace={handleBackspace}
                    onDecimal={handleDecimal}
                    onToggleSign={handleToggleSign}
                    isDark={isDark}
                    osTheme={osTheme}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column: Все решения (Solutions Tape & Steps) */}
          {showHistory && (
            <div className="md:col-span-5 lg:col-span-6 border-t md:border-t-0 md:border-l border-slate-800/60 max-h-[720px] overflow-hidden flex flex-col">
              <SolutionsPanel
                records={records}
                onClearAll={handleClearAllRecords}
                onDeleteRecord={handleDeleteRecord}
                onUseResult={handleUseResult}
                onLoadExpression={handleLoadExpression}
                onUpdateNote={handleUpdateNote}
                onAddSample={handleAddSample}
                onClose={() => setShowHistory(false)}
                isDark={isDark}
                lang={lang}
                onShareViaGmail={handleShareCalculationViaGmail}
              />
            </div>
          )}
        </div>
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        isDark={isDark}
        lang={lang}
      />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={(newVals) =>
          setSettings((prev) => ({ ...prev, ...newVals }))
        }
        onResetSettings={() => setSettings(DEFAULT_SETTINGS)}
        lang={lang}
        setLang={setLang}
        isDark={isDark}
      />

      {/* Photo Math Recognition Modal */}
      <PhotoMathModal
        isOpen={showPhotoMath}
        onClose={() => setShowPhotoMath(false)}
        onSolveExpression={handlePhotoMathSolve}
        lang={lang}
        isDark={isDark}
      />

      {/* Google Account & Workspace Modal */}
      <AccountModal
        isOpen={showAccount}
        onClose={() => setShowAccount(false)}
        user={user}
        onUserChange={setUser}
        isDark={isDark}
        lang={lang}
        onOpenGmailCompose={handleOpenGmailCompose}
      />

      {/* Explicit Gmail Sending Confirmation Dialog (Mandatory User Consent) */}
      <GmailSendConfirmModal
        isOpen={gmailModalData.isOpen}
        onClose={() => setGmailModalData((prev) => ({ ...prev, isOpen: false }))}
        defaultRecipient={gmailModalData.defaultRecipient}
        defaultSubject={gmailModalData.defaultSubject}
        defaultBody={gmailModalData.defaultBody}
        defaultHtml={gmailModalData.defaultHtml}
        isDark={isDark}
        lang={lang}
      />
    </div>
  );
}
