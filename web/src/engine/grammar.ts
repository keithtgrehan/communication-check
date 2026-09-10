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
  verb: string;
  voice: 'active' | 'passive';
  order: 'first' | 'next' | 'last' | null;
}
export interface ClauseFrame {
  span: OriginalSpan;
  tokens: GrammarToken[];
  actions: ActionFrame[];
  requestCount: number;
  ownerUnclear: boolean;
  vagueTimes: OriginalSpan[];
  hasDeadline: boolean;
  hasDependency: boolean;
  referenceDependency: boolean;
  dependencyEvent: string | null;
  dependencyObject: string | null;
  availabilitySubject: string | null;
}

const ACTION = '(?:send|share|upload|submit|complete|review|confirm|approve|choose|select|provide|arrange|organi[sz]e|schedule|book|sign|return|fill|check|verify|nominate|chase|test|enable|configure|set up|add|invite|assign|finish|update|resolve|handle|take ownership of|take responsibility for|own|take care of|sort out|start)';
// Explicit request/obligation syntax establishes an action without a verb whitelist.
const REQUEST_START = /\b(?:please\s+(?:(?:also|kindly)\s+)?|(?:can|could|would|will)\s+you\s+(?:(?:please|also|kindly)\s+)*|(?:I|we)\s+(?:still\s+)?need\s+you\s+to\s+|(?:your team|you)\s+(?:(?:also|still)\s+)?(?:need|have)\s+to\s+)([a-z]+)\b/gi;
// Indefinite amounts and temporal units are separate from exact numeric durations.
const INDEFINITE_DURATION = /\b(?:in|within)\s+(?:a\s+(?:(?:little|short)\s+)?(?:bit|while|moment)|(?:a\s+)?(?:few|couple of|several)\s+(?:minutes?|hours?|days?|weeks?))\b(?=\s*(?:[.,;!?]|$|so\b|before\b|to\b))/i;
const FEASIBILITY = '(?:possible|practical|feasible|convenient)';
const VAGUE = /\b(?:soon|shortly|asap|later|in (?:the )?(?:near|foreseeable|not too distant) future|when(?:ever)? you can(?=\s*(?:[.,;!?]|$|\bso\b|\bto\b))|when(?:ever)? you (?:get|have) (?:a|the) (?:chance|moment)|when(?:ever)? you have time|in the coming (?:days|weeks|months)|at (?:some|your(?: earliest)?) (?:point|convenience)|in due course|sometime|at some stage)\b/i;
const DEPENDENCY = /\b(?:so (?:that )?(?:(?:I|we|you|they|our|your)\b|(?:the|this|that|a|an) (?:[\w-]+ ){1,6}(?:can|will)\b)|before (?:(?:I|we|you|they)|(?:the|our|your) (?:[\w-]+ ){1,5}) ?can|(?:to|will) unblock|depends? on|dependent on|waiting (?:for|on)|then (?:I|we|you|they) can|to (?:begin|start|enable|complete|finish) (?:the|our|your))\b/i;
const DEADLINE = /\b(?:by|before|on|no later than)\s+(?:(?:next|this)\s+)?(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|noon|midnight|\d{1,2}(?::\d{2})?(?:\s*(?:am|pm))?\b|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b)|\bwithin\s+\d+\s+(?:business\s+)?(?:hours?|days?|weeks?)\b/i;
// Bare action words also name things ("test results", "review notes"). Require
// an explicit object determiner/pronoun; polite requests are handled separately.
const LIST_REQUEST = new RegExp(`^(?:(?:[-*•]|\\d+[.)])\\s+)?(?:(?:also|and|then)\\s+)?${ACTION}\\s+(?:the|a|an|this|that|these|those|your|our|my|each|all|any|some|us|me|them|it)\\b`, 'i');

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

// Vague directives are a separate action-quality concern from absent ownership.
function vagueDirective(text: string): boolean {
  const object = '(?:this|that|it|things|(?:the\\s+)?(?:next steps|remaining arrangements|remaining tasks|outstanding items))';
  return new RegExp(`\\b(?:please|could you|can you|someone should)\\s+(?:handle|sort out|take care of)\\s+${object}\\s*[.!?]?$`, 'i').test(text)
    || (/\b(?:let['’]s|let us)\s+get\s+.{1,100}\s+(?:sorted|handled|resolved|done)\b/i.test(text) && !hasExplicitAgent(text));
}

function responsibilityState(text: string): RegExpMatchArray | null {
  const owner = '(?:owner|assignee|person)';
  const assignment = '(?:assigned|appointed|designated|named|chosen)';
  return text.match(new RegExp(`\\b(?:nobody|no one|no ${owner})\\s+(?:is|has(?: yet)? been)\\s+${assignment}\\s+(?:yet\\s+)?(?:to|for)\\s+(.+?)(?:[.!?]|$)`, 'i'))
    ?? text.match(new RegExp(`\\b(?:the|an?|our|your)\\s+(?:[\\w-]+\\s+){0,5}(?:owner|assignee)\\s+has\\s+not\\s+(?:yet\\s+)?been\\s+${assignment}(?:\\s+(.+?))?(?:[.!?]|$)`, 'i'))
    ?? text.match(new RegExp(`\\b(?:the|an?|our|your)\\s+(?:[\\w-]+\\s+){0,5}(?:task|approval|review)\\s+has\\s+not\\s+(?:yet\\s+)?been\\s+(?:assigned|appointed|designated)(?:\\s+(.+?))?(?:[.!?]|$)`, 'i'))
    ?? text.match(/\b(?:we|I|you|they)\s+(?:still\s+)?(?:have|has)\s+not\s+(?:yet\s+)?assigned\s+(?:anyone|anybody|an owner|an assignee)\s+to\s+(.+?)(?:[.!?]|$)/i)
    ?? text.match(/\b(?:nobody|no one)\s+has\s+(?:yet\s+)?taken\s+(?:responsibility|ownership|charge)\s+(?:for|of)\s+(.+?)(?:[.!?]|$)/i)
    ?? text.match(/\bthere\s+is\s+(?:still\s+)?no\s+(?:owner|assignee)\s+for\s+(.+?)(?:[.!?]|$)/i)
    ?? text.match(/\b(?:responsibility|ownership)\s+for\s+(.+?)\s+(?:is|remains)\s+(?:still\s+)?(?:undecided|unassigned|unallocated|unresolved)\b/i)
    ?? text.match(/\b(?:an?|the)\s+(?:owner|assignee)\s+for\s+(.+?)\s+(?:is|has)\s+(?:still\s+)?yet\s+to\s+be\s+(?:chosen|assigned|appointed|designated)\b/i);
}

const NEGATED = /\b(?:not|never|no longer|no need|don't|doesn't|didn't|do not|does not|did not)\b/i;
const QUALIFIED = /\b(?:if|unless|might|may|would|subject to)\b/i;
const RELATIVE = new Set(['which', 'that', 'who', 'whose', 'where', 'when']);
const isParticiple = (word: string) => /^[a-z]{3,}ed$/i.test(word) || /^(?:sent|done|given|chosen|written|taken|built|bought)$/i.test(word);
export function isRequestedAction(action: ActionFrame): boolean { return action.kind === 'request' && action.assertion === 'asserted' && !action.negated; }

const STATIVE = new Set(['be', 'have', 'know', 'understand', 'want', 'like', 'prefer', 'believe', 'feel', 'mean', 'seem', 'appear', 'note', 'remember']);

/** Extract only explicit grammatical requests/requirements; unknown relationships remain absent. */
export function analyzeClause(text: string, offset = 0): ClauseFrame {
  const span = originalSpan(text, offset, 0, text.length);
  const tokens = tokenize(text, offset);
  const words = tokens.filter(token => token.kind === 'word');
  const actions: ActionFrame[] = [];
  const add = (kind: ActionFrame['kind'], subject: OriginalSpan | null, predicate: OriginalSpan, object: OriginalSpan, owner: ActionFrame['owner']) => {
    const prefix = text.slice(0, predicate.end - offset).replace(/’/g, "'");
    actions.push({ kind, subject, predicate, object, owner, modality: kind === 'request' ? 'requested' : 'required', negated: NEGATED.test(kind === 'unassigned-task' ? text.slice(0, predicate.start - offset) : prefix), qualified: QUALIFIED.test(prefix),
      assertion: /\bwhether\b/i.test(prefix) ? 'exploratory' : 'asserted',
      verb: tokenize(predicate.text)[0]?.lemma ?? '', voice: kind === 'passive-task' ? 'passive' : 'active',
      order: (object.text.match(/\b(first|next|last)\s*[,.!?;]?$/i)?.[1].toLowerCase() as ActionFrame['order']) ?? null });
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
    const passive = text.slice(predicate.start - offset).match(/^(?:needs?|requires?)\s+(?:to\s+be\s+)?([a-z]+)\b/i);
    const inflected = passive?.[1];
    if (inflected && !hasExplicitAgent(text)
      && ((/\bto\s+be\b/i.test(passive![0]) && isParticiple(inflected))
        || (/^[a-z]{3,}ing$/i.test(inflected) && /\b(?:the|our|your)\s+\w+/i.test(subject.text)))) {
      const start = predicate.start - offset + passive![0].length - inflected.length;
      add('passive-task', null, originalSpan(text, offset, start, start + inflected.length), subject, 'vacant');
    }
  }
  const ownerLocation = '(?:(?:on|from|in|within)\\s+(?:(?:our|your|their|the|either|both|this|that)\\s+)?(?:[\\w-]+\\s+){0,2}(?:sides?|teams?|groups?|departments?|organi[sz]ations?|companies|company|offices?|staff)\\s+)?';
  const actor = '(?:someone|somebody|one of us|one of you|whoever)';
  const obligation = '(?:(?:will|should|must|can|could)\\s+(?:(?:need|have)\\s+to\\s+)?|(?:needs?|has|have)\\s+to\\s+)';
  const unnamed = new RegExp(`\\b(${actor})\\s+${ownerLocation}${obligation}([a-z]+)\\b`, 'gi');
  const unnamedQuestion = new RegExp(`\\b(?:can|could)\\s+(${actor})\\s+${ownerLocation}([a-z]+)\\b`, 'gi');
  for (const match of [...text.matchAll(unnamed), ...text.matchAll(unnamedQuestion)]) {
    const start = match.index + match[0].length - match[2].length;
    const remainder = text.slice(start + match[2].length);
    if (/^(?:tell|report|say|confirm|describe)$/i.test(match[2]) && /\b(?:who|whether|that)\b/i.test(remainder)) continue;
    const responsibility = match[2].toLowerCase() === 'be' && /^\s+(?:responsible|accountable)\s+for\s+[a-z]+ing\b/i.test(remainder);
    if ((!STATIVE.has(match[2].toLowerCase()) || responsibility) && /\s+\S/.test(remainder)) {
      add('delegated-task', originalSpan(text, offset, match.index, match.index + match[1].length), originalSpan(text, offset, start, start + match[2].length), originalSpan(text, offset, start + match[2].length, text.length), 'unspecified');
    }
  }
  for (const match of text.matchAll(/\b(?:must|should)\s+be\s+([a-z]+(?:ed|en)|sent|done)\b/gi)) {
    if (isParticiple(match[1]) && !hasExplicitAgent(text)) add('passive-task', null, originalSpan(text, offset, match.index, match.index + match[0].length), span, 'vacant');
  }

  // Negative assignment states establish an absent owner; they do not negate
  // the underlying task. Only present status and explicit assignment predicates qualify.
  const absentAssignment = responsibilityState(text);
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
  const requestStarts: Array<{ start: number; verb: string }> = [...text.matchAll(REQUEST_START)].map(match => ({ start: match.index + match[0].length - match[1].length, verb: match[1] }));
  const bare = text.match(LIST_REQUEST);
  if (bare) {
    const verb = bare[0].replace(/^(?:(?:[-*•]|\d+[.)])\s+)?(?:(?:also|and|then)\s+)?/i, '').match(/^[a-z]+/i)!;
    requestStarts.push({ start: text.indexOf(verb[0], bare.index), verb: verb[0] });
  }
  if (requestStarts.length) {
    // Coordinated actions inherit a request only with a following explicit object.
    for (const match of text.matchAll(/(?:,\s*(?:(?:and|then|finally)\s+)?|\band\s+(?:(?:then|finally)\s+)?)([a-z]+)\s+(?=(?:the|a|an|this|that|these|those|your|our|my|each|all|any|some|us|me|them|it)\b)/gi)) {
      requestStarts.push({ start: match.index + match[0].lastIndexOf(match[1]), verb: match[1] });
    }
  }
  requestStarts.sort((a, b) => a.start - b.start);
  const seen = new Set<number>();
  for (const [requestIndex, request] of requestStarts.entries()) {
    if (seen.has(request.start) || RELATIVE.has(request.verb.toLowerCase()) || STATIVE.has(request.verb.toLowerCase()) || /\b(?:do not|don['’]t|no need to|not asking you to)\b/i.test(text)) continue;
    seen.add(request.start);
    const nextStart = requestStarts.slice(requestIndex + 1).find(next => next.start > request.start)?.start ?? text.length;
    const tail = text.slice(request.start + request.verb.length, nextStart);
    const objectText = tail.replace(/(?:\s*(?:,|and|then|finally)\s*)+$/i, '');
    add('request', null, originalSpan(text, offset, request.start, request.start + request.verb.length), originalSpan(text, offset, request.start + request.verb.length, request.start + request.verb.length + objectText.length), 'recipient');
  }
  const vagueTimes = [...text.matchAll(new RegExp(`(?:${VAGUE.source}|${INDEFINITE_DURATION.source}|\\b(?:as soon as|whenever)\\s+${FEASIBILITY}\\b)`, 'gi'))].filter(match => {
    if (match[0].toLowerCase() === 'soon' && /as\s+$/i.test(text.slice(0, match.index)) && /^\s+as\b/i.test(text.slice(match.index + match[0].length))) return false;
    if (match[0].toLowerCase() !== 'later') return true;
    return !/^\s+(?:today|tomorrow|tonight|this\s+(?:week|month|year)|next\s+(?:week|month|year)|on\s+|at\s+|by\s+)/i.test(text.slice(match.index + match[0].length));
  }).map(match => originalSpan(text, offset, match.index, match.index + match[0].length));
  const referenceDependency = /^then\s+(?:I|we|you|they)\s+can\b|^(?:we|I|you|they)\s+need\s+(?:it|this|that|them|these|those)\s+to\s+\w+\b|^(?:this|that|it)\s+(?:lets?|allows?|enables?|unblocks?)\b|\b(?:cannot|can't|can’t|blocked|waiting)\b[^.!?;]*\buntil then\b/i.test(text);
  const dependencyEventMatch = text.match(/^(?:this|that)\s+(\w+)\s+(?:lets?|allows?|enables?|unblocks?)\b/i)
    ?? text.match(/\b(?:blocked|cannot|can't|can’t)\b[^.!?;]*\buntil\s+(?:this|that)\s+(\w+)\b/i);
  const referenceTail = dependencyEventMatch ? text.slice(dependencyEventMatch.index! + dependencyEventMatch[0].length) : '';
  const dependencyObject = referenceTail.match(/^\s+(?:for|of|on)\s+(.+?)\s+(?:is|are|has|have|arrives?|occurs?|happens?|lets?|allows?|enables?|unblocks?)\b/i)?.[1] ?? (/^\s+(?:for|of|on)\b/i.test(referenceTail) ? referenceTail.trim() : null);
  const dependencyEvent = dependencyEventMatch ? eventLemma(dependencyEventMatch[1]) : null;
  const availabilitySubject = text.match(/^(.+?)\s+(?:will\s+)?(?:be\s+available|arrives?|is\s+available)\b/i)?.[1] ?? null;
  const hasDependency = DEPENDENCY.test(text) || referenceDependency || !!dependencyEvent
    || /\b(?:prerequisite|blocker)\s+(?:for|to)\b/i.test(text)
    || (/\b(?:once|after|as soon as)\s+(?:I|we|you|they|he|she|it)\s+[a-z]+\b/i.test(text) && /\b(?:can|cannot|can't|can’t)\b/i.test(text))
    || (/\b(?:once|after|as soon as)\s+(?:the|our|your|this|that|these|those)\s+(?:[\w-]+\s+){1,6}(?:is|are|has|have|arrives?|returns?|becomes?)\b/i.test(text) && /\b(?:can|cannot|can't|can’t)\b/i.test(text))
    || /\b(?:cannot|can't|can’t|blocked)\b[^.!?;]*\buntil\b/i.test(text)
    || /\b(?:cannot|can't|can’t|won't|won’t|will not)\b[^.!?;]*\bwithout\b/i.test(text);
  return { span, tokens, actions, requestCount: actions.filter(isRequestedAction).length,
    ownerUnclear: (vagueDirective(text) && !/\b(?:not|never|no need|don['’]t)\b/i.test(text)) || actions.some(action => action.kind !== 'request' && action.assertion === 'asserted' && !action.negated && !action.qualified), vagueTimes,
    hasDeadline: hasExplicitDeadline(text), hasDependency, referenceDependency, dependencyEvent, dependencyObject, availabilitySubject };
}

const EVENT_NOUNS: Record<string, string> = { approval: 'approve', confirmation: 'confirm', choice: 'choose', selection: 'choose', select: 'choose', verification: 'verify', submission: 'submit', upload: 'upload', return: 'return', receipt: 'receive', availability: 'available' };
function eventLemma(word: string): string { return EVENT_NOUNS[word.toLowerCase()] ?? tokenize(word)[0]?.lemma ?? word.toLowerCase(); }

const TOPIC_STOP = new Set(['the', 'that', 'this', 'these', 'those', 'your', 'our', 'their', 'please', 'will', 'have', 'need', 'can', 'could', 'would', 'should', 'then', 'soon', 'later', 'once', 'when']);
export function linkedDependency(current: ClauseFrame, neighbours: ClauseFrame[]): boolean {
  if (current.hasDependency) return true;
  const requests = current.actions.filter(isRequestedAction);
  if (!requests.length && !current.availabilitySubject) return false;
  // Only the requested object can anchor an adjacent prerequisite. A shared
  // action ("review") or a determiner ("this screenshot") is not a backlink.
  const objects = requests.map(action => {
    const time = current.vagueTimes.find(item => item.start >= action.object.start);
    const end = time ? Math.min(time.start, action.object.end) : action.object.end;
    return action.object.text.slice(0, end - action.object.start).trim().replace(/[.!?,;]+$/, '').trim();
  });
  if (current.availabilitySubject) objects.push(current.availabilitySubject);
  const objectTopics = objects.map(object => tokenize(object).filter(token => token.kind === 'word'
    && token.lemma.length > 2 && !TOPIC_STOP.has(token.lemma)).map(token => token.lemma));
  return neighbours.some(next => {
    if (!next.hasDependency || /\b(?:another|separate|unrelated)\b/i.test(next.span.text)) return false;
    if (next.referenceDependency) return true;
    if (next.dependencyEvent && requests.some(request => eventLemma(request.verb) === next.dependencyEvent)) {
      if (!next.dependencyObject) return true;
      const target = tokenize(next.dependencyObject).filter(token => token.kind === 'word' && !TOPIC_STOP.has(token.lemma)).map(token => token.lemma);
      if (objectTopics.some(topic => topic.length === target.length && topic.every((word, i) => word === target[i]))) return true;
    }
    // An object pronoun can refer back to an already stated prerequisite.
    if (next.span.end <= current.span.start && objects.some(object => /^(?:it|this|that|them|these|those|yours)$/i.test(object))) return true;
    const nextWords = next.tokens.filter(token => token.kind === 'word' && token.lemma.length > 2 && !TOPIC_STOP.has(token.lemma)).map(token => token.lemma);
    return objectTopics.some(topic => topic.length > 0 && nextWords.some((_, start) =>
      topic.every((word, index) => nextWords[start + index] === word)));
  });
}
