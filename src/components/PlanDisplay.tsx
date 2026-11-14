/**
 * PlanDisplay — P6 S2 "Nastavnički radni sto" (direction C, DL-P34; total redesign, Director 2026-11-14).
 *
 * The generated plan as a professional workspace: a table of contents of all segments (left), the open segment
 * as a page of paper on a desk with binder tabs Sve / Nastavnik / Učenik. "Prepravi ovaj dio" sits at the top of the page
 * itself (Director 2026-11-14), so the teacher never leaves the segment to change it; the page runs to the right edge.
 * Segments come from lib/planSegments.ts (the plan's own headings, names and order unchanged); a segment's text is
 * shown through lib/planDocxStructure.ts (the same structure as the Word export, tested to keep every character).
 * Nothing in the plan text is changed or left out: "Sve" lists every segment, and "Izvorni tekst" shows the plan
 * exactly as generated.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Copy, Check, Code2, BookOpen, ChevronLeft, ChevronRight, ListTree, PencilLine, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SECTION_REVISION_TEXT, PSI_VERSION_LABEL } from '@/lib/constants';
import { groupSubtitle, isGroupHeading, parseSegments, type Audience, type PlanSegment } from '@/lib/planSegments';
import { joinWrappedLines, structurePlan, type PlanBlock } from '@/lib/planDocxStructure';
import { showHeading } from '@/lib/language/dashes';
import type { SectionRef } from '@/lib/sectionRevision';

interface PlanDisplayProps {
  planText: string;
  planId?: string;
  className?: string;
  /** Kept for existing call sites; the workspace adapts to the space it gets. */
  compact?: boolean;
  /** P5-4: when given, a segment with its own text can be revised ("Prepravi ovaj dio"). */
  onReviseSection?: (ref: SectionRef, teacherRequest: string) => Promise<void>;
  /** P5-4: no new revision while the AI is busy. */
  reviseDisabled?: boolean;
  /** P6 S3: the AI is still writing — the last segment is marked as being written, revisions wait. */
  streaming?: boolean;
  /** A saved plan (Director 2026-11-14): one continuous, professional document instead of one card per segment.
   *  The table of contents scrolls to a section and follows the reading position. */
  asDocument?: boolean;
}

type View = 'all' | 'n' | 'u';

/** Binder tabs (DL-P34): label and colours (IDSS only, contrast per PLAN.md). */
const VIEWS: { id: View; label: string; tab: string }[] = [
  { id: 'all', label: 'Sve', tab: 'bg-black text-white' },
  { id: 'n', label: 'Nastavnik', tab: 'bg-brand-blue text-white' },
  { id: 'u', label: 'Učenik', tab: 'bg-brand-yellow text-black' },
];

const AUDIENCE_BADGE: Record<Audience, { short: string; label: string; cls: string; rail: string }> = {
  n: { short: 'N', label: 'Za nastavnika', cls: 'bg-brand-blue text-white', rail: 'shadow-[inset_4px_0_0_rgb(var(--brand-blue))]' },
  u: { short: 'U', label: 'Za učenike', cls: 'bg-brand-yellow text-black', rail: 'shadow-[inset_4px_0_0_rgb(var(--brand-yellow))]' },
  nu: { short: 'N·U', label: 'Za nastavnika i učenike', cls: 'bg-black text-white', rail: 'shadow-[inset_4px_0_0_rgb(var(--brand-black))]' },
};

const VIEW_NOTE: Record<View, string> = {
  all: 'Cijela priprema',
  n: 'Za nastavnika: vođenje časa',
  u: 'Za učenike: ono što učenici vide, čuju i rade',
};

/** A segment that is a page of its own (a group heading is only a label). */
const hasText = (s: PlanSegment) => !isGroupHeading(s);
const inView = (s: PlanSegment, v: View) => v === 'all' || s.audience === v || s.audience === 'nu';

export default function PlanDisplay({ planText, planId, className, onReviseSection, reviseDisabled, streaming, asDocument }: PlanDisplayProps) {
  const segments = useMemo(() => parseSegments(planText), [planText]);
  const [view, setView] = useState<View>('all');
  const [active, setActive] = useState(() => Math.max(0, segments.findIndex(hasText)));
  const [raw, setRaw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseText, setReviseText] = useState('');
  const [revising, setRevising] = useState(false);
  const reduce = useReducedMotion();
  // The layout follows the width the workspace really has (it can share the screen with the conversation, DL-P36),
  // not the width of the screen: the table of contents sits beside the page from 960 px.
  const [boxEl, setBoxEl] = useState<HTMLDivElement | null>(null);
  const [boxWidth, setBoxWidth] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));
  useEffect(() => {
    if (!boxEl || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setBoxWidth(e.contentRect.width));
    ro.observe(boxEl);
    return () => ro.disconnect();
  }, [boxEl]);
  const wide = boxWidth >= 960;

  // Document mode: every section's blocks, section anchors, and the section being read (scroll spy)
  const allBlocks = useMemo(() => (asDocument ? segments.map((s) => structurePlan(s.body)) : []), [asDocument, segments]);
  const secId = (i: number) => `${planId ?? 'plan'}-sekcija-${i}`;
  const [reading, setReading] = useState(0);
  useEffect(() => {
    if (!asDocument || raw || typeof IntersectionObserver === 'undefined') return;
    const els = segments.map((_, i) => window.document.getElementById(secId(i))).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => {
      const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (seen[0]) setReading(Number((seen[0].target as HTMLElement).dataset.seg));
    }, { rootMargin: '-90px 0px -65% 0px' });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
    // secId depends only on planId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asDocument, raw, segments, view, planId]);

  // Segments that can be opened as a page in the current view (a group heading without own text is only a label)
  const pages = useMemo(() => segments.map((s, i) => ({ s, i })).filter(({ s }) => hasText(s) && inView(s, view)).map(({ i }) => i), [segments, view]);
  const cur = Math.min(active, segments.length - 1);
  useEffect(() => { if (!pages.includes(cur) && pages.length) setActive(pages[0]); }, [pages, cur]);
  const seg = segments[cur];
  const pos = pages.indexOf(cur);
  const prevIdx = pos > 0 ? pages[pos - 1] : null;
  const nextIdx = pos >= 0 && pos < pages.length - 1 ? pages[pos + 1] : null;
  const blocks = useMemo(() => (seg ? structurePlan(seg.body) : []), [seg]);

  function open(i: number) {
    if (asDocument) {
      setTocOpen(false);
      setReading(i);
      window.document.getElementById(secId(i))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      return;
    }
    setActive(i);
    setTocOpen(false);
    setReviseOpen(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(planText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function submitRevision() {
    if (!onReviseSection || !seg) return;
    setRevising(true);
    setReviseOpen(false);
    try {
      await onReviseSection({ index: cur, head: seg.head, title: seg.title, stopHeads: segments.filter((_, k) => k !== cur).map((s) => s.head) }, reviseText);
    } finally {
      setRevising(false);
      setReviseText('');
    }
  }

  if (!seg) return null;
  const badge = AUDIENCE_BADGE[seg.audience];
  const canRevise = !!onReviseSection;
  const reviseButton = canRevise && (
    <button type="button" disabled={reviseDisabled || revising || streaming} onClick={() => setReviseOpen(!reviseOpen)}
      aria-expanded={reviseOpen}
      className="flex h-9 items-center gap-2 rounded-md border border-primary bg-white px-3 text-sm font-semibold normal-case tracking-normal text-primary transition-colors hover:bg-primary/5 disabled:opacity-50">
      {revising ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
      {revising ? SECTION_REVISION_TEXT.WORKING : SECTION_REVISION_TEXT.BUTTON}
    </button>
  );

  const toolbar = (
    // Workspace toolbar: in the centre column, above the page (no extra row over the table of contents)
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTocOpen(true)} className={cn('flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold', wide && 'hidden')}>
          <ListTree className="h-4 w-4" /> Sadržaj
        </button>
        <div className="flex-1" />
        <button type="button" onClick={() => setRaw(!raw)} className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-neutral-700 hover:text-primary">
          {raw ? <BookOpen className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
          {raw ? 'Radni sto' : 'Izvorni tekst'}
        </button>
        <button type="button" onClick={handleCopy} className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-semibold text-neutral-700 hover:text-primary">
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Kopirano' : 'Kopiraj'}
        </button>
      </div>
  );

  const toc = (
    <nav aria-label="Sadržaj pripreme" className="flex flex-col gap-0.5">
      <div className="px-2.5 pb-0.5 font-display text-sm font-extrabold">Sadržaj</div>
      <div className="px-2.5 pb-2 text-xs text-muted-foreground">{VIEW_NOTE[view]} · {pages.length}</div>
      {segments.map((s, i) => {
        if (!inView(s, view)) return null;
        const b = AUDIENCE_BADGE[s.audience];
        if (!hasText(s)) {
          return <div key={i} className="px-2.5 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{showHeading(s.title)}</div>;
        }
        const on = asDocument ? i === reading : i === cur;
        return (
          <motion.button
            key={i}
            initial={streaming && !reduce ? { x: -24 } : false}
            animate={{ x: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            type="button"
            onClick={() => open(i)}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'flex min-h-[30px] w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              on ? cn('bg-white font-bold text-black shadow-sm', b.rail) : 'font-medium text-neutral-800 hover:bg-white/70',
            )}
          >
            <span className="min-w-0 flex-1 truncate">{showHeading(s.title)}</span>
            {streaming && i === segments.length - 1 && <span className="flex-none animate-pulse rounded bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold text-black">piše se…</span>}
            <span aria-label={b.label} className={cn('flex-none rounded px-1.5 py-0.5 text-[10px] font-bold', b.cls)}>{b.short}</span>
          </motion.button>
        );
      })}
    </nav>
  );

  return (
    <div ref={setBoxEl} className={cn('w-full', className)} id={planId ? `plan-${planId}` : undefined}>
      {raw ? (
        <>{toolbar}<div className="overflow-x-auto rounded-md bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <pre className="whitespace-pre font-mono text-xs leading-relaxed text-neutral-800">{planText}</pre>
        </div></>
      ) : (
        <div className={cn('grid gap-4', wide && 'grid-cols-[240px_minmax(0,1fr)] gap-x-10')}>
          {/* Table of contents */}
          <aside className={wide ? 'block' : 'hidden'}>
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto pr-1">
              {toc}
            </div>
          </aside>

          {/* Paper on the desk */}
          <div className={cn('min-w-0', wide && 'pr-12')}>
            {toolbar}
            {/* Binder tabs: on a phone along the top edge, on a desktop down the right edge of the page */}
            <div role="tablist" aria-label="Prikaz po usmjerenju" className={cn('mb-[-1px] flex gap-1.5 pl-4', wide && 'hidden')}>
              {VIEWS.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
                  className={cn('h-11 rounded-t-lg px-4 text-xs font-bold transition-transform', v.tab, view === v.id ? 'translate-y-0' : 'translate-y-1')}>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="relative">
              <div className={cn('absolute -right-11 bottom-0 top-10 z-10 w-11', wide ? 'block' : 'hidden')}>
              <div role="tablist" aria-label="Prikaz po usmjerenju" className="sticky top-24 flex flex-col gap-1.5">
                {VIEWS.map((v) => (
                  <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
                    className={cn('w-11 rounded-r-lg py-4 text-xs font-bold tracking-wide shadow-md transition-transform [writing-mode:vertical-rl]', v.tab, view === v.id ? 'translate-x-2' : 'translate-x-0')}>
                    {v.label}
                  </button>
                ))}
              </div>
              </div>
              {asDocument ? (
                <article className={cn('relative rounded-md bg-white px-5 py-8 shadow-[0_1px_0_rgb(221_221_221),0_18px_40px_rgba(0,0,0,0.12)]', wide ? 'sm:px-12 sm:py-12' : 'sm:px-8 sm:py-10')}>
                  {segments.map((s, i) => {
                    if (!inView(s, view)) return null;
                    const blocksOf = allBlocks[i] ?? [];
                    if (i === 0) {
                      return (
                        <header key={i} id={secId(i)} data-seg={i} className="scroll-mt-24 border-b-4 border-black pb-6">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Internationale Deutsche Schule Sarajevo</p>
                          <h1 className="mb-4 mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{showHeading(s.title)}</h1>
                          <SegmentBlocks blocks={blocksOf} />
                        </header>
                      );
                    }
                    if (isGroupHeading(s)) {
                      const sub = groupSubtitle(s);
                      return (
                        <div key={i} id={secId(i)} data-seg={i} className="mt-14 scroll-mt-24 border-t-4 border-black pt-4">
                          <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-[28px]">{showHeading(s.title)}</h2>
                          {sub && <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">{sub}</p>}
                        </div>
                      );
                    }
                    const b = AUDIENCE_BADGE[s.audience];
                    return (
                      <section key={i} id={secId(i)} data-seg={i} className="mt-10 scroll-mt-24">
                        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-neutral-200 pb-2">
                          <h3 className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-[22px]">{showHeading(s.title)}</h3>
                          <span aria-label={b.label} className={cn('rounded px-2 py-0.5 text-[11px] font-bold', b.cls)}>{b.short}</span>
                        </div>
                        <SegmentBlocks blocks={blocksOf} />
                      </section>
                    );
                  })}
                  <footer className="mt-14 flex justify-between border-t border-neutral-200 pt-3 text-xs text-muted-foreground">
                    <span>{PSI_VERSION_LABEL}</span>
                    <span>Internationale Deutsche Schule Sarajevo</span>
                  </footer>
                </article>
              ) : (<>
              <motion.article
                key={`${cur}-${view}`}
                initial={reduce ? false : { x: 10, rotateY: -2 }}
                animate={{ x: 0, rotateY: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                style={{ transformPerspective: 1600, transformOrigin: '0% 50%' }}
                className={cn('relative min-h-[min(60vh,560px)] rounded-md bg-white px-5 pb-12 pt-6 shadow-[0_1px_0_rgb(221_221_221),0_18px_40px_rgba(0,0,0,0.12)] sm:pt-7', wide ? 'sm:px-10' : 'sm:px-8')}
              >
                <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-neutral-200 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Internationale Deutsche Schule Sarajevo</span>
                  <span className="ml-auto">{badge.label}</span>
                  {reviseButton}
                </div>
                {canRevise && reviseOpen && (
                  <form className="mb-5 flex flex-wrap gap-2 rounded-md bg-neutral-50 p-3 ring-1 ring-neutral-200" onSubmit={(e) => { e.preventDefault(); void submitRevision(); }}>
                    <input autoFocus value={reviseText} onChange={(e) => setReviseText(e.target.value)} maxLength={500}
                      placeholder={SECTION_REVISION_TEXT.PLACEHOLDER} aria-label={SECTION_REVISION_TEXT.PLACEHOLDER}
                      className="h-10 min-w-[220px] flex-1 rounded-md border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <button type="submit" className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">{SECTION_REVISION_TEXT.SUBMIT}</button>
                    <button type="button" onClick={() => setReviseOpen(false)} className="h-10 rounded-md bg-white px-4 text-sm font-semibold ring-1 ring-neutral-300">{SECTION_REVISION_TEXT.CANCEL}</button>
                  </form>
                )}
                <h2 className="mb-1.5 font-display text-[24px] font-extrabold leading-tight tracking-tight sm:text-[28px]">{showHeading(seg.title)}</h2>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={cn('rounded px-2 py-0.5 text-[11px] font-bold', badge.cls)}>{badge.short}</span>
                  {seg.minutes && <span className="rounded bg-brand-yellow px-2 py-0.5 text-xs font-bold text-black">{seg.minutes}</span>}
                </div>
                <SegmentBlocks blocks={blocks} />
                <div className={cn('absolute bottom-4 left-5 right-5 flex justify-between text-xs text-muted-foreground', wide ? 'sm:left-10 sm:right-10' : 'sm:left-8 sm:right-8')}>
                  <span>{PSI_VERSION_LABEL}</span>
                  <span>{pos + 1} / {pages.length}</span>
                </div>
              </motion.article>
              <div className="mt-3 flex flex-wrap justify-between gap-3">
                <button type="button" disabled={prevIdx === null} onClick={() => prevIdx !== null && open(prevIdx)}
                  className="flex h-11 max-w-[48%] items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4 flex-none" /><span className="truncate">{prevIdx !== null ? showHeading(segments[prevIdx].title) : 'Početak'}</span>
                </button>
                <button type="button" disabled={nextIdx === null} onClick={() => nextIdx !== null && open(nextIdx)}
                  className="flex h-11 max-w-[48%] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                  <span className="truncate">{nextIdx !== null ? showHeading(segments[nextIdx].title) : 'Kraj'}</span><ChevronRight className="h-4 w-4 flex-none" />
                </button>
              </div>
              </>)}
            </div>
          </div>

        </div>
      )}

      {/* Table of contents as a sheet on phones and tablets */}
      {tocOpen && !raw && (
        <div className={cn('fixed inset-0 z-50', wide && 'hidden')} role="dialog" aria-label="Sadržaj pripreme">
          <button type="button" aria-label="Zatvori sadržaj" className="absolute inset-0 bg-black/40" onClick={() => setTocOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-auto rounded-t-2xl bg-background p-3 pb-6">
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setTocOpen(false)} className="flex h-11 items-center gap-1 rounded-lg bg-white px-3 text-sm font-semibold"><X className="h-4 w-4" /> Zatvori</button>
            </div>
            {toc}
          </div>
        </div>
      )}
    </div>
  );
}


/** A drawing that spans several lines is one block; the plan's own box around it ("| … |" on every line) is not
 *  shown, and the common indent is removed. Only the drawing's own characters remain (display only). */
function mergeDrawings(blocks: PlanBlock[]): PlanBlock[] {
  const out: PlanBlock[] = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.type === 'mono' && prev?.type === 'mono') out[out.length - 1] = { type: 'mono', text: `${prev.text}\n${b.text}` };
    else out.push(b);
  }
  return out.map((b) => {
    if (b.type !== 'mono') return b;
    let lines = b.text.split('\n');
    if (lines.every((l) => /^\s*\|/.test(l) && /\|\s*$/.test(l) && l.trim().length > 1)) {
      lines = lines.map((l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').replace(/\s+$/, ''));
    }
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)?.[0].length ?? 0));
    return { type: 'mono', text: lines.map((l) => l.slice(Number.isFinite(indent) ? indent : 0)).join('\n') };
  });
}

/** Display-only clean-up of Markdown the AI sometimes adds (Director 2026-11-14: no leftovers on screen):
 *  **bold** is shown bold, stray ** and `back-ticks` are not shown. Underscores stay (they are fill-in lines). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return <>{parts.map((p, i) => (/^\*\*[^*]+\*\*$/.test(p) ? <strong key={i}>{p.slice(2, -2)}</strong> : p.replace(/\*\*|`/g, '')))}</>;
}

/** The text of one segment: headings, paragraphs (with checkboxes and lists), real tables and drawings. */
function SegmentBlocks({ blocks: raw }: { blocks: PlanBlock[] }) {
  const blocks = mergeDrawings(joinWrappedLines(raw));
  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-[1.55] text-neutral-900">
      {blocks.map((b, i) => {
        if (b.type === 'blank') return <div key={i} className="h-0.5" />;
        if (b.type === 'heading') return <h3 key={i} className="mt-2 font-display text-base font-bold text-black"><Inline text={b.text} /></h3>;
        if (b.type === 'mono') return <pre key={i} className="my-1 overflow-x-auto whitespace-pre rounded-md bg-neutral-50 px-4 py-3 font-mono text-[12px] leading-relaxed text-neutral-800 ring-1 ring-neutral-200">{b.text}</pre>;
        if (b.type === 'table') {
          const [head, ...rows] = b.rows;
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px] leading-snug">
                <thead><tr>{head.map((c, k) => <th key={k} className="border-b-2 border-black px-2 py-1.5 text-left align-bottom text-xs font-bold"><Inline text={c} /></th>)}</tr></thead>
                <tbody>{rows.map((r, k) => <tr key={k}>{r.map((c, m) => <td key={m} className="border-b border-neutral-200 px-2 py-1.5 align-top"><Inline text={c} /></td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
        const t = b.text;
        const box = t.match(/^\[([ xX✓✔])\]\s*(.*)$/);
        if (box) {
          const on = box[1] !== ' ';
          return (
            <div key={i} className="flex items-start gap-2.5">
              <span aria-hidden="true" className={cn('mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded border-2 text-[11px]', on ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white')}>{on ? '✓' : ''}</span>
              <span className="sr-only">{on ? 'označeno: ' : 'nije označeno: '}</span>
              <span><Inline text={box[2]} /></span>
            </div>
          );
        }
        const md = t.match(/^#{1,6}\s+(.*)$/);
        if (md) return <h3 key={i} className="mt-2 font-display text-base font-bold text-black"><Inline text={md[1]} /></h3>;
        const bullet = t.match(/^[-•–*]\s+(.*)$/);
        if (bullet) return <div key={i} className="flex gap-3"><span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rotate-45 bg-primary" /><span><Inline text={bullet[1]} /></span></div>;
        // numbered items of the plan ("I1 …", "K2 …"): the code as a label, the text beside it
        const code = t.match(/^([A-ZČĆŠĐŽ]\d{1,2})\s+(\S.*)$/u);
        if (code) return <div key={i} className="mt-1 flex gap-3"><span className="mt-0.5 h-fit flex-none rounded bg-black px-1.5 py-0.5 text-[11px] font-bold text-white">{code[1]}</span><span><Inline text={code[2]} /></span></div>;
        return <p key={i} className="m-0 whitespace-pre-line"><Inline text={t} /></p>;
      })}
    </div>
  );
}

/** Plan-style text (e.g. an AI answer about a plan) shown exactly like a plan section (same clean-up, M-7). */
export function PlanText({ text }: { text: string }) {
  const blocks = useMemo(() => structurePlan(text), [text]);
  return <SegmentBlocks blocks={blocks} />;
}
