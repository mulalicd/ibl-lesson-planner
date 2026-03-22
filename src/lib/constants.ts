/**
 * lib/constants.ts
 * All constants from CCA Instructions — IDSS IBL Lesson Planner v2.0
 */

export const SUBJECTS = [
  'B/H/S', 'Biologie', 'Chemie', 'Deutsch', 'Englisch', 'Erdkunde',
  'Ethik', 'Französisch', 'Geschichte', 'Gesellschaft', 'Informatik',
  'Kunst', 'Lebenskunde', 'Mathematik', 'Musik', 'Nachmittagsprogramm',
  'Nacharbeit', 'Naturkunde', 'Physik', 'Sachkunde', 'Sport',
  'Technik', 'Umweltkunde',
] as const;

export const SUBJECT_GROUPS = [
  { category: 'Sprachen', subjects: ['B/H/S', 'Deutsch', 'Englisch', 'Französisch'] },
  { category: 'Mathematik & Naturwissenschaften', subjects: ['Biologie', 'Chemie', 'Mathematik', 'Naturkunde', 'Physik', 'Umweltkunde'] },
  { category: 'Gesellschaft & Geschichte', subjects: ['Erdkunde', 'Ethik', 'Geschichte', 'Gesellschaft', 'Lebenskunde', 'Sachkunde'] },
  { category: 'Kreativität & Bewegung', subjects: ['Kunst', 'Musik', 'Sport'] },
  { category: 'Technik & Digital', subjects: ['Informatik', 'Technik'] },
  { category: 'Schulprogramm', subjects: ['Nachmittagsprogramm', 'Nacharbeit'] },
] as const;

export const SUBJECT_SPECIAL_HANDLING = new Map<string, 'school_programme' | 'interdisciplinary' | 'philosophical'>([
  ['Nachmittagsprogramm', 'school_programme'],
  ['Nacharbeit', 'school_programme'],
  ['Lebenskunde', 'interdisciplinary'],
  ['Ethik', 'philosophical'],
]);

export const TIER_LABELS = {
  MICRO:    { bs: 'Mikro čas',      de: 'Mikro-Stunde',      en: 'Micro lesson' },
  STANDARD: { bs: 'Standardni čas', de: 'Standard-Stunde',   en: 'Standard lesson' },
  EXTENDED: { bs: 'Produženi čas',  de: 'Erweiterte Stunde', en: 'Extended lesson' },
} as const;

export const TIER_COLORS = {
  MICRO:    'bg-emerald-100 text-emerald-800 border-emerald-200',
  STANDARD: 'bg-blue-100 text-blue-800 border-blue-200',
  EXTENDED: 'bg-amber-100 text-amber-800 border-amber-200',
} as const;

export const LANGUAGE_LABELS = {
  bosnian: 'Bosanski',
  german:  'Deutsch',
  english: 'English',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED:       'Sesija je istekla. Molimo prijavite se ponovo.',
  INVALID_INPUT:      'Molimo popunite sva obavezna polja ispravno.',
  RATE_LIMIT:         'Sistem je trenutno preopterećen. Sačekajte 1 minutu.',
  GENERATION_FAILED:  'Greška pri generisanju plana. Pokušajte ponovo.',
  SAVE_FAILED:        'Plan je generisan ali nije sačuvan. Kopirajte tekst ručno.',
  NETWORK_ERROR:      'Problem s internet vezom. Provjerite konekciju.',
  NOT_FOUND:          'Plan nije pronađen.',
  EXPORT_FAILED:      'Greška pri izvozu u Word. Pokušajte ponovo.',
  ALL_KEYS_EXHAUSTED: 'Svi API ključevi su privremeno preopterećeni.',
} as const;

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

export const ZPD_THRESHOLDS = {
  SHORT_INPUT:  30,
  MEDIUM_INPUT: 100,
} as const;

export function deriveTier(durationMin: number): 'MICRO' | 'STANDARD' | 'EXTENDED' {
  if (durationMin <= 45) return 'MICRO';
  if (durationMin <= 90) return 'STANDARD';
  return 'EXTENDED';
}

export const TIER_CONFIG = {
  MICRO:    { label: 'Mikro čas',      range: '≤45 min',  hookMin: '3-5',  investigationMin: '20-25', conclusionMin: '10-12', evidenceMax: 2, socraticCount: 2, productComplexity: 'quick' },
  STANDARD: { label: 'Standardni čas', range: '46-90 min', hookMin: '5-8',  investigationMin: '40-50', conclusionMin: '15-20', evidenceMax: 3, socraticCount: 3, productComplexity: 'standard' },
  EXTENDED: { label: 'Produženi čas',  range: '91+ min',   hookMin: '8-12', investigationMin: '60-75', conclusionMin: '20-30', evidenceMax: 5, socraticCount: 4, productComplexity: 'complex' },
} as const;

export const MODE_C_SUGGESTIONS = [
  'Predloži alternativnu udicu',
  'Generiraj rubrik za ocjenjivanje dokaza učenja',
  'Prilagodi plan za 45 minuta',
  'Predloži konkretan video za dokazni materijal',
  'Kako prilagoditi za učenike sa posebnim potrebama?',
  'Da li je istraživačko pitanje dovoljno otvoreno?',
];
