import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, GraduationCap, User } from 'lucide-react';
import { cn, formatDate, truncate, UNKNOWN, showText, showGrade, showMinutes } from '@/lib/utils';
import { TIER_COLORS, TIER_LABELS } from '@/lib/constants';
import type { PlanCardData } from '@/lib/types';

interface PlanCardProps {
  plan: PlanCardData;
  className?: string;
}

export default function PlanCard({ plan, className }: PlanCardProps) {
  const langKey = plan.language === 'bosnian' ? 'bs' : plan.language === 'german' ? 'de' : 'en';
  const tierLabel = plan.tier ? TIER_LABELS[plan.tier][langKey] : UNKNOWN;

  return (
    // P6 S2 (direction C): a plan is a sheet of paper on the desk
    <Link
      to={`/plan/${plan.id}`}
      className={cn(
        'group flex min-h-[190px] flex-col rounded-md bg-white p-4 shadow-[0_1px_0_rgb(221_221_221),0_14px_30px_rgba(0,0,0,0.10)]',
        'transition-transform duration-200 ease-out hover:-translate-y-1 hover:rotate-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 border-b border-neutral-200 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="truncate">{showText(plan.subject)} · <GraduationCap className="inline h-3 w-3" /> {showGrade(plan.grade)}</span>
        <span className="flex flex-none items-center gap-1.5">
          <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold normal-case tracking-normal', plan.tier ? TIER_COLORS[plan.tier] : '')}>{tierLabel}</span>
          {plan.favourite && <Star className="h-4 w-4 fill-idss-gold text-idss-gold" />}
        </span>
      </div>

      <h3 className="mb-1 font-display text-[17px] font-extrabold leading-snug text-black transition-colors group-hover:text-primary">
        {truncate(showText(plan.topic), 70)}
      </h3>

      {plan.inquiry_question && (
        <p className="mb-2 text-sm leading-snug text-primary">„{truncate(plan.inquiry_question, 110)}“</p>
      )}

      <div className="mt-auto flex items-center gap-3 border-t border-neutral-200 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {showMinutes(plan.duration_min)}</span>
        <span>{formatDate(plan.created_at)}</span>
        {plan.author && (
          <span className="ml-auto flex items-center gap-1 truncate" title={plan.author}>
            <User className="h-3 w-3 flex-shrink-0" /> <span className="truncate">{plan.author}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
