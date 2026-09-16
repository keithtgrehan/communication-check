import { activeText } from './active-text';
import { analyzeClause, hasExplicitDeadline, isRequestedAction, linkedDependency } from './grammar';
import { agreementConcern } from './agreement';
import { commitmentConcern } from './commitment';
import { MAX_DRAFT_LENGTH, MAX_FINDINGS, type CheckResult, type Finding, type RuleId } from './types';

interface Span { start: number; end: number; text: string; order?: 'first' | 'next' | 'last' | null }
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
    prompt: 'Which task should happen first, and do any other tasks depend on it?',
  },
  'agreement-wording': {
    title: 'Confirm what was agreed',
    explanation: 'Agreement wording appears alongside an explicit proposal or a decision that is still pending.',
    prompt: 'What is agreed, who still needs to decide, and does the next step depend on that decision?',
  },
  'commitment-confirmation': {
    title: 'Confirm this commitment',
    explanation: 'This wording makes a definite delivery, pricing, or functionality commitment.',
    prompt: 'Has the responsible person or team confirmed this commitment, including any conditions or dependencies?',
  },
};

// This is presentation priority, not a confidence or accuracy score.
const PRIORITY: RuleId[] = [
  'agreement-wording', 'commitment-confirmation', 'action-owner', 'vague-timing', 'competing-requests',
];

function span(text: string, start: number, end: number): Span {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start, end, text: text.slice(start, end) };
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

function orderedRequests(sentences: Span[], requests: Span[]): boolean {
  if (requests.some(request => request.order === 'first')) return true;
  if (requests.every(request => /^\s*\d+[.)]\s/.test(request.text))) return true;
  const context = sentences.map(item => item.text).join('\n');
  return /\b(?:in (?:this |the following )?order|in priority order|first (?:step|priority|action)|start with|begin with|for now,? (?:please )?only|first please)\b|\bfirst,(?=\s)/i.test(context)
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
    const clauseParts = clauses(part, text);
    for (let j = 0; j < clauseParts.length; j++) {
      const clause = clauseParts[j];
      const features = analyzeClause(clause.text, clause.start);
      for (const action of features.actions.filter(isRequestedAction)) requests.push({ ...clause, order: action.order });
      if (features.ownerUnclear) {
        candidates.push({ ruleId: 'action-owner', span: clause });
      }
      const neighbourParts = [clauseParts[j - 1] ?? parts[i - 1], clauseParts[j + 1] ?? parts[i + 1]].filter((item): item is Span => !!item);
      const neighbours = neighbourParts.map(item => analyzeClause(item.text, item.start));
      const refinedDeadline = /\bbut\s+no later than\b/i.test(part.text) && hasExplicitDeadline(part.text);
      if (features.vagueTimes.length && !features.hasDeadline && !refinedDeadline
        && linkedDependency(features, neighbours) && !/\b(?:no need|not needed|don['’]t|do not)\b/i.test(clause.text)) {
        candidates.push({ ruleId: 'vague-timing', span: features.vagueTimes[0] });
      }
      if (commitmentConcern(clause.text)) candidates.push({ ruleId: 'commitment-confirmation', span: clause });
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
