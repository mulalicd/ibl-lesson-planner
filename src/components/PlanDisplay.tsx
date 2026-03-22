import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Check, BookOpen, Target, Lightbulb, Clock, Users, FlaskConical,
  Award, ChevronDown, ChevronUp, Sparkles, FileText, Brain, Palette,
  MessageCircle, ListChecks, Eye, Code2, GraduationCap, ClipboardCheck,
  BookMarked, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanDisplayProps {
  planText: string;
  planId?: string;
  className?: string;
  compact?: boolean;
}

interface PlanSection {
  title: string;
  content: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  accentColor: string;
}

// Known section patterns with unique pastel colors
const SECTION_DEFS: {
  patterns: string[];
  bgColor: string;
  borderColor: string;
  iconBg: string;
  accentColor: string;
  icon: React.ReactNode;
}[] = [
  {
    patterns: ['IBL NASTAVNI PLAN', 'INTERNATIONALE DEUTSCHE', 'HEADER', 'ZAGLAVLJE'],
    bgColor: 'bg-gradient-to-br from-slate-50 to-blue-50/40',
    borderColor: 'border-blue-200/50',
    iconBg: 'bg-blue-100 text-blue-700',
    accentColor: 'text-blue-700',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    patterns: ['HOOK', 'UDICA', 'EINSTIEG', 'ISTRAŽIVAČKO PITANJE'],
    bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50/40',
    borderColor: 'border-amber-200/50',
    iconBg: 'bg-amber-100 text-amber-700',
    accentColor: 'text-amber-700',
    icon: <Lightbulb className="w-4 h-4" />,
  },
  {
    patterns: ['DOKAZNI MATERIJAL', 'EVIDENCE MATERIAL', 'BEWEISMATERIAL'],
    bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50/40',
    borderColor: 'border-rose-200/50',
    iconBg: 'bg-rose-100 text-rose-700',
    accentColor: 'text-rose-700',
    icon: <BookOpen className="w-4 h-4" />,
  },
  {
    patterns: ['VIZUALNI ELEMENT', 'VISUAL ELEMENT', 'VISUELLE'],
    bgColor: 'bg-gradient-to-br from-fuchsia-50 to-purple-50/40',
    borderColor: 'border-fuchsia-200/50',
    iconBg: 'bg-fuchsia-100 text-fuchsia-700',
    accentColor: 'text-fuchsia-700',
    icon: <Palette className="w-4 h-4" />,
  },
  {
    patterns: ['SOKRATOV', 'SOCRATIC', 'SCAFFOLD', 'SOKRATISCH'],
    bgColor: 'bg-gradient-to-br from-indigo-50 to-violet-50/40',
    borderColor: 'border-indigo-200/50',
    iconBg: 'bg-indigo-100 text-indigo-700',
    accentColor: 'text-indigo-700',
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    patterns: ['DOKAZI O UČENJU', 'EVIDENCE OF LEARNING', 'LEARNING EVIDENCE', 'LERNNACHWEIS'],
    bgColor: 'bg-gradient-to-br from-teal-50 to-emerald-50/40',
    borderColor: 'border-teal-200/50',
    iconBg: 'bg-teal-100 text-teal-700',
    accentColor: 'text-teal-700',
    icon: <ListChecks className="w-4 h-4" />,
  },
  {
    patterns: ['SAMOEVALUACIJA', 'SELF-EVAL', 'SELBSTBEWERTUNG', 'NASTAVNIČKA SAMO'],
    bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50/40',
    borderColor: 'border-orange-200/50',
    iconBg: 'bg-orange-100 text-orange-700',
    accentColor: 'text-orange-700',
    icon: <Brain className="w-4 h-4" />,
  },
  {
    patterns: ['DODATNI RESURSI', 'ADDITIONAL RESOURCE', 'ZUSÄTZLICHE', 'DIFERENCIJACIJA', 'DIFFERENTIATION'],
    bgColor: 'bg-gradient-to-br from-cyan-50 to-sky-50/40',
    borderColor: 'border-cyan-200/50',
    iconBg: 'bg-cyan-100 text-cyan-700',
    accentColor: 'text-cyan-700',
    icon: <BookMarked className="w-4 h-4" />,
  },
  {
    patterns: ['PREPORUKE ZA IZVOĐENJE', 'DELIVERY RECOMMEND', 'LESSON DELIVERY', 'EMPFEHLUNG'],
    bgColor: 'bg-gradient-to-br from-sky-50 to-blue-50/40',
    borderColor: 'border-sky-200/50',
    iconBg: 'bg-sky-100 text-sky-700',
    accentColor: 'text-sky-700',
    icon: <Timer className="w-4 h-4" />,
  },
  {
    patterns: ['FOOTER', 'POST-GENERATION', 'KONTAKT', 'CONTACT'],
    bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50/40',
    borderColor: 'border-gray-200/50',
    iconBg: 'bg-gray-100 text-gray-600',
    accentColor: 'text-gray-600',
    icon: <FileText className="w-4 h-4" />,
  },
];

const FALLBACK_COLORS = [
  { bgColor: 'bg-gradient-to-br from-violet-50 to-purple-50/40', borderColor: 'border-violet-200/50', iconBg: 'bg-violet-100 text-violet-700', accentColor: 'text-violet-700' },
  { bgColor: 'bg-gradient-to-br from-lime-50 to-green-50/40', borderColor: 'border-lime-200/50', iconBg: 'bg-lime-100 text-lime-700', accentColor: 'text-lime-700' },
  { bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-50/40', borderColor: 'border-yellow-200/50', iconBg: 'bg-yellow-100 text-yellow-700', accentColor: 'text-yellow-700' },
  { bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50/40', borderColor: 'border-emerald-200/50', iconBg: 'bg-emerald-100 text-emerald-700', accentColor: 'text-emerald-700' },
];

function matchSectionStyle(title: string) {
  const upper = title.toUpperCase();
  for (const def of SECTION_DEFS) {
    for (const pattern of def.patterns) {
      if (upper.includes(pattern)) return def;
    }
  }
  return null;
}

function isDecorationLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 3) return false;
  return /^[═=─\-~*╔║╚╗╝╟╠╣╬┌┐└┘├┤┬┴┼│|_\s]+$/.test(t);
}

function isSectionHeader(line: string): boolean {
  const cleaned = line.replace(/[═=─╔║╚╗╝│|*#\-]/g, '').trim();
  if (cleaned.length < 3 || cleaned.length > 100) return false;
  
  // STRICT: Only match SECTION N patterns
  if (/^SECTION\s+\d+/i.test(cleaned)) return true;
  
  // STRICT: Only match numbered section headers like "1. HEADER"
  if (/^\d+[\.]\s+(HEADER|HOOK|EVIDENCE|VISUAL|SCAFFOLD|LEARNING|TEACHER|ADDITIONAL|DELIVERY|FOOTER)/i.test(cleaned)) return true;
  
  // All caps with letters — but only if it's a known section pattern
  if (cleaned === cleaned.toUpperCase() && /[A-ZČĆŽŠĐÄÖÜ]/.test(cleaned) && cleaned.length >= 4) {
    return !!matchSectionStyle(cleaned);
  }
  
  return false;
}

interface ParsedPlan {
  headerLines: string[];
  inquiryQuestion: string;
  sections: PlanSection[];
}

function parsePlan(text: string): ParsedPlan {
  const lines = text.split('\n');
  const headerLines: string[] = [];
  let inquiryQuestion = '';
  const sections: PlanSection[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];
  let inHeader = true;
  let fallbackIdx = 0;

  function flushSection() {
    if (!currentTitle) return;
    const content = currentContent.join('\n').trim();
    if (!content && !currentTitle) return;

    const cleanTitle = currentTitle.replace(/[═=─\-*#╔║╚╗╝│|]/g, '').replace(/^\d+[\.\)]\s*/, '').trim();
    const style = matchSectionStyle(cleanTitle);
    const fb = FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length];

    sections.push({
      title: cleanTitle,
      content,
      icon: style?.icon || <BookOpen className="w-4 h-4" />,
      bgColor: style?.bgColor || fb.bgColor,
      borderColor: style?.borderColor || fb.borderColor,
      iconBg: style?.iconBg || fb.iconBg,
      accentColor: style?.accentColor || fb.accentColor,
    });
    if (!style) fallbackIdx++;
    currentTitle = '';
    currentContent = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isDecorationLine(trimmed)) continue;

    // Extract inquiry question
    if (!inquiryQuestion) {
      const iqMatch = trimmed.match(/^(?:ISTRAŽIVAČKO PITANJE|FORSCHUNGSFRAGE|INQUIRY QUESTION)\s*(?:\(IQ\))?:?\s*$/i);
      if (iqMatch || (trimmed.includes('ISTRAŽIVAČKO PITANJE') && trimmed.includes('(IQ)'))) {
        // Look for the actual question in next non-empty lines
        for (let j = i + 1; j < lines.length; j++) {
          const next = lines[j].trim().replace(/^[│|>\s]+/, '').replace(/[│|]+$/, '').trim();
          if (isDecorationLine(next) || !next) continue;
          if (next.length > 10 && next.endsWith('?')) {
            inquiryQuestion = next;
            break;
          }
          if (next.length > 15) {
            inquiryQuestion = next;
            break;
          }
        }
      }
    }

    // Detect section headers
    if (isSectionHeader(trimmed)) {
      if (inHeader) inHeader = false;
      flushSection();
      currentTitle = trimmed;
      continue;
    }

    // Accumulate header or section content
    if (inHeader && !currentTitle) {
      if (trimmed) headerLines.push(trimmed);
    } else if (currentTitle) {
      currentContent.push(line);
    }
  }
  flushSection();

  return { headerLines, inquiryQuestion, sections };
}

export default function PlanDisplay({ planText, planId, className, compact }: PlanDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const parsed = useMemo(() => parsePlan(planText), [planText]);

  async function handleCopy() {
    await navigator.clipboard.writeText(planText).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const hasStructured = parsed.sections.length >= 2;

  return (
    <div className={cn('relative group', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
            IBL Plan časa
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasStructured && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg neu-btn text-muted-foreground hover:text-primary font-medium"
            >
              {showRaw ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
              {showRaw ? 'Kartice' : 'Izvorni tekst'}
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg neu-btn text-muted-foreground hover:text-primary font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-secondary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Kopirano' : 'Kopiraj'}
          </motion.button>
        </div>
      </div>

      {hasStructured && !showRaw ? (
        <div className="space-y-4">
          {/* Header card */}
          {parsed.headerLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 border bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/15"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Zaglavlje</span>
              </div>
              <div className="space-y-1">
                {parsed.headerLines.map((l, i) => {
                  // Render key-value pairs as a mini table
                  const kvMatch = l.match(/^([A-ZČĆŽŠĐÄÖÜa-zčćžšđäöü/\s]+):\s+(.+)$/);
                  if (kvMatch) {
                    return (
                      <div key={i} className="flex items-baseline gap-3 text-sm py-0.5">
                        <span className="font-semibold text-foreground/70 min-w-[130px] flex-shrink-0">{kvMatch[1].trim()}</span>
                        <span className="text-foreground">{kvMatch[2].trim()}</span>
                      </div>
                    );
                  }
                  return <p key={i} className="text-sm font-bold text-foreground">{l}</p>;
                })}
              </div>
            </motion.div>
          )}

          {/* Inquiry Question */}
          {parsed.inquiryQuestion && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-5 border-2 bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-300/50 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 shadow-inner">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700/70 mb-1">
                    Istraživačko pitanje (IQ)
                  </p>
                  <p className="text-base font-semibold text-foreground leading-relaxed italic">
                    "{parsed.inquiryQuestion}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Section Cards — full width, one per row */}
          <div className="space-y-4">
            {parsed.sections.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * idx, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-md',
                  section.bgColor,
                  section.borderColor,
                )}
              >
                {/* Section header bar */}
                <div className={cn('px-5 py-3 border-b flex items-center gap-2.5', section.borderColor)}>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shadow-inner', section.iconBg)}>
                    {section.icon}
                  </div>
                  <h2 className={cn('font-bold text-sm tracking-tight', section.accentColor)}>
                    {section.title}
                  </h2>
                </div>
                {/* Section body — render full content */}
                <div className="px-5 py-4 text-sm text-foreground/85 leading-relaxed">
                  <SectionContent content={section.content} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div
          id={planId ? `plan-${planId}` : undefined}
          className="w-full neu-card p-6 overflow-x-auto rounded-2xl"
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-mono text-foreground/85">
            {planText}
          </div>
        </div>
      )}
    </div>
  );
}

/** Renders section content with tables, lists, checkboxes, time phases, etc. */
function SectionContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  // Detect ASCII art lines
  function isAsciiArt(line: string): boolean {
    return /[+\-|\/\\*=#_]{3,}/.test(line) || 
           /^\s*[|+\/\\]/.test(line) ||
           /ASCII|PREVIEW|ascii art/i.test(line);
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip decoration
    if (isDecorationLine(trimmed)) { i++; continue; }

    // Detect ASCII art block
    if (isAsciiArt(trimmed) || (i > 0 && isAsciiArt(lines[i-1]?.trim() || ''))) {
      const asciiLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();
        if (!nextTrimmed || isAsciiArt(nextTrimmed) || nextTrimmed.startsWith(' ')) {
          asciiLines.push(nextLine);
          j++;
        } else {
          break;
        }
      }
      elements.push(
        <pre key={i} className="font-mono text-xs bg-slate-900 text-green-300 border border-slate-700
                           rounded-xl p-4 overflow-x-auto my-3 leading-relaxed shadow-inner
                           whitespace-pre select-all">
          {asciiLines.join('\n')}
        </pre>
      );
      i = j;
      continue;
    }

    // Empty line → spacer
    if (!trimmed) {
      elements.push(<div key={i} className="h-2" />);
      i++;
      continue;
    }

    // Clean pipe borders
    const cleaned = trimmed.replace(/^[│|]\s*/, '').replace(/\s*[│|]$/, '').trim();
    if (!cleaned) { i++; continue; }

    // Time phase markers like (0-5 min) FAZA HOOK
    const timePhase = cleaned.match(/^\((\d+\s*-\s*\d+\s*min)\)\s*(.+)$/i);
    if (timePhase) {
      elements.push(
        <div key={i} className="flex items-center gap-3 mt-4 mb-2 pb-2 border-b border-current/10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 text-xs font-bold text-primary border border-primary/20 shadow-sm">
            <Clock className="w-3 h-3" />
            {timePhase[1]}
          </span>
          <span className="font-bold text-foreground text-sm">{timePhase[2]}</span>
        </div>
      );
      i++;
      continue;
    }

    // Time markers like [15 min]
    const timeMarker = cleaned.match(/^\[?\s*(\d+\s*min)\s*\]?$/i);
    if (timeMarker) {
      elements.push(
        <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 text-xs font-semibold text-muted-foreground my-1 border border-border/20">
          <Clock className="w-3 h-3" /> {timeMarker[1]}
        </span>
      );
      i++;
      continue;
    }

    // Checkbox items [X] or [ ]
    if (cleaned.match(/^\[[ xX✓✔]\]/)) {
      const checked = !cleaned.startsWith('[ ]');
      const text = cleaned.replace(/^\[[ xX✓✔]\]\s*/, '');
      elements.push(
        <div key={i} className="flex items-start gap-2.5 py-1">
          <span className={cn(
            'mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-xs',
            checked
              ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
              : 'bg-white border-gray-300 text-transparent'
          )}>
            {checked ? '✓' : ''}
          </span>
          <span className="flex-1">{text}</span>
        </div>
      );
      i++;
      continue;
    }

    // Numbered items like 1. or 1)
    const numMatch = cleaned.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div key={i} className="flex items-start gap-2.5 py-0.5">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20
                         flex items-center justify-center text-xs font-bold text-primary mt-0.5 shadow-sm">
            {numMatch[1]}
          </span>
          <span className="flex-1">{numMatch[2]}</span>
        </div>
      );
      i++;
      continue;
    }

    // Bullet points
    if (cleaned.match(/^[•·▸▹►→➤✓✔☑\-–]\s/)) {
      elements.push(
        <div key={i} className="flex items-start gap-2 py-0.5 pl-2">
          <span className="text-primary/50 mt-1 flex-shrink-0 text-[8px]">●</span>
          <span>{cleaned.replace(/^[•·▸▹►→➤✓✔☑\-–]\s*/, '')}</span>
        </div>
      );
      i++;
      continue;
    }

    // Key-value pair (like "Naslov elementa:   Dijagram...")
    const kvMatch = cleaned.match(/^([A-ZČĆŽŠĐÄÖÜa-zčćžšđäöü\s/()]+):\s{2,}(.+)$/);
    if (kvMatch) {
      elements.push(
        <div key={i} className="flex items-baseline gap-3 py-1.5 px-3 rounded-lg bg-white/60
                           border border-current/5 my-0.5 hover:bg-white/80 transition-colors">
          <span className="font-semibold text-foreground/70 min-w-[140px] flex-shrink-0 text-xs uppercase tracking-wide">{kvMatch[1].trim()}</span>
          <span className="text-foreground">{kvMatch[2].trim()}</span>
        </div>
      );
      i++;
      continue;
    }

    // Sub-headers (all caps, shorter)
    if (cleaned === cleaned.toUpperCase() && /[A-ZČĆŽŠĐ]/.test(cleaned) && cleaned.length > 3 && cleaned.length < 60) {
      elements.push(
        <p key={i} className="font-bold text-foreground/90 mt-3 mb-1 text-sm tracking-wide">{cleaned}</p>
      );
      i++;
      continue;
    }

    // Indented content (sub-items)
    if (line.startsWith('    ') || line.startsWith('\t')) {
      elements.push(
        <div key={i} className="pl-6 py-0.5 text-foreground/75 border-l-2 border-current/10 ml-3">
          {cleaned}
        </div>
      );
      i++;
      continue;
    }

    // Normal paragraph
    elements.push(<p key={i} className="py-0.5">{cleaned}</p>);
    i++;
  }

  return <>{elements}</>;
}
