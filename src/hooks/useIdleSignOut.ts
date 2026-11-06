/**
 * Signs the user out after 30 minutes without activity (DL-P06 item 5).
 * Supabase Free plan has no server-side inactivity timeout, so this
 * client-side timer is the mechanism. It is a protection for shared
 * school computers, not a hard security boundary.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTIVITY_EVENT } from '@/lib/auth';

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const IDLE_WARNING_MS = 60 * 1000;
const USER_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;
/** Last activity, shared across tabs and browser restarts (the session itself survives a closed tab). */
export const LAST_ACTIVITY_KEY = 'ibl-last-activity';
const PERSIST_THROTTLE_MS = 15 * 1000;

function readLastActivity(): number | null {
  try {
    const v = window.localStorage.getItem(LAST_ACTIVITY_KEY);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null; // storage blocked (private mode): fall back to the in-tab timer only
  }
}

function writeLastActivity(ts: number): void {
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
  } catch {
    /* storage blocked: in-tab timer still applies */
  }
}

/** A fresh sign-in (magic link) starts a new activity window. */
export function markFreshSignIn(): void {
  writeLastActivity(Date.now());
}

export function clearLastActivity(): void {
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
}

export function useIdleSignOut(enabled: boolean, onTimeout: () => void) {
  const [warning, setWarning] = useState(false);
  const warnTimer = useRef<number | null>(null);
  const outTimer = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;
  const lastPersist = useRef(0);

  const clear = () => {
    if (warnTimer.current !== null) window.clearTimeout(warnTimer.current);
    if (outTimer.current !== null) window.clearTimeout(outTimer.current);
    warnTimer.current = null;
    outTimer.current = null;
  };

  const reset = useCallback(() => {
    const now = Date.now();
    if (now - lastPersist.current > PERSIST_THROTTLE_MS) {
      lastPersist.current = now;
      writeLastActivity(now);
    }
    clear();
    setWarning(false);
    warnTimer.current = window.setTimeout(() => setWarning(true), IDLE_TIMEOUT_MS - IDLE_WARNING_MS);
    outTimer.current = window.setTimeout(() => {
      setWarning(false);
      clearLastActivity();
      onTimeoutRef.current();
    }, IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clear();
      setWarning(false);
      return;
    }
    // Returning after a closed tab / browser restart: the stored session may be
    // much older than 30 minutes of inactivity -> sign out immediately.
    const last = readLastActivity();
    if (last !== null && Date.now() - last >= IDLE_TIMEOUT_MS) {
      clearLastActivity();
      onTimeoutRef.current();
      return;
    }
    lastPersist.current = 0;
    reset();
    const handler = () => reset();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY) reset(); // activity in another tab counts
    };
    window.addEventListener('storage', onStorage);
    for (const ev of USER_EVENTS) window.addEventListener(ev, handler, { passive: true });
    window.addEventListener(ACTIVITY_EVENT, handler);
    return () => {
      clear();
      for (const ev of USER_EVENTS) window.removeEventListener(ev, handler);
      window.removeEventListener(ACTIVITY_EVENT, handler);
      window.removeEventListener('storage', onStorage);
    };
  }, [enabled, reset]);

  return { warning, stayActive: reset };
}
