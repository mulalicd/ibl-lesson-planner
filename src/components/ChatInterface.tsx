import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Send, StopCircle, RotateCcw, Lightbulb, Save, CheckCircle2, FilePlus2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { MODE_C_SUGGESTIONS, PSI_VERSION_LABEL, SECTION_REVISION_TEXT, deriveTier } from '@/lib/constants';
import PlanDisplay, { PlanText } from './PlanDisplay';
import CreationPanel from './CreationPanel';
import { parseSegments } from '@/lib/planSegments';
import DocxExportButton from './DocxExportButton';
import ConversationExportButton from './ConversationExportButton';
import InputWizard from './InputWizard';
import LoadingIndicator from './LoadingIndicator';
import aiAvatarImg from '@/assets/ai-avatar.jpg';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Language } from '@/lib/types';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { QualityBadge } from '@/components/QualityBadge';
import { extractInquiryQuestion, extractPlanMeta } from '@/lib/planMeta';
import { useAuth } from '@/hooks/useAuth';
import { canChangePlan, fetchIsAdmin } from '@/lib/planActions';
import { appendMessages, replacePlanText, startConversation } from '@/lib/planConversations';
import { addAmendment, amendmentFromAnswer } from '@/lib/planAppendix';
import { showHeading } from '@/lib/language/dashes';
import { displayPlanText } from '@/lib/language/display';
import type { SectionRef } from '@/lib/sectionRevision';

interface ChatInterfaceProps {
  /** A saved plan opened with "Razgovor s AI-om": its language and author decide "Ugradi u plan". */
  initialPlan?: { id: string; text: string; raw?: string; language?: string | null; owner_id?: string | null } | null;
}

export default function ChatInterface({ initialPlan }: ChatInterfaceProps) {
  const chat = useChat();
  const [input, setInput] = useState('');
  const [showWizard, setShowWizard] = useState(!initialPlan);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set());
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => { void fetchIsAdmin().then(setIsAdmin); }, []);
  // ── P6 (DL-P37): a conversation about a SAVED plan is kept with that plan ──
  const convRef = useRef<{ planId: string; id: string; next: number } | null>(null);
  const pendingRef = useRef<{ planId: string; userMsgId: string } | null>(null);
  const warnedRef = useRef(false); // a failed save is reported once per conversation, not after every answer
  // "Dodaj u plan" (Director 2026-11-14, "Dodaj + Prepravi"): answers already added to the saved plan
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [contextText, setContextText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Store last generate params for saving
  const lastParamsRef = useRef<{ subject: string; grade: number; topic: string; duration_min: number; language: Language; prior_knowledge?: string; notes?: string } | null>(null);
  const isMobile = useIsMobile();
  /** Which finished plan the desk shows (null: the newest). */
  const [shownPlanId, setShownPlanId] = useState<string | null>(null);

  useEffect(() => {
    // only when a message is added, not on every streamed word (that made the screen jump), and only as far as needed
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chat.messages.length]);

  // a new answer (a new plan, a repair) brings the newest plan back onto the desk
  useEffect(() => {
    if (chat.isLoading) setShownPlanId(null);
  }, [chat.isLoading]);

  // Keep each question and answer about a saved plan with that plan (only while a saved plan is the context).
  useEffect(() => {
    if (chat.isLoading) {
      const last = chat.messages[chat.messages.length - 1];
      if (chat.activePlanId && last?.role === 'user' && !pendingRef.current) pendingRef.current = { planId: chat.activePlanId, userMsgId: last.id };
      return;
    }
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    const i = chat.messages.findIndex((m) => m.id === p.userMsgId);
    const answer = i >= 0 ? chat.messages[i + 1] : undefined;
    if (!answer || answer.role !== 'model') return;
    void saveExchange(p.planId, chat.messages[i].content, answer.content);
    // runs when an answer finishes; the messages are read at that moment
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.isLoading]);

  /** The conversation about this saved plan (started on first use). Null when the database refused. */
  async function ensureConversation(planId: string) {
    if (convRef.current?.planId === planId) return convRef.current;
    const id = await startConversation(planId);
    if (!id) return null;
    convRef.current = { planId, id, next: 0 };
    return convRef.current;
  }

  /** One question and its answer, kept with the plan. A failure is reported once per conversation. */
  async function saveExchange(planId: string, question: string, answer: string) {
    const conv = await ensureConversation(planId);
    const ok = !!conv && await appendMessages(conv.id, conv.next, [{ role: 'user', content: question }, { role: 'model', content: answer }]);
    if (!ok || !conv) {
      if (!warnedRef.current) toast.error('Razgovor nije sačuvan uz plan.');
      warnedRef.current = true;
      return;
    }
    conv.next += 2;
  }

  useEffect(() => {
    if (!showWizard) inputRef.current?.focus();
  }, [showWizard]);

  // Load plan context when initialPlan is provided
  useEffect(() => {
    if (initialPlan && initialPlan.id && initialPlan.text) {
      setShowWizard(false);
      setTimeout(() => {
        chat.setPlanContext(initialPlan.id, initialPlan.text);
      }, 100);
    }
  }, [initialPlan?.id]);

  function handleSend() {
    const text = input.trim();
    if (!text || chat.isLoading) return;
    setInput('');
    chat.sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleWizardGenerate(params: {
    subject: string; grade: number; topic: string; duration_min: number;
    language: Language; prior_knowledge?: string; notes?: string;
  }) {
    const tier = deriveTier(params.duration_min);
    lastParamsRef.current = params;
    const promptText = [
      `Predmet: ${params.subject}`,
      `Razred: ${params.grade}`,
      `Tema: ${params.topic}`,
      `Trajanje: ${params.duration_min} minuta`,
      params.prior_knowledge ? `Predznanje: ${params.prior_knowledge}` : null,
      params.notes ? `Napomene: ${params.notes}` : null,
    ].filter(Boolean).join('\n');

    setShowWizard(false);
    chat.sendMessage(promptText, 'generate', {
      ...params,
      tier,
      zpd_calibration: params.prior_knowledge ? 'provided' : undefined,
    });
  }

  async function handleSavePlan(msgId: string, planText: string) {
    if (savedPlanIds.has(msgId)) return;
    setSavingPlanId(msgId);

    try {
      // Extract metadata from plan text
      // Wizard params first, then what the plan itself states (P3: never invent).
      const meta = extractPlanMeta(planText);
      const inquiryQuestion = extractInquiryQuestion(planText);

      const params = lastParamsRef.current;
      const duration = params?.duration_min || meta.duration_min;
      const savedMsg = chat.messages.find(m => m.id === msgId);

      const record = {
        plan_text: planText,
        // P2-8: unknown = null (owner script 2026-11-10_p2-plans-metadata), never invented.
        // Language stays required: Bosnian is the school's and PSI's default output language.
        subject: params?.subject || meta.subject || null,
        grade: params?.grade || meta.grade || null,
        topic: meta.topic || params?.topic || null, // the plan's corrected topic first (Director 2026-11-14)
        duration_min: duration ?? null,
        language: (params?.language || meta.language || 'bosnian') as string,
        tier: duration ? deriveTier(duration) : null,
        generation_time_ms: savedMsg?.generation_ms ?? null,
        gemini_key_index: savedMsg?.key_index ?? null,
        prior_knowledge: params?.prior_knowledge || null,
        notes: params?.notes || null,
        inquiry_question: inquiryQuestion,
        is_favourite: false,
        is_deleted: false,
      };

      const { data: saved, error } = await supabase.from('plans').insert(record).select('id').single();
      if (error) throw error;

      setSavedPlanIds(prev => new Set(prev).add(msgId));
      if (saved?.id) chat.attachPlanId(msgId, saved.id); // P2-1: Word export button appears
      toast.success('Plan je uspješno sačuvan!', {
        description: 'Pronađite ga u "Moji planovi" sekciji.',
      });
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Greška pri čuvanju plana', {
        description: 'Pokušajte ponovo.',
      });
    } finally {
      setSavingPlanId(null);
    }
  }

  const hasMessages = chat.messages.length > 1 || chat.messages.some(m => m.id !== 'welcome');
  // P6 S3: the answer being written is already a plan when it has at least three segment headings
  const isStreamingPlan = (msg: { role: string; isPlan?: boolean; content: string }, idx: number) =>
    chat.isLoading && !msg.isPlan && msg.role === 'model' && idx === chat.messages.length - 1 && parseSegments(msg.content).length >= 3;

  // Wizard view (P6, direction C: the wizard draws its own heading beside the sheet)
  if (showWizard && chat.mode === 'onboarding' && !hasMessages) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <InputWizard onGenerate={handleWizardGenerate} isLoading={chat.isLoading} onSwitchToChat={() => setShowWizard(false)} />
        </div>
      </div>
    );
  }

  // ── P6 layout (Director 2026-11-14): on a tablet or computer the whole screen is used. Left: the conversation
  // (welcome, the teacher's parameters, chat answers) and the composer. Centre, at the top: the creation block that
  // grows as the plan is written; under it the plan itself. A phone keeps one column in the same order.
  const lastIdx = chat.messages.length - 1;
  const generating = chat.isLoading && chat.mode === 'onboarding';
  /** The answer the AI is writing while a plan is being created: shown in the creation block, not as a message. */
  const isPendingPlan = (msg: { role: string; isPlan?: boolean }, idx: number) =>
    generating && msg.role === 'model' && !msg.isPlan && idx === lastIdx;
  const streamingMsg = chat.messages.find((m, i) => isStreamingPlan(m, i)) ?? null;
  const pendingMsg = chat.messages.find((m, i) => isPendingPlan(m, i)) ?? null;
  const plans = chat.messages.filter((m) => m.isPlan);
  const shownPlan = streamingMsg || generating ? null : (plans.find((m) => m.id === shownPlanId) ?? plans[plans.length - 1] ?? null);
  // A saved plan opened with "Razgovor s AI-om" (/chat?plan_id=…): it lies on the desk while the teacher talks to the
  // AI about it (Director 2026-11-14: a saved plan can always be discussed further).
  // contextText is the plan as STORED (amendments are added to it, the original lines stay exactly as they are);
  // the desk shows it through the display layer
  const contextRaw = contextText ?? initialPlan?.raw ?? initialPlan?.text ?? '';
  const contextPlan = initialPlan && !generating && !streamingMsg && !shownPlan
    ? { ...initialPlan, text: contextText ? displayPlanText(contextText, initialPlan.language) : initialPlan.text } : null;
  // "Dodaj u plan" and "Prepravi ovaj dio" on a saved plan: its author or the admin (UI only; the database decides)
  const canEditContext = !!contextPlan && canChangePlan(contextPlan.owner_id, session?.user?.id, isAdmin);

  /** Writes a change from this conversation to the saved plan (newText = the stored text) and shows it. */
  async function saveContextChange(newText: string): Promise<boolean> {
    if (!contextPlan) return false;
    const conv = await ensureConversation(contextPlan.id);
    const result = await replacePlanText(contextPlan.id, conv?.id ?? null, contextRaw, newText);
    if (result === 'ok') {
      setContextText(newText);
      chat.setPlanContext(contextPlan.id, displayPlanText(newText, contextPlan.language));
      return true;
    }
    toast.error(result === 'forbidden' ? 'Samo autor plana ili direktor može mijenjati ovaj plan.' : 'Plan nije sačuvan. Pokušajte ponovo.');
    return false;
  }

  // Director 2026-11-14: "originalni plan ostaje intaktan a u nastavku se lijepi dodatni AI razgovor kao amandman 1, 2".
  // A saved plan is never rewritten: what the teacher takes from the conversation is added after it, numbered.

  /** "Dodaj u plan": the AI answer, word for word, as the next "AMANDMAN n — …". */
  async function handleAddToPlan(answerIdx: number) {
    if (!contextPlan) return;
    const answer = chat.messages[answerIdx];
    const question = [...chat.messages.slice(0, answerIdx)].reverse().find((m) => m.role === 'user')?.content ?? '';
    const amendment = amendmentFromAnswer(answer.content, question);
    if (!amendment) { toast.error('Ovaj odgovor nema sadržaja za plan.'); return; }
    const newText = addAmendment(contextRaw, amendment, contextPlan.language);
    if (await saveContextChange(newText)) {
      setAddedIds((s0) => new Set(s0).add(answer.id));
      toast.success('Dodano u plan kao amandman.', { description: showHeading(amendmentTitle(newText)) });
    }
  }

  /** "Prepravi ovaj dio" on a saved plan: the section stays as it is; the AI's new version is added as the next
   *  amendment ("AMANDMAN n — UDICA 5 minuta, nova verzija"). The request and the new version are kept with the
   *  conversation too. */
  async function handleReviseContext(ref: SectionRef, request: string) {
    if (!contextPlan) return;
    const revisedPlan = await chat.revisePlanText(contextPlan.text, ref, request, contextPlan.language ?? undefined);
    const seg = revisedPlan ? parseSegments(revisedPlan)[ref.index] : undefined;
    const body = seg?.body.trim();
    if (!revisedPlan || !body) { toast.error(SECTION_REVISION_TEXT.FAILED); return; }
    const newText = addAmendment(contextRaw, { title: `${ref.title}, ${NEW_VERSION[contextPlan.language ?? ''] ?? NEW_VERSION.bosnian}`, body }, contextPlan.language);
    if (!(await saveContextChange(newText))) return;
    toast.success('Nova verzija je dodana u plan kao amandman.', { description: showHeading(amendmentTitle(newText)) });
    void saveExchange(contextPlan.id, `${SECTION_REVISION_TEXT.BUTTON}: ${ref.title}${request.trim() ? `\n${request.trim()}` : ''}`, body);
  }

  const hasDesk = generating || !!streamingMsg || !!shownPlan || !!contextPlan;
  const deskText = streamingMsg?.content ?? pendingMsg?.content ?? shownPlan?.content ?? contextPlan?.text ?? '';
  // The plan's own subject/topic win over what was typed: the AI corrects a misspelt topic ("fOdozindesa" →
  // "Fotosinteza"), and the title must show the corrected one (Director 2026-11-14).
  const planMeta = deskText ? extractPlanMeta(deskText) : null;
  const typed = lastParamsRef.current;
  const lesson = typed ? { ...typed, topic: planMeta?.topic || typed.topic } : planMeta;

  const planActions = shownPlan && (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleSavePlan(shownPlan.id, shownPlan.content)}
        disabled={!!savingPlanId || savedPlanIds.has(shownPlan.id)}
        className={cn(
          'flex h-10 items-center gap-2 rounded-md px-4 text-sm font-semibold transition-all',
          savedPlanIds.has(shownPlan.id)
            ? 'bg-status-success-bg text-status-success border border-status-success/20 cursor-default'
            : 'neu-btn-primary',
          savingPlanId === shownPlan.id && 'opacity-70 cursor-wait'
        )}
      >
        {savedPlanIds.has(shownPlan.id) ? (
          <><CheckCircle2 className="w-4 h-4" /> Sačuvano</>
        ) : savingPlanId === shownPlan.id ? (
          <><Save className="w-4 h-4 animate-pulse" /> Čuvanje...</>
        ) : (
          <><Save className="w-4 h-4" /> Sačuvaj plan</>
        )}
      </motion.button>
      {shownPlan.plan_id && <DocxExportButton planId={shownPlan.plan_id} planText={shownPlan.content} />}
    </>
  );

  const desk = hasDesk && (
    <div className="space-y-6">
      <CreationPanel
        step={contextPlan ? 'saved' : shownPlan ? (savedPlanIds.has(shownPlan.id) ? 'saved' : 'check') : 'writing'}
        lesson={lesson}
        planText={deskText}
        writing={!shownPlan && !contextPlan}
        actions={contextPlan ? <DocxExportButton planId={contextPlan.id} planText={contextPlan.text} /> : planActions || undefined}
        quality={shownPlan?.validation ? <QualityBadge report={shownPlan.validation} onRepair={chat.repairPlan} disabled={chat.isLoading} /> : undefined}
      />
      {streamingMsg ? (
        <PlanDisplay key={streamingMsg.id} planText={streamingMsg.content} streaming />
      ) : contextPlan ? (
        <PlanDisplay key={contextPlan.id} planText={contextPlan.text} planId={contextPlan.id}
          onReviseSection={canEditContext ? handleReviseContext : undefined} reviseDisabled={chat.isLoading} />
      ) : shownPlan ? (
        <PlanDisplay
          key={shownPlan.id}
          planText={shownPlan.content}
          planId={shownPlan.plan_id}
          // P5-4: only before the plan is saved (a saved plan is not changed behind the teacher's back)
          onReviseSection={savedPlanIds.has(shownPlan.id) ? undefined : async (ref, request) => {
            const result = await chat.reviseSection(shownPlan.id, ref, request);
            if (result === 'ok') toast.success(SECTION_REVISION_TEXT.DONE);
            else toast.error(SECTION_REVISION_TEXT.FAILED);
          }}
          reviseDisabled={chat.isLoading}
        />
      ) : null}
    </div>
  );

  const conversation = (
    <div className="space-y-6">
      {chat.messages.map((msg, idx) => {
        if (isPendingPlan(msg, idx) || isStreamingPlan(msg, idx)) return null;
        if (msg.isPlan) {
          const m = extractPlanMeta(msg.content);
          const open = shownPlan?.id === msg.id;
          return (
            <button key={msg.id} type="button" aria-pressed={open} onClick={() => setShownPlanId(msg.id)}
              className={cn('block w-full rounded-lg border-l-[6px] bg-white px-4 py-3 text-left shadow-[0_1px_0_rgb(221_221_221),0_10px_24px_rgba(0,0,0,0.10)] transition-transform hover:-translate-y-0.5',
                open ? 'border-black' : 'border-neutral-300')}>
              <span className="block text-[11px] font-bold uppercase tracking-widest text-neutral-600">Priprema</span>
              <span className="mt-0.5 block font-display text-base font-extrabold leading-snug text-black">{m.topic || lastParamsRef.current?.topic || 'IBL plan'}</span>
            </button>
          );
        }
        const canAdd = canEditContext && msg.role === 'model' && idx > 0 && msg.id !== 'welcome';
        return <RailMessage key={msg.id} role={msg.role} content={msg.content} first={idx === 0}
          onAdd={canAdd ? () => void handleAddToPlan(idx) : undefined} added={addedIds.has(msg.id)} addDisabled={chat.isLoading} />;
      })}

      {chat.isLoading && !generating && !streamingMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-[0_1px_0_rgb(221_221_221),0_10px_24px_rgba(0,0,0,0.10)]">
          <img src={aiAvatarImg} alt="AI" className="h-8 w-8 rounded-full object-cover animate-pulse" />
          <LoadingIndicator />
        </div>
      )}

      {chat.error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border-l-[6px] border-brand-red bg-white px-4 py-3 text-sm font-medium text-black shadow-[0_10px_24px_rgba(0,0,0,0.10)]">
          {chat.error}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );

  const composer = (
    <div className="border-t border-neutral-200 bg-background px-4 pb-4 pt-3">
      {chat.mode === 'chat' && !chat.isLoading && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0">
          {MODE_C_SUGGESTIONS.slice(0, 4).map(q => (
            <button
              key={q}
              type="button"
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
              className="neu-btn flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:text-primary md:shrink md:whitespace-normal"
            >
              <Lightbulb className="h-3 w-3 shrink-0" />{q}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={chat.mode === 'chat' ? 'Postavite pitanje o ovom planu...' : 'Napišite predmet, razred, temu... ili postavite pitanje'}
            disabled={chat.isLoading}
            rows={1}
            className="neu-inset w-full resize-none overflow-y-auto px-4 py-3.5 pr-14 text-sm transition-all placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-50 max-h-36"
            style={{ minHeight: '52px' }}
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 144) + 'px'; }}
          />
          <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1">
            {chat.isLoading ? (
              <button type="button" onClick={chat.cancelStream} aria-label="Zaustavi"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20">
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSend} disabled={!input.trim()} aria-label="Pošalji"
                className="neu-btn-primary flex h-9 w-9 items-center justify-center disabled:cursor-not-allowed disabled:opacity-30">
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => { chat.clearChat(); setShowWizard(true); setSavedPlanIds(new Set()); setShownPlanId(null); lastParamsRef.current = null; convRef.current = null; warnedRef.current = false; setAddedIds(new Set()); }}
          className="neu-btn flex h-9 w-9 shrink-0 items-center justify-center text-neutral-700 transition-colors hover:text-primary"
          title="Novi razgovor"
          aria-label="Novi razgovor"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <ConversationExportButton messages={chat.messages} planTopic={lesson?.topic} />
      </div>
      <PrivacyNotice className="mt-3" />
      <p className="mt-2 text-[11px] font-medium tracking-wide text-neutral-600">
        IBL Planer v2.0 · {PSI_VERSION_LABEL} · IDSS Sarajevo
      </p>
    </div>
  );

  // Tablet and computer with a plan on the desk: two zones over the full width.
  if (hasDesk && !isMobile) {
    return (
      <div className="grid h-full grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside aria-label="Razgovor" className="flex min-h-0 flex-col border-r border-neutral-200">
          <div className="flex-1 overflow-y-auto px-4 py-5">{conversation}</div>
          {composer}
        </aside>
        <div className="min-h-0 overflow-y-auto px-4 py-5 lg:px-6">{desk}</div>
      </div>
    );
  }

  // A phone, or no plan yet (free chat): one column.
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className={cn('mx-auto space-y-6', !hasDesk && 'max-w-3xl')}>
          {conversation}
          {desk}
        </div>
      </div>
      <div className={cn('mx-auto w-full', !hasDesk && 'max-w-3xl')}>{composer}</div>
    </div>
  );
}

/** "nova verzija" in the plan's language (title of an amendment made by "Prepravi ovaj dio"). */
const NEW_VERSION: Record<string, string> = { bosnian: 'nova verzija', german: 'neue Fassung', english: 'new version' };

/** The title of the amendment just added (the plan's last amendment). */
function amendmentTitle(planText: string): string {
  return [...parseSegments(planText)].reverse().find((s) => /^(AMANDMAN|ERGÄNZUNG|AMENDMENT) \d+$/.test(s.head))?.title ?? '';
}

/** A message of the conversation as a sheet on the desk (P6, Director 2026-11-14: "3D AAA" cards in the left zone). */
function RailMessage({ role, content, first, onAdd, added, addDisabled }: {
  role: string; content: string; first: boolean;
  /** "Dodaj u plan" (saved plan, its author or the admin). */
  onAdd?: () => void; added?: boolean; addDisabled?: boolean;
}) {
  const reduce = useReducedMotion();
  if (role === 'user') {
    // The wizard sends "Label: value" lines; show them as an index card, anything else as text.
    const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
    const pairs = lines.map((l) => l.match(/^([^:]{2,24}):\s*(.+)$/));
    const isCard = pairs.length > 1 && pairs.every(Boolean);
    return (
      <motion.article
        initial={reduce ? false : { rotateX: 12, y: 14 }} animate={{ rotateX: 0, y: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="group relative ml-6" style={{ perspective: 1000 }}
      >
        <div aria-hidden="true" className="absolute inset-0 translate-x-1.5 translate-y-2 rotate-[1.5deg] rounded-lg bg-brand-blue/30" />
        <div className="relative rounded-lg bg-primary px-4 py-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_18px_32px_rgb(var(--primary)/0.35)] transition-transform duration-300 group-hover:[transform:rotateY(4deg)_rotateX(-2deg)_translateY(-2px)]">
          <span aria-hidden="true" className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-xs font-extrabold text-black shadow-[0_6px_14px_rgba(0,0,0,0.25)]">Vi</span>
          {isCard ? (
            <dl className="space-y-1.5">
              {pairs.map((m, i) => m && (
                <div key={i} className="flex items-baseline justify-between gap-3 border-b border-white/20 pb-1.5 last:border-0 last:pb-0">
                  <dt className="text-xs font-semibold uppercase tracking-wider">{m[1]}</dt>
                  <dd className="text-right text-sm font-bold">{m[2]}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
          )}
        </div>
      </motion.article>
    );
  }
  return (
    <motion.article
      initial={reduce ? false : { rotateY: -10, x: -16 }} animate={{ rotateY: 0, x: 0 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative" style={{ perspective: 1200 }}
    >
      <div aria-hidden="true" className="absolute inset-0 translate-x-2 translate-y-2 rotate-[1.2deg] rounded-lg bg-white shadow-[0_14px_30px_rgba(0,0,0,0.08)]" />
      <div className="relative rounded-lg bg-white py-4 pl-6 pr-4 shadow-[0_1px_0_rgb(221_221_221),0_22px_40px_rgba(0,0,0,0.14)] transition-transform duration-300 group-hover:[transform:rotateY(-4deg)_rotateX(2deg)_translateY(-2px)]">
        <span aria-hidden="true" className="absolute left-0 top-5 h-12 w-1.5 rounded-r bg-brand-blue" />
        {first && (
          <img src={aiAvatarImg} alt="AI Asistent"
            className="float-right mb-2 ml-3 h-12 w-12 rounded-full object-cover shadow-[0_8px_18px_rgba(0,0,0,0.20)] ring-4 ring-white" />
        )}
        {first ? (
          <div className="ai-message-content text-sm leading-relaxed text-black" dangerouslySetInnerHTML={{ __html: formatAIMessage(content) }} />
        ) : (
          // an answer about a plan is shown like the plan (tables, lists, no leftovers), M-7
          <div className="text-sm [&_table]:text-[12px]"><PlanText text={content} /></div>
        )}
        {(onAdd || added) && (
          <div className="mt-3 flex justify-end border-t border-neutral-200 pt-3">
            {added ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-primary"><CheckCircle2 className="h-4 w-4" /> Dodano u plan</span>
            ) : (
              <button type="button" onClick={onAdd} disabled={addDisabled}
                className="neu-btn-primary flex h-9 items-center gap-2 px-3 text-xs font-semibold disabled:opacity-50">
                <FilePlus2 className="h-4 w-4" /> Dodaj u plan
              </button>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}

/** Convert AI text to HTML — strips ALL markdown/decoration */
function formatAIMessage(text: string): string {
  let html = text
    .replace(/^[═=─\-~]{3,}.*$/gm, '')
    .replace(/^\|[-:| ]+\|$/gm, '')
    .replace(/[╔║╚╗╝╟╠╣╬┌┐└┘├┤┬┴┼]/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<span class="inline-code">$1</span>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-primary font-semibold text-xs mt-0.5 w-5 text-right flex-shrink-0">$1.</span><span>$2</span></div>')
    .replace(/^[-•·▸►→]\s+(.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-primary mt-0.5 flex-shrink-0">•</span><span>$1</span></div>')
    .replace(/^\|(.+)\|$/gm, (_match, content) => {
      const cells = content.split('|').map((c: string) => c.trim()).filter(Boolean);
      if (cells.length < 2) return '';
      return `<div class="flex gap-4 py-1 text-sm"><span class="font-semibold text-foreground/70 min-w-[120px]">${cells[0]}</span><span>${cells.slice(1).join(' · ')}</span></div>`;
    })
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n\n/g, '</p><p class="mt-2.5">')
    .replace(/\n/g, '<br/>');

  html = html.replace(/<p class="mt-2\.5"><\/p>/g, '');
  html = html.replace(/<br\/><br\/>/g, '</p><p class="mt-2.5">');

  return `<p>${html}</p>`;
}
