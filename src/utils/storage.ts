import {
  AppSettings,
  BankQuestion,
  ExamPackage,
  LearningObjectives,
  SchoolIdentity,
} from '../types/exam';
import {
  DEFAULT_IDENTITY,
  DEFAULT_OBJECTIVES,
  DEFAULT_SETTINGS,
  SEED_BANK_QUESTIONS,
  SEED_PACKAGES,
} from '../data/seedData';

const STORAGE_KEYS = {
  IDENTITY: 'smart_teacher_identity_v1',
  OBJECTIVES: 'smart_teacher_objectives_v1',
  PACKAGES: 'smart_teacher_packages_v1',
  BANK: 'smart_teacher_bank_v1',
  SETTINGS: 'smart_teacher_settings_v1',
} as const;

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function loadIdentity(): SchoolIdentity {
  return safeRead<SchoolIdentity>(STORAGE_KEYS.IDENTITY, DEFAULT_IDENTITY);
}

export function saveIdentity(identity: SchoolIdentity): void {
  safeWrite(STORAGE_KEYS.IDENTITY, identity);
}

export function loadObjectives(): LearningObjectives {
  return safeRead<LearningObjectives>(
    STORAGE_KEYS.OBJECTIVES,
    DEFAULT_OBJECTIVES
  );
}

export function saveObjectives(objectives: LearningObjectives): void {
  safeWrite(STORAGE_KEYS.OBJECTIVES, objectives);
}

export function loadPackages(): ExamPackage[] {
  return safeRead<ExamPackage[]>(STORAGE_KEYS.PACKAGES, SEED_PACKAGES);
}

export function savePackages(packages: ExamPackage[]): void {
  safeWrite(STORAGE_KEYS.PACKAGES, packages);
}

export function loadBankQuestions(): BankQuestion[] {
  return safeRead<BankQuestion[]>(STORAGE_KEYS.BANK, SEED_BANK_QUESTIONS);
}

export function saveBankQuestions(bank: BankQuestion[]): void {
  safeWrite(STORAGE_KEYS.BANK, bank);
}

export function loadSettings(): AppSettings {
  return safeRead<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  safeWrite(STORAGE_KEYS.SETTINGS, settings);
}

export interface BackupPayload {
  exportedAt: string;
  app: 'SMART TEACHER';
  identity: SchoolIdentity;
  objectives: LearningObjectives;
  packages: ExamPackage[];
  bank: BankQuestion[];
  settings: AppSettings;
}

export function exportAllDataAsJson(payload: Omit<BackupPayload, 'exportedAt' | 'app'>): string {
  const full: BackupPayload = {
    exportedAt: new Date().toISOString(),
    app: 'SMART TEACHER',
    ...payload,
  };
  return JSON.stringify(full, null, 2);
}

export function resetAllStorageToDefaults(): {
  identity: SchoolIdentity;
  objectives: LearningObjectives;
  packages: ExamPackage[];
  bank: BankQuestion[];
  settings: AppSettings;
} {
  saveIdentity(DEFAULT_IDENTITY);
  saveObjectives(DEFAULT_OBJECTIVES);
  savePackages(SEED_PACKAGES);
  saveBankQuestions(SEED_BANK_QUESTIONS);
  saveSettings(DEFAULT_SETTINGS);
  return {
    identity: DEFAULT_IDENTITY,
    objectives: DEFAULT_OBJECTIVES,
    packages: SEED_PACKAGES,
    bank: SEED_BANK_QUESTIONS,
    settings: DEFAULT_SETTINGS,
  };
}
