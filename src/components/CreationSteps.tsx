/**
 * CreationSteps — P6 S3 (direction C, DL-P34): where the teacher is in creating a plan. Each step shows a REAL state
 * of the app (parameters sent, the AI writing, the quality check returned, the plan saved); nothing is simulated.
 */
import { Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type CreationStep = 'params' | 'writing' | 'check' | 'saved';

const STEPS: { id: string; label: string }[] = [
  { id: 'params', label: 'Parametri' },
  { id: 'writing', label: 'AI piše pripremu' },
  { id: 'check', label: 'Provjera kvaliteta' },
  { id: 'saved', label: 'Sačuvano' },
];

/** `flat`: without its own card, when it sits inside another sheet. */
export default function CreationSteps({ step, flat }: { step: CreationStep; flat?: boolean }) {
  const reduce = useReducedMotion();
  const at = STEPS.findIndex((s) => s.id === step);
  return (
    <ol aria-label="Koraci kreiranja pripreme" className={cn('flex flex-wrap items-center gap-2', !flat && 'rounded-md bg-white px-3 py-2 shadow-[0_1px_0_rgb(221_221_221)]')}>
      {STEPS.map((s, i) => {
        const done = i < at || (step === 'saved' && i === at);
        const current = i === at && step !== 'saved';
        return (
          <li key={s.id} aria-current={current ? 'step' : undefined}
            className={cn('flex h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold',
              current ? 'bg-primary text-primary-foreground' : done ? 'bg-neutral-100 text-black' : 'text-neutral-500')}>
            {done ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-white"><Check className="h-3 w-3" /></span>
            ) : current ? (
              <motion.span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-brand-yellow"
                animate={reduce ? undefined : { scale: [1, 1.5, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 text-[10px]">{i + 1}</span>
            )}
            {s.label}
          </li>
        );
      })}
    </ol>
  );
}
