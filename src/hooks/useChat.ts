import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatMode, ConversationState, GenerateParams } from '@/lib/types';
import { randomHex } from '@/lib/utils';
import { getAccessToken, signalActivity } from '@/lib/auth';
import { ERROR_MESSAGES } from '@/lib/constants';
import { ValidationEventSchema, MetaEventSchema, type ValidationReportInput } from '@/lib/validation/schemas';
import { buildRepairMessage } from '@/lib/qualityChecks';
import { displayPlanText } from '@/lib/language/display';
import { isPlanText } from '@/lib/planMeta';
import { buildRevisionRequest, extractRevisedSection, replaceSection, type SectionRef } from '@/lib/sectionRevision';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ibl-chat`;

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: `Dobrodošli u IBL Planer! 🎓

Na ovom mjestu kreiramo pisane pripreme nastavnog časa zasnovane na istraživačkom učenju.`,
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
    let keyIndex: number | undefined;
    const startedAt = performance.now();
    // P3/P2-6: an SSE line may be the server's quality report or its meta event instead of text.
    const readValidation = (parsed: unknown): boolean => {
      const ev = ValidationEventSchema.safeParse(parsed);
      if (ev.success) { validation = ev.data.report; return true; }
      const meta = MetaEventSchema.safeParse(parsed);
      if (meta.success) { keyIndex = meta.data.key_index; return true; }
      return false;
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
      // DL-P19: a Bosnian answer is shown, kept and saved in standard Bosnian. Grammar-safe word fixes run on
      // the text received so far (milliseconds, no extra AI call); the raw text is never displayed.
      const language = (params ?? lastParamsRef.current)?.language;
      // DL-P30: a German/English answer gets copied Bosnian template lines replaced by their German/English line.
      // DL-P32: misspelled fixed headings ("TIPPPS & TRICKS") are corrected to the PSI heading.
      // DL-P19/DL-P30/DL-P32 + dashes: one display layer for new plans, revisions and saved plans (M-7)
      const shown = (raw: string) => displayPlanText(raw, language);

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
                  msgs[msgs.length - 1] = { ...lastMsg, content: shown(assistantSoFar) };
                } else {
                  msgs.push({
                    id: randomHex(8),
                    role: 'model',
                    content: shown(assistantSoFar),
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

      assistantSoFar = shown(assistantSoFar);
      // Check if response contains a plan
      const isPlan = isPlanText(assistantSoFar); // P2-3: header near the top + inquiry question

      if (isPlan) {
        setState(prev => {
          const msgs = [...prev.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.role === 'model' && lastMsg.id !== 'welcome') {
            msgs[msgs.length - 1] = {
              ...lastMsg, isPlan: true, content: assistantSoFar, validation,
              generation_ms: Math.round(performance.now() - startedAt), key_index: keyIndex,
            };
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

  /** P2-1 (audit D-2): after "Sačuvaj plan" the message knows its database id → Word export appears. */
  const attachPlanId = useCallback((messageId: string, planId: string) => {
    setState(prev => ({
      ...prev,
      activePlanId: planId,
      messages: prev.messages.map(m => (m.id === messageId ? { ...m, plan_id: planId } : m)),
    }));
  }, []);

  /** "Popravi": a visible chat message naming the failed checks (DL-P13 item 5, teacher-triggered). */
  const repairPlan = useCallback((failedIds: string[], checks?: { id: string; detail?: string }[]) => {
    if (!failedIds.length) return;
    void sendMessage(buildRepairMessage(failedIds, checks), 'chat', lastParamsRef.current);
  }, [sendMessage]);

  /**
   * P5-4 "Prepravi ovaj dio": the AI rewrites ONE section of a plan message; only that section is replaced.
   * The whole plan goes as context (mode "chat", no params, so the server does not score the section as a
   * plan). The old quality report no longer describes the changed plan, so it is removed.
   * Returns 'ok' or 'failed'; on 'failed' the plan is unchanged.
   */
  const reviseSection = useCallback(async (messageId: string, ref: SectionRef, teacherRequest: string): Promise<'ok' | 'failed'> => {
    const msg = state.messages.find((m) => m.id === messageId);
    if (!msg?.isPlan) return 'failed';
    const language = lastParamsRef.current?.language;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
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
          mode: 'chat',
          messages: [{ role: 'user', content: buildRevisionRequest(ref.title, teacherRequest, language) }],
          plan_context: msg.content,
        }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 401) window.location.assign('/login');
        return 'failed';
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answer = '';
      const takeLine = (line: string) => {
        const l = line.endsWith('\r') ? line.slice(0, -1) : line;
        if (!l.startsWith('data: ')) return;
        const json = l.slice(6).trim();
        if (!json || json === '[DONE]') return;
        try {
          const parsed = JSON.parse(json) as { choices?: { delta?: { content?: string } }[] };
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) { answer += token; signalActivity(); }
        } catch { /* an event that is not text (meta, validation) */ }
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf('\n')) !== -1) {
          takeLine(buffer.slice(0, nl));
          buffer = buffer.slice(nl + 1);
        }
      }
      if (buffer) takeLine(buffer);

      // the same language layer as a new plan (DL-P19, DL-P30)
      const shownAnswer = displayPlanText(answer, language);
      const revised = extractRevisedSection(shownAnswer, ref.head, ref.stopHeads);
      const newPlan = revised ? replaceSection(msg.content, ref, revised) : null;
      // nothing usable, or no change at all: report it honestly, the plan stays as it was
      if (!newPlan || newPlan === msg.content) return 'failed';
      setState(prev => ({
        ...prev,
        activePlan: prev.activePlan === msg.content ? newPlan : prev.activePlan,
        messages: prev.messages.map((m) => (m.id === messageId ? { ...m, content: newPlan, validation: undefined } : m)),
      }));
      return 'ok';
    } catch (err) {
      console.error('section revision failed:', err);
      return 'failed';
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.messages]);

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
    attachPlanId,
    reviseSection,
  };
}
