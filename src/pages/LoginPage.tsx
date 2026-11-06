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
    <main className="min-h-screen bg-brand-black text-brand-yellow flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-brand-yellow text-4xl font-extrabold tracking-[0.2em]">IDSS</p>
          <h1 className="text-brand-lightblue text-lg font-bold mt-2">IBL Planer</h1>
          <p className="text-brand-lightblue text-sm mt-1">Internationale Deutsche Schule Sarajevo</p>
        </div>

        <div className="rounded-2xl border-2 border-brand-blue p-6 sm:p-8">
          {params.get('razlog') === 'neaktivnost' && status === 'idle' && (
            <p role="status" className="text-brand-yellow text-sm mb-5 border-l-4 border-brand-yellow pl-3">
              {LOGIN_MESSAGES.idle}
            </p>
          )}

          {status === 'sent' ? (
            <div role="status" aria-live="polite">
              <h2 className="text-brand-yellow text-xl font-bold mb-3">Provjerite e-mail</h2>
              <p className="text-brand-lightblue text-sm leading-relaxed">
                Poslali smo link za prijavu na <strong className="text-brand-yellow">{email.trim().toLowerCase()}</strong>.
                Otvorite ga na ovom uređaju. Link važi ograničeno vrijeme.
              </p>
              <button
                type="button"
                onClick={() => { setStatus('idle'); setMessage(''); }}
                className="mt-6 text-brand-lightblue text-sm underline underline-offset-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lightblue rounded"
              >
                Pošalji ponovo ili promijeni adresu
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-brand-yellow text-xl font-bold mb-2">Prijava</h2>
              <p className="text-brand-lightblue text-sm mb-6">
                Unesite školsku e-mail adresu. Poslaćemo vam link za prijavu — bez lozinke.
              </p>
              <label htmlFor="login-email" className="block text-brand-yellow text-xs font-bold uppercase tracking-widest mb-2">
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
                className="w-full rounded-xl bg-brand-black border-2 border-brand-lightblue text-brand-yellow placeholder:text-brand-lightblue/60 px-4 py-3 text-base focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lightblue/50"
              />
              {message && (
                <p id="login-message" role="alert" className="text-brand-red text-sm mt-3 font-semibold">
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="mt-6 w-full rounded-xl bg-brand-yellow text-brand-black font-bold py-3 text-base disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-lightblue"
              >
                {status === 'sending' ? 'Šaljem link…' : 'Pošalji link za prijavu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
