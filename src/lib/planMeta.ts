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
