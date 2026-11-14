/**
 * lib/language/dashes.ts — Director 2026-11-14: the spaced long dash ' — ' reads as an AI tell in a written lesson
 * plan; it is shown as ', '. Part of the display language layer (display.ts), so a new plan, a revised section
 * and a saved plan read the same (M-7).
 * - Segment heading lines keep their ' — ' in the text: the app finds the plan's sections by them (planSegments).
 *   Headings are shown through showHeading() instead, on screen and in Word.
 * - Lines of an ASCII drawing (arrows, box characters) keep their exact width.
 */
import { headingOf } from '@/lib/planSegments';

const DRAWING = /[┌┐└┘├┤│─┼]|-->|<--|==>|<==/;
const DASH = / +— +/g;

export function replaceSpacedDashes(text: string): string {
  if (!text.includes(' — ')) return text;
  return text.split('\n').map((l) => (DRAWING.test(l) || headingOf(l) ? l : l.replace(DASH, ', '))).join('\n');
}

/** A heading as shown to the teacher (screen and Word): ' — ' becomes ', '. */
export const showHeading = (title: string): string => title.replace(DASH, ', ');
