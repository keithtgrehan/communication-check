import { analyzeClause, hasExplicitDeadline, hasUnresolvedApproval, linkedDependency, matchingReference, standaloneUnresolvedApproval } from './grammar';
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

function agreementConcern(sentence: Span, previous: Span | undefined, next: Span | undefined): boolean {
  const agreed = /\b(?:as agreed|we agreed|you agreed|we have agreed|we['’]ve agreed|it is agreed|it['’]s agreed|as confirmed|we confirmed)\b/i;
  const proposalStatus = /\b(?:proposed|tentative)\s+(?:[\w-]+\s+){0,5}(?:is|are|has been|have been)\s+(?:now\s+)?(?:agreed|confirmed|finali[sz]ed)\b/i;
  if (!agreed.test(sentence.text) && !proposalStatus.test(sentence.text)) return false;
  if (/\b(?:not agreed|haven['’]t agreed|have not agreed|never agreed|if we agreed|whether we agreed)\b/i.test(sentence.text)) return false;
  if (/\bas agreed,?\s+(?:this|that|it|the proposal|the plan)\s+(?:is|remains)\s+(?:still )?(?:a proposal|tentative|pending)\b/i.test(sentence.text)) return false;
  // A formerly proposed date can now be confirmed. Require an unresolved status,
  // not the word "proposed" alone, to conflict with agreement wording.

  if (hasUnresolvedApproval(sentence.text)) {
    const status = sentence.text.match(proposalStatus);
    if (!status || agreed.test(sentence.text)) return true;
    // A resolved proposal conflicts only with its own explicitly unresolved
    // approval. A separate budget/other decision is not evidence against it.
    const rest = sentence.text.slice(status.index! + status[0].length).replace(/^\s*,?\s*(?:(?:even though|although|though|but|yet|while|and)\s+)?/i, '');

    const unresolvedReference = /^(?:you|we|they)\s+(?:have not|haven['’]t)\s+(?:yet\s+)?(?:approved|accepted|confirmed)\s+(?:it|this|that)(?:\s+yet)?\s*[.!?]?$/i;
    return standaloneUnresolvedApproval(rest) || unresolvedReference.test(rest);
  }
  // Require an explicit reference between adjacent statements; do not join unrelated decisions.
  const agreementClause = sentence.text.replace(/^(?:as agreed|as confirmed),?\s+/i, '');
  const previousReference = /^(?:this|that|these|those|it)\s+(?:is|are|was|were|will|would|should|has|have)\b/i.test(agreementClause)
    || /\b(?:agreed (?:to|on)|confirmed)\s+(?:this|that|these|those|it)(?=\s*(?:[.!?]|$))/i.test(agreementClause);
  if (previous && previousReference && hasUnresolvedApproval(previous.text)) return true;
  // Link a pronoun subject or the object of an explicit unresolved-approval
  // predicate. An internal "discuss that" or temporal "this week" is unrelated.
  if (!next || /\b(?:another|other|separate|unrelated)\b/i.test(next.text) || !hasUnresolvedApproval(next.text)) return false;
  if (/^(?:this|that|these|those|it)\s+(?:is|are|was|were|remains?|still|has|have|needs?)\b/i.test(next.text)) return true;
  // An explicitly named permission can refer to the immediately preceding
  // access privilege even when the wording uses an action rather than a noun.
  const permissionReference = /^(?:this|that)\s+(?:permission|access right|privilege|access policy|visibility policy)\s+(?:is|was|remains|has|still)\b/i.test(next.text);
  const accessPrivilege = /\b(?:guests?|users?|members?|admins?|administrators?|customers?|you|they|your team)\s+(?:can|may|will be able to|are able to|are allowed to|will be allowed to)\s+(?:view|read|edit|access|delete|create|download|upload|invite|share)\b/i.test(sentence.text);
  const accessVisibility = /\b(?:will\s+)?(?:remain|be)\s+(?:visible|accessible)\s+to\s+(?:(?:your|our|their|the|all)\s+)?(?:[\w-]+\s+){0,2}(?:users?|guests?|members?|admins?|administrators?|customers?|you)\b/i.test(sentence.text);
  if (permissionReference && (accessPrivilege || accessVisibility)) return true;
  if (matchingReference(sentence.text, next.text)) return true;
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
  const delivery = /\b(?:deliver|ship|release|build|launch|deploy|implement|finish|complete|go live|be (?:ready|available|live|delivered|shipped|released|built|launched|deployed|implemented|completed))\b/i;
  const product = /\b(?:(?:feature|connector|integration|export|import|migration|dashboard|api|platform|product|app|application|release|rollout|deployment|implementation|configuration|system|tool|update|bug|workflow|portal|module|automation)s?|sso|scim|saml|software|custom|fix(?:es)?|patch(?:es)?|reporting|capabilit(?:y|ies)|functionality)\b/i;
  const price = /\b(?:pric(?:e|es|ing)|cost|fee|fees|charg(?:e|es)|discount|free|rate|subscription|refund|credit)\b/i;
  // A cost/discount topic is not an assurance. Require a financial predicate,
  // promised price state/benefit, or an explicit guarantee of a price outcome.
  const priceOutcome = /\b(?:fixed|locked|unchanged|free|refund|discount|credit|no (?:extra|additional)|at no)\b|[$€£]\s*\d|\d\s*%/i;
  const pricePredicate = /\b(?:will|shall|['’]ll)\s+(?:(?:always|never|definitely)\s+)?(?:cost|charge|pay|waive|refund|discount|increase|reduce|fix|lock)\b|\b(?:will|shall|['’]ll)\s+(?:remain|stay|be)\s+(?:(?:permanently|fully)\s+)?(?:fixed|locked|unchanged|free|no (?:extra|additional)|[$€£]\s*\d)/i;
  const priceAssurance = pricePredicate.test(text) || (priceOutcome.test(text)
    && /\b(?:guarantee(?:s|d)?|promise)\b|\b(?:will|shall|['’]ll)\s+(?:offer|grant|apply|give|provide|include|honou?r)\b/i.test(text));
  const capability = /\b(?:support|handle|work with|integrate with|sync|synchroni[sz]e|process|automate|eliminate|prevent|ensure|include|provide|enable|allow|run|meet)\b/i;
  // Strong universal assurances require an affirmative technical component
  // subject, not merely the absence of a recognised human role.
  const universal = text.match(/\b(?:the|our|your|this|that)\s+((?:[\w-]+\s+){0,4}[\w-]+)\s+will\s+(?:(?:always|definitely|automatically)\s+)?(read|parse|process|recogni[sz]e|support|handle|accept|convert)\s+(?:every|all|any)\b/i);
  const technicalSubject = /(?:\b(?:scanner|decoder|encoder|parser|importer|exporter|processor|converter|renderer|validator|indexer|analy[sz]er|widget|pipeline|engine|software|system|component|module|application|app|tool|connector|integration)s?|\b(?:form|query|workflow|report|dashboard|page|survey|automation)[ -]builders?)$/i;
  const technicalObjects = /\b(?:formats?|files?|records?|inputs?|labels?|fields?|documents?|data|requests?)\b/i;
  const technicalReading = !universal || universal[2].toLowerCase() !== 'read' || /\b(?:formats?|encodings?|protocols?|schemas?)\b/i.test(text);
  const absoluteAssurance = /\b(?:without (?:fail|(?:any )?errors?)|perfectly|guaranteed)\b|100\s*%/i;
  // Capability claims need a product as the subject. A product word modifying
  // a human role ("integration specialist") does not make that person's work
  // a product capability. Delivery and pricing commitments remain independent.
  const isProductSubject = (phrase: string): boolean => {
    // Find the head of a bounded noun phrase: versions and prepositional
    // complements modify the product, whereas "specialist" is a human head.
    let core = phrase.trim().replace(/\s+(?:is|are|was|were)$/i, '');
    core = core.split(/[,;]|\bthat\s+/i).at(-1)!.trim();
    core = core.split(/\s+(?:for|with|of|in|on)\s+/i)[0];
    core = core.replace(/\s+(?:v(?:ersion)?\s*)?\d+(?:\.\d+)*(?:[-\w]*)?$/i, '');
    if (core.split(/\s+/).length > 8) return false;
    const head = core.match(/[\w-]+$/)?.[0];
    const offering = /^(?:package|plan|subscription|tier|edition|bundle)s?$/i;
    const customReport = /\bcustom\s+(?:[\w-]+\s+){0,3}reports?$/i.test(core);
    return !!head && (product.test(head) || technicalSubject.test(core) || customReport || (offering.test(head) && product.test(text)));
  };
  const directSubject = [...text.matchAll(/\b(?:will|shall|guarantee(?:s|d)?|promises?)\b|['’]ll\b/gi)]
    .some(marker => isProductSubject(text.slice(0, marker.index)));
  const guaranteedComplement = text.match(/\bguarantee(?:s|d)?\s+that\s+((?:[\w.-]+\s+){0,11}?[\w.-]+)\s+(?=(?:can|will|shall|supports?|handles?|works?|integrates?|syncs?|process(?:es)?|automates?|includes?|provides?|enables?|allows?|runs?|meets?)\b)/i);
  const productSubject = directSubject || (!!guaranteedComplement && isProductSubject(guaranteedComplement[1]));
  const activeProductDelivery = [...text.matchAll(/\b(?:deliver|ship|release|build|launch|deploy|implement|finish|complete)\s+([^;.!?]+)/gi)]
    .some(match => isProductSubject(match[1].split(/\s+(?:by|before|after|within|on)\s+|,|\band\b/i)[0]));

  if (definite && universal && technicalSubject.test(universal[1]) && technicalObjects.test(text) && technicalReading && absoluteAssurance.test(text)) return true;
  if (definite && delivery.test(text) && (productSubject || activeProductDelivery)) return true;
  if (definite && price.test(text) && priceAssurance) return true;
  if (definite && productSubject && capability.test(text)) return true;
  return (price.test(text) && /\b(?:is|are)\s+(?:permanently |fully )?(?:fixed|locked|guaranteed|free)\b|\bno additional (?:cost|charge|fee)s?\b/i.test(text))
    || (productSubject && /\b(?:guaranteed to|guarantee(?:s)? that)\b/i.test(text));
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
    const clauseParts = clauses(part, text);
    for (let j = 0; j < clauseParts.length; j++) {
      const clause = clauseParts[j];
      const features = analyzeClause(clause.text, clause.start);
      for (let count = 0; count < features.requestCount; count++) requests.push(clause);
      if (features.ownerUnclear && !/\b(?:not|never|no need|don['’]t)\b/i.test(clause.text)) {
        candidates.push({ ruleId: 'action-owner', span: clause });
      }
      const neighbourParts = [clauseParts[j - 1] ?? parts[i - 1], clauseParts[j + 1] ?? parts[i + 1]].filter((item): item is Span => !!item);
      const neighbours = neighbourParts.map(item => analyzeClause(item.text, item.start));
      const refinedDeadline = /\bbut\s+no later than\b/i.test(part.text) && hasExplicitDeadline(part.text);
      if (features.vagueTimes.length && !features.hasDeadline && !refinedDeadline
        && linkedDependency(features, neighbours) && !/\b(?:no need|not needed|don['’]t|do not)\b/i.test(clause.text)) {
        candidates.push({ ruleId: 'vague-timing', span: features.vagueTimes[0] });
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
