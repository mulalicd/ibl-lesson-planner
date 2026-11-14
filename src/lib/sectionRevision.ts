/**
 * lib/sectionRevision.ts — P5-4 "Prepravi ovaj dio" (Director: "P5 odobren", DL-P27; button text approved
 * 2026-11-14, "1-4 odobravam").
 *
 * The teacher rewrites ONE section of a new plan. The AI gets the whole plan as context and returns only that
 * section, so the answer is short. Only that section is replaced; every other line stays exactly as it was.
 */

const DECORATION = /^[\s═=─\-*#╔║╚╗╝│|_~+·]*$/;

/** The section title as PlanDisplay shows it (same cleaning), so a click maps back to the plan text. */
export function cleanTitle(line: string): string {
  return line.trim().replace(/[═=─\-*#╔║╚╗╝│|]/g, '').replace(/^\d+[.)]\s*/, '').trim();
}

export type SectionRef = {
  /** Title as shown (PlanDisplay). */
  title: string;
  /** Title of the next section, or null for the last one. */
  nextTitle: string | null;
  /** 0 for the first section with this title, 1 for the second … */
  occurrence: number;
};

/** Line index range [start, end) of the section in the plan text, or null when it cannot be found. */
export function findSectionRange(planText: string, ref: SectionRef): { start: number; end: number } | null {
  const lines = planText.split('\n');
  let seen = 0;
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (cleanTitle(lines[i]) === ref.title) {
      if (seen === ref.occurrence) { start = i; break; }
      seen++;
    }
  }
  if (start < 0) return null;
  let end = lines.length;
  if (ref.nextTitle) {
    const next = lines.findIndex((l, i) => i > start && cleanTitle(l) === ref.nextTitle);
    if (next < 0) return null;
    end = next;
  }
  // the decoration lines just above the next heading belong to the next section's box
  while (end - 1 > start && DECORATION.test(lines[end - 1]) && lines[end - 1].trim() !== '') end--;
  return { start, end };
}

/** Keeps only the revised section from the AI answer: from its heading line on, without a closing box line. */
export function extractRevisedSection(answer: string, title: string): string | null {
  const lines = answer.replace(/\r/g, '').split('\n');
  const start = lines.findIndex((l) => cleanTitle(l) === title);
  if (start < 0) return null;
  let end = lines.length;
  while (end - 1 > start && (lines[end - 1].trim() === '' || DECORATION.test(lines[end - 1]))) end--;
  const body = lines.slice(start, end);
  return body.length >= 2 ? body.join('\n') : null; // a heading alone is not a revision
}

/** The plan with exactly one section replaced. Null when the section is not found (the plan stays as it is). */
export function replaceSection(planText: string, ref: SectionRef, revised: string): string | null {
  const range = findSectionRange(planText, ref);
  if (!range) return null;
  const lines = planText.split('\n');
  // keep the empty lines between the end of the section and the next heading
  let keepFrom = range.end;
  while (keepFrom - 1 > range.start && lines[keepFrom - 1].trim() === '') keepFrom--;
  return [...lines.slice(0, range.start), ...revised.split('\n'), ...lines.slice(keepFrom)].join('\n');
}

const LANGUAGE_NAMES: Record<string, string> = { bosnian: 'Bosnian (bosanski)', german: 'German (Deutsch)', english: 'English' };

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
