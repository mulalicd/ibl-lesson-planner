/**
 * CreationPanel — P6 (direction C, DL-P36, Director 2026-11-14): the block at the top of the planner, under the main
 * bar. It grows as the plan is created: the real steps, the lesson (subject, grade, duration, topic), every segment
 * that has arrived (coloured by audience, DL-P34), the segment being written now, and the plan's actions. Every value
 * shown comes from the app's real state; nothing is simulated.
 */
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CreationSteps, { type CreationStep } from '@/components/CreationSteps';
import { parseSegments, type Audience } from '@/lib/planSegments';
import { showHeading } from '@/lib/language/dashes';
import { cn } from '@/lib/utils';

export interface CreationLesson {
  subject?: string | null;
  grade?: number | null;
  duration_min?: number | null;
  topic?: string | null;
}

const AUDIENCE_BAR: Record<Audience, string> = { n: 'bg-brand-blue', u: 'bg-brand-yellow', nu: 'bg-brand-lightblue' };

export default function CreationPanel({ step, lesson, planText, writing, actions, quality }: {
  step: CreationStep;
  lesson: CreationLesson | null;
  /** The plan text so far (streaming) or the finished plan; empty before the first words arrive. */
  planText: string;
  /** True while the AI is writing. */
  writing: boolean;
  /** Save / Word buttons of a finished plan. */
  actions?: ReactNode;
  /** The quality check of the finished plan (QualityBadge), between the steps and the actions. */
  quality?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const segments = planText.trim() ? parseSegments(planText) : [];
  const meta = [lesson?.subject, lesson?.grade ? `${lesson.grade}. razred` : null, lesson?.duration_min ? `${lesson.duration_min} min` : null]
    .filter(Boolean).join(' · ');
  const current = writing && segments.length > 0 ? segments[segments.length - 1] : null;

  return (
    <section aria-label="Kreiranje pripreme" className="relative" style={{ perspective: 1600 }}>
      {/* pages under the sheet (decoration) */}
      <div aria-hidden="true" className="absolute inset-x-3 -bottom-2 top-2 rounded-lg bg-white shadow-[0_18px_40px_rgba(0,0,0,0.08)]" />
      <motion.div
        initial={reduce ? false : { rotateX: 8, y: -12 }}
        animate={{ rotateX: 0, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative overflow-hidden rounded-lg bg-white shadow-[0_1px_0_rgb(221_221_221),0_24px_48px_rgba(0,0,0,0.14)]"
      >
        {/* five-colour edge along the top of the sheet */}
        <div aria-hidden="true" className="grid h-1.5 grid-cols-5">
          <span className="bg-brand-blue" /><span className="bg-brand-lightblue" /><span className="bg-brand-yellow" />
          <span className="bg-brand-red" /><span className="bg-black" />
        </div>
        <div className="space-y-4 px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <CreationSteps step={step} flat />
            {/* quality check and actions stay together; on a narrow desk they move to their own line as one row */}
            {(quality || actions) && (
              <div className="flex min-w-0 flex-1 basis-[300px] flex-wrap items-center justify-end gap-3">
                {quality && (
                  <div className="min-w-[240px] flex-1 rounded-md bg-brand-yellow text-black shadow-[0_8px_18px_rgba(0,0,0,0.12)] [&>div]:border-0 [&>div]:py-2 [&_.text-muted-foreground]:text-black">
                    {quality}
                  </div>
                )}
                {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
              </div>
            )}
          </div>

          {(meta || lesson?.topic) && (
            <div>
              {meta && <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">{meta}</p>}
              {lesson?.topic && <h2 className="mt-0.5 font-display text-2xl font-extrabold leading-tight tracking-tight text-black md:text-3xl">{lesson.topic}</h2>}
            </div>
          )}

          {segments.length === 0 ? (
            writing && (
              <div>
                <div className="flex items-center gap-3 text-sm font-semibold text-black">
                  <motion.span aria-hidden="true" className="inline-block h-3 w-3 rotate-45 rounded-[3px] bg-brand-red"
                    animate={reduce ? undefined : { y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }} />
                  AI analizira i gradi plan časa...
                </div>
                <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-sm bg-neutral-100">
                  <motion.div className="h-full bg-black" animate={reduce ? { width: '35%' } : { width: ['0%', '100%'] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }} />
                </div>
              </div>
            )
          ) : (
            <div>
              {/* one mark per arrived segment, in plan order */}
              <ol aria-label="Dijelovi pripreme" className="flex items-center gap-1">
                {segments.map((s, i) => (
                  <motion.li key={`${i}-${s.head}`} title={showHeading(s.title)}
                    initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.35 }}
                    className={cn('h-2.5 min-w-[4px] flex-1 origin-left rounded-[2px]', AUDIENCE_BAR[s.audience],
                      current && i === segments.length - 1 && 'animate-pulse')} />
                ))}
              </ol>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs font-semibold text-neutral-700">
                <span>
                  Dijelova: <span className="text-black">{segments.length}</span>
                  {current && <> · Sada se piše: <span className="text-black">{showHeading(current.title)}</span></>}
                </span>
                <span className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-blue" />Nastavnik</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-yellow" />Učenik</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-lightblue" />N·U</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
