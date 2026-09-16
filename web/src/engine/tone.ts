import { activeText } from './active-text';
import {
  MAX_DRAFT_LENGTH, MAX_TONE_FINDINGS,
  type ToneCheckResult, type ToneFinding, type ToneIntent, type ToneRuleId,
} from './types';

/*
 * Bounded wording cues, not sentiment analysis or a judgment about the writer.
 * Addressed statements, explicit requests and bounded evaluative clauses qualify.
 * Sweeping blame requires always/never plus one of the coordination actions below;
 * dismissal requires an explicit accusation or dismissive reminder followed by a
 * request; pressure requires
 * a request ending in "no excuses", "no more excuses" or "or else". Judgmental
 * framing covers only "not a good look" and addressed "you should know better".
 * Brevity, please, deadlines, escalation, thanks and punctuation style are never
 * sufficient cues.
 *
 * We deliberately abstain on questions, supported negations/qualifications,
 * reported/hypothetical wording, and any unit containing quoted text. These are
 * finite lexical safeguards, not general language understanding. Unfamiliar cues,
 * context across sentences, sarcasm and many valid uses remain outside coverage.
 * Intent changes the review question, never invents a concern or a recipient's
 * feelings: Direct asks for a specific action; Collaborative invites coordination;
 * Warm invites less impersonal framing without requiring gratitude or apology.
 */
const PRIORITY: ToneRuleId[] = ['sweeping-blame', 'dismissive-request', 'pressure-wording', 'judgmental-framing'];
const ACTION = '(?:send|share|upload|complete|confirm|provide|reply|respond|review|read|check|finish|approve|return|submit)';
const DISMISSAL = new RegExp(`^stop (?:making excuses|wasting (?:my|our) time) and (?:please )?${ACTION}\\b`, 'i');
const REQUEST = new RegExp(`^(?:(?:please )?${ACTION}|you (?:must|need to|have to) ${ACTION}|i (?:need|expect) you to ${ACTION})\\b`, 'i');
const SWEEPING = /^you (?:always (?:(?:ignore|disregard) (?:my|our|the) (?:requests?|emails?|messages?|questions?|instructions?|feedback)|miss (?:our |the )?(?:deadlines?|meetings?)|fail to (?:reply|respond|follow up|send|share|provide|complete))|never (?:(?:reply|respond)(?: to (?:my|our) (?:emails?|messages?|requests?|questions?)| at all|(?=[.!\s]*$))|(?:read|follow) (?:my|our|the) (?:instructions?|messages?|emails?)|listen to (?:me|us)))\b/i;
const QUALIFIED = /\b(?:if|unless|except|perhaps|maybe|hypothetically|suppose|example|sample|template|phrase|wording|quoted?|allegedly|apparently|says?|said|claims?|claimed|untrue|inaccurate|without|not|cannot|can['’]t|don['’]t|doesn['’]t|didn['’]t|isn['’]t|aren['’]t|wasn['’]t|weren['’]t|wouldn['’]t|shouldn['’]t)\b/i;
const REPORTED = /\b(?:reportedly|reported|wrote|writes|according to|told (?:me|us)|tell(?:s)? (?:me|us))\b/i;
const SELF_REFLECTIVE = /\b(?:myself|ourselves|(?:my|our) (?:own )?(?:mistake|fault))\b/i;

const COPY: Record<ToneRuleId, { title: string; explanation: string; prompts: Record<ToneIntent, string> }> = {
  'sweeping-blame': {
    title: 'A sweeping statement',
    explanation: '“Always” or “never” with this action may read as a broad accusation rather than a specific follow-up.',
    prompts: {
      direct: 'Would naming the specific missed action make this request more precise?',
      collaborative: 'Would naming the specific missed action and a shared next step help coordinate the follow-up?',
      warm: 'Would focusing on this specific occasion make the follow-up less impersonal?',
    },
  },
  'dismissive-request': {
    title: 'Wording before a request',
    explanation: 'The wording before the requested action may make the request read as dismissive.',
    prompts: {
      direct: 'Could the requested action stand on its own without this lead-in?',
      collaborative: 'Would asking about a blocker and agreeing a next step help with this request?',
      warm: 'Would focusing on the specific situation fit your intended warmth?',
    },
  },
  'pressure-wording': {
    title: 'Extra pressure around a request',
    explanation: 'The added “no excuses”, “no more excuses” or “or else” wording may read as pressure beyond the requested action.',
    prompts: {
      direct: 'Would stating the action and any necessary deadline or consequence directly be clearer?',
      collaborative: 'Would clarifying the dependency and a way to raise blockers help coordinate this request?',
      warm: 'Would leaving room for a reply about the situation fit your intended warmth?',
    },
  },
  'judgmental-framing': {
    title: 'Judgmental framing',
    explanation: 'This wording may read as a judgment rather than a description of the specific situation.',
    prompts: {
      direct: 'Would naming the specific issue and requested action make this follow-up more precise?',
      collaborative: 'Would describing the specific issue and a shared next step help coordinate this follow-up?',
      warm: 'Would focusing on the specific situation instead of this judgment fit your intended warmth?',
    },
  },
};

interface Unit { start: number; end: number; text: string }

function judgmentalCue(text: string): { negationStart?: number } | undefined {
  if (SELF_REFLECTIVE.test(text)) return undefined;
  if (/^you should know better(?:[.!]*$|,\s*\S| than to \S)/i.test(text)) return {};
  // Require an evaluative clause boundary, so ordinary "look at"/"view of"
  // descriptions and unlisted paraphrases do not qualify. A leading I/we clause
  // is conservatively treated as self-reflection, not recipient-directed review.
  const atStart = /^(?:(?:this|that|it)(?: is|['’]s) )?not a good look(?:[.!]*$|,\s*\S)/i.test(text);
  const atEnd = !/^(?:i|we)\b/i.test(text)
    && /^.+,\s*(?:(?:this|that|it)(?: is|['’]s) )?not a good look[.!]*$/i.test(text);
  if (!atStart && !atEnd) return undefined;
  // The selected cue alone may bypass "not". Every other qualification in the
  // sentence still runs through the unchanged negation/qualification safeguard.
  const cue = atStart ? /\bnot a good look\b/i.exec(text) : /\bnot a good look[.!]*$/i.exec(text);
  return cue ? { negationStart: cue.index } : undefined;
}

/** Quotation ranges use unchanged UTF-16 positions, including unmatched openers.
 * Apostrophes between letters/digits are contractions, not quote delimiters.
 * Unclosed quotes conservatively exclude the rest of the draft; quoted passages
 * can span lines. Conventional email history is separately handled by activeText.
 */
function quotationRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [...text.matchAll(/```[\s\S]*?(?:```|$)|~~~[\s\S]*?(?:~~~|$)/g)]
    .map(match => [match.index, match.index + match[0].length]);
  let open: { start: number; close: string } | undefined;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const apostrophe = (char === "'" || char === '’')
      && /[\p{L}\p{N}]/u.test(text[i - 1] ?? '')
      && (!open || /[\p{L}\p{N}]/u.test(text[i + 1] ?? ''));
    if (apostrophe) continue;
    if (open) {
      if (char === open.close) {
        ranges.push([open.start, i + 1]);
        open = undefined;
      }
    } else {
      const close = ({ '“': '”', '‘': '’', '"': '"', "'": "'", '`': '`' } as Record<string, string>)[char];
      if (close) open = { start: i, close };
    }
  }
  if (open) ranges.push([open.start, text.length]);
  return ranges;
}

function units(masked: string): Unit[] {
  const result: Unit[] = [];
  // Deliberately do not promote clauses after a colon/comma/semicolon into a
  // direct request: those often belong to an example, condition or reported text.
  for (const line of masked.matchAll(/[^\r\n]+/g)) {
    let offset = 0;
    const stops = [...line[0].matchAll(/[.!?]+(?=\s|$)/g)].map(mark => mark.index + mark[0].length);
    stops.push(line[0].length);
    for (const stop of stops) {
      const part = line[0].slice(offset, stop);
      const leading = part.match(/^\s*(?:(?:[-*•]|\d+[)])\s+)?/)![0].length;
      const start = line.index + offset + leading;
      const end = line.index + offset + part.trimEnd().length;
      if (end > start) result.push({ start, end, text: masked.slice(start, end) });
      offset = stop;
    }
  }
  return result;
}

export function checkTone(text: string, intent: ToneIntent): ToneCheckResult {
  if (text.length > MAX_DRAFT_LENGTH) throw new RangeError(`Draft exceeds the ${MAX_DRAFT_LENGTH.toLocaleString('en-US')}-character limit.`);
  if (!text.trim()) return { findings: [], checkedCharacters: text.length, excludedSections: 0 };
  const { masked, excludedSections } = activeText(text);
  const quoted = quotationRanges(masked);
  const candidates: ToneFinding[] = [];
  for (const unit of units(masked)) {
    if (quoted.some(([start, end]) => start < unit.end && end > unit.start)
      || /\?[.!?]*$/.test(unit.text) || REPORTED.test(unit.text)
      || text.slice(unit.start, unit.end) !== unit.text) continue;
    const reminder = /^as i already told you,\s*(.+)$/i.exec(unit.text);
    const judgment = judgmentalCue(unit.text);
    const ruleId: ToneRuleId | undefined = SWEEPING.test(unit.text) ? 'sweeping-blame'
      : DISMISSAL.test(unit.text) || (reminder && REQUEST.test(reminder[1])) ? 'dismissive-request'
        : REQUEST.test(unit.text) && /[,;—–]\s*(?:no (?:more )?excuses|or else)[.!]*$/i.test(unit.text) ? 'pressure-wording'
          : judgment ? 'judgmental-framing' : undefined;
    if (!ruleId) continue;
    const negationStart = ruleId === 'judgmental-framing' ? judgment?.negationStart : undefined;
    const qualificationText = negationStart === undefined ? unit.text
      : unit.text.slice(0, negationStart) + '   ' + unit.text.slice(negationStart + 3);
    if (QUALIFIED.test(qualificationText)) continue;
    const copy = COPY[ruleId];
    candidates.push({
      id: `${ruleId}:${unit.start}:${unit.end}`, ruleId,
      start: unit.start, end: unit.end, quote: text.slice(unit.start, unit.end),
      title: copy.title, explanation: copy.explanation, prompt: copy.prompts[intent],
    });
  }
  candidates.sort((a, b) => PRIORITY.indexOf(a.ruleId) - PRIORITY.indexOf(b.ruleId) || a.start - b.start);
  const findings: ToneFinding[] = [];
  for (const candidate of candidates) {
    if (findings.some(finding => finding.ruleId === candidate.ruleId)) continue;
    findings.push(candidate);
    if (findings.length === MAX_TONE_FINDINGS) break;
  }
  return { findings, checkedCharacters: text.length, excludedSections };
}
