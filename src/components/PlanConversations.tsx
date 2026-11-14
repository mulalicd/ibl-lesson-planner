/**
 * PlanConversations — P6 (DL-P37, Director 2026-11-14): the conversations with the AI about a saved plan, shown on
 * the plan's page under the plan. Every signed-in teacher sees them (like the plan); each can be read and exported
 * to Word on the memorandum. Nothing is shown when there are none.
 */
import { useEffect, useState } from 'react';
import { ChevronDown, MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPlanConversations, type PlanConversation } from '@/lib/planConversations';
import ConversationExportButton from '@/components/ConversationExportButton';
import { PlanText } from '@/components/PlanDisplay';
import type { ChatMessage } from '@/lib/types';

const when = (iso: string) => new Date(iso).toLocaleString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function PlanConversations({ planId, planTopic }: { planId: string; planTopic?: string | null }) {
  const [items, setItems] = useState<PlanConversation[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchPlanConversations(planId).then((c) => { if (alive) setItems(c); });
    return () => { alive = false; };
  }, [planId]);

  if (!items.length) return null;
  return (
    <section aria-label="Razgovori o ovoj pripremi" className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
        <MessagesSquare className="h-5 w-5 text-primary" /> Razgovori o ovoj pripremi
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((c) => {
          const isOpen = open === c.id;
          const asChat: ChatMessage[] = c.messages.map((m, i) => ({ id: `${c.id}-${i}`, role: m.role, content: m.content, timestamp: m.created_at }));
          return (
            <article key={c.id} className="rounded-md bg-white shadow-[0_1px_0_rgb(221_221_221),0_10px_24px_rgba(0,0,0,0.08)]">
              <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <ChevronDown className={cn('h-4 w-4 flex-none transition-transform', isOpen && 'rotate-180')} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-black">{c.messages.find((m) => m.role === 'user')?.content ?? 'Razgovor'}</span>
                    <span className="block text-xs text-neutral-600">{[c.author, when(c.created_at), `${c.messages.length} poruka`].filter(Boolean).join(' · ')}</span>
                  </span>
                </button>
                {c.replacedPlan && <span className="rounded bg-brand-yellow px-2 py-0.5 text-[11px] font-bold text-black">Ugrađeno u plan</span>}
                <ConversationExportButton messages={asChat} planTopic={planTopic} />
              </div>
              {isOpen && (
                <div className="space-y-4 border-t border-neutral-200 px-4 py-4">
                  {c.messages.map((m, i) => (
                    <div key={i} className={cn('rounded-md px-4 py-3', m.role === 'user' ? 'bg-primary text-white' : 'bg-neutral-50 ring-1 ring-neutral-200')}>
                      <p className={cn('mb-1 text-xs font-bold', m.role === 'user' ? 'text-white' : 'text-primary')}>
                        {m.role === 'user' ? 'Nastavnik' : 'AI asistent'} · {when(m.created_at)}
                      </p>
                      {m.role === 'user' ? <p className="whitespace-pre-wrap text-sm">{m.content}</p> : <PlanText text={m.content} />}
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
