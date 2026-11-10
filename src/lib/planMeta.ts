/**
 * lib/planMeta.ts — metadata read from a generated plan text when saving.
 * PSI v9 prints the inquiry question inside a boxed table ("|   Kako …?   |");
 * the pre-P3 format printed it on a plain line. Both are supported.
 */
const IQ_HEADINGS = /(?:ISTRAŽIVAČKO PITANJE|ISTRAZIVACKO PITANJE|INQUIRY QUESTION|FORSCHUNGSFRAGE)/i;

export function extractInquiryQuestion(planText: string): string | null {
  const lines = planText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!IQ_HEADINGS.test(lines[i])) continue;
    // the heading line itself may carry the question ("ISTRAŽIVAČKO PITANJE: Zašto …?")
    for (let j = i; j < Math.min(lines.length, i + 8); j++) {
      const cleaned = lines[j]
        .replace(IQ_HEADINGS, '')
        .replace(/\(IQ\)|\(mora biti otvoreno\)/gi, '')
        .replace(/^[\s|:"„“>-]+|[\s|"“”]+$/g, '')
        .trim();
      if (cleaned.length > 10 && cleaned.endsWith('?')) return cleaned;
    }
  }
  return null;
}

export interface PlanMeta {
  subject?: string;
  grade?: number;
  topic?: string;
  duration_min?: number;
  language?: 'bosnian' | 'german' | 'english';
}

const clean = (v: string) => v.replace(/[|]/g, ' ').replace(/\s{2,}/g, ' ').trim();

/**
 * Reads subject, grade, topic, duration and language from the plan header
 * (PSI v9 Module 3.1, all three output languages; pre-P3 "Predmet:" lines too).
 * A field that is not in the text is left undefined: nothing is invented.
 */
export function extractPlanMeta(planText: string): PlanMeta {
  const meta: PlanMeta = {};
  const lines = planText.split('\n').slice(0, 80); // the header is at the top

  const LABELS: { lang: PlanMeta['language']; subjGrade: RegExp; topic: RegExp; duration: RegExp }[] = [
    { lang: 'bosnian', subjGrade: /Predmet i razred:\s*(.+?),\s*(\d{1,2})\.\s*razred/i, topic: /\bTema:\s*(.+)/i, duration: /Trajanje:\s*(\d{2,3})\s*min/i },
    { lang: 'german', subjGrade: /Fach und Klasse:\s*(.+?),\s*(?:Klasse\s*)?(\d{1,2})\.?(?:\s*Klasse)?/i, topic: /\bThema:\s*(.+)/i, duration: /Dauer:\s*(\d{2,3})\s*Min/i },
    { lang: 'english', subjGrade: /Subject and grade:\s*(.+?),\s*(?:Grade\s*)?(\d{1,2})(?:st|nd|rd|th)?\.?(?:\s*grade)?/i, topic: /\bTopic:\s*(.+)/i, duration: /Duration:\s*(\d{2,3})\s*min/i },
  ];

  for (const L of LABELS) {
    for (const line of lines) {
      const sg = line.match(L.subjGrade);
      if (sg && !meta.subject) {
        meta.subject = clean(sg[1]);
        meta.grade = Number(sg[2]);
        meta.language = L.lang;
      }
      if (meta.language === L.lang) {
        const t = line.match(L.topic);
        if (t && !meta.topic) meta.topic = clean(t[1]);
        const d = line.match(L.duration);
        if (d && !meta.duration_min) meta.duration_min = Number(d[1]);
      }
    }
    if (meta.language) break;
  }

  // Pre-P3 format: separate "Predmet:" / "Razred:" / "Tema:" / "Trajanje:" lines.
  if (!meta.subject) {
    const text = lines.join('\n');
    const subj = text.match(/^\s*\|?\s*Predmet:\s*(.+)$/im);
    const grade = text.match(/Razred:\s*(\d{1,2})/i);
    const topic = text.match(/^\s*\|?\s*Tema:\s*(.+)$/im);
    const dur = text.match(/Trajanje:\s*(\d{2,3})/i);
    if (subj) meta.subject = clean(subj[1]);
    if (grade) meta.grade = Number(grade[1]);
    if (topic) meta.topic = clean(topic[1]);
    if (dur) meta.duration_min = Number(dur[1]);
  }
  // v8.1 format (production until 2026-11-10): "Subject: X   Grade: 5. razred" / "Topic:" / "Duration:".
  if (!meta.subject) {
    const text = lines.join('\n');
    const subj = text.match(/^\s*Subject:\s*(.+?)(?:\s{2,}Grade:|$)/im);
    const grade = text.match(/Grade:\s*(\d{1,2})/i);
    const topic = text.match(/^\s*Topic:\s*(.+)$/im);
    const dur = text.match(/^\s*Duration:\s*(\d{2,3})\s*min/im);
    if (subj) meta.subject = clean(subj[1]);
    if (grade) meta.grade = Number(grade[1]);
    if (topic) meta.topic = clean(topic[1]);
    if (dur) meta.duration_min = Number(dur[1]);
  }
  if (meta.grade !== undefined && (meta.grade < 1 || meta.grade > 9)) delete meta.grade; // DB: 1–9
  if (meta.duration_min !== undefined && (meta.duration_min < 10 || meta.duration_min > 240)) delete meta.duration_min;
  return meta;
}

// P2-3 (audit D-7): a response is a lesson PLAN only if a plan header appears near the
// top (a revised plan may start with one sentence, e.g. "Evo ispravljenog plana:") AND it
// has an inquiry-question heading. A chat answer that merely quotes "ISTRAŽIVAČKO
// PITANJE" no longer replaces the active plan.
const PLAN_HEADER = /(PLANER ZA IBL|IBL-UNTERRICHTSPLANER|IBL LESSON PLANNER|^\s*SECTION\s+1\s*[-—–]\s*HEADER)/im;

export function isPlanText(text: string): boolean {
  const top = text.split('\n').slice(0, 25).join('\n');
  return PLAN_HEADER.test(top) && IQ_HEADINGS.test(text);
}
