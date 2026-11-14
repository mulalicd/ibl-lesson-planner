import { cn } from '@/lib/utils';
import { PSI_VERSION_LABEL, TIER_COLORS, TIER_LABELS } from '@/lib/constants';
import type { Tier, Language } from '@/lib/types';
import { Timer, Cpu } from 'lucide-react';

interface GeminiStatusBarProps {
  tier: Tier | null;
  language: Language;
  durationMs?: number;
  keyIndex?: number;
  className?: string;
}

export default function GeminiStatusBar({
  tier, language, durationMs, keyIndex, className,
}: GeminiStatusBarProps) {
  const langKey = language === 'bosnian' ? 'bs' : language === 'german' ? 'de' : 'en';
  const tierLabel = tier ? TIER_LABELS[tier][langKey] : '—';
  const seconds = durationMs ? (durationMs / 1000).toFixed(1) : null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className={cn('text-[10px] px-2.5 py-1 rounded-full border font-bold', tier ? TIER_COLORS[tier] : '')}>
        {tierLabel}
      </span>
      {seconds && (
        <span className="text-[10px] neu-inset px-2.5 py-1 rounded-full font-medium flex items-center gap-1 text-muted-foreground">
          <Timer className="w-3 h-3" /> {seconds}s
        </span>
      )}
      {keyIndex !== undefined && (
        <span className="text-[10px] neu-inset px-2.5 py-1 rounded-full font-medium flex items-center gap-1 text-muted-foreground">
          <Cpu className="w-3 h-3" /> AI #{keyIndex + 1}
        </span>
      )}
      <span className="text-[10px] text-neutral-600 font-semibold">{PSI_VERSION_LABEL}</span>
    </div>
  );
}
