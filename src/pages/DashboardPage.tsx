import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, X, Star, LayoutGrid, Loader2, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';
import PlanCard from '@/components/PlanCard';
import { SUBJECTS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import type { PlanCardData, DashboardFilters } from '@/lib/types';
import { softDeletePlan } from '@/lib/planActions';
import { fetchFavouriteIds, fetchPlanAuthors } from '@/lib/planFavourites';
import { TierSchema } from '@/lib/validation/schemas';
import { toast } from 'sonner';
import { ERROR_MESSAGES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_PLAN_SCOPE, PLAN_SCOPE_LABELS, planScopeQuery, planScopeTitle, type PlanScope } from '@/lib/planScope';

const INITIAL_FILTERS: DashboardFilters = {
  subject: '', grade: null, tier: null, isFavourite: false, searchQuery: '',
  sortBy: 'created_at', sortOrder: 'desc',
};

export default function DashboardPage() {
  const [plans, setPlans] = useState<PlanCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // P5-1: "Moji" (default, Director) / "Svi". Kept outside the filters so "Resetuj" does not change it.
  const [scope, setScope] = useState<PlanScope>(DEFAULT_PLAN_SCOPE);
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;
  const limit = 12;

  useEffect(() => { fetchPlans(); }, [page, filters, scope, userId]);

  async function fetchPlans() {
    setLoading(true);
    const scoped = planScopeQuery(scope, userId);
    if (scoped.kind === 'none') { setPlans([]); setTotal(0); setLoading(false); return; }
    try {
      // P5-2: the teacher's own stars; the "favourites" filter shows only those plans
      const favourites = await fetchFavouriteIds();
      if (filters.isFavourite && favourites.size === 0) { setPlans([]); setTotal(0); return; }
      let query = supabase
        .from('plans')
        .select('id, created_at, subject, grade, topic, duration_min, tier, language, inquiry_question', { count: 'exact' })
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (scoped.kind === 'owner') query = query.eq('owner_id', scoped.ownerId);
      if (filters.subject) query = query.eq('subject', filters.subject);
      if (filters.grade) query = query.eq('grade', filters.grade);
      if (filters.tier) query = query.eq('tier', filters.tier);
      if (filters.isFavourite) query = query.in('id', [...favourites]);
      if (filters.searchQuery) query = query.ilike('topic', `%${filters.searchQuery}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const authors = await fetchPlanAuthors(rows.map((r) => r.id));
      setPlans(rows.map((r) => ({
        ...(r as unknown as Omit<PlanCardData, 'favourite' | 'author'>),
        favourite: favourites.has(r.id),
        author: authors.get(r.id) ?? null,
      })));
      setTotal(count ?? 0);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  function setFilter<K extends keyof DashboardFilters>(key: K, val: DashboardFilters[K]) {
    setFilters(prev => ({ ...prev, [key]: val }));
    setPage(1);
  }

  async function handleDeletePlan(planId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Obrisati ovaj plan? Ova akcija se ne može poništiti.')) return;
    // P2-2: RLS refuses a non-author's delete WITHOUT an error (0 rows); never remove it from the list then.
    const result = await softDeletePlan(planId);
    if (result === 'ok') {
      setPlans(prev => prev.filter(p => p.id !== planId));
      setTotal(prev => prev - 1);
    } else if (result === 'forbidden') {
      toast.error(ERROR_MESSAGES.DELETE_FORBIDDEN);
    } else {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = filters.subject || filters.grade || filters.tier || filters.isFavourite || filters.searchQuery;

  const selectCls = 'h-10 min-w-[150px] cursor-pointer appearance-none rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    // P6 S2 (direction C, DL-P34): the library is the desk — each plan is a sheet of paper on it.
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="px-3 py-4 md:px-6">
        {/* Title bar with the Moji / Svi binder tabs */}
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div role="group" aria-label="Prikaz planova" className="mb-[-1px] flex gap-1.5">
              {(['mine', 'all'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  aria-pressed={scope === sc}
                  onClick={() => { setScope(sc); setPage(1); }}
                  className={cn(
                    'h-10 rounded-t-lg px-5 text-sm font-bold transition-transform',
                    scope === sc ? 'translate-y-0 bg-white text-black shadow-[0_-1px_0_rgb(221_221_221)]' : 'translate-y-1 bg-neutral-200 text-neutral-700 hover:text-black',
                  )}
                >
                  {PLAN_SCOPE_LABELS[sc]}
                </button>
              ))}
            </div>
            <div className="rounded-b-md rounded-tr-md bg-white px-4 py-3 shadow-[0_1px_0_rgb(221_221_221)]">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{planScopeTitle(scope)}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{total} {total === 1 ? 'plan' : 'planova'} ukupno</p>
            </div>
          </div>
          <Link to="/chat" className="inline-flex h-12 items-center gap-2 self-start rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground sm:self-auto">
            <Plus className="h-4 w-4" /> Novi plan
          </Link>
        </div>

        {/* Filters: always visible on a desktop, behind "Filteri" on a phone */}
        <div className="mb-4 rounded-md bg-white p-2.5 shadow-[0_1px_0_rgb(221_221_221)]">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 lg:max-w-[340px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Pretraži teme..."
                aria-label="Pretraži teme"
                value={filters.searchQuery || ''}
                onChange={e => setFilter('searchQuery', e.target.value)}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(prev => !prev)}
              aria-expanded={filtersOpen}
              className={cn('flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-semibold lg:hidden', filtersOpen ? 'text-primary' : 'text-neutral-700')}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filteri
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
            </button>
            <div className={cn('w-full flex-wrap items-center gap-3 lg:flex lg:w-auto', filtersOpen ? 'flex' : 'hidden')}>
              <select value={filters.subject || ''} onChange={e => setFilter('subject', e.target.value)} className={selectCls} aria-label="Predmet">
                <option value="">Svi predmeti</option>
                {SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
              <select value={filters.grade ?? ''} onChange={e => setFilter('grade', e.target.value ? Number(e.target.value) : null)} className={selectCls} aria-label="Razred">
                <option value="">Svi razredi</option>
                {Array.from({ length: 9 }, (_, i) => i + 1).map(g => (<option key={g} value={g}>{g}. razred</option>))}
              </select>
              <select value={filters.tier ?? ''} onChange={e => { const t = TierSchema.safeParse(e.target.value); setFilter('tier', t.success ? t.data : null); }} className={selectCls} aria-label="Tip časa">
                <option value="">Svi tipovi</option>
                <option value="MICRO">Mikro čas</option>
                <option value="STANDARD">Standardni čas</option>
                <option value="EXTENDED">Produženi čas</option>
              </select>
              <label className="flex h-10 cursor-pointer select-none items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-800">
                <input type="checkbox" checked={filters.isFavourite || false} onChange={e => setFilter('isFavourite', e.target.checked)} className="h-4 w-4 accent-primary" />
                <Star className="h-3.5 w-3.5" /> Omiljeni
              </label>
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={() => { setFilters(INITIAL_FILTERS); setPage(1); }}
                className="flex h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-neutral-700 hover:text-destructive">
                <X className="h-3 w-3" /> Resetuj
              </button>
            )}
          </div>
        </div>

        {/* The desk with the plans */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : plans.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-40 w-32 rotate-[-4deg] items-center justify-center rounded bg-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
              <LayoutGrid className="h-10 w-10 text-neutral-300" />
            </div>
            <p className="mb-2 font-display text-xl font-bold">{hasActiveFilters ? 'Nema rezultata' : 'Nema planova'}</p>
            <p className="mb-6 text-sm text-muted-foreground">{hasActiveFilters ? 'Promijenite filtere za više rezultata.' : 'Kreirajte prvi IBL plan časa.'}</p>
            <Link to="/chat" className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-primary-foreground">
              <Plus className="h-4 w-4" /> Novi plan
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ y: 24 }}
                animate={{ y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.05, duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
                className="group/card relative"
              >
                <PlanCard plan={plan} className={i % 3 === 1 ? 'rotate-[0.6deg]' : i % 3 === 2 ? 'rotate-[-0.5deg]' : ''} />
                <button
                  type="button"
                  onClick={(e) => handleDeletePlan(plan.id, e)}
                  aria-label="Obriši plan"
                  title="Obriši plan"
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-xs text-neutral-600 opacity-0 transition-opacity hover:border-brand-red/40 hover:text-brand-red focus-visible:opacity-100 group-hover/card:opacity-100"
                >
                  ✗
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="h-10 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">← Prethodna</button>
            <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold">{page} / {totalPages}</span>
            <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="h-10 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">Sljedeća →</button>
          </div>
        )}
      </main>
    </div>
  );
}
