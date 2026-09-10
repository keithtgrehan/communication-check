import { tokenize, type OriginalSpan } from './grammar';

/** Settled status and approval state are separate assertions about a proposition. */
interface SettlementFrame { proposition: string; start: number; process: boolean }
interface ApprovalFrame { text: string; start: number; end: number; state: 'pending'; reference: string }
const APPROVAL = '(?:approval|confirmation|authori[sz]ation|consent|acceptance|sign[- ]off)';
const APPROVED = '(?:approved|confirmed|authori[sz]ed|accepted|agreed|decided|given)';
const TOPIC_STOP = new Set(['this', 'that', 'these', 'those', 'your', 'their', 'with', 'from', 'will', 'have', 'been', 'still', 'only', 'just', 'now', 'the', 'our', 'you', 'they', 'we', 'not', 'yet', 'is', 'are', 'be', 'it', 'its', 'and', 'but', 'although', 'though', 'despite', 'approval', 'confirmation', 'authorisation', 'authorization', 'consent', 'acceptance', 'pending', 'outstanding', 'proposed', 'suggested', 'recommended', 'confirmed', 'agreed', 'final', 'finalised', 'finalized', 'settled', 'proposal', 'decision', 'topic', 'change', 'option', 'week', 'month', 'year', 'today', 'tomorrow']);
const words = (text: string) => tokenize(text).filter(token => token.kind === 'word').map(token => token.normal);

function approvalFrames(text: string): ApprovalFrame[] {
  const patterns = [
    new RegExp(`\\b(?:${APPROVAL}|decision)(?:\\s+(?:for|of|on)\\s+(?:this|that|the|your)\\s+[\\w-]+)?\\s+(?:(?:is|are|being|remains?|still)\\s+)*(?:pending|outstanding)\\b`, 'gi'),
    new RegExp(`\\b(?:have not|has not|haven['’]t|hasn['’]t|not yet)\\s+(?:yet\\s+)?(?:been\\s+)?${APPROVED}\\b`, 'gi'),
    /\b(?:have|has)\s+(?:still\s+)?yet\s+to\s+(?:approve|confirm|authori[sz]e|accept|agree|sign\s+off)\b/gi,
    new RegExp(`\\b(?:have|has)\\s+(?:still\\s+)?yet\\s+to\\s+receive\\s+(?:your |our |their |final )?${APPROVAL}\\b`, 'gi'),
    /\b(?:have not|has not|haven['’]t|hasn['’]t)\s+(?:yet\s+)?signed\s+(?:it\s+|this\s+|that\s+)?off\b/gi,
    new RegExp(`\\b(?:awaits?|awaiting|waiting for|needs?|requires?)\\s+(?:your |our |their |final )?${APPROVAL}\\b`, 'gi'),
    /\b(?:still\s+(?:a proposal|proposed|tentative|pending|unconfirmed|undecided)|(?:only|just)\s+(?:a |our |your |their )?(?:proposal|suggestion)|(?:remains?|is)\s+(?:an?\s+)?unapproved\s+(?:proposal|suggestion|arrangement))\b/gi,
    /\b(?:described|describe)\s+(?:this|that)\s+arrangement\s+as\s+tentative\b/gi,
  ];
  return patterns.flatMap(pattern => [...text.matchAll(pattern)].map(match => {
    // Preserve the whole local proposition around a status, including explicit
    // objects and possessors that distinguish it from a neighbouring decision.
    const before = text.slice(0, match.index);
    const boundary = [...before.matchAll(/;|,\s*(?:(?:even though|although|though|but|yet|while|despite|and)\s+)?|\b(?:although|though|but|despite)\s+/gi)].at(-1);
    const start = boundary ? boundary.index + boundary[0].length : 0;
    return { text: match[0], start: match.index, end: match.index + match[0].length, state: 'pending' as const, reference: text.slice(start) };
  }));
}

function propositionText(text: string): string {
  // The approval qualification cannot supply the entity against which its
  // own reference is checked. Keep the asserted proposition on its own side.
  return text.split(/;|,\s*(?:(?:even though|although|though|but|yet|while|despite)\b)|\b(?:although|though|but|despite)\s+/i)[0].trim();
}

function settlements(text: string): SettlementFrame[] {
  const frames: SettlementFrame[] = [];
  const opening = /\b(?:as (?:agreed|confirmed)|(?:we|you|they)\s+(?:(?:have|had)\s+)?(?:agreed|confirmed|settled on)|we['’]ve agreed|it(?: is|['’]s) agreed)\b/gi;
  for (const match of text.matchAll(opening)) {
    if (/\b(?:not|never|haven['’]t|whether|if)\s*(?:\w+\s+)?$/i.test(text.slice(0, match.index))) continue;
    const body = text.slice(match.index + match[0].length).replace(/^[,\s]+|^(?:that|on|to)\s+/gi, '');
    if (/^(?:this|that|it|the proposal|the plan)\s+(?:is|remains)\s+(?:still\s+)?(?:a proposal|tentative|pending)\b/i.test(body)) continue;
    const process = new RegExp(`^((?:[\\w-]+\\s+){1,7}?)(?:still\\s+)?(?:needs?|requires?)\\s+(?:your |our |their |final )?${APPROVAL}\\b`, 'i').exec(body);
    frames.push({ proposition: propositionText(body), start: match.index, process: !!process && !/\b(?:will|shall|can|is|are|was|were|has|have)\b/i.test(process[1]) });
  }
  // A copular/perfect settled state attaches to its subject, including a
  // relative proposal clause and modifiers between the subject and predicate.
  for (const match of text.matchAll(/\b(?:is|are|has been|have been)\s+(?:now\s+)?(?:confirmed|agreed|final|finali[sz]ed|settled)\b|\bas\s+(?:our|the|your)\s+agreed\s+[\w-]+(?:\s+[\w-]+){0,2}/gi)) {
    const before = text.slice(0, match.index);
    const boundary = [...before.matchAll(/;|,\s*|\band\s+(?=the|your|our|this|that)/gi)].at(-1);
    const start = boundary ? boundary.index + boundary[0].length : 0;
    const proposition = propositionText(text.slice(start));
    if (/\b(?:not|never|no final|whether|if)\b/i.test(text.slice(start, match.index))) continue;
    frames.push({ proposition, start, process: false });
  }
  return frames;
}

function eventConcepts(text: string): Set<string> {
  const concepts = new Set<string>();
  if (/\b(?:will\s+)?(?:be|remain)\s+(?:visible|accessible)\s+to\b|\bmake\s+[^.!?;]{1,100}\s+(?:visible|accessible)\s+to\b|\b(?:can|may|will be able to|are able to|are allowed to|will be allowed to)\s+(?:view|read|edit|access|delete|create|download|upload|invite|share)\b/i.test(text)) concepts.add('access');
  if (/\b(?:will|shall|can)\s+(?:be\s+)?(?:shared|share|distributed|distribute|receive|sent|send)\b/i.test(text)) concepts.add('distribution');
  if (/\bwill\s+(?:enter\s+|(?:be\s+)?(?:routed|sent|placed|assigned)\s+(?:to|into)\s+)(?:(?:the|a|an|your|our)\s+)?(?:[\w-]+\s+){0,4}(?:queue|workflow|channel|group|stage|pipeline)\b/i.test(text)) concepts.add('routing');
  return concepts;
}

function explicitReference(proposition: string, reference: string): boolean {
  if (/\b(?:another|other|separate|unrelated)\b/i.test(reference)) return false;
  // Subject pronouns and standalone approval objects are direct backlinks;
  // internal determiners, time expressions and newly named objects are not.
  if (/^(?:this|that|these|those|it)\s+(?:is|are|was|were|remains?|still|has|have|needs?|awaits?)\b/i.test(reference)) return true;
  if (/\b(?:approved|confirmed|authori[sz]ed|authori[sz]e|accepted|accept|approve|confirm|agreed to|signed off on|signed)\s+(?:it|this|that|these|those)(?=\s*(?:[.!?]|$|yet\b|so far\b|off\b))/i.test(reference)) return true;
  const described = /\bdescribed\s+(?:this|that)\s+arrangement\s+as\s+tentative/i.test(reference);
  if (described && /\bwill\b/i.test(proposition)) return true;
  const concepts = eventConcepts(proposition);
  const named = reference.match(/^(?:this|that)\s+((?:[\w-]+\s+){0,2}?[\w-]+)\s+(?:is|are|was|were|remains?|still|has|have|needs?|requires?)\b/i);
  if (named) {
    if (/^(?:permission|privilege|access right|access policy|visibility (?:policy|arrangement))$/i.test(named[1]) && concepts.has('access')) return true;
    if (/^(?:sharing|distribution)\s+(?:arrangement|plan|policy)$/i.test(named[1]) && concepts.has('distribution')) return true;
    if (/^routing\s+(?:arrangement|plan|policy)$/i.test(named[1]) && concepts.has('routing')) return true;
    if (/\b(?:sharing|distribution|routing|visibility|permission|privilege|access)\b/i.test(named[1])) return false;
  }
  const explicitTopic = reference.match(/(?:\b(?:this|that|these|those)\s+)([\w-]+(?:\s+[\w-]+){0,3}?)(?=\s*(?:[.!?]|$|yet\b|is\b|are\b|remains?\b|still\b|has\b|have\b))/i);
  if (!explicitTopic) return false;
  const declared = new Set(words(proposition));
  const topics = words(explicitTopic[1]).filter(word => !TOPIC_STOP.has(word));
  // Generic topics need to be actually declared, not inferred from a routine action.
  return topics.some(word => word.length > 3 && declared.has(word));
}

function sameProposition(frame: SettlementFrame, approval: ApprovalFrame): boolean {
  const reference = approval.reference.trim();
  if (explicitReference(frame.proposition, reference)) return true;
  if (new RegExp(`^(?:(?:your|our|their|the)\\s+)?${APPROVAL}\\s+(?:of|for|on)\\s+(?:this|that)\\s+(?:arrangement|approach|plan|proposal)\\b`, 'i').test(reference)) return true;
  // A possessive/generic approval qualification with no alternative object
  // refers to the immediately preceding settled proposition in this sentence.
  const direct = new RegExp(`^(?:(?:your|our|their|its|the|final)\\s+)?${APPROVAL}\\s+(?:(?:is|are|being|remains?|still)\\s+)*(?:pending|outstanding)\\s*[.!?]?$`, 'i');
  if (direct.test(reference)) return true;
  return false;
}

export function agreementConcern(sentence: OriginalSpan, previous?: OriginalSpan, next?: OriginalSpan): boolean {
  const frames = settlements(sentence.text).filter(frame => !frame.process);
  if (!frames.length) return false;
  const localApproval = approvalFrames(sentence.text);
  if (frames.some(frame => localApproval.some(approval => approval.start >= frame.start && sameProposition(frame, approval)))) return true;
  if (next && approvalFrames(next.text).length && frames.some(frame => explicitReference(frame.proposition, next.text))) return true;
  if (previous && approvalFrames(previous.text).length) {
    return frames.some(frame => /^(?:this|that|these|those|it)\s+(?:is|are|was|were|will|would|should|has|have)\b/i.test(frame.proposition)
      || /^(?:this|that|these|those|it)\s*[.!?]?$/i.test(frame.proposition));
  }
  return false;
}
