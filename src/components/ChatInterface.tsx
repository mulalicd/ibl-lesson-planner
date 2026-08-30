import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, StopCircle, RotateCcw, Lightbulb, ChevronRight, Save, CheckCircle2 } from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { MODE_C_SUGGESTIONS, deriveTier } from '@/lib/constants';
import PlanDisplay from './PlanDisplay';
import DocxExportButton from './DocxExportButton';
import ConversationExportButton from './ConversationExportButton';
import InputWizard from './InputWizard';
import LoadingIndicator from './LoadingIndicator';
import aiAvatarImg from '@/assets/ai-avatar.jpg';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Language } from '@/lib/types';

interface ChatInterfaceProps {
  initialPlan?: { id: string; text: string } | null;
}

export default function ChatInterface({ initialPlan }: ChatInterfaceProps) {
  const chat = useChat();
  const [input, setInput] = useState('');
  const [showWizard, setShowWizard] = useState(!initialPlan);
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [savedPlanIds, setSavedPlanIds] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Store last generate params for saving
  const lastParamsRef = useRef<{ subject: string; grade: number; topic: string; duration_min: number; language: Language; prior_knowledge?: string; notes?: string } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isLoading]);

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
      const subjectMatch = planText.match(/Predmet:\s*(.+)/i);
      const gradeMatch = planText.match(/Razred:\s*(\d+)/i);
      const topicMatch = planText.match(/Tema:\s*(.+)/i);
      const durationMatch = planText.match(/Trajanje:\s*(\d+)/i);
      const iqMatch = planText.match(/(?:ISTRAŽIVAČKO PITANJE|INQUIRY QUESTION|FORSCHUNGSFRAGE)[^?]*\n\s*([^\n]+\?)/i);

      const params = lastParamsRef.current;

      const record = {
        plan_text: planText,
        subject: params?.subject || subjectMatch?.[1]?.trim() || 'Nepoznat',
        grade: params?.grade || parseInt(gradeMatch?.[1] || '5'),
        topic: params?.topic || topicMatch?.[1]?.trim() || 'Bez teme',
        duration_min: params?.duration_min || parseInt(durationMatch?.[1] || '45'),
        language: (params?.language || 'bosnian') as string,
        tier: deriveTier(params?.duration_min || parseInt(durationMatch?.[1] || '45')),
        prior_knowledge: params?.prior_knowledge || null,
        notes: params?.notes || null,
        inquiry_question: iqMatch?.[1]?.trim() || null,
        is_favourite: false,
        is_deleted: false,
      };

      const { error } = await supabase.from('plans').insert(record as any);
      if (error) throw error;

      setSavedPlanIds(prev => new Set(prev).add(msgId));
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

  // Wizard view
  if (showWizard && chat.mode === 'onboarding' && !hasMessages) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden neu-card shadow-lg">
                <img src={aiAvatarImg} alt="AI" className="w-full h-full object-cover" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Kreirajte IBL Plan časa
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Popunite obrazac korak po korak ili
              <button
                onClick={() => setShowWizard(false)}
                className="text-primary font-semibold hover:underline ml-1 inline-flex items-center gap-1"
              >
                razgovarajte s AI-om <ChevronRight className="w-3 h-3" />
              </button>
            </p>
          </motion.div>
          <InputWizard onGenerate={handleWizardGenerate} isLoading={chat.isLoading} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
        <AnimatePresence mode="popLayout">
          {chat.messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: idx === 0 ? 0 : 0.05 }}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {/* Avatar */}
              {msg.role === 'user' ? (
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-bold neu-btn-primary"
                >
                  Vi
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  className="flex-shrink-0 w-10 h-10 rounded-2xl overflow-hidden neu-card"
                >
                  <img src={aiAvatarImg} alt="AI Asistent" className="w-full h-full object-cover" />
                </motion.div>
              )}

              {/* Message bubble */}
              <div className={cn(
                'max-w-[85%] rounded-2xl',
                msg.role === 'user'
                  ? 'neu-bubble-user rounded-tr-lg px-5 py-4'
                  : 'neu-bubble-ai rounded-tl-lg px-5 py-4',
                msg.isPlan && 'max-w-full w-full !px-4 !py-5'
              )}>
                {msg.isPlan ? (
                  <div className="space-y-4">
                    <PlanDisplay planText={msg.content} planId={msg.plan_id} />
                    {/* Action buttons: Save + Export */}
                    <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/30">
                      {/* Save button */}
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSavePlan(msg.id, msg.content)}
                        disabled={!!savingPlanId || savedPlanIds.has(msg.id)}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all',
                          savedPlanIds.has(msg.id)
                            ? 'bg-status-success-bg text-status-success border border-status-success/20 cursor-default'
                            : 'neu-btn-primary hover:shadow-depth-3',
                          savingPlanId === msg.id && 'opacity-70 cursor-wait'
                        )}
                      >
                        {savedPlanIds.has(msg.id) ? (
                          <><CheckCircle2 className="w-4 h-4" /> Sačuvano</>
                        ) : savingPlanId === msg.id ? (
                          <><Save className="w-4 h-4 animate-pulse" /> Čuvanje...</>
                        ) : (
                          <><Save className="w-4 h-4" /> Sačuvaj plan</>
                        )}
                      </motion.button>
                      {msg.plan_id && (
                        <DocxExportButton planId={msg.plan_id} planText={msg.content} />
                      )}
                    </div>
                  </div>
                ) : msg.role === 'model' ? (
                  <div className="ai-message-content text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatAIMessage(msg.content) }} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading */}
        {chat.isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-10 h-10 rounded-2xl overflow-hidden neu-card flex-shrink-0">
              <img src={aiAvatarImg} alt="AI" className="w-full h-full object-cover animate-pulse" />
            </div>
            <div className="neu-bubble-ai rounded-2xl rounded-tl-lg px-5 py-4 max-w-md">
              <LoadingIndicator />
            </div>
          </motion.div>
        )}

        {chat.error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto max-w-md bg-destructive/8 text-destructive rounded-2xl px-5 py-3.5 text-sm text-center border border-destructive/15 shadow-depth-2"
          >
            ⚠️ {chat.error}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {chat.mode === 'chat' && !chat.isLoading && (
        <div className="px-4 md:px-8 pb-3 flex flex-wrap gap-2">
          {MODE_C_SUGGESTIONS.slice(0, 4).map(q => (
            <motion.button
              key={q}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
              className="text-xs px-4 py-2.5 rounded-xl neu-btn text-muted-foreground hover:text-primary font-medium flex items-center gap-1.5"
            >
              <Lightbulb className="w-3 h-3 opacity-50" />{q}
              <ChevronRight className="w-3 h-3 opacity-30" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 md:px-8 pb-5 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex flex-col gap-1.5">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => { chat.clearChat(); setShowWizard(true); setSavedPlanIds(new Set()); lastParamsRef.current = null; }}
              className="flex-shrink-0 w-11 h-11 rounded-xl neu-btn flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
              title="Novi razgovor"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
            <ConversationExportButton messages={chat.messages} />
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={chat.mode === 'chat' ? 'Postavite pitanje o ovom planu...' : 'Napišite predmet, razred, temu... ili postavite pitanje'}
              disabled={chat.isLoading}
              rows={1}
              className="w-full resize-none neu-inset px-5 py-3.5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 transition-all disabled:opacity-50 max-h-36 overflow-y-auto placeholder:text-muted-foreground/50"
              style={{ minHeight: '52px' }}
              onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 144) + 'px'; }}
            />
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
              {chat.isLoading ? (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={chat.cancelStream}
                  className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                  <StopCircle className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-xl neu-btn-primary flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-muted-foreground/40 mt-3 font-medium tracking-wide">
          IBL Planer v2.0 · PSI v8.0 · IDSS Sarajevo
        </p>
      </div>
    </div>
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
    .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-primary/50 font-semibold text-xs mt-0.5 w-5 text-right flex-shrink-0">$1.</span><span>$2</span></div>')
    .replace(/^[\-•·▸►→]\s+(.+)$/gm, '<div class="flex items-start gap-2 py-0.5"><span class="text-primary/60 mt-0.5 flex-shrink-0">•</span><span>$1</span></div>')
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
