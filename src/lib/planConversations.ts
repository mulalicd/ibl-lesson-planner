/**
 * lib/planConversations.ts — P6 (DL-P37, Director 2026-11-14: "Čuvanje + Ugradi", "Svi prijavljeni").
 *
 * A conversation with the AI about a SAVED plan is kept with that plan: one `conversations` row per conversation
 * (author set by the database, never by the browser, E-4) and its messages in `conversation_messages`.
 * Every signed-in teacher reads the conversations of a plan (like the plan itself, DL-P09); only the author adds to
 * a conversation. Owner script: supabase/owner-scripts/2026-11-14_p6-plan-conversations.
 *
 * "Dodaj u plan" and "Prepravi ovaj dio" change the plan's text (plans rule: author of the plan or admin) and keep the
 * text from before on the conversation (`plan_text_before`), so the change can be undone with one click.
 */
import { supabase } from '@/integrations/supabase/client';
import type { ChangeResult } from '@/lib/planActions';
import { extractInquiryQuestion } from '@/lib/planMeta';
import { missingSections } from '@/lib/sectionRevision';
import {
  ConversationAuthorRowSchema,
  ConversationMessageRowSchema,
  ConversationRowSchema,
} from '@/lib/validation/schemas';

export interface StoredMessage { role: 'user' | 'model'; content: string; created_at: string }
export interface PlanConversation {
  id: string;
  created_at: string;
  author: string | null;
  replacedPlan: boolean;
  /** The plan text from before this conversation's changes (given back with "Vrati plan od prije izmjena"). */
  planTextBefore: string | null;
  messages: StoredMessage[];
}

/** Starts a conversation about a saved plan. Null when the database refused (e.g. owner script not applied yet). */
export async function startConversation(planId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from('conversations').insert({ plan_id: planId, mode: 'chat' }).select('id').single();
    if (error || !data) {
      console.error('conversation start failed:', error?.message);
      return null;
    }
    return data.id;
  } catch (e) {
    console.error('conversation start failed:', e);
    return null;
  }
}

/** Adds messages in order. `from` is the order number of the first one. */
export async function appendMessages(conversationId: string, from: number, messages: { role: 'user' | 'model'; content: string }[]): Promise<boolean> {
  if (!messages.length) return true;
  try {
    const rows = messages.map((m, i) => ({ conversation_id: conversationId, role: m.role, content: m.content, message_order: from + i }));
    const { error } = await supabase.from('conversation_messages').insert(rows);
    if (error) console.error('conversation save failed:', error.message);
    return !error;
  } catch (e) {
    console.error('conversation save failed:', e);
    return false;
  }
}

/** All conversations about a plan, newest first, with their messages and author names. Empty on any failure. */
export async function fetchPlanConversations(planId: string): Promise<PlanConversation[]> {
  try {
    const { data: convs, error } = await supabase
      .from('conversations')
      .select('id, created_at, author_id, plan_text_before')
      .eq('plan_id', planId)
      .order('created_at', { ascending: false });
    if (error || !convs?.length) {
      if (error) console.error('conversations fetch failed:', error.message);
      return [];
    }
    const rows = convs.map((c) => ConversationRowSchema.safeParse(c)).flatMap((r) => (r.success ? [r.data] : []));
    const ids = rows.map((r) => r.id);
    const [{ data: msgs, error: mErr }, { data: authors }] = await Promise.all([
      supabase.from('conversation_messages').select('conversation_id, role, content, message_order, created_at')
        .in('conversation_id', ids).order('message_order', { ascending: true }),
      supabase.rpc('conversation_authors', { p_plan_id: planId }),
    ]);
    if (mErr) console.error('conversation messages fetch failed:', mErr.message);
    const messages = (msgs ?? []).map((m) => ConversationMessageRowSchema.safeParse(m)).flatMap((r) => (r.success ? [r.data] : []));
    const names = new Map((authors ?? []).map((a) => ConversationAuthorRowSchema.safeParse(a)).flatMap((r) => (r.success ? [[r.data.conversation_id, r.data.author] as const] : [])));
    return rows
      .map((c) => ({
        id: c.id,
        created_at: c.created_at,
        author: names.get(c.id) ?? null,
        replacedPlan: !!c.plan_text_before,
        planTextBefore: c.plan_text_before,
        messages: messages.filter((m) => m.conversation_id === c.id).map(({ role, content, created_at }) => ({ role, content, created_at })),
      }))
      .filter((c) => c.messages.length > 0);
  } catch (e) {
    console.error('conversations fetch failed:', e);
    return [];
  }
}

/** A change to a saved plan from a conversation ("Dodaj u plan", "Prepravi ovaj dio"; author of the plan or admin —
 *  the database decides). The plan text from BEFORE the conversation's first change is kept on the conversation
 *  (`plan_text_before`, written only once), so "Vrati plan od prije izmjena" gives back the original. */
export async function replacePlanText(planId: string, conversationId: string | null, before: string, after: string): Promise<ChangeResult> {
  // a change from a conversation never removes a section of the teacher's plan
  if (missingSections(before, after).length) return 'error';
  try {
    let markedNow = false;
    if (conversationId) {
      const { data: marked, error } = await supabase.from('conversations').update({ plan_text_before: before })
        .eq('id', conversationId).is('plan_text_before', null).select('id');
      if (error) console.error('keeping the old plan text failed:', error.message);
      markedNow = !!marked && marked.length > 0;
    }
    const { data, error } = await supabase
      .from('plans')
      .update({ plan_text: after, inquiry_question: extractInquiryQuestion(after) })
      .eq('id', planId)
      .select('id');
    const result: ChangeResult = error ? 'error' : data && data.length > 0 ? 'ok' : 'forbidden';
    if (error) console.error('plan text update failed:', error.message);
    // the plan did not change: the conversation must not say it changed the plan
    if (result !== 'ok' && markedNow && conversationId) await supabase.from('conversations').update({ plan_text_before: null }).eq('id', conversationId);
    return result;
  } catch (e) {
    console.error('plan text update failed:', e);
    return 'error';
  }
}

/** "Vrati plan od prije izmjena": the plan gets back the text it had before this conversation's changes (author of the plan or
 *  admin — the database decides); then the conversation no longer says it replaced the plan. */
export async function restorePlanText(planId: string, conversationId: string, before: string): Promise<ChangeResult> {
  try {
    const { data, error } = await supabase
      .from('plans')
      .update({ plan_text: before, inquiry_question: extractInquiryQuestion(before) })
      .eq('id', planId)
      .select('id');
    if (error) {
      console.error('plan restore failed:', error.message);
      return 'error';
    }
    if (!data || data.length === 0) return 'forbidden';
    const { error: cErr } = await supabase.from('conversations').update({ plan_text_before: null }).eq('id', conversationId);
    if (cErr) console.error('restore marker not cleared:', cErr.message);
    return 'ok';
  } catch (e) {
    console.error('plan restore failed:', e);
    return 'error';
  }
}
