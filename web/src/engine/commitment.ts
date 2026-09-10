import { hasExplicitDeadline } from './grammar';

/** Definite claim force is evaluated separately from its product or financial outcome. */
export function commitmentConcern(text: string): boolean {
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
  const passiveFinancialInclusion = /\b(?:will|shall)\s+be\s+(?:included|provided|offered|supplied)\s+(?:at\s+)?no\s+(?:(?:extra|additional)\s+)?(?:cost|charge|fee)s?\b/i.test(text);
  const priceAssurance = passiveFinancialInclusion || pricePredicate.test(text) || (priceOutcome.test(text)
    && /\b(?:guarantee(?:s|d)?|promise)\b|\b(?:will|shall|['’]ll)\s+(?:offer|grant|apply|give|provide|include|honou?r)\b/i.test(text));
  const capability = /\b(?:support|handle|work with|integrate with|sync|synchroni[sz]e|process|automate|eliminate|prevent|ensure|include|provide|enable|allow|run|meet)\b/i;
  // Strong universal assurances require an affirmative technical component
  // subject, not merely the absence of a recognised human role.
  const universal = text.match(/\b(?:the|our|your|this|that)\s+((?:[\w-]+\s+){0,4}[\w-]+)\s+will\s+(?:(?:always|definitely|automatically)\s+)?(read|parse|process|recogni[sz]e|support|handle|accept|convert)\s+(?:every|all|any)\b/i);
  const technicalSubject = /(?:\b(?:scanner|decoder|encoder|parser|uploader|downloader|importer|exporter|processor|converter|renderer|validator|indexer|analy[sz]er|widget|pipeline|engine|software|system|component|module|application|app|tool|connector|integration)s?|\b(?:form|query|workflow|report|dashboard|page|survey|automation)[ -]builders?|\b(?:offline|online|read-only|preview|sandbox|automatic)[ -]modes?)$/i;
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

  const universalOutcome = text.match(/\b(?:will|shall)\s+(?:[a-z]+ly\s+)?([a-z]+)\s+(?:every|all|any)\b/i);
  const errorFree = /\bwithout\s+(?:(?:any|a single)\s+)?(?:errors?|mistakes?|exceptions?|fail)\b|\berror[- ]free\b/i.test(text);
  const serviceSubject = text.match(/\b((?:[\w-]+\s+){0,5}services?)\s+(?:will|shall)\b/i)?.[1];
  const digitalObject = /\b(?:data|records?|files?|formats?|inputs?|images?|photographs?|transactions?|rules?|events?|uploaded|imported)\b/i.test(text);
  const universalProductCapability = !!universalOutcome && !/^(?:be|have|discuss|review|explain|send|share)$/i.test(universalOutcome[1])
    && (productSubject || (!!serviceSubject && errorFree && digitalObject));
  const guaranteedPatient = /\b(?:every|all|any)\s+[^.!?;]{1,100}\s+(?:is|are)\s+guaranteed\s+to\s+[a-z]+\b/i.test(text);
  const productDestination = [...text.matchAll(/\b(?:in|into|on)\s+((?:(?:the|our|your|this)\s+)?(?:[\w-]+\s+){0,3}?[\w-]+)(?=\s+(?:within|by|before|after|in)|[.!?,;]|$)/gi)]
    .some(match => isProductSubject(match[1]));
  const priceState = price.test(text) && /\b(?:will|shall)\s+(?:remain|stay|be)\s+(?:at\s+)?[$€£]\s*\d/i.test(text);
  const zeroPrice = /\bthere\s+(?:will|shall)\s+be\s+no\s+(?:(?:extra|additional)\s+)?(?:charges?|fees?|costs?)\b(?=\s*(?:for\b|on\b|to\b|[.!?]|$))/i.test(text)
    || /\bno\s+(?:(?:extra|additional)\s+)?(?:charges?|fees?|costs?)\s+(?:will|shall)\s+(?:apply|be\s+(?:charged|added))\b/i.test(text);
  if (universalProductCapability || (guaranteedPatient && productDestination) || priceState || zeroPrice) return true;
  // Strong assurance can establish the relevant commitment without an exact
  // product-name or capability-verb match. Positive context is still required.
  const automatedUniversal = text.match(/\b(?:the|our|your|this|that)\s+((?:[\w-]+\s+){0,5}[\w-]+)\s+will\s+(?:[a-z]+ly\s+)?[a-z]+\s+(?:every|all|any)\s+[^.!?;]+/i);
  const automaticCapability = !!automatedUniversal
    && (technicalSubject.test(automatedUniversal[1]) || /\bservices?$/i.test(automatedUniversal[1]))
    && /\bautomatically\b/i.test(automatedUniversal[0])
    && /\bwithout (?:exceptions?|fail|(?:any )?errors?)\b/i.test(automatedUniversal[0]);
  const readyPromise = text.match(/\b(?:promise|guarantee)(?:s|d)?\s+that\s+((?:[\w-]+\s+){1,8}[\w-]+)\s+will\s+be\s+(?:ready|available|live)\b/i);
  // A readiness promise needs an affirmative product class. "Custom" alone
  // also describes routine correspondence and cannot establish this context.
  const technicalDeliverable = /(?:\b(?:devices?|terminals?|kiosks?|appliances?)|\b(?:sign-in|check-in|registration|reception|visitor)[ -]stations?)$/i;
  const explicitDeliverableReadiness = !!readyPromise
    && (isProductSubject(readyPromise[1]) || technicalDeliverable.test(readyPromise[1])) && hasExplicitDeadline(text);
  if (automaticCapability || explicitDeliverableReadiness) return true;
  if (definite && universal && technicalSubject.test(universal[1]) && technicalObjects.test(text) && technicalReading && absoluteAssurance.test(text)) return true;
  if (definite && delivery.test(text) && (productSubject || activeProductDelivery)) return true;
  if (definite && price.test(text) && priceAssurance) return true;
  if (definite && productSubject && capability.test(text)) return true;
  return (price.test(text) && /\b(?:is|are)\s+(?:permanently |fully )?(?:fixed|locked|guaranteed|free)\b|\bno additional (?:cost|charge|fee)s?\b/i.test(text))
    || (productSubject && /\b(?:guaranteed to|guarantee(?:s)? that)\b/i.test(text));
}

