import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import PlanDisplay from '@/components/PlanDisplay';
import { parseSegments } from '@/lib/planSegments';
import { showHeading } from '@/lib/language/dashes';
import { contentSignature } from '@/lib/planDocxStructure';

const G08 = readFileSync(resolve(__dirname, '../../supabase/functions/_shared/fixtures/plan_v91_fotosinteza_bs.txt'), 'utf8');
const toc = () => screen.getAllByRole('navigation', { name: 'Sadržaj pripreme' })[0];

describe('P6 S2 workspace "Nastavnički radni sto" (real plan g08)', () => {
  it('lists every segment of the plan in its order and with its name', () => {
    render(<PlanDisplay planText={G08} />);
    const text = toc().textContent ?? '';
    let at = -1;
    for (const s of parseSegments(G08)) { const t = showHeading(s.title); const k = text.indexOf(t, at + 1); expect(k, t).toBeGreaterThan(at); at = k; }
  });

  it('every page together shows every character of the plan (nothing lost)', () => {
    const { container } = render(<PlanDisplay planText={G08} />);
    let seen = '';
    const buttons = within(toc()).getAllByRole('button');
    for (const b of buttons) {
      fireEvent.click(b);
      seen += container.querySelector('article')?.textContent ?? '';
    }
    const want = contentSignature(G08.replace(/[\s|=─\-_·*~+]/g, ''));
    const got = contentSignature(seen.replace(/[✓\s]/g, '').replace(/označeno:|nijeoznačeno:/g, ''));
    for (const ch of new Set(want)) expect(got.includes(ch), ch).toBe(true);
    expect(got.length).toBeGreaterThanOrEqual(want.length * 0.98);
  });

  it('binder tabs filter by audience: Učenik shows student segments, never the teacher-only Skela', () => {
    render(<PlanDisplay planText={G08} />);
    fireEvent.click(screen.getAllByRole('tab', { name: 'Učenik' })[0]);
    const text = toc().textContent ?? '';
    expect(text).toContain('UDICA');
    expect(text).toContain('TOK ČASA'); // N·U
    expect(text).not.toContain('SKELA');
  });

  it('a group heading without own text (DODATNI RESURSI) is a label, not a page (no revision on it)', () => {
    render(<PlanDisplay planText={G08} onReviseSection={async () => {}} />);
    expect(within(toc()).queryByRole('button', { name: /DODATNI RESURSI/ })).toBeNull();
  });
});

describe('P5-4 "Prepravi ovaj dio" in the workspace', () => {
  it('is shown only when the page allows revisions', () => {
    const { unmount } = render(<PlanDisplay planText={G08} />);
    expect(screen.queryByText('Prepravi ovaj dio')).toBeNull();
    unmount();
    render(<PlanDisplay planText={G08} onReviseSection={async () => {}} />);
    expect(screen.getByText('Prepravi ovaj dio')).toBeTruthy();
  });

  it('sends the open segment and the teacher\'s request', async () => {
    const onRevise = vi.fn(async () => {});
    render(<PlanDisplay planText={G08} onReviseSection={onRevise} />);
    fireEvent.click(within(toc()).getByRole('button', { name: /^UDICA/ }));
    fireEvent.click(screen.getByText('Prepravi ovaj dio'));
    fireEvent.change(screen.getByPlaceholderText('Šta želite promijeniti? (nije obavezno)'), { target: { value: 'kraće' } });
    fireEvent.click(screen.getByText('Prepravi'));
    await waitFor(() => expect(onRevise).toHaveBeenCalledTimes(1));
    const segs = parseSegments(G08);
    const i = segs.findIndex((s) => s.head === 'UDICA');
    expect(onRevise).toHaveBeenCalledWith(expect.objectContaining({ index: i, head: 'UDICA' }), 'kraće');
  });
});

describe('P6 saved plan as one document (Director 2026-11-14)', () => {
  it('shows every section on one page, with no page-by-page navigation and no stray rules', () => {
    render(<PlanDisplay planText={G08} planId="d1" asDocument />);
    const segs = parseSegments(G08);
    for (let i = 0; i < segs.length; i++) expect(document.getElementById(`d1-sekcija-${i}`), segs[i].title).toBeTruthy();
    expect(screen.queryByText(/^\d+ \/ \d+$/)).toBeNull();
    const body = document.body.textContent ?? '';
    expect(body).not.toMatch(/-{6,}I1/);
    expect(body).toContain('DODATNI RESURSI ZA NASTAVNIKE');
  });
});
