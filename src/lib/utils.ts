import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Tier, Language } from './types';
import { TIER_LABELS } from './constants';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function getTierLabel(tier: Tier, language: Language): string {
  const langKey = language === 'bosnian' ? 'bs' : language === 'german' ? 'de' : 'en';
  return TIER_LABELS[tier][langKey];
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export function randomHex(bytes: number = 16): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  }
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
