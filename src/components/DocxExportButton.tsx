import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocxExportButtonProps {
  planId: string;
  planText?: string;
  className?: string;
}

export default function DocxExportButton({ planId, planText, className }: DocxExportButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  async function handleExport() {
    if (status === 'loading') return;
    setStatus('loading');

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

      const text = planText || '';
      const lines = text.split('\n');
      const paragraphs: any[] = [];

      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'IBL Plan časa — IDSS Sarajevo', bold: true, size: 32, color: '6366F1' })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      for (const line of lines) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 20 })],
            spacing: { after: 60 },
          })
        );
      }

      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IBL_Plan_${planId.slice(0, 8)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      console.error('DOCX export error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleExport}
      disabled={status === 'loading'}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
        status === 'loading' && 'neu-btn text-muted-foreground cursor-not-allowed',
        status === 'success' && 'bg-secondary/15 text-secondary border border-secondary/25',
        status === 'error' && 'bg-destructive/10 text-destructive border border-destructive/20',
        status === 'idle' && 'neu-btn-primary',
        className
      )}
    >
      {status === 'loading' ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Izvoz...</>
      ) : status === 'success' ? (
        <><CheckCircle2 className="w-4 h-4" /> Izvezeno!</>
      ) : status === 'error' ? (
        <><XCircle className="w-4 h-4" /> Greška</>
      ) : (
        <><Download className="w-4 h-4" /> Word dokument</>
      )}
    </motion.button>
  );
}
