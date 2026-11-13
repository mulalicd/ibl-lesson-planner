// Message building for the ibl-chat Edge Function and the golden evaluation.
// ONE implementation, so production and evaluation cannot diverge (M-7).

import { PSI_V81_PROMPT } from "./psi_v81.ts";
import { PSI_V90_PROMPT } from "./psi_v90.generated.ts";
import { PSI_V91_PROMPT } from "./psi_v91.generated.ts";
import type { IblChatRequest } from "../../../src/lib/validation/schemas.ts";

export type AiMessage = { role: string; content: string };
export type PromptVariant = "v81" | "psi";

/**
 * "v81": the pre-P3 production prompt and wrapper, VERBATIM (baseline).
 * "psi": a full PSI document (v8.0 / v9.0) as the system instruction, with a
 * minimal wrapper that adds no rules of its own: PSI owns every rule.
 */
/**
 * THE switch for the production prompt (DL-P13 item 1).
 * "v90" since 2026-11-10: the Director approved the PSI v9.0 text ("PSI v9 odobren").
 * Rollback = set back to "v81" and deploy.
 */
export type ProductionPsi = "v81" | "v90" | "v91";
// v91 = PSI v9.1 DRAFT (P4, amendment A16): only for evaluation until the Director approves its text.
export const PRODUCTION_PSI: ProductionPsi = "v90";

/** P4: the stricter pedagogy checks (A16) apply only to plans written under v9.1. */
export const pedagogyChecksFor = (psi: ProductionPsi): boolean => psi === "v91";

/** What the Edge Function sends to Gemini. Tests cover every setting. */
export function buildProductionMessages(req: IblChatRequest, psi: ProductionPsi = PRODUCTION_PSI): AiMessage[] {
  if (psi === "v91") return buildMessages(req, "psi", PSI_V91_PROMPT);
  return psi === "v90" ? buildMessages(req, "psi", PSI_V90_PROMPT) : buildMessages(req, "v81");
}

export function buildMessages(req: IblChatRequest, variant: PromptVariant = "v81", psiText?: string): AiMessage[] {
  if (variant === "psi") {
    if (!psiText) throw new Error("buildMessages: psiText required for variant 'psi'");
    return buildPsiMessages(req, psiText);
  }
  return buildV81Messages(req);
}

function buildV81Messages(req: IblChatRequest): AiMessage[] {
  const { mode, messages, plan_context, params } = req;
  const aiMessages: { role: string; content: string }[] = [
    { role: "system", content: PSI_V81_PROMPT },
  ];

  if (mode === "onboarding") {
    aiMessages.push({
      role: "user",
      content: "MODE: onboarding\nStart or continue the guided onboarding dialogue. Ask ONE question at a time. Be warm and professional.",
    });
    for (const msg of messages) {
      aiMessages.push({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      });
    }

  } else if (mode === "generate" && params) {
    const langLabels: Record<string, string> = {
      bosnian: "BOSNIAN — write the ENTIRE plan in Bosnian language",
      german:  "GERMAN — write the ENTIRE plan in German language",
      english: "ENGLISH — write the ENTIRE plan in English language",
    };
    const tierConfig: Record<string, string> = {
      MICRO:    "MICRO (45 min or less): 2 Socratic questions, 2 evidence items, 1 visual, 1 learning activity",
      STANDARD: "STANDARD (46-90 min): 3 Socratic questions, 3 evidence items, 2 visuals, 2 learning activities",
      EXTENDED: "EXTENDED (91+ min): 4 Socratic questions, 5 evidence items, 3 visuals, 3 learning activities",
    };

    const promptLines = [
      "MODE: generate",
      "",
      "CRITICAL REQUIREMENTS — READ BEFORE GENERATING:",
      "- You MUST complete ALL 10 sections without exception",
      "- Section 9 (Delivery Recommendations) MUST be minimum 30 lines",
      "- Do NOT truncate any section",
      "- All ASCII diagrams must be properly space-aligned",
      "- Evidence items must use REAL, NAMED sources (specific video titles, book chapters)",
      "- Include exact teacher dialogue in quotation marks in Section 9",
      "- Include 2-3 common student misconceptions in Section 9",
      "",
      `SUBJECT:         ${params.subject}`,
      `GRADE:           ${params.grade}. razred (students approximately age ${5 + params.grade}-${6 + params.grade})`,
      `TOPIC:           ${params.topic}`,
      `DURATION:        ${params.duration_min} minutes`,
      `TIER:            ${tierConfig[params.tier] || params.tier}`,
      `OUTPUT LANGUAGE: ${langLabels[params.language] || params.language}`,
      "",
      "LANGUAGE ENFORCEMENT: The output language above is MANDATORY.",
      "If the subject name is in German (e.g., Biologie, Mathematik, Deutsch), that does NOT mean the output language is German.",
      "The output language is determined ONLY by the OUTPUT LANGUAGE field above.",
      "Write EVERYTHING in the specified language — section titles, content, vocabulary, teacher dialogue.",
    ];

    if (params.prior_knowledge) {
      promptLines.push(`PRIOR KNOWLEDGE: ${params.prior_knowledge}`);
    }
    if (params.notes) {
      promptLines.push(`TEACHER NOTES:   ${params.notes}`);
    }

    promptLines.push(
      "",
      "EXECUTION SEQUENCE:",
      "1. Protocol 1: Lock language, calibrate ZPD, confirm tier requirements",
      "2. Module 2.1: Generate IQ — verify all 7 Wiggins-McTighe criteria and 5 traps",
      "3. Module 2.2: Generate hook — concrete, sensory, leads directly to IQ",
      "4. Modules 2.3 to 2.9: Generate all remaining sections with real named sources",
      "5. Module 2.10: Coherence integrity check — every element must serve the IQ",
      "6. Protocol 3: Write complete plan — all 10 sections, no truncation",
    );

    aiMessages.push({ role: "user", content: promptLines.join("\n") });

  } else if (mode === "chat") {
    const contextIntro = plan_context
      ? `MODE: chat\n\nFULL PLAN CONTEXT:\n\n${plan_context}\n\n---\nThe teacher has a follow-up question. Answer specifically using the plan context. End your response with 2-3 suggested follow-up questions.`
      : "MODE: chat\nThe teacher has a follow-up question. Answer helpfully. End with 2-3 suggested follow-up questions.";

    aiMessages.push({ role: "user", content: contextIntro });
    aiMessages.push({
      role: "assistant",
      content: "Understood. I have the full plan context and am ready for the teacher's question.",
    });

    for (const msg of messages) {
      aiMessages.push({
        role: msg.role === "model" ? "assistant" : "user",
        content: msg.content,
      });
    }
  }
  return aiMessages;
}

const LANGUAGE_NAMES = { bosnian: "Bosnian (bosanski)", german: "German (Deutsch)", english: "English" } as const;

function buildPsiMessages(req: IblChatRequest, psiText: string): AiMessage[] {
  const { mode, messages, plan_context, params } = req;
  const out: AiMessage[] = [{ role: "system", content: psiText }];
  const history = messages.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.content }));

  if (mode === "generate" && params) {
    const lines = [
      "MODE B — DIRECT GENERATION. Execute Protocols 1 → 2 → 3 of the system instructions exactly.",
      "",
      `subject: ${params.subject}`,
      `grade: ${params.grade}`,
      `topic: ${params.topic}`,
      `duration_min: ${params.duration_min}`,
      `tier: ${params.tier}`,
      `output_language: ${LANGUAGE_NAMES[params.language]} — set by the teacher; overrides language detection.`,
    ];
    if (params.prior_knowledge) lines.push(`prior_knowledge: ${params.prior_knowledge}`);
    if (params.notes) lines.push(`teacher_notes: ${params.notes}`);
    out.push({ role: "user", content: lines.join("\n") });
    return out;
  }

  if (mode === "chat") {
    out.push({
      role: "user",
      content: plan_context
        ? `MODE C — POST-GENERATION CONVERSATION (Protocol 4). The plan under discussion:\n\n${plan_context}`
        : "MODE C — POST-GENERATION CONVERSATION (Protocol 4). No plan has been loaded yet.",
    });
    out.push({ role: "assistant", content: "Understood." });
    // The plan is in plan_context; don't send it a second time from history (audit D-6).
    for (const m of history) if (!(plan_context && m.role === "assistant" && m.content === plan_context)) out.push(m);
    return out;
  }

  // onboarding
  out.push({ role: "user", content: "MODE A — GUIDED ONBOARDING (Protocol 0). Continue the dialogue." });
  out.push(...history);
  return out;
}
