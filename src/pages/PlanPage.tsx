import { displayPlanText } from '@/lib/language/display';
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Trash2, Plus, MessageSquare, Loader2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import PlanDisplay from '@/components/PlanDisplay';
import GeminiStatusBar from '@/components/GeminiStatusBar';
import DocxExportButton from '@/components/DocxExportButton';
import { supabase } from '@/integrations/supabase/client';
import { formatDate, showText, showGrade, showMinutes } from '@/lib/utils';
import type { PlanRecord } from '@/lib/types';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { ERROR_MESSAGES } from '@/lib/constants';
import { softDeletePlan, fetchIsAdmin, canChangePlan } from '@/lib/planActions';
import { isFavourite, setFavourite } from '@/lib/planFavourites';

export default function PlanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { session } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  // P5-2: the signed-in teacher's own star
  const [favourite, setFavouriteState] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchIsAdmin().then((v) => { if (alive) setIsAdmin(v); });
    return () => { alive = false; };
  }, []);

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
          // P5-5: older Bosnian plans are shown and exported with the DL-P19 fixes (stored text unchanged)
          const record = data as unknown as PlanRecord;
          setPlan({ ...record, plan_text: displayPlanText(record.plan_text, record.language) });
        }
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void isFavourite(id).then((v) => { if (alive) setFavouriteState(v); });
    return () => { alive = false; };
  }, [id]);

  async function toggleFavourite() {
    if (!plan) return;
    const next = !favourite;
    setFavouriteState(next);
    const result = await setFavourite(plan.id, next);
    if (result !== 'ok') {
      setFavouriteState(!next);
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  async function deletePlan() {
    if (!plan) return;
    if (!confirm('Obrisati ovaj plan? Ova akcija se ne može poništiti.')) return;
    const result = await softDeletePlan(plan.id);
    if (result === 'ok') navigate('/dashboard');
    else if (result === 'forbidden') toast.error(ERROR_MESSAGES.DELETE_FORBIDDEN);
    else toast.error(ERROR_MESSAGES.NETWORK_ERROR);
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

  // UI only: the database decides (RLS). Author or admin may change the plan.
  const canChange = canChangePlan(plan.owner_id, session?.user?.id, isAdmin);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* P6 S2 (direction C): the plan's title bar, then the workspace — the desk with the plan on it */}
      <main className="px-3 py-4 md:px-6">
        <div className="mb-4 flex flex-col gap-3 rounded-md bg-white px-4 py-3 shadow-[0_1px_0_rgb(221_221_221)] lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-neutral-600">
              <Link to="/dashboard" className="flex items-center gap-1 hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Moji planovi</Link>
              <span aria-hidden="true">/</span>
              <span>{showText(plan.subject)} · {showGrade(plan.grade)}</span>
            </div>
            <h1 className="truncate font-display text-2xl font-extrabold tracking-tight">{showText(plan.topic)}</h1>
            {plan.inquiry_question && (
              <p className="mt-1 line-clamp-2 text-sm text-primary"><span className="font-semibold text-neutral-600">Istraživačko pitanje: </span>{plan.inquiry_question}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded bg-neutral-100 px-2 py-1">{showMinutes(plan.duration_min)}</span>
              <span className="rounded bg-neutral-100 px-2 py-1">{formatDate(plan.created_at)}</span>
              {plan.docx_export_count > 0 && <span className="rounded bg-neutral-100 px-2 py-1">Izvezeno {plan.docx_export_count}×</span>}
              <GeminiStatusBar tier={plan.tier} language={plan.language} durationMs={plan.generation_time_ms ?? undefined} keyIndex={plan.gemini_key_index ?? undefined} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* P5-2: every teacher may star any plan they can read (own favourites) */}
            <motion.button whileTap={{ scale: 0.93 }} onClick={toggleFavourite} aria-label="Favorit" aria-pressed={favourite}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white transition-colors hover:text-idss-gold">
              <Star className={`h-4 w-4 ${favourite ? 'fill-brand-yellow text-brand-yellow' : 'text-muted-foreground'}`} />
            </motion.button>
            <DocxExportButton planId={plan.id} planText={plan.plan_text} />
            <Link to={`/chat?plan_id=${plan.id}`} className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 hover:text-primary">
              <MessageSquare className="h-4 w-4" /> Razgovor s AI-om
            </Link>
            <Link to="/chat" className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 hover:text-primary">
              <Plus className="h-4 w-4" /> Novi
            </Link>
            {canChange && (
              <motion.button whileTap={{ scale: 0.93 }} onClick={deletePlan} aria-label="Obriši plan"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-muted-foreground transition-colors hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>

        <PlanDisplay planText={plan.plan_text} planId={plan.id} asDocument />
      </main>
    </div>
  );
}
