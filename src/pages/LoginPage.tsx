/**
 * Sign-in by e-mail link (P1, DL-P05/DL-P06). Only @idss.ba addresses.
 * The domain rule is enforced server-side (trigger on auth.users); the
 * check here only gives a friendly message earlier.
 * Uses only the five IDSS brand tokens (CONSTITUTION rule 6).
 */
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SignInEmailSchema } from '@/lib/validation/schemas';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export const LOGIN_MESSAGES = {
  domain: 'Prijava je dozvoljena samo za e-mail adrese @idss.ba.',
  invalid: 'Unesite ispravnu e-mail adresu.',
  rateLimit: 'Poslano je previše zahtjeva. Sačekajte nekoliko minuta pa pokušajte ponovo.',
  generic: 'Slanje linka nije uspjelo. Pokušajte ponovo.',
  idle: 'Odjavljeni ste zbog 30 minuta neaktivnosti.',
} as const;

export default function LoginPage() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const from = (location.state as { from?: string } | null)?.from;
  if (!loading && session) return <Navigate to={from && from !== '/login' ? from : '/chat'} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = email.trim();
    const parsed = SignInEmailSchema.safeParse(raw);
    if (!parsed.success) {
      setStatus('error');
      setMessage(parsed.error.issues[0]?.message === 'domain' ? LOGIN_MESSAGES.domain : LOGIN_MESSAGES.invalid);
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: { emailRedirectTo: `${window.location.origin}/chat`, shouldCreateUser: true },
      });
      if (error) {
        console.error('signInWithOtp failed:', error.status, error.message);
        setStatus('error');
        setMessage(
          error.status === 429 ? LOGIN_MESSAGES.rateLimit
          : /database error|idss\.ba/i.test(error.message) ? LOGIN_MESSAGES.domain
          : LOGIN_MESSAGES.generic,
        );
        return;
      }
      setStatus('sent');
    } catch (err) {
      console.error('signInWithOtp failed:', err);
      setStatus('error');
      setMessage(LOGIN_MESSAGES.generic);
    }
  }

  return (
    // P6 (direction C "Nastavnički radni sto"): the sign-in is a sheet of paper on the desk, with the binder tabs of
    // the five IDSS colours behind it. Texts unchanged.
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-black">
      <div className="w-full max-w-md">
        <div className="relative" style={{ perspective: 1400 }}>
          {/* pages and binder tabs behind the sheet (decoration only) */}
          <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rotate-[2.5deg] rounded-md bg-white shadow-[0_18px_40px_rgba(0,0,0,0.10)]" />
          <div aria-hidden="true" className="absolute inset-0 -translate-x-2 translate-y-2 rotate-[-2deg] rounded-md bg-white shadow-[0_18px_40px_rgba(0,0,0,0.08)]" />
          <div aria-hidden="true" className="absolute -right-3 top-10 flex flex-col gap-1.5">
            <span className="h-12 w-3 rounded-r bg-brand-blue" /><span className="h-12 w-3 rounded-r bg-brand-lightblue" />
            <span className="h-12 w-3 rounded-r bg-brand-yellow" /><span className="h-12 w-3 rounded-r bg-brand-red" />
            <span className="h-12 w-3 rounded-r bg-black" />
          </div>

          <div className="relative rounded-md bg-white px-6 py-8 shadow-[0_1px_0_rgb(221_221_221),0_24px_50px_rgba(0,0,0,0.14)] sm:px-10">
            <div className="mb-8 text-center">
              <img src="/brand/idss-logo.png" alt="Internationale Deutsche Schule Sarajevo" width={1460} height={443} className="mx-auto h-14 w-auto sm:h-16" />
              <div className="mt-5 flex items-center justify-center gap-2">
                <span aria-hidden="true" className="flex gap-0.5">
                  <span className="h-5 w-1.5 rounded-sm bg-brand-blue" /><span className="h-5 w-1.5 rounded-sm bg-brand-lightblue" />
                  <span className="h-5 w-1.5 rounded-sm bg-brand-yellow" /><span className="h-5 w-1.5 rounded-sm bg-brand-red" />
                  <span className="h-5 w-1.5 rounded-sm bg-black" />
                </span>
                <h1 className="font-display text-lg font-extrabold">IBL Planer</h1>
              </div>
            </div>

            {params.get('razlog') === 'neaktivnost' && status === 'idle' && (
              <p role="status" className="mb-5 rounded bg-brand-yellow/30 px-3 py-2 text-sm text-black">
                {LOGIN_MESSAGES.idle}
              </p>
            )}

            {status === 'sent' ? (
              <div role="status" aria-live="polite">
                <h2 className="mb-3 font-display text-xl font-extrabold">Provjerite e-mail</h2>
                <p className="text-sm leading-relaxed text-neutral-700">
                  Poslali smo link za prijavu na <strong className="text-black">{email.trim().toLowerCase()}</strong>.
                  Otvorite ga na ovom uređaju. Link važi ograničeno vrijeme.
                </p>
                <button
                  type="button"
                  onClick={() => { setStatus('idle'); setMessage(''); }}
                  className="mt-6 rounded text-sm font-semibold text-primary underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Pošalji ponovo ili promijeni adresu
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <h2 className="mb-2 font-display text-xl font-extrabold">Prijava</h2>
                <p className="mb-6 text-sm text-neutral-700">
                  Unesite školsku e-mail adresu. Poslaćemo vam link za prijavu — bez lozinke.
                </p>
                <label htmlFor="login-email" className="mb-2 block text-xs font-bold uppercase tracking-widest text-neutral-700">
                  E-mail adresa
                </label>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ime.prezime@idss.ba"
                  aria-invalid={status === 'error'}
                  aria-describedby={message ? 'login-message' : undefined}
                  className="h-12 w-full rounded-lg border border-input bg-white px-4 text-base text-black placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {message && (
                  <p id="login-message" role="alert" className="mt-3 rounded border-l-4 border-brand-red bg-brand-red/10 px-3 py-2 text-sm font-semibold text-black">
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="mt-6 h-12 w-full rounded-lg bg-primary text-base font-bold text-primary-foreground disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {status === 'sending' ? 'Šaljem link…' : 'Pošalji link za prijavu'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
