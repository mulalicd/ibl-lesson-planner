import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Clock, GraduationCap } from 'lucide-react';
import { cn, formatDate, truncate } from '@/lib/utils';
import { TIER_COLORS, TIER_LABELS } from '@/lib/constants';
import type { PlanCardData } from '@/lib/types';

interface PlanCardProps {
  plan: PlanCardData;
  className?: string;
}

export default function PlanCard({ plan, className }: PlanCardProps) {
  const langKey = plan.language === 'bosnian' ? 'bs' : plan.language === 'german' ? 'de' : 'en';
  const tierLabel = TIER_LABELS[plan.tier][langKey];

  return (
    <Link
      to={`/plan/${plan.id}`}
      className={cn(
        'group block neu-card p-5',
        'hover:shadow-[8px_8px_20px_var(--neu-dark),-8px_-8px_20px_var(--neu-light)]',
        'transition-all duration-300 ease-out',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="pastel-tag">
            {plan.subject}
          </span>
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <GraduationCap className="w-3 h-3" />
            {plan.grade}. razred
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={cn('text-[10px] px-2.5 py-0.5 rounded-full border font-semibold', TIER_COLORS[plan.tier])}>
            {tierLabel}
          </span>
          {plan.is_favourite && <Star className="w-4 h-4 text-idss-gold fill-idss-gold" />}
        </div>
      </div>

      <h3 className="font-semibold text-foreground text-[15px] leading-snug mb-3 group-hover:text-primary transition-colors duration-200">
        {truncate(plan.topic, 70)}
      </h3>

      {plan.inquiry_question && (
        <div className="iq-callout rounded-r-xl mb-3">
          <p className="text-xs text-foreground/80 leading-relaxed not-italic font-normal">
            {truncate(plan.inquiry_question, 100)}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-auto pt-3 border-t border-border/30">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {plan.duration_min} min
        </span>
        <span>{formatDate(plan.created_at)}</span>
      </div>
    </Link>
  );
}
