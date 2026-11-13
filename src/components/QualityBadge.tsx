import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import type { ValidationReportInput } from '@/lib/validation/schemas';
import { qualityCheckLabel } from '@/lib/qualityChecks';

/**
 * P3 quality badge (DL-P13 item 5): shows the server's automatic check of a
 * generated plan and offers a teacher-triggered "Popravi". No automatic
 * extra AI call. Colours use existing tokens until P6 (five-colour system).
 */
export function QualityBadge({
  report,
  onRepair,
  disabled,
}: {
  report: ValidationReportInput;
  onRepair: (failedIds: string[], checks?: ValidationReportInput['checks']) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const allOk = report.failed.length === 0;

  return (
    <div className="rounded-xl border border-border/40 px-4 py-3 text-sm" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center gap-3">
        {allOk ? (
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" aria-hidden="true" />
        )}
        <span className="font-semibold">
          Provjera kvaliteta: {report.passed}/{report.total}
        </span>
        {!allOk && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            aria-expanded={open}
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {open ? 'Sakrij' : 'Prikaži'} ({report.failed.length})
          </button>
        )}
        {!allOk && (
          <button
            type="button"
            onClick={() => onRepair(report.failed, report.checks)}
            disabled={disabled}
            className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl neu-btn-primary text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
            Popravi
          </button>
        )}
      </div>
      {!allOk && open && (
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-6">
          {report.failed.map((id) => (
            <li key={id}>{qualityCheckLabel(id)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
