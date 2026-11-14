/**
 * InputWizard — the parameters of a new plan. P6 (direction C "Nastavnički radni sto", DL-P34/DL-P36): the five
 * steps are a sheet of paper on the desk with binder tabs in the IDSS colours; beside it, the plan's header card
 * fills in as the teacher chooses. Steps, fields, limits, texts and the generated request are unchanged.
 */
import { useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBJECT_GROUPS, deriveTier, TIER_CONFIG } from '@/lib/constants';
import type { Language } from '@/lib/types';
import { LIMITS } from '@/lib/validation/schemas';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import CreationSteps from '@/components/CreationSteps';

interface InputWizardProps {
  onGenerate: (params: {
    subject: string;
    grade: number;
    topic: string;
    duration_min: number;
    language: Language;
    prior_knowledge?: string;
    notes?: string;
  }) => void;
  isLoading?: boolean;
  /** "razgovarajte s AI-om": switches to the free chat. */
  onSwitchToChat?: () => void;
}

const DURATION_OPTIONS = [
  { value: 45, label: '45 min', desc: 'Mikro čas', blocks: 1 },
  { value: 60, label: '60 min', desc: 'Standardni', blocks: 1 },
  { value: 90, label: '90 min', desc: 'Produženi', blocks: 2 },
  { value: 135, label: '3×45', desc: 'Sedmični blok', blocks: 3 },
  { value: 180, label: '4×45', desc: 'Projekt sedmica', blocks: 4 },
];

const LANGUAGE_OPTIONS: { value: Language; label: string; code: string }[] = [
  { value: 'bosnian', label: 'Bosanski', code: 'BS' },
  { value: 'german', label: 'Deutsch', code: 'DE' },
  { value: 'english', label: 'English', code: 'EN' },
];

/** Binder tab per step, IDSS colours only (CONSTITUTION rule 6); text colours keep at least 4.5:1 contrast. */
const STEPS = [
  { label: 'Predmet', tab: 'bg-brand-blue text-white' },
  { label: 'Razred', tab: 'bg-brand-lightblue text-black' },
  { label: 'Tema', tab: 'bg-brand-yellow text-black' },
  { label: 'Trajanje', tab: 'bg-brand-red text-black' },
  { label: 'Generiši', tab: 'bg-black text-white' },
];

const fieldLabel = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-600';
const field = 'w-full rounded-md border border-neutral-300 bg-white px-4 text-black placeholder:text-neutral-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export default function InputWizard({ onGenerate, isLoading, onSwitchToChat }: InputWizardProps) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<number>(5);
  const [gradeChosen, setGradeChosen] = useState(false);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(90);
  const [language, setLanguage] = useState<Language>('bosnian');
  const [priorKnowledge, setPriorKnowledge] = useState('');
  const [notes, setNotes] = useState('');

  const canProceed = (s: number) => {
    if (s === 0) return !!subject;
    if (s === 2) return !!topic.trim();
    return true;
  };
  /** A tab can be opened when every step before it can be left. */
  const reachable = (target: number) => Array.from({ length: target }, (_, i) => i).every(canProceed);
  const go = (target: number) => { if (reachable(target)) setStep(target); };

  function handleGenerate() {
    onGenerate({
      subject,
      grade,
      topic: topic.trim(),
      duration_min: duration,
      language,
      prior_knowledge: priorKnowledge.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  }

  const tierLabel = TIER_CONFIG[deriveTier(duration)].label;
  const languageLabel = LANGUAGE_OPTIONS.find((l) => l.value === language)?.label || language;
  const header: { label: string; value: string; step: number }[] = [
    { label: 'Predmet', value: subject, step: 0 },
    { label: 'Razred', value: subject && (gradeChosen || step > 1) ? `${grade}. razred` : '', step: 1 },
    { label: 'Tema', value: topic.trim(), step: 2 },
    { label: 'Trajanje', value: step > 2 ? `${duration} minuta (${tierLabel})` : '', step: 3 },
    { label: 'Jezik', value: step > 2 ? languageLabel : '', step: 3 },
  ];

  const tabs = (vertical: boolean) => (
    <div role="tablist" aria-label="Koraci obrasca"
      className={vertical ? 'absolute -right-11 top-8 z-10 hidden flex-col gap-1.5 lg:flex' : 'mb-[-1px] flex gap-1 overflow-x-auto pl-3 lg:hidden'}>
      {STEPS.map((s, i) => {
        const open = reachable(i);
        return (
          <button key={s.label} type="button" role="tab" aria-selected={step === i} disabled={!open} onClick={() => go(i)}
            className={cn('shrink-0 text-xs font-bold transition-transform disabled:cursor-not-allowed',
              open ? s.tab : 'bg-neutral-200 text-neutral-600',
              vertical
                ? cn('w-11 rounded-r-lg py-4 tracking-wide shadow-md [writing-mode:vertical-rl]', step === i ? 'translate-x-2' : 'translate-x-0')
                : cn('h-10 rounded-t-lg px-2.5 sm:px-3', step === i ? 'translate-y-0' : 'translate-y-1'))}>
            {s.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[380px_minmax(0,1fr)]">
      {/* Left: what is being created, the real creation steps, and the plan header filling in */}
      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Nova priprema</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold leading-tight tracking-tight text-black lg:text-4xl">
            Kreirajte IBL Plan časa
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            Popunite obrazac korak po korak ili
            {onSwitchToChat && (
              <button type="button" onClick={onSwitchToChat}
                className="ml-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline">
                razgovarajte s AI-om <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </p>
        </div>
        <div className="hidden lg:block"><CreationSteps step="params" /></div>
        <section aria-label="Zaglavlje pripreme" className="hidden rounded-md bg-white p-4 shadow-[0_1px_0_rgb(221_221_221),0_10px_24px_rgba(0,0,0,0.08)] lg:block">
          <p className="border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-600">Zaglavlje pripreme</p>
          <dl className="mt-1">
            {header.map((h) => (
              <button key={h.label} type="button" onClick={() => go(h.step)} disabled={!reachable(h.step)}
                className="flex w-full items-baseline justify-between gap-3 border-b border-neutral-100 py-2 text-left last:border-0 disabled:cursor-default">
                <dt className="text-xs font-semibold text-neutral-600">{h.label}</dt>
                <dd className={cn('truncate text-sm font-semibold', h.value ? 'text-black' : 'text-neutral-400')}>{h.value || '—'}</dd>
              </button>
            ))}
          </dl>
        </section>
      </aside>

      {/* Right: the sheet on the desk with the binder tabs */}
      <div className="min-w-0 pb-24 lg:pb-0 lg:pr-12">
        {tabs(false)}
        <div className="relative" style={{ perspective: 1400 }}>
          {tabs(true)}
          {/* the pages under the current one (decoration) */}
          <div aria-hidden="true" className="absolute inset-0 translate-x-2 translate-y-2 rotate-[0.8deg] rounded-md bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)]" />
          <motion.section
            key={step}
            initial={reduce ? false : { x: 28, rotateY: -6 }}
            animate={{ x: 0, rotateY: 0 }}
            transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
            aria-label={STEPS[step].label}
            className="relative rounded-md bg-white px-5 py-6 shadow-[0_1px_0_rgb(221_221_221),0_22px_40px_rgba(0,0,0,0.12)] sm:px-8 sm:py-7"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-600">
              <span>Nova priprema</span>
              <span>Korak {step + 1} / {STEPS.length}</span>
            </div>

            {step === 0 && (
              <Sheet title="Odaberite predmet" sub="Izaberite predmet za koji želite kreirati IBL plan">
                <div className="space-y-4">
                  {SUBJECT_GROUPS.map((group) => (
                    <div key={group.category}>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-600">{group.category}</p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                        {group.subjects.map((s) => (
                          <button key={s} type="button" aria-pressed={subject === s}
                            onClick={() => { setSubject(s); setStep(1); }}
                            className={cn('flex min-h-11 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm font-semibold transition-colors',
                              subject === s ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white text-black hover:border-primary hover:bg-primary/5')}>
                            {s}
                            {subject === s && <Check className="h-4 w-4 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Sheet>
            )}

            {step === 1 && (
              <Sheet title="Odaberite razred" sub={`Za ${subject}`}>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                  {Array.from({ length: 9 }, (_, i) => i + 1).map((g) => (
                    <button key={g} type="button" aria-pressed={grade === g}
                      onClick={() => { setGrade(g); setGradeChosen(true); setStep(2); }}
                      className={cn('flex aspect-square flex-col items-center justify-center rounded-md border transition-colors',
                        grade === g ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white text-black hover:border-primary hover:bg-primary/5')}>
                      <span className="font-display text-2xl font-extrabold">{g}</span>
                      <span className="text-[11px] font-medium">razred</span>
                    </button>
                  ))}
                </div>
              </Sheet>
            )}

            {step === 2 && (
              <Sheet title="Unesite temu" sub={`${subject}, ${grade}. razred`}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="wiz-topic" className={fieldLabel}>Tema časa *</label>
                    <input id="wiz-topic" type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                      maxLength={LIMITS.topic} placeholder="npr. Fotosinteza, Razlomci, Drugi svjetski rat..." autoFocus
                      className={cn(field, 'h-12 text-base font-medium')} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="wiz-prior" className={fieldLabel}>Predznanje učenika (opcionalno)</label>
                      <textarea id="wiz-prior" value={priorKnowledge} onChange={(e) => setPriorKnowledge(e.target.value)}
                        maxLength={LIMITS.priorKnowledge} placeholder="Šta učenici već znaju o ovoj temi?" rows={3}
                        className={cn(field, 'resize-none py-3 text-sm')} />
                    </div>
                    <div>
                      <label htmlFor="wiz-notes" className={fieldLabel}>Dodatne napomene (opcionalno)</label>
                      <textarea id="wiz-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                        maxLength={LIMITS.notes} placeholder="Posebni zahtjevi, fokus na određeni aspekt..." rows={3}
                        className={cn(field, 'resize-none py-3 text-sm')} />
                    </div>
                  </div>
                  <PrivacyNotice />
                </div>
              </Sheet>
            )}

            {step === 3 && (
              <Sheet title="Trajanje časa" sub="Odaberite dužinu nastavnog bloka">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {DURATION_OPTIONS.map((opt) => {
                    const on = duration === opt.value;
                    return (
                      <button key={opt.value} type="button" aria-pressed={on} onClick={() => setDuration(opt.value)}
                        className={cn('flex items-center gap-3 rounded-md border p-3 text-left transition-colors',
                          on ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-neutral-300 bg-white hover:border-primary')}>
                        <span aria-hidden="true" className="flex h-8 w-10 items-end gap-0.5">
                          {Array.from({ length: 4 }, (_, k) => (
                            <span key={k} className={cn('w-2 rounded-sm', k < opt.blocks ? (on ? 'bg-primary' : 'bg-black') : 'bg-neutral-200')}
                              style={{ height: `${40 + k * 20}%` }} />
                          ))}
                        </span>
                        <span className="flex-1">
                          <span className="block text-sm font-bold text-black">{opt.label}</span>
                          <span className="block text-xs text-neutral-600">{opt.desc}</span>
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-black">
                          {TIER_CONFIG[deriveTier(opt.value)].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-widest text-neutral-600">Jezik plana</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map((l) => (
                    <button key={l.value} type="button" aria-pressed={language === l.value} onClick={() => setLanguage(l.value)}
                      className={cn('flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition-colors',
                        language === l.value ? 'border-primary bg-primary text-white' : 'border-neutral-300 bg-white text-black hover:border-primary')}>
                      <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-extrabold',
                        language === l.value ? 'bg-white text-primary' : 'bg-neutral-100 text-black')}>{l.code}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              </Sheet>
            )}

            {step === 4 && (
              <Sheet title="Pregled i generisanje" sub="Provjerite podatke prije generisanja plana">
                <dl className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
                  {[
                    { label: 'Predmet', value: subject, to: 0 },
                    { label: 'Razred', value: `${grade}. razred`, to: 1 },
                    { label: 'Tema', value: topic, to: 2 },
                    { label: 'Trajanje', value: `${duration} minuta (${tierLabel})`, to: 3 },
                    { label: 'Jezik', value: languageLabel, to: 3 },
                  ].map((item) => (
                    <button key={item.label} type="button" onClick={() => setStep(item.to)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-neutral-50">
                      <dt className="text-sm font-medium text-neutral-600">{item.label}</dt>
                      <dd className="text-sm font-semibold text-black">{item.value}</dd>
                    </button>
                  ))}
                </dl>
                {(priorKnowledge || notes) && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {priorKnowledge && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-600">Predznanje</span>
                        <p className="mt-1 text-sm text-black">{priorKnowledge}</p>
                      </div>
                    )}
                    {notes && (
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-neutral-600">Napomene</span>
                        <p className="mt-1 text-sm text-black">{notes}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="mt-6 flex justify-center">
                  <button type="button" onClick={handleGenerate} disabled={isLoading}
                    className="neu-btn-primary inline-flex h-14 items-center gap-3 px-8 text-base font-bold disabled:opacity-50">
                    <Zap className="h-5 w-5" />
                    {isLoading ? 'Generisanje u toku...' : 'Generiši IBL Plan'}
                  </button>
                </div>
              </Sheet>
            )}

          </motion.section>
        </div>
        {/* Navigation: outside the 3D container so it can stay fixed at the bottom of a phone screen */}
        <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 border-t border-neutral-200 bg-white px-4 py-3 lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className={cn('neu-btn flex h-11 items-center gap-2 px-4 text-sm font-semibold text-black', step === 0 && 'invisible')}>
            <ChevronLeft className="h-4 w-4" /> Nazad
          </button>
          {step < 4 && (
            <button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={!canProceed(step)}
              className="flex h-11 items-center gap-2 rounded-md bg-black px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-30">
              Dalje <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Sheet({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-display text-2xl font-extrabold tracking-tight text-black">{title}</h3>
      <p className="mb-5 mt-1 text-sm text-neutral-700">{sub}</p>
      {children}
    </div>
  );
}
