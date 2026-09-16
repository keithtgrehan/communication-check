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
 * framing covers "not a good look", addressed "you should know better", and
 * complete I/we complaints about having to chase you/your team. Dismissal also
 * covers I/we demands to stop "holding this/things up" and take a listed action.
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
const HOLDING_UP_REQUEST = new RegExp(`^(?:i|we) need you to stop holding (?:this|things) up and (?:please )?${ACTION}\\b`, 'i');
const CHASING_COMPLAINT = /^(?:i|we) (shouldn['’]t|should not) have to (?:chase|keep chasing) (?:you|your team)[.!]*$/i;
const REQUEST = new RegExp(`^(?:(?:please )?${ACTION}|you (?:must|need to|have to) ${ACTION}|i (?:need|expect) you to ${ACTION})\\b`, 'i');
const SWEEPING = /^you (?:always (?:(?:ignore|disregard) (?:my|our|the) (?:requests?|emails?|messages?|questions?|instructions?|feedback)|miss (?:our |the )?(?:deadlines?|meetings?)|fail to (?:reply|respond|follow up|send|share|provide|complete))|never (?:(?:reply|respond)(?: to (?:my|our) (?:emails?|messages?|requests?|questions?)| at all|(?=[.!\s]*$))|(?:read|follow) (?:my|our|the) (?:instructions?|messages?|emails?)|listen to (?:me|us)))\b/i;
const QUALIFIED = /\b(?:if|unless|except|perhaps|maybe|hypothetically|suppose|example|sample|template|phrase|wording|quoted?|allegedly|apparently|says?|said|claims?|claimed|untrue|inaccurate|without|not|cannot|can['’]t|don['’]t|doesn['’]t|didn['’]t|isn['’]t|aren['’]t|wasn['’]t|weren['’]t|wouldn['’]t|shouldn['’]t)\b/i;
const REPORTED = /\b(?:reportedly|reported|wrote|writes|according to|told (?:me|us)|tell(?:s)? (?:me|us))\b/i;
const SELF_REFLECTIVE = /\b(?:myself|ourselves|(?:my|our) (?:own )?(?:mistake|fault))\b/i;

const COPY: Record<ToneRuleId, { title: string; explanation: string; prompts: Record<ToneIntent, string> }> = {
  'sweeping-blame': {
    title: 'A broad statement',
    explanation: '“Always” or “never” here may sound like a general accusation rather than a comment on this situation.',
    prompts: {
      direct: 'Could you name the specific missed action?',
      collaborative: 'Could you name the specific missed action and a next step you can agree on?',
      warm: 'Would focusing on this occasion make the message feel less impersonal?',
    },
  },
  'dismissive-request': {
    title: 'The lead-in to this request',
    explanation: 'The words before the request may sound dismissive.',
    prompts: {
      direct: 'Could you make the request without this lead-in?',
      collaborative: 'Would it help to ask if anything is getting in the way and agree on a next step?',
      warm: 'Could you focus on the situation and leave room for the customer’s perspective?',
    },
  },
  'pressure-wording': {
    title: 'Extra pressure in this request',
    explanation: 'Phrases such as “no excuses,” “no more excuses” or “or else” may add pressure beyond the action you’re asking for.',
    prompts: {
      direct: 'Could you state the action and any necessary deadline or consequence without this phrase?',
      collaborative: 'Could this wording overlook a real blocker? Would asking the customer to explain help?',
      warm: 'Would leaving room for the customer to explain the situation suit this follow-up?',
    },
  },
  'judgmental-framing': {
    title: 'Wording that may sound judgmental',
    explanation: 'This wording may sound like a judgment rather than a description of what happened.',
    prompts: {
      direct: 'Could you name the specific issue and the action you need?',
      collaborative: 'Could you describe the specific issue and a next step you can agree on?',
      warm: 'Could you focus on the situation without making a judgment?',
    },
  },
};

/** Select review guidance without running detection or changing finding evidence. */
export function tonePromptFor(ruleId: ToneRuleId, intent: ToneIntent): string {
  return COPY[ruleId].prompts[intent];
}

interface Unit { start: number; end: number; text: string }

function judgmentalCue(text: string): { cueNegation?: { start: number; end: number } } | undefined {
  if (SELF_REFLECTIVE.test(text)) return undefined;
  const chasing = CHASING_COMPLAINT.exec(text);
  if (chasing) {
    const start = text.indexOf(chasing[1]);
    return { cueNegation: { start, end: start + chasing[1].length } };
  }
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
  return cue ? { cueNegation: { start: cue.index, end: cue.index + 3 } } : undefined;
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
      : DISMISSAL.test(unit.text) || HOLDING_UP_REQUEST.test(unit.text) || (reminder && REQUEST.test(reminder[1])) ? 'dismissive-request'
        : REQUEST.test(unit.text) && /[,;—–]\s*(?:no (?:more )?excuses|or else)[.!]*$/i.test(unit.text) ? 'pressure-wording'
          : judgment ? 'judgmental-framing' : undefined;
    if (!ruleId) continue;
    // Exempt only the negation within an exact approved cue. Other qualifiers
    // retain their normal meaning; evidence always uses untouched original text.
    const cueNegation = ruleId === 'judgmental-framing' ? judgment?.cueNegation : undefined;
    const qualificationText = cueNegation === undefined ? unit.text
      : unit.text.slice(0, cueNegation.start) + ' ' + unit.text.slice(cueNegation.end);
    if (QUALIFIED.test(qualificationText)) continue;
    const copy = COPY[ruleId];
    candidates.push({
      id: `${ruleId}:${unit.start}:${unit.end}`, ruleId,
      start: unit.start, end: unit.end, quote: text.slice(unit.start, unit.end),
      title: copy.title, explanation: copy.explanation, prompt: tonePromptFor(ruleId, intent),
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
