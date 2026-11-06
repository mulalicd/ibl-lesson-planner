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

export function useIdleSignOut(enabled: boolean, onTimeout: () => void) {
  const [warning, setWarning] = useState(false);
  const warnTimer = useRef<number | null>(null);
  const outTimer = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const clear = () => {
    if (warnTimer.current !== null) window.clearTimeout(warnTimer.current);
    if (outTimer.current !== null) window.clearTimeout(outTimer.current);
    warnTimer.current = null;
    outTimer.current = null;
  };

  const reset = useCallback(() => {
    clear();
    setWarning(false);
    warnTimer.current = window.setTimeout(() => setWarning(true), IDLE_TIMEOUT_MS - IDLE_WARNING_MS);
    outTimer.current = window.setTimeout(() => {
      setWarning(false);
      onTimeoutRef.current();
    }, IDLE_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clear();
      setWarning(false);
      return;
    }
    reset();
    const handler = () => reset();
    for (const ev of USER_EVENTS) window.addEventListener(ev, handler, { passive: true });
    window.addEventListener(ACTIVITY_EVENT, handler);
    return () => {
      clear();
      for (const ev of USER_EVENTS) window.removeEventListener(ev, handler);
      window.removeEventListener(ACTIVITY_EVENT, handler);
    };
  }, [enabled, reset]);

  return { warning, stayActive: reset };
}
