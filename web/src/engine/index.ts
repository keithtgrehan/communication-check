import { MAX_DRAFT_LENGTH, MAX_FINDINGS, type CheckResult, type Finding, type RuleId } from './types';

interface Span { start: number; end: number; text: string }
interface Candidate { ruleId: RuleId; span: Span }

const COPY: Record<RuleId, Pick<Finding, 'title' | 'explanation' | 'prompt'>> = {
  'action-owner': {
    title: 'Make the next step clear',
    explanation: 'This next step leaves the action or the person responsible unclear.',
    prompt: 'Name the person or team responsible and the specific action they should take.',
  },
  'vague-timing': {
    title: 'Clarify the timing',
    explanation: 'A requested or dependent next step uses timing that could mean different things to each person.',
    prompt: 'Would a specific date or an agreed trigger help the recipient know when to act?',
  },
  'competing-requests': {
    title: 'Choose a first action',
    explanation: 'Several requests appear together without an explicit first step.',
    prompt: 'Make the first action clear, or put these requests in priority order.',
  },
  'agreement-wording': {
    title: 'Confirm what was agreed',
    explanation: 'Agreement wording appears alongside an explicit proposal or a decision that is still pending.',
    prompt: 'Confirm whether this is agreed, or make the remaining proposal or approval clear.',
  },
  'commitment-confirmation': {
    title: 'Confirm this commitment',
    explanation: 'This wording makes a definite delivery, pricing, or functionality commitment.',
    prompt: 'Confirm this commitment before sending.',
  },
};

// This is presentation priority, not a confidence or accuracy score.
const PRIORITY: RuleId[] = [
  'agreement-wording', 'commitment-confirmation', 'action-owner', 'vague-timing', 'competing-requests',
];
const ACTION = '(?:send|share|upload|submit|complete|review|confirm|approve|choose|select|provide|schedule|book|sign|return|fill|check|verify|nominate|chase|test|enable|configure|set up|add|invite|assign|finish|update|resolve|handle|take ownership of|take responsibility for|own|take care of|sort out|start)';
const REQUEST = new RegExp(`\\b(?:please\\s+(?:\\w+\\s+){0,2}${ACTION}|(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?${ACTION}|(?:I|we)\\s+need\\s+you\\s+to\\s+${ACTION}|(?:your team|you)\\s+(?:need|needs)\\s+to\\s+${ACTION})\\b`, 'i');
const VAGUE = /\b(?:soon|shortly|asap|as soon as possible|when(?:ever)? you (?:get|have) (?:a|the) (?:chance|moment)|at (?:some|your earliest) (?:point|convenience)|in due course|sometime|at some stage)\b/i;
const DEPENDENCY = /\b(?:so (?:that )?(?:we|you|they|our|your)|before (?:(?:we|you|they)|(?:the|our|your) (?:[\w-]+ ){1,5}) ?can|(?:to|will) unblock|depends? on|dependent on|waiting (?:for|on)|once .{0,80}(?:can|will)|then (?:we|you|they) can|to (?:begin|start|enable|complete|finish) (?:the|our|your))\b/i;
const DEADLINE = /\b(?:by|before|on|no later than)\s+(?:(?:next|this)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d{1,2}(?::\d{2})?(?:\s*(?:am|pm))?\b|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)|\bwithin\s+\d+\s+(?:business\s+)?(?:hours?|days?|weeks?)\b/i;
// Bare action words also name things ("test results", "review notes"). Require
// an explicit object determiner/pronoun; polite requests are handled separately.
const LIST_REQUEST = new RegExp(`^(?:(?:[-*•]|\\d+[.)])\\s+)?(?:and\\s+)?${ACTION}\\s+(?:the|a|an|this|that|these|those|your|our|my|each|all|any|some|us|me|them|it)\\b`, 'i');

function requestedAction(text: string): boolean {
  return (REQUEST.test(text) || LIST_REQUEST.test(text))
    && !/\b(?:do not|don['’]t|no need to|not asking you to)\b/i.test(text);
}

function span(text: string, start: number, end: number): Span {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start, end, text: text.slice(start, end) };
}

/** Mask only recognised history/signature spans, retaining every UTF-16 position. */
function activeText(text: string): { masked: string; excludedSections: number } {
  const lines = [...text.matchAll(/[^\r\n]+/g)];
  const exclusions: Array<[number, number]> = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i];
    const line = match[0].trim();
    const start = match.index;
    if (/^>/.test(line)) {
      exclusions.push([start, start + match[0].length]);
      continue;
    }
    const replyHeader = /^On\s+.{1,250}\bwrote:\s*$/i.test(line)
      || /^[-_]{2,}\s*(?:original|forwarded) message\s*[-_]{2,}$/i.test(line)
      || /^Begin forwarded message:\s*$/i.test(line)
      || (/^From:\s*\S/i.test(line) && lines.slice(i + 1, i + 5).some(next => /^(?:Sent|Date):/i.test(next[0].trim())));
    const signatureDivider = /^--\s*$/.test(match[0]) || /^Sent from my\s+/i.test(line);
    // Conventional valedictions only count if followed by a compact name/contact block.
    const valediction = /^(?:thanks|thank you|best|best regards|kind regards|regards|cheers)[,!]?$/i.test(line);
    const tail = valediction ? lines.slice(i + 1, i + 7).map(next => next[0].trim()) : [];
    const name = tail[0] ?? '';
    const signatureTail = valediction
      && /^[\p{L}][\p{L}' .-]{1,50}$/u.test(name)
      && tail.length <= 5 && tail.join('\n').length <= 250
      && !tail.some(part => /[?!]|\b(?:please|will|should|must|need|guarantee|can you|could you)\b/i.test(part));
    if (replyHeader || signatureDivider || signatureTail) {
      exclusions.push([start, text.length]);
      break;
    }
  }
  let masked = text;
  for (const [start, end] of exclusions) {
    masked = masked.slice(0, start) + masked.slice(start, end).replace(/[^\r\n]/g, ' ') + masked.slice(end);
  }
  return { masked, excludedSections: exclusions.length };
}

/** Sentence punctuation is a boundary only before whitespace/end, so IDs, decimals and URLs survive. */
function sentences(masked: string, original: string): Span[] {
  const result: Span[] = [];
  const paragraphs: Span[] = [];
  let current: Span | undefined;
  for (const line of masked.matchAll(/[^\r\n]+/g)) {
    const part = span(masked, line.index, line.index + line[0].length);
    if (!part.text) {
      if (current) paragraphs.push(current);
      current = undefined;
      continue;
    }
    const boundary = !current || /(?:\r?\n)[ \t]*(?:\r?\n)/.test(masked.slice(current.end, part.start))
      || /^(?:[-*•]|\d+[.)])\s/.test(part.text)
      || /[.!?][”"']?$/.test(current.text)
      || /^(?:hi|hello|dear)\b[^.!?]*,$/i.test(current.text);
    if (boundary) {
      if (current) paragraphs.push(current);
      current = part;
    } else {
      current = span(masked, current!.start, part.end);
    }
  }
  if (current) paragraphs.push(current);
  for (const paragraph of paragraphs) {
    let start = paragraph.start;
    const end = paragraph.end;
    const terminators = [...paragraph.text.matchAll(/[.!?](?:[”"']?)(?=\s|$)/g)];
    for (const mark of terminators) {
      const stop = paragraph.start + mark.index + mark[0].length;
      // Keep common initials/abbreviations attached to the following words.
      const preceding = original.slice(start, stop);
      if (/^\s*\d+\.$/.test(preceding) || /(?:\b(?:Mr|Mrs|Ms|Dr|Prof|e\.g|i\.e)|\b[A-Z])\.$/.test(preceding)) continue;
      const part = span(masked, start, stop);
      if (part.text) result.push({ ...part, text: original.slice(part.start, part.end) });
      start = stop;
    }
    const part = span(masked, start, end);
    if (part.text) result.push({ ...part, text: original.slice(part.start, part.end) });
  }
  return result;
}

function clauses(sentence: Span, text: string): Span[] {
  const result: Span[] = [];
  let start = sentence.start;
  // "Yet" inside "not yet confirmed" is temporal, not a clause boundary.
  for (const mark of sentence.text.matchAll(/;\s*|\s+\b(?:but|however)\b[,\s]+|,\s+yet\b[,\s]+/gi)) {
    const end = sentence.start + mark.index;
    if (end > start) result.push(span(text, start, end));
    start = sentence.start + mark.index + mark[0].length;
  }
  if (start < sentence.end) result.push(span(text, start, sentence.end));
  return result;
}

function ambiguousAction(text: string): boolean {
  const unclearOwner = new RegExp(`\\b(?:someone|somebody|one of us|one of you|whoever)\\s+(?:(?:will|should|needs? to|has to|can|could|must)\\s+)?${ACTION}\\b`, 'i');
  const passive = /\b(?:needs? to be|must be|should be)\s+(?:sent|shared|uploaded|submitted|completed|reviewed|confirmed|approved|assigned|scheduled|configured|updated|resolved|handled|sorted|done)\b/i;
  const agent = text.match(/\bby\s+(you|us|me|our team|your team|the [\w-]+ team|[A-Z][\p{L}'-]+)\b/u);
  const explicitAgent = !!agent && !/^(?:then|tomorrow|today|next|this|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(agent[1]);
  const vagueAction = /\b(?:please|could you|can you|someone should)\s+(?:handle|sort out|take care of)\s+(?:this|that|it|things|the next steps)\s*[.!?]?$/i;
  const collaborativeVagueAction = /\b(?:let['’]s|let us)\s+get\s+.{1,100}\s+(?:sorted|handled|resolved|done)\b/i;
  return unclearOwner.test(text) || ((passive.test(text) || collaborativeVagueAction.test(text)) && !explicitAgent) || vagueAction.test(text);
}

function agreementConcern(sentence: Span, previous: Span | undefined, next: Span | undefined): boolean {
  const agreed = /\b(?:as agreed|we agreed|you agreed|we have agreed|we['’]ve agreed|it is agreed|it['’]s agreed|as confirmed|we confirmed)\b/i;
  const proposalConfirmed = /\b(?:proposed|tentative)\s+(?:[\w-]+\s+){0,5}(?:is|are|has been|have been)\s+(?:now\s+)?confirmed\b/i;
  if (!agreed.test(sentence.text) && !proposalConfirmed.test(sentence.text)) return false;
  if (/\b(?:not agreed|haven['’]t agreed|have not agreed|never agreed|if we agreed|whether we agreed)\b/i.test(sentence.text)) return false;
  if (/\bas agreed,?\s+(?:this|that|it|the proposal|the plan)\s+(?:is|remains)\s+(?:still )?(?:a proposal|tentative|pending)\b/i.test(sentence.text)) return false;
  // A formerly proposed date can now be confirmed. Require an unresolved status,
  // not the word "proposed" alone, to conflict with agreement wording.
  const pending = /\b(?:still (?:a proposal|proposed|tentative|pending|unconfirmed|undecided)|(?:approval|confirmation|decision|sign[- ]off) (?:is |remains? )?(?:still )?pending|(?:haven['’]t|hasn['’]t|have not|has not|not yet) (?:yet )?(?:been )?(?:agreed|approved|confirmed|decided|accepted|given)|(?:only|just) (?:a |our |your |their )?(?:proposal|suggestion)|awaiting (?:your |their |final )?(?:approval|confirmation|sign[- ]off))\b/i;
  if (pending.test(sentence.text)) return true;
  // Require an explicit reference between adjacent statements; do not join unrelated decisions.
  const agreementClause = sentence.text.replace(/^(?:as agreed|as confirmed),?\s+/i, '');
  const previousReference = /^(?:this|that|these|those|it)\s+(?:is|are|was|were|will|would|should|has|have)\b/i.test(agreementClause)
    || /\b(?:agreed (?:to|on)|confirmed)\s+(?:this|that|these|those|it)(?=\s*(?:[.!?]|$))/i.test(agreementClause);
  if (previous && previousReference && pending.test(previous.text)) return true;
  // Link a pronoun subject or the object of an explicit unresolved-approval
  // predicate. An internal "discuss that" or temporal "this week" is unrelated.
  if (!next || /\b(?:another|other|separate|unrelated)\b/i.test(next.text) || !pending.test(next.text)) return false;
  if (/^(?:this|that|these|those|it)\s+(?:is|are|was|were|remains?|still|has|have|needs?)\b/i.test(next.text)) return true;
  const objectReference = next.text.match(/\b(?:haven['’]t|hasn['’]t|have not|has not|not yet)\s+(?:yet\s+)?(?:accepted|approved|confirmed|agreed to|signed off on)\s+(?:this|that|these|those)\b(.*)/i);
  if (!objectReference) return false;
  const remainder = objectReference[1].trim();
  if (/^(?:[.!?]|$|yet\b|so far\b)/i.test(remainder)) return true;
  // A determiner introducing a new noun is not a pronoun backlink. Accept it
  // only when a specific topic word also appears in the agreement statement.
  const objectWords = remainder.split(/[,;.!?]|\b(?:and|but|because|yet)\b/i)[0].toLowerCase().match(/[\p{L}]+/gu) ?? [];
  const generic = new Set(['plan', 'plans', 'proposal', 'proposals', 'decision', 'decisions', 'topic', 'topics', 'change', 'changes', 'option', 'options', 'approach', 'agreed', 'confirmed', 'this', 'that', 'these', 'those', 'your', 'their', 'with', 'from', 'will', 'have', 'been', 'week', 'month', 'year', 'today', 'tomorrow']);
  const agreementWords = new Set(sentence.text.toLowerCase().match(/[\p{L}]+/gu));
  return objectWords.some(word => word.length > 3 && !generic.has(word) && agreementWords.has(word));
}

function commitment(text: string): boolean {
  if (/[?]\s*$/.test(text) || /^(?:(?:[-*•]|\d+[.)])\s*)?(?:can|could|would|will|does|do|is|are|please confirm|please check)\b/i.test(text)) return false;
  const qualified = /\b(?:if|unless|subject to|pending|provided (?:that|we)|assuming|depending on|tentative(?:ly)?|provisional(?:ly)?|not (?:yet )?confirmed|needs? (?:further )?(?:approval|confirmation|testing)|aim(?:ing)? to|hope to|plan to|expect to|intend to|trying to|target(?:ing)?|might|could|should|cannot|can['’]t|won['’]t|will not|do not|don['’]t|not able to|not guarantee|no guarantee|not promising)\b/i;
  const uncertainty = /\b(?:not (?:yet )?(?:sure|certain)|uncertain|unconfirmed|(?:has|have|had) not (?:yet )?been (?:confirmed|verified|approved)|(?:hasn['’]t|haven['’]t|hadn['’]t) (?:yet )?been (?:confirmed|verified|approved))\b/i;
  if (qualified.test(text) || uncertainty.test(text) || /\bmay\s+(?:not\s+)?(?:be|support|deliver|ship|cost|include|work|have|need|provide|allow|handle|change)\b/i.test(text)) return false;
  // An explicit request to validate the promise already does the review we would suggest.
  if (/\b(?:please|can you|could you|need to|must|let['’]s)\s+(?:confirm|verify|check)\b/i.test(text)) return false;
  if (/\b(?:will|shall|['’]ll)\s+(?:discuss|review|explain|check|confirm|ask about|talk about)\b/i.test(text)) return false;
  if (/\b(?:will|shall|['’]ll)\s+(?:send|share|provide)\b/i.test(text)
    && /\b(?:notes|agenda|instructions|guide|documentation|quote|proposal|cost breakdown|pricing details)\b/i.test(text)) return false;
  // Running a validation/check is ordinary follow-up work, not a functionality promise.
  if (/\b(?:I|we|your team|our team)(?:['’]ll|\s+will)\s+(?:run|perform)\s+(?:(?:the|an?|our|your)\s+)?(?:[\w-]+\s+){0,3}(?:validation|checks?|tests?)\b/i.test(text)) return false;
  const definite = /\b(?:will|shall|guarantee(?:s|d)?|promise|commit(?:ted)? to)\b|\b(?:we|I|it|they|you)['’]ll\b/i.test(text);
  const delivery = /\b(?:deliver|ship|release|build|launch|deploy|implement|finish|complete|go live|be (?:ready|available|live))\b/i;
  const product = /\b(?:(?:feature|connector|integration|export|import|migration|dashboard|api|platform|product|app|application|release|rollout|deployment|implementation|configuration|system|tool|update|bug|workflow|portal|module|automation)s?|sso|scim|saml|software|custom|fix(?:es)?|patch(?:es)?|reporting|capabilit(?:y|ies)|functionality)\b/i;
  const price = /\b(?:pric(?:e|es|ing)|cost|fee|fees|charg(?:e|es)|discount|free|rate|subscription|refund|credit)\b/i;
  const priceAssurance = /\b(?:remain|stay|fixed|locked|never|no (?:extra|additional)|at no|free|waive|refund|discount|cost|charge|pay|increase|reduce|include)\b|[$€£]\s*\d/i;
  const capability = /\b(?:support|handle|work with|integrate with|sync|synchroni[sz]e|process|automate|eliminate|prevent|ensure|include|provide|enable|allow|run|meet)\b/i;
  if (definite && delivery.test(text) && product.test(text)) return true;
  if (definite && price.test(text) && priceAssurance.test(text)) return true;
  if (definite && product.test(text) && capability.test(text)) return true;
  return (price.test(text) && /\b(?:is|are)\s+(?:permanently |fully )?(?:fixed|locked|guaranteed|free)\b|\bno additional (?:cost|charge|fee)s?\b/i.test(text))
    || (product.test(text) && /\b(?:guaranteed to|guarantee(?:s)? that)\b/i.test(text));
}

function orderedRequests(sentences: Span[], requests: Span[]): boolean {
  if (requests.every(request => /^\s*\d+[.)]\s/.test(request.text))) return true;
  const context = sentences.map(item => item.text).join('\n');
  return /\b(?:in (?:this |the following )?order|in priority order|first (?:step|priority|action)|start with|begin with|for now,? (?:please )?only|first,|first please)\b/i.test(context)
    || /\b(?:afterwards|once (?:that|those|these) (?:is|are)|then,? please)\b/i.test(context);
}

export function checkDraft(text: string): CheckResult {
  if (text.length > MAX_DRAFT_LENGTH) throw new RangeError(`Draft exceeds the ${MAX_DRAFT_LENGTH.toLocaleString('en-US')}-character limit.`);
  if (!text.trim()) return { findings: [], checkedCharacters: text.length, excludedSections: 0 };
  const { masked, excludedSections } = activeText(text);
  const parts = sentences(masked, text);
  const candidates: Candidate[] = [];
  const requests: Span[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (agreementConcern(part, parts[i - 1], parts[i + 1])) candidates.push({ ruleId: 'agreement-wording', span: part });
    for (const clause of clauses(part, text)) {
      if (requestedAction(clause.text)) {
        requests.push(clause);
        const coordinated = new RegExp(`(?:,\\s*(?:and\\s+)?|\\band\\s+)${ACTION}\\b`, 'gi');
        for (const _ of clause.text.matchAll(coordinated)) requests.push(clause);
      }
      if (ambiguousAction(clause.text) && !/\b(?:not|never|no need|don['’]t)\b/i.test(clause.text)) {
        candidates.push({ ruleId: 'action-owner', span: clause });
      }
      const refinedDeadline = /\bbut\s+no later than\b/i.test(part.text) && DEADLINE.test(part.text);
      if (VAGUE.test(clause.text) && !DEADLINE.test(clause.text) && !refinedDeadline
        && (requestedAction(clause.text) || DEPENDENCY.test(clause.text)) && !/\b(?:no need|not needed|don['’]t|do not)\b/i.test(clause.text)) {
        const match = clause.text.match(VAGUE)!;
        candidates.push({ ruleId: 'vague-timing', span: span(text, clause.start + match.index!, clause.start + match.index! + match[0].length) });
      }
      if (commitment(clause.text)) candidates.push({ ruleId: 'commitment-confirmation', span: clause });
    }
  }
  if (requests.length >= 3 && !orderedRequests(parts, requests)) {
    // Quote a contiguous group of three so the review has concrete evidence.
    // Excluded history is never swept into this evidence range.
    const first = requests[0];
    const third = requests[2];
    if (text.slice(first.start, third.end) === masked.slice(first.start, third.end)) {
      candidates.push({ ruleId: 'competing-requests', span: span(text, first.start, third.end) });
    }
  }
  candidates.sort((a, b) => PRIORITY.indexOf(a.ruleId) - PRIORITY.indexOf(b.ruleId) || a.span.start - b.span.start || a.span.end - b.span.end);
  const selected: Candidate[] = [];
  for (const candidate of candidates) {
    // One invitation per family; agreement already reviews a promise in the same sentence.
    if (selected.some(item => item.ruleId === candidate.ruleId
      || (item.ruleId === 'agreement-wording' && candidate.ruleId === 'commitment-confirmation'
        && item.span.start <= candidate.span.start && item.span.end >= candidate.span.end))) continue;
    selected.push(candidate);
    if (selected.length === MAX_FINDINGS) break;
  }
  return {
    findings: selected.map(({ ruleId, span: evidence }) => ({
      id: `${ruleId}:${evidence.start}:${evidence.end}`,
      ruleId, ...COPY[ruleId], start: evidence.start, end: evidence.end, quote: evidence.text,
    })),
    checkedCharacters: text.length,
    excludedSections,
  };
}
