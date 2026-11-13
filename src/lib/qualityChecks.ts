/**
 * lib/qualityChecks.ts — teacher-facing names of the P3 quality checks
 * (ids come from supabase/functions/_shared/validate.ts).
 * Single source of this wording (M-7). Wording APPROVED by the Director
 * (2026-11-09, "tekst odobren"). Do not change it without his approval.
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
  // P4 (PSI v9.1) — PROPOSED wording, approved together with the v9.1 text; shown only when v9.1 is live.
  section_materials: 'Materijali za čas',
  section_flow: 'Tok časa (tabela faza)',
  section_presentation: 'Predstavljanje nalaza',
  section_studentReflection: 'Refleksija učenika',
  phases_complete: 'Svaka faza ima oblik rada i minute',
  outcomes_aligned: 'Svaki ishod ima aktivnost, dokaz i kriterij „Mogu …“',
  // DL-P19 (Director 2026-11-13): Bosnian plans in standard Bosnian, Latin script
  bosnian_standard: 'Bosanski jezik', // wording approved by the Director 2026-11-13
};

export function qualityCheckLabel(id: string): string {
  return QUALITY_CHECK_LABELS[id] ?? id;
}

/** The message the "Popravi" button sends (a normal, visible chat message). */
export function buildRepairMessage(failedIds: string[], checks: { id: string; detail?: string }[] = []): string {
  const items = failedIds.map((id) => {
    const detail = checks.find((c) => c.id === id)?.detail;
    // The language check names the exact words, so the AI replaces those and only those.
    return id === 'bosnian_standard' && detail ? `- ${qualityCheckLabel(id)}: ${detail}` : `- ${qualityCheckLabel(id)}`;
  }).join('\n');
  return [
    'Molim te ispravi ovaj plan i ponovo ga ispiši u cjelini, u istoj strukturi.',
    'Automatska provjera kvaliteta našla je da nedostaje ili nije ispravno:',
    items,
  ].join('\n');
}
