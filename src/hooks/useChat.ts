import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatMode, ConversationState, GenerateParams } from '@/lib/types';
import { randomHex } from '@/lib/utils';
import { getAccessToken, signalActivity } from '@/lib/auth';
import { ERROR_MESSAGES } from '@/lib/constants';
import { ValidationEventSchema, type ValidationReportInput } from '@/lib/validation/schemas';
import { buildRepairMessage } from '@/lib/qualityChecks';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ibl-chat`;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: `Dobrodošli u IBL Planer! 🎓

Ja sam vaš AI asistent za kreiranje planova časa zasnovanih na istraživačkom učenju (IBL) za Internationale Deutsche Schule Sarajevo.

Kako mogu pomoći?

  1. Kreirajte novi IBL plan časa
  2. Unesite direktno: naziv predmeta, razred, temu i trajanje
     Primjer: "Matematika, 5. razred, Razlomci, 90 minuta"

Za početak — recite mi za koji predmet i razred trebate plan.`,
  timestamp: new Date().toISOString(),
};

export function useChat() {
  const [state, setState] = useState<ConversationState>({
    mode: 'onboarding',
    messages: [WELCOME_MESSAGE],
    activePlanId: null,
    activePlan: null,
    isLoading: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  // Params of the last generated plan: re-sent with "Popravi" so the server can re-check the corrected plan.
  const lastParamsRef = useRef<GenerateParams | undefined>(undefined);

  const setMode = useCallback((mode: ChatMode) => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setPlanContext = useCallback((planId: string, planText: string) => {
    setState(prev => ({
      ...prev,
      activePlanId: planId,
      activePlan: planText,
      mode: 'chat',
    }));
  }, []);

  const sendMessage = useCallback(async (
    content: string,
    overrideMode?: ChatMode,
    params?: GenerateParams,
  ) => {
    const userMsg: ChatMessage = {
      id: randomHex(8),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    const mode = overrideMode || state.mode;
    if (params) lastParamsRef.current = params;
    let validation: ValidationReportInput | undefined;
    // P3: one SSE line may be the server's quality report instead of text.
    const readValidation = (parsed: unknown): boolean => {
      const ev = ValidationEventSchema.safeParse(parsed);
      if (ev.success) validation = ev.data.report;
      return ev.success;
    };
    const allMessages = [...state.messages.filter(m => m.id !== 'welcome'), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      abortRef.current = new AbortController();

      // P1: the Edge Function requires the signed-in user's token, not the anon key.
      const accessToken = await getAccessToken();
      if (!accessToken) {
        window.location.assign('/login');
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          mode,
          messages: allMessages,
          plan_context: state.activePlan,
          params,
        }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: ERROR_MESSAGES.NETWORK_ERROR }));
        if (resp.status === 401) {
          window.location.assign('/login');
        }
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            if (readValidation(parsed)) continue;
            const tokenContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (tokenContent) {
              assistantSoFar += tokenContent;
              signalActivity(); // keep the idle timer from firing mid-generation
              setState(prev => {
                const msgs = [...prev.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg?.role === 'model' && lastMsg.id !== 'welcome') {
                  msgs[msgs.length - 1] = { ...lastMsg, content: assistantSoFar };
                } else {
                  msgs.push({
                    id: randomHex(8),
                    role: 'model',
                    content: assistantSoFar,
                    timestamp: new Date().toISOString(),
                  });
                }
                return { ...prev, messages: msgs };
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            if (readValidation(parsed)) continue;
            const tokenContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (tokenContent) assistantSoFar += tokenContent;
          } catch { /* ignore */ }
        }
      }

      // Check if response contains a plan
      const isPlan = assistantSoFar.includes('ISTRAŽIVAČKO PITANJE') ||
                     assistantSoFar.includes('FORSCHUNGSFRAGE') ||
                     assistantSoFar.includes('INQUIRY QUESTION') ||
                     (assistantSoFar.includes('====') && assistantSoFar.includes('PLANER'));

      if (isPlan) {
        setState(prev => {
          const msgs = [...prev.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.role === 'model' && lastMsg.id !== 'welcome') {
            msgs[msgs.length - 1] = { ...lastMsg, isPlan: true, content: assistantSoFar, validation };
          }
          return {
            ...prev,
            messages: msgs,
            activePlan: assistantSoFar,
            mode: 'chat',
            isLoading: false,
          };
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: (err as Error).message,
      }));
    }
  }, [state.mode, state.messages, state.activePlan]);

  const clearChat = useCallback(() => {
    setState({
      mode: 'onboarding',
      messages: [WELCOME_MESSAGE],
      activePlanId: null,
      activePlan: null,
      isLoading: false,
      error: null,
    });
  }, []);

  /** "Popravi": a visible chat message naming the failed checks (DL-P13 item 5, teacher-triggered). */
  const repairPlan = useCallback((failedIds: string[]) => {
    if (!failedIds.length) return;
    void sendMessage(buildRepairMessage(failedIds), 'chat', lastParamsRef.current);
  }, [sendMessage]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  return {
    ...state,
    sendMessage,
    setMode,
    setPlanContext,
    clearChat,
    cancelStream,
    repairPlan,
  };
}
