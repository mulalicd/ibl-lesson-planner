/**
 * lib/language/display.ts — the ONE display language layer of a plan (M-7), client only: used for a plan being
 * written, a revised section, and a saved plan (screen and Word). The stored text in the database is never changed.
 * - Bosnian: grammar-safe standard-language fixes (DL-P19); German/English: template lines (DL-P30)
 * - misspelt fixed headings corrected (DL-P32)
 * - spaced long dashes shown as ", " (Director 2026-11-14)
 * The server's validator uses the same language functions directly (bosnianStandard.ts stays free of client imports).
 */
import { normalizeBosnian } from './bosnianStandard';
import { normalizeTemplateLines } from './templateLines';
import { fixHeadingTypos } from './headingGuard';
import { replaceSpacedDashes } from './dashes';

export function displayPlanText(text: string, language: string | null | undefined): string {
  return replaceSpacedDashes(fixHeadingTypos(language === 'bosnian' ? normalizeBosnian(text) : normalizeTemplateLines(text, language), language));
}
