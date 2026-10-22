export type CalculatorMode =
  | 'standard'
  | 'scientific'
  | 'programmer'
  | 'fractions'
  | 'converter'
  | 'finance'
  | 'graphs';

export interface GraphFunction {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  showDerivative?: boolean;
  label?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type AngleMode = 'DEG' | 'RAD';

export type ProgrammerBase = 'HEX' | 'DEC' | 'OCT' | 'BIN';

export type WordSize = 'QWORD' | 'DWORD' | 'WORD' | 'BYTE';

export type AppTheme =
  | 'win-dark'
  | 'win-light'
  | 'mac-dark'
  | 'mac-light'
  | 'cyberpunk'
  | 'retro-win98'
  | 'nordic'
  | 'oled'
  | 'sakura';

export type AccentColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';

export interface CalculationStep {
  stepNumber: number;
  description: string;
  subExpression: string;
  subResult: string;
  resultingExpression: string;
}

export interface CalculationRecord {
  id: string;
  timestamp: number;
  expression: string;
  result: string;
  rawResult: number;
  steps: CalculationStep[];
  note?: string;
  mode: CalculatorMode;
}

export interface MemoryItem {
  id: string;
  value: number;
  timestamp: number;
}

export interface AppSettings {
  theme: AppTheme;
  accentColor: AccentColor;
  keySoundType: 'mechanical' | 'soft' | 'beep' | 'off';
  decimalPlaces: number;
  autoExpandSteps: boolean;
  historyLimit: number;
}
