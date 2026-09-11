/** Lexical outcome classes are intentionally bounded. They identify claim
 * content, not its truth; qualification and conversational scope stay separate. */
interface OutcomeSpan { start: number; end: number; text: string }
export interface CommitmentOutcome {
  kind: 'financial' | 'delivery' | 'capability';
  force: 'future' | 'guarantee' | 'unspecified';
  polarity: 'affirmed' | 'negated';
  effect: 'exemption' | 'delivery' | 'capability';
  predicate: OutcomeSpan;
  target: OutcomeSpan;
  negation?: OutcomeSpan;
}
const span = (text: string, start: number, end: number): OutcomeSpan => ({ start, end, text: text.slice(start, end) });

// Extracting an outcome inside a question, denial or requested assertion does
// not make that outcome the sender's own promise.
function assertedOutcome(text: string, start: number): boolean {
  // An independently asserted coordinated clause starts its own scope. A
  // reporting complement introduced by "that" stays inside its claimant.
  const prefix = text.slice(0, start).split(/;|,?\s+and\s+(?=(?:I|we|you|they|our|the)\b)/i).at(-1)!;
  const deniedClaim = /\b(?:nobody|no one|no (?:person|team|company))\s+(?:(?:has|had)\s+)?(?:(?:promis(?:e|ed)|guarantee(?:d)?|confirm(?:ed)?|said|stated|agreed)\b|$)/i.test(prefix);
  const requestedClaim = /\b(?:ask(?:ed)?|request(?:ed)?|suggest(?:ed)?|propos(?:e|ed))\s+that\b/i.test(prefix);
  return !deniedClaim && !requestedClaim && !/\b(?:whether|if)\b|\bnot\s+(?:true|correct)\s+that\b|\b(?:please|to|can|could|would|should)\s*$/i.test(prefix);
}


// Financial exemption is a positive benefit even when its charge predicate is
// negative. Only the negation inside that predicate can bypass a negative gate.
export function financialOutcomes(text: string): CommitmentOutcome[] {
  const frames: CommitmentOutcome[] = [];
  const forms = [
    /\b(?:will|shall)\s+not\s+(?:be\s+charged\s+for|charge\s+(?:you|us|them|the customer|your company)\s+for)\s+([^.!?;]+)/gi,
    /\b(?:will|shall)\s+be\s+(?:included|provided|offered|supplied)\s+(?:at\s+)?no\s+(?:(?:extra|additional)\s+)?(?:cost|charge|fee)s?\b/gi,
  ];
  forms.forEach((pattern, index) => {
    for (const match of text.matchAll(pattern)) {
      if (!assertedOutcome(text, match.index)) continue;
      const predicate = span(text, match.index, match.index + match[0].length);
      // A passive charge can concern electricity or a criminal allegation.
      // Customer/service targets establish the monetary reading conservatively.
      if (index === 0 && !/\b(?:accounts?|users?|seats?|licen[cs]es?|subscriptions?|plans?|services?|support|training|storage|usage|features?|integrations?|exports?|imports?|upgrades?|delivery|installation)\b/i.test(match[1])) continue;
      const negation = index === 0 ? span(text, match.index, match.index + match[0].match(/^(?:will|shall)\s+not/i)![0].length) : undefined;
      frames.push({ kind: 'financial', force: 'future', polarity: index === 0 ? 'negated' : 'affirmed', effect: 'exemption', predicate, target: predicate, negation });
    }
  });
  return frames;
}

// Verbs and their outcome nouns share one delivery class. Ordinary human
// documents still require the caller's positive technical-target classifier.
const DELIVERY_FORMS = {
  deliver: 'delivery', ship: 'shipment', release: 'release', build: 'build',
  launch: 'launch', deploy: 'deployment', implement: 'implementation', finish: 'completion', complete: 'completion',
};
export function deliveryOutcomes(text: string): CommitmentOutcome[] {
  const forms = [
    new RegExp(`\\b(${Object.keys(DELIVERY_FORMS).join('|')})\\s+([^;.!?]+)`, 'gi'),
    new RegExp(`\\b(?:guarantee(?:s|d)?|promise(?:s|d)?)\\s+(?:the\\s+)?(${[...new Set(Object.values(DELIVERY_FORMS))].join('|')})\\s+of\\s+([^;.!?]+)`, 'gi'),
  ];
  return forms.flatMap((pattern, index) => [...text.matchAll(pattern)].filter(match => !index || assertedOutcome(text, match.index)).map(match => {
    const targetStart = match.index + match[0].length - match[2].length;
    const target = match[2].split(/\s+(?:by|before|after|within|on)\s+|,|\band\b/i)[0];
    return { kind: 'delivery' as const, force: index ? 'guarantee' as const : 'unspecified' as const,
      polarity: 'affirmed' as const, effect: 'delivery' as const,
      predicate: span(text, match.index, targetStart), target: span(text, targetStart, targetStart + target.length) };
  }));
}

export function universalCapability(text: string): CommitmentOutcome | null {
  const match = text.match(/\b(?:will|shall)\s+(?:[a-z]+ly\s+)?([a-z]+)\s+(?:every|all|any)\b/i);
  if (!match || /^(?:be|have|discuss|review|explain|send|share)$/i.test(match[1])) return null;
  return { kind: 'capability', force: 'future', polarity: 'affirmed', effect: 'capability',
    predicate: span(text, match.index!, match.index! + match[0].length),
    target: span(text, match.index! + match[0].length, text.length) };
}

/** A service is technical only with a declared computing operation in its
 * immediate head modifier, not an earlier topic word. Human role heads and
 * consulting/customer/support service abstain. */
export function technicalService(phrase: string): boolean {
  return /\b(?:validation|processing|conversion|synchroni[sz]ation|automation|indexing|encryption|recognition|import|export|migration|data|api|software)[ -]+services?$/i.test(phrase);
}
