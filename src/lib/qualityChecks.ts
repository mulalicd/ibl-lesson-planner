/**
 * lib/qualityChecks.ts — teacher-facing names of the P3 quality checks
 * (ids come from supabase/functions/_shared/validate.ts).
 * Single source of this wording (M-7). PROPOSED wording, pending the
 * Director's approval before release (lesson 2026-11-09: institutional
 * text is the Director's).
 */
export const QUALITY_CHECK_LABELS: Record<string, string> = {
  section_iq: 'Istraživačko pitanje',
  section_hook: 'Udica (uvod)',
  section_evidence: 'Dokazni materijal',
  section_socratic: 'Skela i sokratska pitanja',
  section_learningEvidence: 'Dokaz učenja',
  section_selfEval: 'Samoevaluacija nastavnika',
  section_differentiation: 'Diferencijacija',
  section_delivery: 'Preporuke za izvođenje časa',
  section_outcomes: 'Ishodi učenja',
  section_realLife: 'Uporište u stvarnom životu',
  section_tips: 'Savjeti i trikovi za nastavnike',
  tips_before_footer: 'Savjeti i trikovi na kraju plana, prije potpisa',
  iq_is_a_question: 'Istraživačko pitanje je postavljeno kao pitanje',
  socratic_synthesis_present: 'Sinteza i povratak na istraživačko pitanje',
  timeline_matches_duration: 'Vremenski raspored odgovara trajanju časa',
  footer_contact: 'Kontakt Maje Ljubović u potpisu',
  not_truncated: 'Plan je kompletan (nije prekinut)',
  no_invented_date: 'Datum je ostavljen prazan',
  no_english_labels: 'Bez engleskih naslova',
  bosnian_diacritics: 'Ispravna slova č, ć, š, ž, đ',
  sources_marked_to_verify: 'Izvori označeni „ZA PROVJERU“',
};

export function qualityCheckLabel(id: string): string {
  return QUALITY_CHECK_LABELS[id] ?? id;
}

/** The message the "Popravi" button sends (a normal, visible chat message). */
export function buildRepairMessage(failedIds: string[]): string {
  const items = failedIds.map((id) => `- ${qualityCheckLabel(id)}`).join('\n');
  return [
    'Molim te ispravi ovaj plan i ponovo ga ispiši u cjelini, u istoj strukturi.',
    'Automatska provjera kvaliteta našla je da nedostaje ili nije ispravno:',
    items,
  ].join('\n');
}
