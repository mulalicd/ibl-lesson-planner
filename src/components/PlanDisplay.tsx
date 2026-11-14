/**
 * PlanDisplay — P6 S2 "Nastavnički radni sto" (direction C, DL-P34; total redesign, Director 2026-11-14).
 *
 * The generated plan as a professional workspace: a table of contents of all segments (left), the open segment
 * as a page of paper on a desk (centre) with binder tabs Sve / Nastavnik / Učenik, and sticky notes (right).
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
import { parseSegments, type Audience, type PlanSegment } from '@/lib/planSegments';
import { structurePlan, type PlanBlock } from '@/lib/planDocxStructure';
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
  /** Optional sticky note with the quality check (the existing QualityBadge). */
  quality?: ReactNode;
  /** P6 S3: the AI is still writing — the last segment is marked as being written, revisions wait. */
  streaming?: boolean;
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

const hasText = (s: PlanSegment) => s.body.split('\n').some((l) => /[\p{L}\p{N}]/u.test(l.replace(/[|│=─-]/g, '')));
const inView = (s: PlanSegment, v: View) => v === 'all' || s.audience === v || s.audience === 'nu';

export default function PlanDisplay({ planText, planId, className, onReviseSection, reviseDisabled, quality, streaming }: PlanDisplayProps) {
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
  const hasNotes = !!quality || !!onReviseSection;

  const toolbar = (
    // Workspace toolbar: in the centre column, above the page (no extra row over the table of contents)
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTocOpen(true)} className="flex h-10 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold lg:hidden">
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
          return <div key={i} className="px-2.5 pb-0.5 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.title}</div>;
        }
        const on = i === cur;
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
            <span className="min-w-0 flex-1 truncate">{s.title}</span>
            {streaming && i === segments.length - 1 && <span className="flex-none animate-pulse rounded bg-brand-yellow px-1.5 py-0.5 text-[10px] font-bold text-black">piše se…</span>}
            <span aria-label={b.label} className={cn('flex-none rounded px-1.5 py-0.5 text-[10px] font-bold', b.cls)}>{b.short}</span>
          </motion.button>
        );
      })}
    </nav>
  );

  return (
    <div className={cn('w-full', className)} id={planId ? `plan-${planId}` : undefined}>
      {raw ? (
        <>{toolbar}<div className="overflow-x-auto rounded-md bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
          <pre className="whitespace-pre font-mono text-xs leading-relaxed text-neutral-800">{planText}</pre>
        </div></>
      ) : (
        <div className={cn('grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-x-14', hasNotes && 'xl:grid-cols-[240px_minmax(0,1fr)_250px]')}>
          {/* Table of contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto pr-1">{toc}</div>
          </aside>

          {/* Paper on the desk */}
          <div className="min-w-0">
            {toolbar}
            {/* Binder tabs: on a phone along the top edge, on a desktop down the right edge of the page */}
            <div role="tablist" aria-label="Prikaz po usmjerenju" className="mb-[-1px] flex gap-1.5 pl-4 lg:hidden">
              {VIEWS.map((v) => (
                <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
                  className={cn('h-11 rounded-t-lg px-4 text-xs font-bold transition-transform', v.tab, view === v.id ? 'translate-y-0' : 'translate-y-1')}>
                  {v.label}
                </button>
              ))}
            </div>
            <div className="relative mx-auto max-w-[1040px]">
              <div role="tablist" aria-label="Prikaz po usmjerenju" className="absolute -right-11 top-10 z-10 hidden flex-col gap-1.5 lg:flex">
                {VIEWS.map((v) => (
                  <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}
                    className={cn('w-11 rounded-r-lg py-4 text-xs font-bold tracking-wide shadow-md transition-transform [writing-mode:vertical-rl]', v.tab, view === v.id ? 'translate-x-2' : 'translate-x-0')}>
                    {v.label}
                  </button>
                ))}
              </div>
              <motion.article
                key={`${cur}-${view}`}
                initial={reduce ? false : { x: 28, rotateY: -6 }}
                animate={{ x: 0, rotateY: 0 }}
                transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ transformPerspective: 1600, transformOrigin: '0% 50%' }}
                className="relative rounded-md bg-white px-5 pb-12 pt-6 shadow-[0_1px_0_rgb(221_221_221),0_18px_40px_rgba(0,0,0,0.12)] sm:px-8 sm:pt-7 lg:px-10"
              >
                <div className="mb-4 flex flex-wrap justify-between gap-2 border-b border-neutral-200 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Internationale Deutsche Schule Sarajevo</span>
                  <span>{badge.label}</span>
                </div>
                <h2 className="mb-1.5 font-display text-[24px] font-extrabold leading-tight tracking-tight sm:text-[28px]">{seg.title}</h2>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className={cn('rounded px-2 py-0.5 text-[11px] font-bold', badge.cls)}>{badge.short}</span>
                  {seg.minutes && <span className="rounded bg-brand-yellow px-2 py-0.5 text-xs font-bold text-black">{seg.minutes}</span>}
                </div>
                <SegmentBlocks blocks={blocks} />
                <div className="absolute bottom-4 left-5 right-5 flex justify-between text-xs text-muted-foreground sm:left-8 sm:right-8 lg:left-10 lg:right-10">
                  <span>{PSI_VERSION_LABEL}</span>
                  <span>{pos + 1} / {pages.length}</span>
                </div>
              </motion.article>
              <div className="mt-3 flex flex-wrap justify-between gap-3">
                <button type="button" disabled={prevIdx === null} onClick={() => prevIdx !== null && open(prevIdx)}
                  className="flex h-11 max-w-[48%] items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4 flex-none" /><span className="truncate">{prevIdx !== null ? segments[prevIdx].title : 'Početak'}</span>
                </button>
                <button type="button" disabled={nextIdx === null} onClick={() => nextIdx !== null && open(nextIdx)}
                  className="flex h-11 max-w-[48%] items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40">
                  <span className="truncate">{nextIdx !== null ? segments[nextIdx].title : 'Kraj'}</span><ChevronRight className="h-4 w-4 flex-none" />
                </button>
              </div>
            </div>
          </div>

          {/* Sticky notes */}
          {hasNotes && <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
            {quality && <div className="-rotate-1 rounded bg-brand-yellow p-4 text-black shadow-[0_10px_20px_rgba(0,0,0,0.12)]">{quality}</div>}
            {onReviseSection && (
              <div className="rotate-[0.6deg] rounded bg-white p-4 shadow-[0_10px_20px_rgba(0,0,0,0.08)]">
                <button type="button" disabled={reviseDisabled || revising || streaming} onClick={() => setReviseOpen(!reviseOpen)}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-white text-sm font-semibold text-primary disabled:opacity-50">
                  {revising ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                  {revising ? SECTION_REVISION_TEXT.WORKING : SECTION_REVISION_TEXT.BUTTON}
                </button>
                {reviseOpen && (
                  <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); void submitRevision(); }}>
                    <input autoFocus value={reviseText} onChange={(e) => setReviseText(e.target.value)} maxLength={500}
                      placeholder={SECTION_REVISION_TEXT.PLACEHOLDER} aria-label={SECTION_REVISION_TEXT.PLACEHOLDER}
                      className="h-11 rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                    <div className="flex gap-2">
                      <button type="submit" className="h-10 flex-1 rounded-lg bg-primary text-sm font-semibold text-primary-foreground">{SECTION_REVISION_TEXT.SUBMIT}</button>
                      <button type="button" onClick={() => setReviseOpen(false)} className="h-10 flex-1 rounded-lg bg-muted text-sm font-semibold">{SECTION_REVISION_TEXT.CANCEL}</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </aside>}
        </div>
      )}

      {/* Table of contents as a sheet on phones and tablets */}
      {tocOpen && !raw && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-label="Sadržaj pripreme">
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

/** Lines of the plan are wrapped at about 78 characters inside its boxes. For reading, a line that continues the
 *  sentence of the line before (no closing punctuation before, a lower-case start, or a hyphen break) joins it into
 *  one paragraph. Only line breaks change (and a hyphen that split a word at a line break). */
function joinWrapped(blocks: PlanBlock[]): PlanBlock[] {
  const out: PlanBlock[] = [];
  for (const b of blocks) {
    const prev = out[out.length - 1];
    if (b.type === 'para' && prev?.type === 'para' && !/^(\[[ xX✓✔]\]|[-•–]\s|\d+[.)]\s)/.test(b.text)) {
      const p = prev.text.trimEnd();
      const continues = /-$/.test(p) || (!/[.:?!“”"]$/.test(p) && /^[\p{Ll}(„"']/u.test(b.text.trimStart()));
      if (continues) {
        out[out.length - 1] = { type: 'para', text: /-$/.test(p) ? p.slice(0, -1) + b.text.trimStart() : `${p} ${b.text.trimStart()}` };
        continue;
      }
    }
    out.push(b);
  }
  return out;
}

/** The text of one segment: headings, paragraphs (with checkboxes and lists), real tables and drawings. */
function SegmentBlocks({ blocks: raw }: { blocks: PlanBlock[] }) {
  const blocks = joinWrapped(raw);
  return (
    <div className="flex flex-col gap-1.5 text-[15px] leading-[1.55] text-neutral-900">
      {blocks.map((b, i) => {
        if (b.type === 'blank') return <div key={i} className="h-0.5" />;
        if (b.type === 'heading') return <h3 key={i} className="mt-2 font-display text-base font-bold text-black">{b.text}</h3>;
        if (b.type === 'mono') return <pre key={i} className="overflow-x-auto whitespace-pre rounded bg-neutral-50 px-3 py-1 font-mono text-[12px] leading-relaxed text-neutral-800">{b.text}</pre>;
        if (b.type === 'table') {
          const [head, ...rows] = b.rows;
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full border-collapse text-[13.5px] leading-snug">
                <thead><tr>{head.map((c, k) => <th key={k} className="border-b-2 border-black px-2 py-1.5 text-left align-bottom text-xs font-bold">{c}</th>)}</tr></thead>
                <tbody>{rows.map((r, k) => <tr key={k}>{r.map((c, m) => <td key={m} className="border-b border-neutral-200 px-2 py-1.5 align-top">{c}</td>)}</tr>)}</tbody>
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
              <span>{box[2]}</span>
            </div>
          );
        }
        const bullet = t.match(/^[-•–]\s+(.*)$/);
        if (bullet) return <div key={i} className="flex gap-3"><span aria-hidden="true" className="mt-[9px] h-1.5 w-1.5 flex-none rotate-45 bg-primary" /><span>{bullet[1]}</span></div>;
        return <p key={i} className="m-0 whitespace-pre-line">{t}</p>;
      })}
    </div>
  );
}
