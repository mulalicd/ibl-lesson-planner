/**
 * lib/planAppendix.ts — amendments to a saved plan (Director 2026-11-14: "originalni plan ostaje intaktan a u nastavku
 * se lijepi dodatni AI razgovor kao amandman 1, 2 …").
 *
 * The saved plan itself is never rewritten. What the teacher takes from a conversation — an AI answer ("Dodaj u plan")
 * or a rewritten section ("Prepravi ovaj dio") — is added WORD FOR WORD after the plan as "AMANDMAN 1 — <title>",
 * "AMANDMAN 2 — …". The AI's introduction ("Razumijem. … Evo rubrike:") and its closing "Moguća sljedeća pitanja"
 * are left out: they talk to the teacher, they are not plan content. Amendments go after the plan's footer and
 * before the app hint "ŠTA MOŽETE URADITI SLJEDEĆE" (PSI A15).
 */
import { parseSegments } from '@/lib/planSegments';

const RULE = '='.repeat(80);

/** The word for an amendment in the plan's language. */
const WORD: Record<string, string> = { bosnian: 'AMANDMAN', german: 'ERGÄNZUNG', english: 'AMENDMENT' };
const NUMBERED = /^(AMANDMAN|ERGÄNZUNG|AMENDMENT) (\d+)$/;

/** The closing suggestions of a chat answer (PSI Protocol 4), in the three plan languages. */
const FOLLOW_UP = /^\s*[-•*]?\s*(mogu[cć]a sljede[cć]a pitanja|[sš]to (jo[sš] )?mo[zž]ete pitati|m[öo]gliche (n[äa]chste|weitere) fragen|was k[öo]nnen sie (noch )?fragen|possible (next|follow-up) questions|what (else )?(can|could) you ask)/i;

/** An all-capitals title line of the answer (its own heading), e.g. "RUBRIKA ZA OCJENJIVANJE DOKAZA UČENJA: EXIT TICKET". */
const isTitleLine = (l: string) => {
  const t = l.trim();
  const letters = t.replace(/[^\p{L}]/gu, '');
  return letters.length >= 4 && t.length <= 100 && letters === letters.toUpperCase() && !t.startsWith('|');
};

const fold = (s: string) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
/** The app hint that closes every plan (PSI Module 3.13), in the three plan languages. */
const NEXT_STEPS = /^(STA MOZETE URADITI|WAS SIE (ALS NACHSTES|JETZT) TUN|WAS KONNEN SIE|WHAT (YOU CAN|TO) DO NEXT)/;

export interface Amendment { title: string; body: string }

/** An amendment made from an AI answer, or null when the answer has no content for the plan. */
export function amendmentFromAnswer(answer: string, question: string): Amendment | null {
  let lines = answer.replace(/\r/g, '').split('\n');
  const cut = lines.findIndex((l) => FOLLOW_UP.test(l));
  if (cut >= 0) lines = lines.slice(0, cut);
  // the answer's own title: the first all-capitals line within its first lines; what stands before it is the intro
  const t = lines.findIndex((l, i) => i < 8 && isTitleLine(l));
  let title: string;
  if (t >= 0) {
    title = lines[t].trim().replace(/:\s*$/, '');
    lines = lines.slice(t + 1);
  } else {
    title = question.trim().replace(/[?.!]+$/, '').toUpperCase();
  }
  const body = lines.join('\n').replace(/^\s*\n/, '').trimEnd();
  return /[\p{L}\p{N}]/u.test(body) ? { title, body } : null;
}

/** The plan with the amendment added as the next "AMANDMAN n — …", before "ŠTA MOŽETE URADITI SLJEDEĆE" (or at the
 *  end). Every line of the plan is kept, in place. */
export function addAmendment(planText: string, amendment: Amendment, language: string | null | undefined): string {
  const lines = planText.replace(/\r/g, '').split('\n');
  const segs = parseSegments(planText);
  const n = 1 + Math.max(0, ...segs.map((s) => Number(s.head.match(NUMBERED)?.[2] ?? 0)));
  // "Label: value" would stop the line from being a heading (planSegments); a comma keeps the meaning
  const title = amendment.title.replace(/:\s+/g, ', ').slice(0, 90);
  const block = [RULE, `${WORD[language ?? ''] ?? WORD.bosnian} ${n} — ${title}`, RULE, amendment.body];
  const last = segs[segs.length - 1];
  let at = last && segs.length > 1 && NEXT_STEPS.test(fold(last.head)) ? last.start : lines.length;
  // keep the box line that belongs to the hint above it
  while (at > 0 && lines[at - 1].trim() && /^[=\-─\s]*$/.test(lines[at - 1])) at--;
  return [...lines.slice(0, at), '', ...block, '', ...lines.slice(at)].join('\n');
}
