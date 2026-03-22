import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Trash2, Plus, MessageSquare, Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import PlanDisplay from '@/components/PlanDisplay';
import GeminiStatusBar from '@/components/GeminiStatusBar';
import DocxExportButton from '@/components/DocxExportButton';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';
import type { PlanRecord } from '@/lib/types';

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Plan nije pronađen.');
        } else {
          setPlan(data as unknown as PlanRecord);
        }
        setLoading(false);
      });
  }, [id]);

  async function toggleFavourite() {
    if (!plan) return;
    const next = !plan.is_favourite;
    setPlan(prev => prev ? { ...prev, is_favourite: next } : prev);
    await supabase
      .from('plans')
      .update({ is_favourite: next } as any)
      .eq('id', plan.id)
      .then(({ error }) => {
        if (error) setPlan(prev => prev ? { ...prev, is_favourite: !next } : prev);
      });
  }

  async function deletePlan() {
    if (!plan) return;
    if (!confirm('Obrisati ovaj plan? Ova akcija se ne može poništiti.')) return;
    await supabase.from('plans').update({ is_deleted: true } as any).eq('id', plan.id);
    navigate('/dashboard');
  }

  if (loading) return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader />
      <div className="flex items-center justify-center py-32">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    </div>
  );

  if (error || !plan) return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader />
      <div className="flex items-center justify-center py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="neu-card inline-block p-6 rounded-3xl mb-4">
            <p className="text-4xl">📋</p>
          </div>
          <p className="text-foreground font-bold mb-2">{error || 'Plan nije pronađen.'}</p>
          <Link to="/dashboard" className="text-sm text-primary hover:underline font-medium">
            ← Nazad na planove
          </Link>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader />

      <motion.main
        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto px-4 md:px-8 py-8"
      >
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Moji planovi
            </Link>
            <span className="text-border/70">/</span>
            <span className="font-semibold text-foreground">
              {plan.subject} · {plan.grade}. razred
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={toggleFavourite}
              className="w-10 h-10 rounded-xl neu-btn flex items-center justify-center hover:text-idss-gold transition-colors"
            >
              <Star className={`w-4 h-4 ${plan.is_favourite ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
            </motion.button>
            <DocxExportButton planId={plan.id} planText={plan.plan_text} />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Link
                to="/chat"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl neu-btn text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4" /> Novi
              </Link>
            </motion.div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={deletePlan}
              className="w-10 h-10 rounded-xl neu-btn flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Meta card */}
        <div className="neu-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-foreground leading-snug tracking-tight">
              {plan.topic}
            </h1>
            <GeminiStatusBar
              tier={plan.tier}
              language={plan.language}
              durationMs={plan.generation_time_ms ?? undefined}
              keyIndex={plan.gemini_key_index ?? undefined}
              className="flex-shrink-0"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="pastel-tag">📚 {plan.subject}</span>
            <span className="pastel-tag">🎓 {plan.grade}. razred</span>
            <span className="pastel-tag">⏱ {plan.duration_min} min</span>
            <span className="pastel-tag">📅 {formatDate(plan.created_at)}</span>
            {plan.docx_export_count > 0 && <span className="pastel-tag">⬇ Izvezeno {plan.docx_export_count}×</span>}
          </div>
        </div>

        {/* Inquiry question callout */}
        {plan.inquiry_question && (
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="iq-callout mb-6"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/70 mb-2 not-italic">
              Istraživačko pitanje
            </p>
            <p className="text-lg text-foreground leading-relaxed">
              {plan.inquiry_question}
            </p>
          </motion.div>
        )}

        {/* Plan display - structured cards */}
        <PlanDisplay planText={plan.plan_text} planId={plan.id} />

        {/* Footer actions */}
        <div className="mt-8 flex items-center justify-between">
          <Link
            to={`/chat?plan_id=${plan.id}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline font-medium"
          >
            <MessageSquare className="w-4 h-4" /> Razgovarajte s AI-om o ovom planu
          </Link>
          <DocxExportButton planId={plan.id} planText={plan.plan_text} />
        </div>
      </motion.main>
    </div>
  );
}
