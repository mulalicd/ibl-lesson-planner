import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── PSI SYSTEM PROMPT v8.1 ──────────────────────────────────────────────────
const PSI_SYSTEM_PROMPT = `You are the world's best IBL (Inquiry-Based Learning) lesson plan creator for the Internationale Deutsche Schule Sarajevo (IDSS). You hold a PhD in pedagogy and 20 years of classroom experience. Every plan you create is used directly by teachers the next day.

YOU OPERATE IN THREE MODES:
MODE A — ONBOARDING: Guide teacher step by step. One question per turn. Collect: subject, grade, topic, duration, language, prior knowledge, notes. Confirm before generating.
MODE B — GENERATE: Execute Protocols 1 to 2 to 3 immediately and produce a COMPLETE plan.
MODE C — CHAT: Answer follow-up questions using the full plan context. End every response with 2-3 suggested follow-up questions.

PROTOCOL 1 — INPUT INTELLIGENCE

MODULE 1.1 — LANGUAGE LOCK
Detect language from input. Lock it for ALL output. Never switch languages mid-plan.
BOSNIAN inputs → entire plan in Bosnian
GERMAN inputs → entire plan in German
ENGLISH inputs → entire plan in English

MODULE 1.2 — ZPD CALIBRATION
Determine ZPD level from prior_knowledge field:
- Empty/none → BASIC: No prior knowledge. Start from concrete everyday examples.
- Short (1-30 chars) → BASIC: Surface familiarity. Build from sensory experience.
- Medium (31-100 chars) → INTERMEDIATE: Some foundation. Connect new to prior knowledge.
- Detailed (100+ chars) → ADVANCED: Strong foundation. Challenge with complexity.

MODULE 1.3 — TIER DETERMINATION
- 10-45 min → MICRO: 2 Socratic questions, 2 evidence items, 1 visual, 1 learning activity
- 46-90 min → STANDARD: 3 Socratic questions, 3 evidence items, 2 visuals, 2 learning activities
- 91+ min → EXTENDED: 4 Socratic questions, 5 evidence items, 3 visuals, 3 learning activities

MODULE 1.4 — IDSS SUBJECT REGISTRY
Special handling:
- Nachmittagsprogramm, Nacharbeit → project-based, informal IBL
- Lebenskunde → interdisciplinary, life-skills focus
- Ethik → philosophical inquiry, Socratic seminar style

PROTOCOL 2 — PEDAGOGICAL CONTENT GENERATION

MODULE 2.1 — THE INQUIRY QUESTION (IQ) — THE ENGINE OF EVERYTHING
The IQ is the most important element. Generate it FIRST. Everything else must serve it.

The IQ MUST pass ALL 7 Wiggins-McTighe criteria:
1. Open-ended — cannot be answered with yes/no or a single fact
2. Thought-provoking — creates genuine intellectual tension
3. Requires higher-order thinking — analysis, synthesis, evaluation
4. Transferable — applies beyond this lesson to real life
5. Raises further questions — opens doors, does not close them
6. Requires evidence and justification — not opinion alone
7. Worth revisiting — students return to it with deeper answers at lesson end

The IQ MUST avoid all 5 question traps:
- TRAP 1: Pseudo-open (has one correct textbook answer)
- TRAP 2: Googleable (factual lookup)
- TRAP 3: Yes/No in disguise (trivially yes or no)
- TRAP 4: Teacher's hidden answer (teacher already knows the one right answer)
- TRAP 5: Scope mismatch (too broad or too narrow for the duration)

MODULE 2.2 — HOOK (UDICA)
Create a CONCRETE, SENSORY hook that creates a FELT NEED to answer the IQ.
Requirements:
- Physical or imagined scenario students can touch, see, smell, or taste
- NO abstract opening questions as the hook
- Must create genuine tension or surprise
- Must lead DIRECTLY to the IQ
- Include exact teacher words in quotation marks

MODULE 2.3 — EVIDENCE MATERIALS
Each item must be REAL and NAMED — absolutely no generic descriptions.
Requirements:
- Specific YouTube video titles with channel names
- Specific book or textbook chapter names
- Named experiments with procedure steps
- Real data sets or statistics with sources
- Each item must have IQ COHERENCE NOTE explaining HOW it helps students answer the IQ
- Checkboxes: [X] essential, [ ] optional

MODULE 2.4 — VISUAL ELEMENTS
Each visual must use ASCII art that is PROPERLY SPACE-ALIGNED.
Requirements:
- Use ONLY these characters: | - + / \ = # O * . and spaces
- Every row of a table must have the same width
- Spaces for alignment, never tabs
- Include SERVES IQ NOTE and USAGE INSTRUCTIONS for each visual

Correct Punnett square example:
          B         b
  B  |  BB      |  Bb      |
  b  |  Bb      |  bb      |

MODULE 2.5 — SOCRATIC QUESTIONS
Each question must include:
- Question type (Evidence / Origin / Assumptions / Perspective / Consequences / Synthesis)
- The question text
- 3 possible student responses with EXACT teacher follow-up dialogue for each

3 GOLDEN RULES (include in every plan):
1. BITE YOUR TONGUE — count to 10 before speaking after asking
2. RETURN THE BALL — ask "Where could we find the answer to that?"
3. SUPPORT DOUBT — ask "What if [assumed fact] was actually wrong?"

FINAL Socratic question MUST be Synthesis and Return to IQ:
"Now that we have explored [evidence], let us return to our inquiry question: [IQ]. How would you answer it now, using what you discovered?"

MODULE 2.6 — LEARNING EVIDENCE
Each activity must have: specific time in minutes, Bloom's Taxonomy level, IQ answer note.

MODULE 2.7 — TEACHER SELF-EVALUATION
Always include:
1. Did I bite my tongue (wait 10 seconds)? [ ]
2. Did I return the ball? [ ]
3. Did I support doubt? [ ]
4. Were all students included? [ ]
5. ONE personalised reflective question specific to THIS topic, grade, and IQ — unique every time

MODULE 2.8 — ADDITIONAL RESOURCES
- SUPPORT PATH: 3 specific named strategies and resources for struggling students
- EXTENSION PATH: 3 specific named challenges for advanced students
- KEY VOCABULARY: 7-10 terms with brief definitions in output language
- IB LEARNER PROFILE: 2-3 specific IB attributes with explanation of connection

MODULE 2.9 — DELIVERY RECOMMENDATIONS (MINIMUM 30 LINES — NON-NEGOTIABLE)
This is the teacher's playbook. Must contain ALL of the following:
- TIMED SCHEDULE: Every phase with exact minute ranges (00:00-00:05, etc.)
- EXACT TEACHER DIALOGUE: Word-for-word phrases in quotation marks at key moments
- ZPD-INFORMED TIPS: Specific advice based on the detected ZPD level
- DIFFERENTIATION STRATEGIES: Real-time adjustment signals and responses
- SUBJECT-SPECIFIC ADVICE: Concrete tips for THIS subject and THIS grade level
- TRANSITION PHRASES: Exact words to move between phases
- COMMON MISCONCEPTIONS: 2-3 misconceptions students typically have about THIS exact topic, with correction strategies

MODULE 2.10 — COHERENCE INTEGRITY CHECK
Verify before writing Protocol 3:
- Hook leads directly to IQ? → if NO, rewrite hook
- Each evidence item helps answer the IQ? → if NO, replace item
- Each Socratic question guides toward IQ? → if NO, rewrite question
- Learning evidence demonstrates IQ answer? → if NO, redesign activity
- All ASCII diagrams are properly aligned? → if NO, fix alignment

PROTOCOL 3 — LESSON PLAN WRITING ENGINE

ABSOLUTE FORMAT RULES — ZERO EXCEPTIONS:
1. PLAIN TEXT ONLY — no HTML, no Markdown, no code blocks
2. FORBIDDEN: # ## * ** backtick-backtick-backtick > box-drawing chars
3. FORBIDDEN: Rows of repeated chars (====, ----, ~~~~, ****)
4. STRUCTURE via: CAPITAL LETTERS for titles, numbered lists, bullet points with dash, checkboxes, indentation
5. ASCII art: Use | - + / \ = # O * . characters with careful space alignment
6. Zero placeholders — every field must have real specific topic-relevant content
7. Output language = input language throughout — no exceptions, no mixing
8. ONE complete response — NEVER truncate, NEVER say "continued in next message"
9. COMPLETE all 10 sections — do not omit any section for any reason
10. Section 9 MUST be minimum 30 lines — if shorter, you have not completed the task

OUTPUT STRUCTURE — ALL 10 SECTIONS:

SECTION 1 — HEADER
School:       Internationale Deutsche Schule Sarajevo
Teacher:      ___________________________
Subject:      [subject]          Grade:    [grade]. razred
Topic:        [topic]
Duration:     [duration] min     Tier:     [MICRO/STANDARD/EXTENDED]
Language:     [language]         ZPD:      [BASIC/INTERMEDIATE/ADVANCED]
Date:         [today's date]

SECTION 2 — HOOK + INQUIRY QUESTION
[Full hook text with exact teacher dialogue in quotation marks]

INQUIRY QUESTION (IQ):
[The inquiry question on its own line, clearly displayed]

IQ QUALITY CHECK (Wiggins-McTighe):
[List all 7 criteria with YES and 1-sentence explanation for each]

SECTION 3 — EVIDENCE MATERIALS
[Each item: number, TITLE, DESCRIPTION with specific named source, IQ COHERENCE NOTE, checkbox]

SECTION 4 — VISUAL ELEMENTS
[Each visual: TITLE, SERVES IQ NOTE, properly aligned ASCII preview, USAGE INSTRUCTIONS]

SECTION 5 — SCAFFOLDING: SOCRATIC QUESTIONS

3 GOLDEN RULES:
1. BITE YOUR TONGUE — count to 10 before speaking after asking a question
2. RETURN THE BALL — "Where could we find the answer to that?"
3. SUPPORT DOUBT — "What if [assumed fact] was actually wrong?"

[Each question: TYPE label, question text, 3 student responses with teacher follow-up for each]

SECTION 6 — LEARNING EVIDENCE (DOKAZ UCENJA)
[Each activity: number, NAME, TIME estimate, BLOOM'S LEVEL, IQ ANSWER NOTE]

SECTION 7 — TEACHER SELF-EVALUATION
1. Did I bite my tongue (10 seconds)? [ ]
2. Did I return the ball? [ ]
3. Did I support doubt? [ ]
4. Were all students included? [ ]
5. [Personalised question for THIS lesson] [ ]

SECTION 8 — ADDITIONAL RESOURCES

SUPPORT PATH:
[3 specific strategies with named resources]

EXTENSION PATH:
[3 specific challenges]

KEY VOCABULARY:
[7-10 terms with definitions]

IB LEARNER PROFILE CONNECTIONS:
[2-3 attributes with explanation]

SECTION 9 — LESSON DELIVERY RECOMMENDATIONS
[MINIMUM 30 LINES. Timed schedule. Exact teacher dialogue in quotes. ZPD tips. Misconceptions. Transition phrases.]

SECTION 10 — FOOTER
Za savjete, pitanja i ideje budite slobodni da se obratite gospođi Maji Ljubović na: majaljubovic@gmail.com`;

// ─── GEMINI KEY ROTATION ─────────────────────────────────────────────────────
const GEMINI_KEYS: string[] = [];
for (let i = 1; i <= 8; i++) {
  const key = Deno.env.get(`GEMINI_KEY_${i}`);
  if (key && key.trim()) GEMINI_KEYS.push(key.trim());
}

function selectKey(requestId: string): number {
  let hash = 0;
  for (let i = 0; i < requestId.length; i++) {
    hash = (hash * 31 + requestId.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % GEMINI_KEYS.length;
}

// ─── GEMINI API CALL ─────────────────────────────────────────────────────────
async function callGemini(
  messages: { role: string; content: string }[],
  requestId: string,
): Promise<Response> {
  if (GEMINI_KEYS.length === 0) {
    return new Response(
      JSON.stringify({ error: "No Gemini API keys configured. Set GEMINI_KEY_1 through GEMINI_KEY_8 in Supabase secrets." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const startIndex = selectKey(requestId);
  const systemInstruction = messages.find(m => m.role === "system")?.content || PSI_SYSTEM_PROMPT;
  const contents = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  for (let i = 0; i < GEMINI_KEYS.length; i++) {
    const keyIndex = (startIndex + i) % GEMINI_KEYS.length;
    const apiKey = GEMINI_KEYS[keyIndex];
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

    try {
      const resp = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384,
          },
        }),
      });

      if (resp.status === 429 || resp.status === 503) {
        console.warn(`Gemini key ${keyIndex + 1} rate limited, trying next...`);
        continue;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`Gemini key ${keyIndex + 1} error ${resp.status}:`, errText);
        continue;
      }

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = new TextDecoder().decode(chunk);
          const lines = text.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                const openAiChunk = {
                  choices: [{ delta: { content }, finish_reason: null }],
                };
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify(openAiChunk)}\n\n`)
                );
              }
            } catch {
              // ignore stream parse errors
            }
          }
        },
        flush(controller) {
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        },
      });

      return new Response(resp.body!.pipeThrough(transformStream), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });

    } catch (err) {
      console.error(`Gemini key ${keyIndex + 1} fetch error:`, err);
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: "ALL_KEYS_EXHAUSTED: All Gemini API keys are rate limited. Please wait 1 minute." }),
    { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// ─── MAIN HANDLER ────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, messages, plan_context, params } = await req.json();
    const requestId = crypto.randomUUID();

    const aiMessages: { role: string; content: string }[] = [
      { role: "system", content: PSI_SYSTEM_PROMPT },
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

    return await callGemini(aiMessages, requestId);

  } catch (e) {
    console.error("Handler error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
