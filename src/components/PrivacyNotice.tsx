import { ShieldAlert } from 'lucide-react';

/**
 * Data-protection notice (DL-P14, Director 2026-11-09, option B).
 * Production uses the FREE Gemini API tier. Google's terms for unpaid services
 * say submitted content may be read by human reviewers and used to improve
 * Google's products, and "Do not submit sensitive, confidential, or personal
 * information". Single source of this wording — reuse, do not copy.
 */
export const PRIVACY_NOTICE_TEXT =
  'Ne upisujte imena učenika niti lične podatke (zdravlje, posebne potrebe, ocjene, porodica). ' +
  'Tekst obrađuje besplatni Google Gemini; Google ga može pregledati i koristiti za razvoj svojih proizvoda.';

export function PrivacyNotice({ className = '' }: { className?: string }) {
  return (
    <p
      role="note"
      className={`flex items-start gap-2 text-[11px] leading-snug text-destructive font-medium ${className}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 mt-px flex-shrink-0" aria-hidden="true" />
      <span>{PRIVACY_NOTICE_TEXT}</span>
    </p>
  );
}
