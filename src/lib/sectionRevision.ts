/**
 * lib/sectionRevision.ts — P5-4 "Prepravi ovaj dio" (Director: "P5 odobren", DL-P27; texts approved 2026-11-14,
 * DL-P31). Since P6 S2 it works on the segments of lib/planSegments.ts, the same split the workspace shows (M-7).
 *
 * The teacher rewrites ONE segment of a new plan. The AI gets the whole plan as context and returns only that
 * segment. Only that segment's lines are replaced; every other line stays exactly as it was.
 */
import { AI_LANGUAGE_NAMES } from '@/lib/language/languageNames';
import { headingOf, parseSegments, replaceSegment } from '@/lib/planSegments';

const DECORATION = /^[\s═=─\-*#╔║╚╗╝│|_~+·]*$/;

export type SectionRef = {
  /** Position of the segment in the plan (parseSegments order). */
  index: number;
  /** Its heading part ("UDICA"), used to find it in the AI answer and to check it is still the same segment. */
  head: string;
  /** Its full heading line as shown. */
  title: string;
  /** Heading parts of all other segments: the AI answer is cut at the first of them (no duplicated segments). */
  stopHeads: string[];
};

/** Keeps only the revised segment from the AI answer: from its heading line up to the first heading of another
 *  segment, without a closing box line. Null when there is no real content under the heading. */
export function extractRevisedSection(answer: string, head: string, stopHeads: string[] = []): string | null {
  const lines = answer.replace(/\r/g, '').split('\n');
  const start = lines.findIndex((l) => headingOf(l) === head);
  if (start < 0) return null;
  const stops = new Set(stopHeads.filter((h) => h !== head));
  let end = lines.findIndex((l, i) => i > start && stops.has(headingOf(l) ?? ''));
  if (end < 0) end = lines.length;
  while (end - 1 > start && (lines[end - 1].trim() === '' || DECORATION.test(lines[end - 1]))) end--;
  const body = lines.slice(start, end);
  const content = body.slice(1).filter((l) => l.trim() !== '' && !DECORATION.test(l));
  return content.length > 0 ? body.join('\n') : null;
}

/** The plan with exactly one segment replaced, or null when the segment is no longer where it was. A decoration
 *  line directly above the next heading (its box) is kept. */
export function replaceSection(planText: string, ref: SectionRef, revised: string): string | null {
  const seg = parseSegments(planText)[ref.index];
  if (!seg || seg.head !== ref.head) return null;
  const lines = planText.replace(/\r/g, '').split('\n');
  const own = lines.slice(seg.start, seg.end);
  // keep the trailing box rule / empty lines that visually belong to the next segment
  let keep = own.length;
  while (keep > 1 && (own[keep - 1].trim() === '' || DECORATION.test(own[keep - 1]))) keep--;
  const tail = own.slice(keep);
  // keep anything that precedes the heading inside this range (the plan's first segment starts at line 0)
  const headAt = own.findIndex((l) => headingOf(l) === ref.head);
  const lead = headAt > 0 ? own.slice(0, headAt) : [];
  return replaceSegment(planText, ref.index, [...lead, ...revised.split('\n'), ...tail].join('\n'));
}

const LANGUAGE_NAMES: Record<string, string> = AI_LANGUAGE_NAMES;

/** The instruction to the AI (English, like every instruction in the PSI wrapper). Approved by the Director 2026-11-14 (DL-P31). */
export function buildRevisionRequest(title: string, teacherRequest: string, language: string | undefined): string {
  const want = teacherRequest.trim()
    ? `The teacher's request: "${teacherRequest.trim()}"`
    : 'The teacher gave no details: make this section more specific to this topic, grade and duration.';
  return [
    `REVISE ONE SECTION: rewrite ONLY the section "${title}" of the plan above.`,
    want,
    'Keep every rule of the system instructions for this section.',
    `Write in ${LANGUAGE_NAMES[language ?? ''] ?? 'the language of the plan'}, in the same format (plain text, the same boxes and tables) and with the same minutes, so it fits back into the plan.`,
    'Output ONLY the complete revised section, starting with its heading line exactly as it is now. Do not write any other section, introduction or closing text.',
  ].join('\n');
}

const foldHead = (h: string) => h.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

/** Completeness gate for any change to a saved plan (Director 2026-11-14: the AI once left UDICA out and it was saved):
 *  the titles of the old plan's sections that the new plan does not have. Empty = every section is there. */
export function missingSections(oldPlan: string, newPlan: string): string[] {
  const have = new Set(parseSegments(newPlan).map((s) => foldHead(s.head)));
  return parseSegments(oldPlan).filter((s) => !have.has(foldHead(s.head))).map((s) => s.title);
}
