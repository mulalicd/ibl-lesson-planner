import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validatePlan } from '../../supabase/functions/_shared/validate';
import { ValidationEventSchema, ValidationReportSchema } from '@/lib/validation/schemas';
import { buildRepairMessage, QUALITY_CHECK_LABELS } from '@/lib/qualityChecks';
import { QualityBadge } from '@/components/QualityBadge';
import PlanDisplay from '@/components/PlanDisplay';

const FIXTURE = readFileSync(
  resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v81_fotosinteza_bs.txt'),
  'utf8',
);

const V9_PLAN = `
================================================================================
PLANER ZA IBL LEKCIJU
================================================================================
UDICA
"Pogledajte ovu biljku."
ISTRAŽIVAČKO PITANJE
Kako biljka koja ne jede može rasti?
ISHODI UČENJA
I1 Učenik može uporediti dva izvora.
UPORISTE U STVARNOM ZIVOTU
Bašta u dvorištu škole.
SAVJETI I TRIKOVI ZA NASTAVNIKE
PRIPREMA: posadite grah sedmicu ranije.
Za savjete, pitanja i ideje budite slobodni da se obratite gospođi Maji Ljubović na: maja.ljubovic@idss.ba
`;

describe('P3 quality report contract', () => {
  it('the Deno validator output matches the browser Zod schema (one contract, two sides)', () => {
    const report = validatePlan(FIXTURE, { language: 'bosnian', duration_min: 45, tier: 'MICRO' });
    expect(ValidationReportSchema.safeParse(report).success).toBe(true);
    const ev = ValidationEventSchema.safeParse(JSON.parse(JSON.stringify({ type: 'validation', report })));
    expect(ev.success).toBe(true);
  });

  it('every check id produced by the validator has a teacher-facing label', () => {
    const report = validatePlan(FIXTURE, { language: 'bosnian', duration_min: 45 });
    for (const c of report.checks) expect(QUALITY_CHECK_LABELS[c.id], c.id).toBeTruthy();
  });

  it('a normal text delta is NOT mistaken for a validation event', () => {
    expect(ValidationEventSchema.safeParse({ choices: [{ delta: { content: 'x' } }] }).success).toBe(false);
  });

  it('the repair message names the failed checks', () => {
    const msg = buildRepairMessage(['section_tips', 'bosnian_diacritics']);
    expect(msg).toContain('Savjeti i trikovi za nastavnike');
    expect(msg).toContain('Ispravna slova č, ć, š, ž, đ');
  });
});

describe('QualityBadge', () => {
  const report = {
    passed: 19, total: 21, failed: ['section_tips', 'timeline_matches_duration'],
    checks: [{ id: 'section_tips', ok: false, detail: 'missing' }, { id: 'timeline_matches_duration', ok: false, detail: 'x' }],
  };

  it('shows the score, lists failures on demand, and "Popravi" sends exactly the failed ids', () => {
    const onRepair = vi.fn();
    render(<QualityBadge report={report} onRepair={onRepair} />);
    expect(screen.getByText('Provjera kvaliteta: 19/21')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Prikaži/));
    expect(screen.getByText('Savjeti i trikovi za nastavnike')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Popravi'));
    expect(onRepair).toHaveBeenCalledWith(['section_tips', 'timeline_matches_duration']);
  });

  it('a fully passing plan has no "Popravi"', () => {
    render(<QualityBadge report={{ passed: 21, total: 21, failed: [], checks: [] }} onRepair={vi.fn()} />);
    expect(screen.queryByText('Popravi')).toBeNull();
  });
});

describe('PlanDisplay recognises PSI v9 sections (display regression)', () => {
  it('shows ISHODI UČENJA, UPORIŠTE (even without diacritics) and SAVJETI I TRIKOVI as sections', () => {
    render(<PlanDisplay planText={V9_PLAN} />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent ?? '');
    expect(headings).toContain('ISHODI UČENJA');
    expect(headings).toContain('UPORISTE U STVARNOM ZIVOTU');
    expect(headings).toContain('SAVJETI I TRIKOVI ZA NASTAVNIKE');
  });

  it("the Director's real pre-P3 plan still renders without errors", () => {
    const { container } = render(<PlanDisplay planText={FIXTURE} />);
    expect(container.textContent?.length ?? 0).toBeGreaterThan(500);
  });
});

import { extractInquiryQuestion } from '@/lib/planMeta';

describe('extractInquiryQuestion (saving a plan)', () => {
  it('reads the question from the PSI v9 boxed table without the borders', () => {
    const v9 = 'ISTRAŽIVAČKO PITANJE                (mora biti otvoreno)\n================\n|                       |\n|   Kako biljka koja ne jede može rasti i davati nam hranu?   |\n';
    expect(extractInquiryQuestion(v9)).toBe('Kako biljka koja ne jede može rasti i davati nam hranu?');
  });
  it("still reads the Director's real pre-P3 plan", () => {
    const q = extractInquiryQuestion(FIXTURE);
    expect(q).toBeTruthy();
    expect(q!.endsWith('?')).toBe(true);
    expect(q!.startsWith('|')).toBe(false);
  });
  it('returns null when there is no question (never invents one)', () => {
    expect(extractInquiryQuestion('UDICA\nNešto bez pitanja.')).toBeNull();
  });
});

import { extractPlanMeta } from '@/lib/planMeta';

describe('extractPlanMeta (saving a plan without wizard params)', () => {
  it('reads the PSI v9 Bosnian header', () => {
    const h = '| Predmet i razred:     Biologie, 5. razred                             |\n| Tema:                 Fotosinteza                                     |\n| Datum:                _______________   Trajanje: 45 min        |';
    expect(extractPlanMeta(h)).toEqual({ subject: 'Biologie', grade: 5, topic: 'Fotosinteza', duration_min: 45, language: 'bosnian' });
  });
  it('reads the German and English headers', () => {
    expect(extractPlanMeta('| Fach und Klasse: Deutsch, 2. Klasse |\n| Thema: Märchenfiguren |\n| Datum: ____   Dauer: 45 Min |'))
      .toEqual({ subject: 'Deutsch', grade: 2, topic: 'Märchenfiguren', duration_min: 45, language: 'german' });
    expect(extractPlanMeta('| Subject and grade: B/H/S, Grade 6 |\n| Topic: Bašeskija |\n| Date: ____   Duration: 45 min |'))
      .toEqual({ subject: 'B/H/S', grade: 6, topic: 'Bašeskija', duration_min: 45, language: 'english' });
  });
  it('invents nothing when the header is absent', () => {
    expect(extractPlanMeta('UDICA\nNešto bez zaglavlja.')).toEqual({});
  });
  it("reads the Director's real pre-P3 (v8.1) plan — the old code fell back to invented values here", () => {
    expect(extractPlanMeta(FIXTURE)).toEqual({ subject: 'Biologie', grade: 5, topic: 'Fotosinteza', duration_min: 45 });
  });
});
