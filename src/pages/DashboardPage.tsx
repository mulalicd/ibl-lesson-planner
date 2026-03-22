import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Star, LayoutGrid, Loader2, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import AppHeader from '@/components/AppHeader';
import PlanCard from '@/components/PlanCard';
import { SUBJECTS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import type { PlanCardData, DashboardFilters } from '@/lib/types';

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
  const limit = 12;

  useEffect(() => { fetchPlans(); }, [page, filters]);

  async function fetchPlans() {
    setLoading(true);
    try {
      let query = supabase
        .from('plans')
        .select('id, created_at, subject, grade, topic, duration_min, tier, language, inquiry_question, is_favourite', { count: 'exact' })
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      if (filters.subject) query = query.eq('subject', filters.subject);
      if (filters.grade) query = query.eq('grade', filters.grade);
      if (filters.tier) query = query.eq('tier', filters.tier);
      if (filters.isFavourite) query = query.eq('is_favourite', true);
      if (filters.searchQuery) query = query.ilike('topic', `%${filters.searchQuery}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      setPlans((data as unknown as PlanCardData[]) ?? []);
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
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_deleted: true })
        .eq('id', planId);
      if (!error) {
        setPlans(prev => prev.filter(p => p.id !== planId));
        setTotal(prev => prev - 1);
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  }

  const totalPages = Math.ceil(total / limit);
  const hasActiveFilters = filters.subject || filters.grade || filters.tier || filters.isFavourite || filters.searchQuery;

  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <AppHeader />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Moji IBL planovi</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {total} {total === 1 ? 'plan' : 'planova'} ukupno
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl neu-btn-primary
                         text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Novi plan
            </Link>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="neu-card p-4 mb-6"
        >
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <input
                type="text"
                placeholder="Pretraži teme..."
                value={filters.searchQuery || ''}
                onChange={e => setFilter('searchQuery', e.target.value)}
                className="w-full neu-inset pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25
                           placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Toggle filters */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setFiltersOpen(prev => !prev)}
              className={cn(
                'neu-btn flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors',
                filtersOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filteri
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </motion.button>

            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setFilters(INITIAL_FILTERS); setPage(1); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive
                           px-3 py-2 rounded-xl hover:bg-destructive/8 transition-all font-medium"
              >
                <X className="w-3 h-3" /> Resetuj
              </motion.button>
            )}
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
                  <select
                    value={filters.subject || ''}
                    onChange={e => setFilter('subject', e.target.value)}
                    className="neu-inset px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25
                               appearance-none cursor-pointer font-medium min-w-[160px]"
                  >
                    <option value="">Svi predmeti</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  <select
                    value={filters.grade ?? ''}
                    onChange={e => setFilter('grade', e.target.value ? Number(e.target.value) : null)}
                    className="neu-inset px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25
                               appearance-none cursor-pointer font-medium min-w-[140px]"
                  >
                    <option value="">Svi razredi</option>
                    {Array.from({ length: 9 }, (_, i) => i + 1).map(g => (
                      <option key={g} value={g}>{g}. razred</option>
                    ))}
                  </select>

                  <select
                    value={filters.tier ?? ''}
                    onChange={e => setFilter('tier', (e.target.value as any) || null)}
                    className="neu-inset px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25
                               appearance-none cursor-pointer font-medium min-w-[160px]"
                  >
                    <option value="">Svi tipovi</option>
                    <option value="MICRO">Mikro čas</option>
                    <option value="STANDARD">Standardni čas</option>
                    <option value="EXTENDED">Produženi čas</option>
                  </select>

                  <label className="flex items-center gap-2.5 text-sm text-muted-foreground cursor-pointer select-none font-medium
                                    neu-btn px-4 py-2.5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={filters.isFavourite || false}
                      onChange={e => setFilter('isFavourite', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/20 w-4 h-4 accent-primary"
                    />
                    <Star className="w-3.5 h-3.5" /> Omiljeni
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
              <Loader2 className="w-8 h-8 text-primary" />
            </motion.div>
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-24"
          >
            <div className="neu-card inline-block p-8 rounded-3xl mb-6">
              <LayoutGrid className="w-16 h-16 text-muted-foreground/20 mx-auto" />
            </div>
            <p className="text-xl font-bold text-foreground mb-2">
              {hasActiveFilters ? 'Nema rezultata' : 'Nema planova'}
            </p>
            <p className="text-muted-foreground text-sm mb-6">
              {hasActiveFilters
                ? 'Promijenite filtere za više rezultata.'
                : 'Kreirajte prvi IBL plan časa.'}
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link to="/chat"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl neu-btn-primary text-sm font-bold">
                <Plus className="w-4 h-4" /> Novi plan
              </Link>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative group/card">
              <PlanCard plan={plan} />
              <button
                onClick={(e) => handleDeletePlan(plan.id, e)}
                className="absolute top-3 right-3 z-10 opacity-0 group-hover/card:opacity-100
                           transition-opacity w-7 h-7 rounded-lg bg-white border border-gray-200
                           text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50
                           flex items-center justify-center text-xs shadow-sm"
                title="Obriši plan"
              >
                ✗
              </button>
            </div>
          </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 mt-8"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-5 py-2.5 rounded-xl neu-btn text-sm font-medium text-muted-foreground
                         hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prethodna
            </motion.button>
            <span className="text-sm text-muted-foreground font-semibold px-3 py-2 neu-inset rounded-xl">
              {page} / {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-5 py-2.5 rounded-xl neu-btn text-sm font-medium text-muted-foreground
                         hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Sljedeća →
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
