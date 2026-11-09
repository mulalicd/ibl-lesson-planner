/**
 * lib/validation/schemas.ts — the ONLY place for Zod schemas (Commander E-2).
 *
 * Shared by the browser and by the `ibl-chat` Edge Function (Deno imports
 * this file by relative path; bare `zod` resolves through
 * supabase/functions/deno.json — Commander A-8). Keep it free of browser-
 * or Deno-specific imports.
 *
 * Limits mirror the production database CHECK constraints
 * (supabase/schema/live_schema_2026-11-06.sql) so that a request which
 * passes here can also be saved.
 */
import { z } from 'zod';

export const LIMITS = {
  subject: 100,
  topic: 200,
  priorKnowledge: 500,
  notes: 500,
  durationMin: 10,
  durationMax: 240,
  /** A full generated plan can reach ~60 000 characters (16 384 output tokens). */
  messageContent: 80_000,
  messagesCount: 60,
  planContext: 80_000,
  /** Total characters across all messages + plan context in one request. */
  totalChars: 400_000,
} as const;

export const LanguageSchema = z.enum(['bosnian', 'german', 'english']);
export const TierSchema = z.enum(['MICRO', 'STANDARD', 'EXTENDED']);
export const ChatModeSchema = z.enum(['onboarding', 'generate', 'chat']);

export const ChatMessageInputSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string().min(1).max(LIMITS.messageContent),
});

export const GenerateParamsSchema = z.object({
  language: LanguageSchema,
  subject: z.string().trim().min(1).max(LIMITS.subject),
  grade: z.number().int().min(1).max(9),
  topic: z.string().trim().min(1).max(LIMITS.topic),
  duration_min: z.number().int().min(LIMITS.durationMin).max(LIMITS.durationMax),
  tier: TierSchema,
  prior_knowledge: z.string().max(LIMITS.priorKnowledge).optional(),
  notes: z.string().max(LIMITS.notes).optional(),
  zpd_calibration: z.string().max(50).optional(),
});

export const IblChatRequestSchema = z
  .object({
    mode: ChatModeSchema,
    messages: z.array(ChatMessageInputSchema).max(LIMITS.messagesCount),
    plan_context: z.string().max(LIMITS.planContext).nullable().optional(),
    params: GenerateParamsSchema.optional(),
  })
  .superRefine((req, ctx) => {
    if (req.mode === 'generate' && !req.params) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['params'], message: 'params required for generate' });
    }
    if (req.mode !== 'generate' && req.messages.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['messages'], message: 'messages required' });
    }
    const total =
      req.messages.reduce((sum, m) => sum + m.content.length, 0) + (req.plan_context?.length ?? 0);
    if (total > LIMITS.totalChars) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['messages'], message: 'request too large' });
    }
  });

export type IblChatRequest = z.infer<typeof IblChatRequestSchema>;
export type GenerateParamsInput = z.infer<typeof GenerateParamsSchema>;

/**
 * Quality report of a generated plan (P3, DL-P13 item 5). Produced by
 * supabase/functions/_shared/validate.ts (validatePlan) and sent by the Edge
 * Function as one extra SSE event: data: {"type":"validation","report":{…}}.
 * The browser validates it with this schema before showing it.
 */
export const CheckResultSchema = z.object({
  id: z.string().min(1).max(64),
  ok: z.boolean(),
  detail: z.string().max(500),
});
export const ValidationReportSchema = z.object({
  passed: z.number().int().min(0),
  total: z.number().int().min(0),
  failed: z.array(z.string().max(64)).max(64),
  checks: z.array(CheckResultSchema).max(64),
});
export const ValidationEventSchema = z.object({
  type: z.literal('validation'),
  report: ValidationReportSchema,
});
export type ValidationReportInput = z.infer<typeof ValidationReportSchema>;

/** Sign-in e-mail: only @idss.ba (server enforces the same rule in auth.users). */
export const IDSS_EMAIL_DOMAIN = 'idss.ba';
export const SignInEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .refine((email) => email.endsWith(`@${IDSS_EMAIL_DOMAIN}`), {
    message: 'domain',
  });
