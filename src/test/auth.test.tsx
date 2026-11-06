import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const authMock = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  session: null as null | { access_token: string; user: { email: string } },
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: authMock.session }, error: null })),
      onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
        authMock.listener = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signInWithOtp: authMock.signInWithOtp,
      signOut: authMock.signOut,
    },
  },
}));

import AuthProvider from '@/components/AuthProvider';
import RequireAuth from '@/components/RequireAuth';
import LoginPage, { LOGIN_MESSAGES } from '@/pages/LoginPage';
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS, LAST_ACTIVITY_KEY } from '@/hooks/useIdleSignOut';
import { signalActivity } from '@/lib/auth';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/chat" element={<RequireAuth><p>CHAT PAGE</p></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><p>DASHBOARD PAGE</p></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authMock.session = null;
  authMock.signInWithOtp.mockReset();
  authMock.signOut.mockReset().mockResolvedValue({ error: null });
});
afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

describe('route guard', () => {
  it('sends a signed-out visitor from /dashboard to the login page', async () => {
    renderAt('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Prijava' })).toBeInTheDocument();
    expect(screen.queryByText('DASHBOARD PAGE')).not.toBeInTheDocument();
  });

  it('shows the page to a signed-in teacher', async () => {
    authMock.session = { access_token: 't', user: { email: 'a@idss.ba' } };
    renderAt('/dashboard');
    expect(await screen.findByText('DASHBOARD PAGE')).toBeInTheDocument();
  });

  it('redirects a signed-in user away from /login to /chat', async () => {
    authMock.session = { access_token: 't', user: { email: 'a@idss.ba' } };
    renderAt('/login');
    expect(await screen.findByText('CHAT PAGE')).toBeInTheDocument();
  });
});

describe('login page', () => {
  it('refuses a non-@idss.ba address before calling the server', async () => {
    renderAt('/login');
    fireEvent.change(await screen.findByLabelText('E-mail adresa'), { target: { value: 'x@gmail.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pošalji link za prijavu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(LOGIN_MESSAGES.domain);
    expect(authMock.signInWithOtp).not.toHaveBeenCalled();
  });

  it('sends a magic link for an @idss.ba address and confirms', async () => {
    authMock.signInWithOtp.mockResolvedValue({ error: null });
    renderAt('/login');
    fireEvent.change(await screen.findByLabelText('E-mail adresa'), { target: { value: ' Nastavnik@IDSS.ba ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pošalji link za prijavu' }));
    expect(await screen.findByText('Provjerite e-mail')).toBeInTheDocument();
    expect(authMock.signInWithOtp).toHaveBeenCalledWith({
      email: 'nastavnik@idss.ba',
      options: { emailRedirectTo: `${window.location.origin}/chat`, shouldCreateUser: true },
    });
  });

  it('explains a server-side domain refusal and a rate limit', async () => {
    authMock.signInWithOtp.mockResolvedValueOnce({ error: { status: 500, message: 'Database error saving new user' } });
    renderAt('/login');
    fireEvent.change(await screen.findByLabelText('E-mail adresa'), { target: { value: 'a@idss.ba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pošalji link za prijavu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(LOGIN_MESSAGES.domain);

    authMock.signInWithOtp.mockResolvedValueOnce({ error: { status: 429, message: 'rate limit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Pošalji link za prijavu' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(LOGIN_MESSAGES.rateLimit));
  });

  it('shows the idle notice after an automatic sign-out', async () => {
    renderAt('/login?razlog=neaktivnost');
    expect(await screen.findByText(LOGIN_MESSAGES.idle)).toBeInTheDocument();
  });
});

describe('30-minute idle sign-out', () => {
  async function signedInChat() {
    authMock.session = { access_token: 't', user: { email: 'a@idss.ba' } };
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, origin: 'http://localhost' });
    renderAt('/chat');
    await screen.findByText('CHAT PAGE');
    return assign;
  }

  it('warns 60 s before and signs out at 30 min without activity', async () => {
    const assign = await signedInChat();
    await act(async () => { vi.advanceTimersByTime(IDLE_TIMEOUT_MS - IDLE_WARNING_MS + 10); });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(IDLE_WARNING_MS); });
    await waitFor(() => expect(authMock.signOut).toHaveBeenCalled());
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login?razlog=neaktivnost'));
    vi.unstubAllGlobals();
  });

  it('keypresses and AI streaming activity keep the session alive', async () => {
    await signedInChat();
    await act(async () => { vi.advanceTimersByTime(IDLE_TIMEOUT_MS - 5_000); });
    fireEvent.keyDown(window, { key: 'a' });
    await act(async () => { vi.advanceTimersByTime(IDLE_TIMEOUT_MS - 5_000); });
    act(() => signalActivity());
    await act(async () => { vi.advanceTimersByTime(IDLE_TIMEOUT_MS - 5_000); });
    expect(authMock.signOut).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('"Ostani prijavljen" in the warning resets the timer', async () => {
    await signedInChat();
    await act(async () => { vi.advanceTimersByTime(IDLE_TIMEOUT_MS - IDLE_WARNING_MS + 10); });
    fireEvent.click(screen.getByRole('button', { name: 'Ostani prijavljen' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await act(async () => { vi.advanceTimersByTime(IDLE_WARNING_MS + 1_000); });
    expect(authMock.signOut).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('signs out on return when the stored last activity is older than 30 min (closed tab)', async () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now() - IDLE_TIMEOUT_MS - 60_000));
    const assign = await signedInChatNoWait();
    await waitFor(() => expect(authMock.signOut).toHaveBeenCalled());
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login?razlog=neaktivnost'));
    vi.unstubAllGlobals();
  });

  it('keeps a recent session on return (last activity 5 min ago)', async () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now() - 5 * 60_000));
    await signedInChat();
    expect(authMock.signOut).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  async function signedInChatNoWait() {
    authMock.session = { access_token: 't', user: { email: 'a@idss.ba' } };
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, origin: 'http://localhost' });
    renderAt('/chat');
    return assign;
  }

  it('a fresh magic-link sign-in is not undone by a stale timestamp from yesterday', async () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now() - 24 * 60 * 60_000));
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign, origin: 'http://localhost' });
    renderAt('/chat'); // not signed in yet -> login
    await screen.findByRole('heading', { name: 'Prijava' });
    const fresh = { access_token: 't2', user: { email: 'a@idss.ba' } };
    await act(async () => { authMock.listener?.('SIGNED_IN', fresh); });
    expect(authMock.signOut).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
