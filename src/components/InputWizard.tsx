import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, BookOpen, FileText, Clock, Sparkles, ChevronRight, ChevronLeft, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUBJECT_GROUPS, deriveTier, TIER_CONFIG } from '@/lib/constants';
import type { Language } from '@/lib/types';

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
}

const DURATION_OPTIONS = [
  { value: 45, label: '45 min', desc: 'Mikro čas', icon: '⚡' },
  { value: 60, label: '60 min', desc: 'Standardni', icon: '📘' },
  { value: 90, label: '90 min', desc: 'Produženi', icon: '📚' },
  { value: 135, label: '3×45', desc: 'Sedmični blok', icon: '📅' },
  { value: 180, label: '4×45', desc: 'Projekt sedmica', icon: '🗓️' },
];

const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'bosnian', label: 'Bosanski', flag: '🇧🇦' },
  { value: 'german', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'english', label: 'English', flag: '🇬🇧' },
];

const PASTEL_CATEGORY_COLORS: Record<string, string> = {
  'Sprachen': 'from-violet-50 to-purple-50 border-violet-200/60',
  'Mathematik & Naturwissenschaften': 'from-blue-50 to-cyan-50 border-blue-200/60',
  'Gesellschaft & Geschichte': 'from-amber-50 to-yellow-50 border-amber-200/60',
  'Kreativität & Bewegung': 'from-rose-50 to-pink-50 border-rose-200/60',
  'Technik & Digital': 'from-emerald-50 to-teal-50 border-emerald-200/60',
  'Schulprogramm': 'from-slate-50 to-gray-50 border-slate-200/60',
};

export default function InputWizard({ onGenerate, isLoading }: InputWizardProps) {
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState<number>(5);
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(90);
  const [language, setLanguage] = useState<Language>('bosnian');
  const [priorKnowledge, setPriorKnowledge] = useState('');
  const [notes, setNotes] = useState('');

  const steps = [
    { label: 'Predmet', icon: BookOpen, complete: !!subject },
    { label: 'Razred', icon: GraduationCap, complete: true },
    { label: 'Tema', icon: FileText, complete: !!topic },
    { label: 'Trajanje', icon: Clock, complete: true },
    { label: 'Generiši', icon: Sparkles, complete: false },
  ];

  const canProceed = () => {
    if (step === 0) return !!subject;
    if (step === 2) return !!topic.trim();
    return true;
  };

  function handleGenerate() {
    const tier = deriveTier(duration);
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

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <button
              onClick={() => { if (i < step) setStep(i); }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300',
                i === step ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25' :
                i < step ? 'bg-secondary/15 text-secondary cursor-pointer hover:bg-secondary/25' :
                'bg-muted/50 text-muted-foreground/40'
              )}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-6 h-0.5 mx-1 rounded-full transition-colors duration-300',
                i < step ? 'bg-secondary/40' : 'bg-border/40'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Step 0: Subject */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Odaberite predmet</h3>
                <p className="text-sm text-muted-foreground mt-1">Izaberite predmet za koji želite kreirati IBL plan</p>
              </div>
              {SUBJECT_GROUPS.map(group => (
                <div key={group.category}>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 px-1">
                    {group.category}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.subjects.map(s => (
                      <motion.button
                        key={s}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSubject(s); setStep(1); }}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                          subject === s
                            ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                            : `bg-gradient-to-br ${PASTEL_CATEGORY_COLORS[group.category] || 'from-muted to-muted'} hover:shadow-md hover:-translate-y-0.5`
                        )}
                      >
                        {s}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Grade */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Odaberite razred</h3>
                <p className="text-sm text-muted-foreground mt-1">Za {subject}</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-md mx-auto">
                {Array.from({ length: 9 }, (_, i) => i + 1).map(g => (
                  <motion.button
                    key={g}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    onClick={() => { setGrade(g); setStep(2); }}
                    className={cn(
                      'aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 text-sm font-bold transition-all duration-200 border',
                      grade === g
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                        : 'neu-card hover:shadow-lg'
                    )}
                  >
                    <span className="text-2xl">{g}</span>
                    <span className="text-[10px] opacity-60 font-medium">razred</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Topic */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Unesite temu</h3>
                <p className="text-sm text-muted-foreground mt-1">{subject}, {grade}. razred</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Tema časa *
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="npr. Fotosinteza, Razlomci, Drugi svjetski rat..."
                    autoFocus
                    className="w-full neu-inset px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/35 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Predznanje učenika (opcionalno)
                  </label>
                  <textarea
                    value={priorKnowledge}
                    onChange={e => setPriorKnowledge(e.target.value)}
                    placeholder="Šta učenici već znaju o ovoj temi?"
                    rows={2}
                    className="w-full neu-inset px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/35 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Dodatne napomene (opcionalno)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Posebni zahtjevi, fokus na određeni aspekt..."
                    rows={2}
                    className="w-full neu-inset px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/35 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Duration */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Trajanje časa</h3>
                <p className="text-sm text-muted-foreground mt-1">Odaberite dužinu nastavnog bloka</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {DURATION_OPTIONS.map(opt => {
                  const tier = deriveTier(opt.value);
                  return (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ y: -2 }}
                      onClick={() => setDuration(opt.value)}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left',
                        duration === opt.value
                          ? 'bg-primary/8 border-primary/30 shadow-md shadow-primary/10'
                          : 'neu-card hover:shadow-lg'
                      )}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <p className="font-bold text-foreground text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded-full font-bold',
                        tier === 'MICRO' ? 'bg-emerald-100 text-emerald-700' :
                        tier === 'STANDARD' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      )}>
                        {TIER_CONFIG[tier].label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              {/* Language selector */}
              <div className="max-w-lg mx-auto">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3 text-center">
                  Jezik plana
                </p>
                <div className="flex justify-center gap-2">
                  {LANGUAGE_OPTIONS.map(l => (
                    <motion.button
                      key={l.value}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setLanguage(l.value)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                        language === l.value
                          ? 'bg-primary/8 border-primary/30 text-primary'
                          : 'bg-card border-border/40 text-muted-foreground hover:border-primary/20'
                      )}
                    >
                      <span>{l.flag}</span> {l.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Generate */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground">Pregled i generisanje</h3>
                <p className="text-sm text-muted-foreground mt-1">Provjerite podatke prije generisanja plana</p>
              </div>
              <div className="neu-card p-6 space-y-4 max-w-lg mx-auto">
                {[
                  { label: 'Predmet', value: subject, color: 'bg-violet-50 text-violet-700' },
                  { label: 'Razred', value: `${grade}. razred`, color: 'bg-blue-50 text-blue-700' },
                  { label: 'Tema', value: topic, color: 'bg-emerald-50 text-emerald-700' },
                  { label: 'Trajanje', value: `${duration} minuta (${TIER_CONFIG[deriveTier(duration)].label})`, color: 'bg-amber-50 text-amber-700' },
                  { label: 'Jezik', value: LANGUAGE_OPTIONS.find(l => l.value === language)?.label || language, color: 'bg-rose-50 text-rose-700' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <span className="text-sm text-muted-foreground font-medium">{item.label}</span>
                    <span className={cn('text-sm font-semibold px-3 py-1 rounded-lg', item.color)}>
                      {item.value}
                    </span>
                  </div>
                ))}
                {priorKnowledge && (
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest">Predznanje</span>
                    <p className="text-sm text-foreground mt-1">{priorKnowledge}</p>
                  </div>
                )}
                {notes && (
                  <div className="pt-2">
                    <span className="text-xs text-muted-foreground/60 font-bold uppercase tracking-widest">Napomene</span>
                    <p className="text-sm text-foreground mt-1">{notes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl neu-btn-primary text-base font-bold disabled:opacity-50 shadow-xl shadow-primary/25"
                >
                  <Zap className="w-5 h-5" />
                  {isLoading ? 'Generisanje u toku...' : 'Generiši IBL Plan'}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
            step === 0 ? 'opacity-0 pointer-events-none' : 'neu-btn text-muted-foreground hover:text-foreground'
          )}
        >
          <ChevronLeft className="w-4 h-4" /> Nazad
        </motion.button>
        {step < 4 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setStep(s => Math.min(4, s + 1))}
            disabled={!canProceed()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold neu-btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Dalje <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
}
