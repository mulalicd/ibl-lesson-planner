import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/types';

interface ConversationExportButtonProps {
  messages: ChatMessage[];
  className?: string;
}

export default function ConversationExportButton({ messages, className }: ConversationExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleExport() {
    if (status === 'loading' || messages.length <= 1) return;
    setStatus('loading');

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');

      const children: any[] = [];

      // Title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'IBL Planer — Zapis razgovora', bold: true, size: 32, font: 'Arial', color: '6C63FF' })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `IDSS Sarajevo · Datum: ${new Date().toLocaleDateString('bs-BA')}`, size: 20, font: 'Arial', color: '888888' })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'E0E0E0', space: 1 } },
          spacing: { after: 300 },
          children: [],
        })
      );

      // Messages
      for (const msg of messages) {
        if (msg.id === 'welcome') continue;

        const isUser = msg.role === 'user';
        const label = isUser ? '👤 KORISNIK' : '🤖 AI ASISTENT';
        const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' }) : '';

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: label, bold: true, size: 22, font: 'Arial', color: isUser ? '6C63FF' : '4CAF93' }),
              new TextRun({ text: `  ${time}`, size: 18, font: 'Arial', color: 'AAAAAA' }),
            ],
            spacing: { before: 240, after: 80 },
          })
        );

        // Clean content - remove markdown/decoration characters
        const cleanContent = msg.content
          .replace(/[═╔║╚╗╝╟╠╣╬┌┐└┘├┤┬┴┼]/g, '')
          .replace(/={4,}/g, '')
          .replace(/-{4,}/g, '')
          .replace(/\|/g, '');

        const contentLines = cleanContent.split('\n');
        for (const line of contentLines) {
          const trimmed = line.trim();
          if (!trimmed) {
            children.push(new Paragraph({ spacing: { after: 60 }, children: [] }));
            continue;
          }

          const isBullet = trimmed.match(/^[•·\-–]\s/);
          const isNumbered = trimmed.match(/^\d+[\.\)]\s/);
          const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 60 && /[A-Z]/.test(trimmed);

          if (isAllCaps) {
            children.push(
              new Paragraph({
                children: [new TextRun({ text: trimmed, bold: true, size: 22, font: 'Arial', color: '333333' })],
                spacing: { before: 160, after: 80 },
              })
            );
          } else {
            children.push(
              new Paragraph({
                children: [new TextRun({
                  text: (isBullet || isNumbered) ? trimmed : trimmed,
                  size: 20,
                  font: 'Arial',
                  color: '444444',
                })],
                spacing: { after: 40 },
                indent: (isBullet || isNumbered) ? { left: 360 } : undefined,
              })
            );
          }
        }

        // Separator
        children.push(
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'F0F0F0', space: 1 } },
            spacing: { before: 120, after: 120 },
            children: [],
          })
        );
      }

      // Footer
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'IBL Planer v2.0 · PSI v8.0 · IDSS Sarajevo', size: 18, font: 'Arial', color: 'AAAAAA', italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        })
      );

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
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
