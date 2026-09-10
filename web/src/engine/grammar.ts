/** Internal deterministic grammar features. Source text and UTF-16 offsets are never rewritten. */
export interface OriginalSpan { start: number; end: number; text: string }
export interface GrammarToken extends OriginalSpan { normal: string; lemma: string; kind: 'word' | 'punctuation' }
export interface ActionFrame {
  kind: 'request' | 'delegated-task' | 'owner-vacancy' | 'passive-task' | 'unassigned-task';
  subject: OriginalSpan | null;
  predicate: OriginalSpan;
  object: OriginalSpan;
  owner: 'recipient' | 'unspecified' | 'vacant';
  modality: 'requested' | 'required';
  negated: boolean;
  qualified: boolean;
  assertion: 'asserted' | 'exploratory';
}
export interface ClauseFeatures {
  span: OriginalSpan;
  tokens: GrammarToken[];
  actions: ActionFrame[];
  requestCount: number;
  ownerUnclear: boolean;
  vagueTimes: OriginalSpan[];
  hasDeadline: boolean;
  hasDependency: boolean;
  referenceDependency: boolean;
}

const ACTION = '(?:send|share|upload|submit|complete|review|confirm|approve|choose|select|provide|arrange|organi[sz]e|schedule|book|sign|return|fill|check|verify|nominate|chase|test|enable|configure|set up|add|invite|assign|finish|update|resolve|handle|take ownership of|take responsibility for|own|take care of|sort out|start)';
// Reuse the action vocabulary for responsibility-for gerunds instead of
// inventing a separate list of task nouns or matching arbitrary prose.
const ACTION_GERUND = '(?:' + ACTION.slice(3, -1).split('|').map(action => action.replace(/^\S+/, verb => {
  if (verb === 'submit') return 'submitting';
  if (verb === 'set') return 'setting';
  return (verb.endsWith('e') ? verb.slice(0, -1) : verb) + 'ing';
})).join('|') + ')';
const REQUEST = new RegExp(`\\b(?:please\\s+(?:\\w+\\s+){0,2}${ACTION}|(?:can|could|would|will)\\s+you\\s+(?:please\\s+)?${ACTION}|(?:I|we)\\s+need\\s+you\\s+to\\s+${ACTION}|(?:your team|you)\\s+(?:need|needs)\\s+to\\s+${ACTION})\\b`, 'i');
// Indefinite amounts and temporal units are separate from exact numeric durations.
const INDEFINITE_DURATION = /\b(?:in|within)\s+(?:a\s+(?:(?:little|short)\s+)?(?:bit|while|moment)|(?:a\s+)?(?:few|couple of|several)\s+(?:minutes?|hours?|days?|weeks?))\b(?=\s*(?:[.,;!?]|$|so\b|before\b|to\b))/i;
const VAGUE = /\b(?:soon|shortly|asap|later|in (?:the )?(?:near|foreseeable|not too distant) future|as soon as possible|when(?:ever)? you can(?=\s*(?:[.,;!?]|$|\bso\b|\bto\b))|when(?:ever)? you (?:get|have) (?:a|the) (?:chance|moment)|at (?:some|your earliest) (?:point|convenience)|in due course|sometime|at some stage)\b/i;
const DEPENDENCY = /\b(?:so (?:that )?(?:(?:I|we|you|they|our|your)\b|(?:the|this|that|a|an) (?:[\w-]+ ){1,6}(?:can|will)\b)|before (?:(?:I|we|you|they)|(?:the|our|your) (?:[\w-]+ ){1,5}) ?can|(?:to|will) unblock|depends? on|dependent on|waiting (?:for|on)|once .{0,80}(?:can|will)|then (?:I|we|you|they) can|to (?:begin|start|enable|complete|finish) (?:the|our|your))\b/i;
const DEADLINE = /\b(?:by|before|on|no later than)\s+(?:(?:next|this)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d{1,2}(?::\d{2})?(?:\s*(?:am|pm))?\b|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)|\bwithin\s+\d+\s+(?:business\s+)?(?:hours?|days?|weeks?)\b/i;
// Bare action words also name things ("test results", "review notes"). Require
// an explicit object determiner/pronoun; polite requests are handled separately.
const LIST_REQUEST = new RegExp(`^(?:(?:[-*•]|\\d+[.)])\\s+)?(?:and\\s+)?${ACTION}\\s+(?:the|a|an|this|that|these|those|your|our|my|each|all|any|some|us|me|them|it)\\b`, 'i');

function requestedAction(text: string): boolean {
  return (REQUEST.test(text) || LIST_REQUEST.test(text))
    && !/\b(?:do not|don['’]t|no need to|not asking you to)\b/i.test(text);
}



const FORMS: Record<string, string> = {
  needs: 'need', needed: 'need', requires: 'require', required: 'require', owners: 'owner', assignees: 'assignee',
  approval: 'approval', confirmation: 'approval', authorization: 'approval', authorisation: 'approval', consent: 'approval', acceptance: 'approval',
  agreed: 'agree', agreeing: 'agree', agreement: 'agree', confirmed: 'confirm', confirms: 'confirm',
  shared: 'share', shares: 'share', sharing: 'share', routing: 'route', routed: 'route', suggested: 'suggest', proposed: 'propose', authorised: 'approve', authorized: 'approve', sent: 'send', built: 'build',
  has: 'have', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be',
};
for (const action of ACTION.slice(3, -1).split('|')) {
  const verb = action.split(' ')[0];
  if (!/^[a-z]+$/.test(verb)) continue;
  const gerund = verb === 'submit' ? 'submitting' : verb === 'set' ? 'setting' : (verb.endsWith('e') ? verb.slice(0, -1) : verb) + 'ing';
  const past = verb.endsWith('e') ? verb + 'd' : /[^aeiou]y$/.test(verb) ? verb.slice(0, -1) + 'ied' : verb + 'ed';
  const third = /[^aeiou]y$/.test(verb) ? verb.slice(0, -1) + 'ies' : /(?:s|sh|ch|x|z)$/.test(verb) ? verb + 'es' : verb + 's';
  FORMS[gerund] = verb; FORMS[past] = verb; FORMS[third] = verb;
}

export function tokenize(text: string, offset = 0): GrammarToken[] {
  return [...text.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?|[^\s]/gu)].map(match => {
    const normal = match[0].toLowerCase().replace(/’/g, "'");
    return { start: offset + match.index, end: offset + match.index + match[0].length, text: match[0], normal,
      lemma: FORMS[normal] ?? normal, kind: /^[\p{L}\p{N}]/u.test(match[0]) ? 'word' : 'punctuation' };
  });
}

function originalSpan(text: string, offset: number, start: number, end: number): OriginalSpan {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start: offset + start, end: offset + end, text: text.slice(start, end) };
}

export function hasExplicitDeadline(text: string): boolean {
  return DEADLINE.test(text) || /\b(?:in|within)\s+(?:exactly\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s+(?:business\s+)?(?:minutes?|hours?|days?|weeks?)\b/i.test(text);
}
export function hasExplicitAgent(text: string): boolean {
  const agent = text.match(/\bby\s+(you|us|me|our team|your team|the [\w-]+ team|[A-Z][\p{L}'-]+)\b/u);
  return !!agent && !/^(?:then|tomorrow|today|next|this|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(agent[1]);
}

// Retained narrow wording recognizers complement the grammatical frames.
function ambiguousAction(text: string): boolean {
  // A location/team noun phrase must end immediately before the requested
  // action. It cannot swallow a reporting verb and another person's action.
  const ownerLocation = '(?:(?:on|from|in|within)\\s+(?:(?:our|your|their|the|either|both|this|that)\\s+)?(?:[\\w-]+\\s+){0,2}(?:sides?|teams?|groups?|departments?|organi[sz]ations?|companies|company|offices?|staff)\\s+)?';
  const actionPrefix = '(?:(?:will|should|must|can|could)\\s+)?(?:(?:needs?|has|have)\\s+to\\s+)?';
  const responsibility = `(?:(?:will|should|must)\\s+be|needs?\\s+to\\s+be)\\s+(?:responsible|accountable)\\s+for\\s+${ACTION_GERUND}`;
  const unclearOwner = new RegExp(`\\b(?:someone|somebody|one of us|one of you|whoever)\\s+${ownerLocation}(?:${actionPrefix}${ACTION}|${responsibility})\\b`, 'i');
  const passive = /\b(?:needs? to be|must be|should be)\s+(?:sent|shared|uploaded|submitted|completed|reviewed|confirmed|approved|assigned|scheduled|configured|updated|resolved|handled|sorted|done)\b/i;
  const explicitAgent = hasExplicitAgent(text);
  const vagueAction = /\b(?:please|could you|can you|someone should)\s+(?:handle|sort out|take care of)\s+(?:this|that|it|things|the next steps)\s*[.!?]?$/i;
  const collaborativeVagueAction = /\b(?:let['’]s|let us)\s+get\s+.{1,100}\s+(?:sorted|handled|resolved|done)\b/i;
  return unclearOwner.test(text) || ((passive.test(text) || collaborativeVagueAction.test(text)) && !explicitAgent) || vagueAction.test(text);
}

const NEGATED = /\b(?:not|never|no longer|no need|don't|doesn't|didn't|do not|does not|did not)\b/i;
const QUALIFIED = /\b(?:if|unless|might|may|would|subject to)\b/i;
const STATIVE = new Set(['be', 'have', 'know', 'understand', 'want', 'like', 'prefer', 'believe', 'feel', 'mean', 'seem', 'appear']);

/** Extract only explicit grammatical requests/requirements; unknown relationships remain absent. */
export function analyzeClause(text: string, offset = 0): ClauseFeatures {
  const span = originalSpan(text, offset, 0, text.length);
  const tokens = tokenize(text, offset);
  const words = tokens.filter(token => token.kind === 'word');
  const actions: ActionFrame[] = [];
  const add = (kind: ActionFrame['kind'], subject: OriginalSpan | null, predicate: OriginalSpan, object: OriginalSpan, owner: ActionFrame['owner']) => {
    const prefix = text.slice(0, predicate.end - offset).replace(/’/g, "'");
    actions.push({ kind, subject, predicate, object, owner, modality: kind === 'request' ? 'requested' : 'required', negated: NEGATED.test(kind === 'unassigned-task' ? text.slice(0, predicate.start - offset) : prefix), qualified: QUALIFIED.test(prefix),
      assertion: /\bwhether\b/i.test(prefix) ? 'exploratory' : 'asserted' });
  };
  const adjacent = (items: GrammarToken[]) => items.every((item, i) => !i || /^\s+$/.test(text.slice(items[i - 1].end - offset, item.start - offset)));
  for (let i = 0; i < words.length; i++) {
    const predicate = words[i];
    // Past requirements can describe completed work; only current/future requirements qualify.
    if (!/^(?:needs?|requires?)$/.test(predicate.normal)) continue;
    const a = words[i + 1], b = words[i + 2], c = words[i + 3], d = words[i + 4];
    const subject = originalSpan(text, offset, 0, predicate.start - offset);
    if (a && b && /^(?:a|an)$/.test(a.normal) && /^(?:owner|assignee)$/.test(b.lemma) && adjacent([predicate, a, b])
      && (!c || /^(?:for|to|by|before|after|so|from|on|in|within|who)$/.test(c.normal))) {
      add('owner-vacancy', subject, predicate, b, 'vacant');
    }
    // The grammar establishes an action without a closed verb whitelist.
    if (a && b && c && d && /^(?:someone|somebody|anyone)$/.test(a.normal) && b.normal === 'to'
      && /^[a-z]+$/.test(c.normal) && !STATIVE.has(c.lemma) && adjacent([predicate, a, b, c])) {
      add('delegated-task', a, c, originalSpan(text, offset, c.end - offset, text.length), 'unspecified');
    }
    if (a && b && c && a.normal === 'to' && b.lemma === 'be' && adjacent([predicate, a, b, c])
      && new RegExp(`^${ACTION}$`, 'i').test(c.lemma) && c.normal !== c.lemma && !hasExplicitAgent(text)) {
      add('passive-task', null, c, subject, 'vacant');
    }
  }
  // Negative assignment states establish an absent owner; they do not negate
  // the underlying task. Only present status and explicit assignment predicates qualify.
  const absentAssignment = text.match(/\b(?:nobody|no one|no (?:owner|assignee|person))\s+(?:is|has(?: yet)? been)\s+(?:assigned|appointed|designated)\s+(?:yet\s+)?(?:to|for)\s+(.+?)(?:[.!?]|$)/i)
    ?? text.match(/\b(?:the|an?|our|your)\s+(?:[\w-]+\s+){0,5}(?:owner|assignee|task|approval|review)\s+has\s+not\s+(?:yet\s+)?been\s+(?:assigned|appointed|designated)(?:\s+(.+?))?(?:[.!?]|$)/i);
  if (absentAssignment) {
    const start = absentAssignment.index!;
    const assignment = originalSpan(text, offset, start, start + absentAssignment[0].length);
    // A denied vacancy or an explicitly cancelled underlying action is not an outstanding task.
    const task = tokenize((absentAssignment[1] ?? '').split(/[,;]|\b(?:and|but|because|since)\b/i)[0]).filter(token => token.kind === 'word');
    const taskVerb = task[0]?.lemma;
    const objectWords = (tokens: GrammarToken[]) => tokens.filter(token => !/^(?:the|a|an|your|our|their)$/.test(token.normal)).map(token => token.lemma);
    const assignedObject = objectWords(task.slice(1));
    const cancellation = [...text.matchAll(/\b(?:(?:do not|don['’]t|no longer)\s+need|no need)\s+to\s+([a-z]+)\s+([^.!?;]+)/gi)];
    const cancelledTask = !!taskVerb && cancellation.some(match => {
      if (tokenize(match[1])[0]?.lemma !== taskVerb) return false;
      const object = match[2].split(/,|\b(?:and|but|because|since)\b/i)[0].trim();
      if (/^(?:it|them|this|that|these|those)$/i.test(object)) return true;
      const cancelledObject = objectWords(tokenize(object).filter(token => token.kind === 'word'));
      return assignedObject.length > 0 && assignedObject.length === cancelledObject.length
        && assignedObject.every((word, index) => word === cancelledObject[index]);
    });
    if (!cancelledTask) add('unassigned-task', null, assignment, assignment, 'vacant');
  }
  if (requestedAction(text)) {
    const request = text.match(REQUEST);
    const list = request ? null : text.match(LIST_REQUEST);
    const verb = request ? request[0].match(new RegExp(`${ACTION}$`, 'i')) : list?.[0].replace(/^(?:(?:[-*•]|\d+[.)])\s+)?(?:and\s+)?/i, '').match(new RegExp(`^${ACTION}`, 'i'));
    if (verb) {
      const start = request ? request.index! + request[0].length - verb[0].length : text.toLowerCase().indexOf(verb[0].toLowerCase(), list?.index ?? 0);
      add('request', null, originalSpan(text, offset, start, start + verb[0].length), originalSpan(text, offset, start + verb[0].length, text.length), 'recipient');
    }
    for (const match of text.matchAll(new RegExp(`(?:,\\s*(?:and\\s+)?|\\band\\s+)(${ACTION})\\b`, 'gi'))) {
      const start = match.index + match[0].length - match[1].length;
      add('request', null, originalSpan(text, offset, start, start + match[1].length), originalSpan(text, offset, start + match[1].length, text.length), 'recipient');
    }
  }
  const vagueTimes = [...text.matchAll(new RegExp(`(?:${VAGUE.source}|${INDEFINITE_DURATION.source})`, 'gi'))].filter(match => {
    if (match[0].toLowerCase() !== 'later') return true;
    return !/^\s+(?:today|tomorrow|tonight|this\s+(?:week|month|year)|next\s+(?:week|month|year)|on\s+|at\s+|by\s+)/i.test(text.slice(match.index + match[0].length));
  }).map(match => originalSpan(text, offset, match.index, match.index + match[0].length));
  const referenceDependency = /^then\s+(?:I|we|you|they)\s+can\b|^(?:we|I|you|they)\s+need\s+(?:it|this|that|them|these|those)\s+to\s+\w+\b|^(?:this|that|it)\s+(?:lets?|allows?|enables?|unblocks?)\b|\b(?:cannot|can't|can’t|blocked|waiting)\b[^.!?;]*\buntil then\b/i.test(text);
  const hasDependency = DEPENDENCY.test(text) || referenceDependency
    || /\b(?:cannot|can't|can’t|won't|won’t|will not)\b[^.!?;]*\bwithout\b/i.test(text);
  return { span, tokens, actions, requestCount: actions.filter(action => action.kind === 'request').length,
    ownerUnclear: (ambiguousAction(text) && !/\b(?:not|never|no need|don['’]t)\b/i.test(text)) || actions.some(action => action.kind !== 'request' && action.assertion === 'asserted' && !action.negated && !action.qualified), vagueTimes,
    hasDeadline: hasExplicitDeadline(text), hasDependency, referenceDependency };
}

const TOPIC_STOP = new Set(['the', 'that', 'this', 'these', 'those', 'your', 'our', 'their', 'please', 'will', 'have', 'need', 'can', 'could', 'would', 'should', 'then', 'soon', 'later', 'once', 'when']);
export function linkedDependency(current: ClauseFeatures, neighbours: ClauseFeatures[]): boolean {
  if (current.hasDependency) return true;
  const requests = current.actions.filter(action => action.kind === 'request');
  if (!requests.length) return false;
  // Only the requested object can anchor an adjacent prerequisite. A shared
  // action ("review") or a determiner ("this screenshot") is not a backlink.
  const objects = requests.map(action => {
    const time = current.vagueTimes.find(item => item.start >= action.object.start);
    const end = time ? Math.min(time.start, action.object.end) : action.object.end;
    return action.object.text.slice(0, end - action.object.start).trim().replace(/[.!?,;]+$/, '').trim();
  });
  const objectTopics = objects.map(object => tokenize(object).filter(token => token.kind === 'word'
    && token.lemma.length > 2 && !TOPIC_STOP.has(token.lemma)).map(token => token.lemma));
  return neighbours.some(next => {
    if (!next.hasDependency || /\b(?:another|separate|unrelated)\b/i.test(next.span.text)) return false;
    if (next.referenceDependency) return true;
    // An object pronoun can refer back to an already stated prerequisite.
    if (next.span.end <= current.span.start && objects.some(object => /^(?:it|this|that|them|these|those|yours)$/i.test(object))) return true;
    const nextWords = next.tokens.filter(token => token.kind === 'word' && token.lemma.length > 2 && !TOPIC_STOP.has(token.lemma)).map(token => token.lemma);
    return objectTopics.some(topic => topic.length > 0 && nextWords.some((_, start) =>
      topic.every((word, index) => nextWords[start + index] === word)));
  });
}

const APPROVAL_NOUN = '(?:approval|confirmation|consent|authori[sz]ation|acceptance|sign[- ]off)';
const PENDING = new RegExp(`\\b(?:still (?:a proposal|proposed|tentative|pending|unconfirmed|undecided)|(?:${APPROVAL_NOUN}|decision) (?:of (?:this|that) (?:arrangement|approach|proposal|plan) )?(?:is |remains? )?(?:still )?(?:pending|outstanding)|(?:haven['’]t|hasn['’]t|have not|has not|not yet) (?:yet )?(?:been )?(?:agreed|approved|confirmed|decided|accepted|given|authori[sz]ed)|(?:only|just) (?:a |our |your |their )?(?:proposal|suggestion)|(?:still )?(?:needs?|requires?) (?:your |their |final )?${APPROVAL_NOUN}|awaiting (?:your |their |final )?${APPROVAL_NOUN})\\b`, 'i');
export function hasUnresolvedApproval(text: string): boolean { return PENDING.test(text); }
export function standaloneUnresolvedApproval(text: string): boolean {
  return new RegExp(`^(?:(?:your|our|their|its|the|final)\\s+)?${APPROVAL_NOUN}\\s+(?:(?:is|remains)\\s+)?(?:still\\s+)?(?:pending|outstanding)\\s*[.!?]?$`, 'i').test(text);
}

/** Agreeing on the need for approval does not present the underlying proposal as approved. */
export function agreementConcernsApproval(text: string): boolean {
  const body = text.replace(/^(?:as (?:agreed|confirmed),?\s+|we (?:have )?agreed (?:that|on)\s+)/i, '');
  if (body === text) return false;
  const process = body.match(new RegExp(`^((?:[\\w-]+\\s+){1,7}?)(?:still\\s+)?(?:needs?|requires?)\\s+(?:your |our |their |final )?${APPROVAL_NOUN}\\b`, 'i'));
  return !!process && !/\b(?:will|shall|can|is|are|was|were|has|have)\b/i.test(process[1]);
}

/** An explicit proposal/suggestion on the subject is now presented as settled. */
export function proposalAssertion(text: string): OriginalSpan | null {
  const match = text.match(/\b(?:proposed|tentative)\s+(?:[\w-]+\s+){0,5}(?:is|are|has been|have been)\s+(?:now\s+)?(?:agreed|confirmed|finali[sz]ed)\b/i)
    ?? text.match(/\b(?:the|your|our|this|that)\s+(?:[\w-]+\s+){1,5}(?:you|we|they)\s+(?:(?:have|had)\s+)?(?:suggested|proposed|recommended)\s+(?:is|are|has been|have been)\s+(?:now\s+)?(?:agreed|confirmed|finali[sz]ed)\b/i);
  return match ? originalSpan(text, 0, match.index!, match.index! + match[0].length) : null;
}

// A routing nominalisation requires an actual finite movement to a destination,
// never merely discussion of a queue or a route. Concepts remain deliberately bounded.
const ROUTING_EVENT = /\bwill\s+(?:enter\s+|(?:be\s+)?(?:routed|sent|placed|assigned)\s+(?:to|into)\s+)(?:(?:the|a|an|your|our)\s+)?(?:[\w-]+\s+){0,4}(?:queue|workflow|channel|group|stage|pipeline)\b/i;

/** Match an explicit event noun to a finite action, or a directly declared topic. */
export function matchingReference(assertion: string, reference: string): boolean {
  const source = tokenize(assertion).filter(token => token.kind === 'word');
  const referent = reference.match(/^(?:this|that|these|those)\s+(.+?)\s+(?:is|are|was|were|has|have|remains?|still)\b/i);
  if (referent) {
    const words = tokenize(referent[1]).filter(token => token.kind === 'word');
    const event = words.find(token => token.normal.endsWith('ing') && token.lemma !== token.normal);
    const generic = new Set(['arrangement', 'approach', 'plan', 'proposal', 'policy', 'decision', 'setup']);
    if (event?.lemma === 'route' && words.every(token => token === event || generic.has(token.lemma)) && ROUTING_EVENT.test(assertion)) return true;
    if (event && words.every(token => token === event || generic.has(token.lemma) || source.some(original => original.lemma === token.lemma))) {
      const index = source.findIndex((token, i) => token.lemma === event.lemma && i > 0 && /^(?:will|shall|can|be|have)$/.test(source[i - 1].lemma));
      if (index >= 0) return true;
    }
  }
  const declared = assertion.match(/\b(?:confirmed|agreed (?:on|to))\s+(?:the|this|that|our|your)\s+([\w-]+)(?:\s+(?:of|that|to)|[.!?]|$)/i);
  const object = reference.match(/\b(?:have not|has not|haven['’]t|hasn['’]t|not yet)\s+(?:yet\s+)?(?:accepted|approved|confirmed)\s+(?:this|that)\s+([\w-]+)(?:\s+yet)?\s*[.!?]?$/i);
  return !!declared && !!object && declared[1].toLowerCase() === object[1].toLowerCase();
}
