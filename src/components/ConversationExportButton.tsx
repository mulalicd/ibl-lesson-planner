import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';
import memorandumUrl from '@/assets/memorandum/IDSS_memorandum_nastavnici.docx?url';

interface ConversationExportButtonProps {
  messages: ChatMessage[];
  /** The plan the conversation is about, named in the document. */
  planTopic?: string | null;
  className?: string;
}

export default function ConversationExportButton({ messages, planTopic, className }: ConversationExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleExport() {
    if (status === 'loading' || messages.length <= 1) return;
    setStatus('loading');

    try {
      // Director 2026-11-14: on the school's memorandum, like the plan (one Word builder, M-7). Loaded on click only.
      const { buildConversationOnMemorandum } = await import('@/lib/memorandumDocx');
      const template = await (await fetch(memorandumUrl)).arrayBuffer();
      const entries = messages.filter((m) => m.id !== 'welcome').map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp }));
      const bytes = await buildConversationOnMemorandum(template, entries, planTopic);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IBL_Razgovor_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      console.error('Conversation DOCX export error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  const hasContent = messages.filter(m => m.id !== 'welcome').length > 0;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleExport}
      disabled={status === 'loading' || !hasContent}
      className={cn(
        'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200',
        status === 'loading' && 'neu-btn text-muted-foreground cursor-not-allowed',
        status === 'success' && 'bg-secondary/15 text-secondary border border-secondary/25',
        status === 'error' && 'bg-destructive/10 text-destructive border border-destructive/20',
        status === 'idle' && 'neu-btn text-muted-foreground hover:text-primary',
        !hasContent && 'opacity-30 cursor-not-allowed',
        className
      )}
    >
      {status === 'loading' ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Izvoz...</>
      ) : status === 'success' ? (
        <><CheckCircle2 className="w-3.5 h-3.5" /> Izvezeno!</>
      ) : status === 'error' ? (
        <><XCircle className="w-3.5 h-3.5" /> Greška</>
      ) : (
        <><FileDown className="w-3.5 h-3.5" /> Izvezi razgovor</>
      )}
    </motion.button>
  );
}
