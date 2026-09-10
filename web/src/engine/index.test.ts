import { describe, expect, it } from 'vitest';
import { checkDraft } from './index';
import { DEVELOPMENT_DRAFTS } from './__fixtures__/development';
import { MAX_DRAFT_LENGTH, type RuleId } from './types';

const rules = (text: string): RuleId[] => checkDraft(text).findings.map(finding => finding.ruleId);

function verifySpans(text: string): void {
  const result = checkDraft(text);
  expect(result.findings.length).toBeLessThanOrEqual(3);
  for (const finding of result.findings) {
    expect(finding.start).toBeGreaterThanOrEqual(0);
    expect(finding.end).toBeGreaterThan(finding.start);
    expect(finding.end).toBeLessThanOrEqual(text.length);
    expect(finding.quote).toBe(text.slice(finding.start, finding.end));
    expect(finding.prompt.length).toBeGreaterThan(0);
  }
}

describe('fictional development coverage', () => {
  it('contains exactly 18 distinct development drafts covering every family and clean controls', () => {
    expect(DEVELOPMENT_DRAFTS).toHaveLength(18);
    expect(new Set(DEVELOPMENT_DRAFTS.map(item => item.text)).size).toBe(18);
    expect(new Set(DEVELOPMENT_DRAFTS.flatMap(item => item.expected)).size).toBe(5);
    expect(DEVELOPMENT_DRAFTS.filter(item => !item.expected.length).length).toBeGreaterThanOrEqual(6);
  });
  for (const draft of DEVELOPMENT_DRAFTS) {
    it(`${draft.id}: ${draft.rationale}`, () => {
      expect([...rules(draft.text)].sort()).toEqual([...draft.expected].sort());
      verifySpans(draft.text);
    });
  }
});

describe('meaningful suppressions and changes in wording', () => {
  it.each([
    'I will send the meeting notes by Friday.',
    "I’ll share the agenda shortly.",
    'We will review the API documentation tomorrow.',
    'We will discuss the cost at the next call.',
    "We'll share the cost breakdown tomorrow.",
    'We will send instructions to deploy the connector.',
    'Please confirm that the connector will support the import format.',
    'Can you confirm the custom connector will ship by Friday?',
    'Will the connector support the new fields?',
    'If engineering approves, we will ship the feature on Friday.',
    'The connector will support the archive format, subject to testing.',
    "We can't promise the tool will be ready next week.",
    'The tool will not support binary imports.',
    'As agreed, please share your test tenant by Tuesday.',
    'As agreed, this is still a proposal.',
    'We have not agreed to the proposed timeline.',
    'It would be nice to catch up soon.',
    'Please send the team list as soon as possible, but no later than Friday.',
    'The access form should be submitted by your team on Tuesday.',
    'The access form needs to be submitted by Noor.',
    'No need to send the archive soon; the setup is not waiting on it.',
  ])('does not flag already clear or qualified wording: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it('flags an affirmative promise after a separate negated clause', () => {
    const text = 'We cannot deliver the archive importer this month, but we will ship the custom connector by Friday.';
    expect(rules(text)).toEqual(['commitment-confirmation']);
    expect(checkDraft(text).findings[0].quote).toBe('we will ship the custom connector by Friday.');
  });

  it('clears the vague-time finding when the request has a date', () => {
    expect(rules('Please upload the team list soon.')).toEqual(['vague-timing']);
    expect(rules('Please upload the team list by Tuesday.')).toEqual([]);
  });

  it('clears an unclear owner once a person takes responsibility', () => {
    expect(rules('Someone should upload the team list.')).toEqual(['action-owner']);
    expect(rules('Noor will upload the team list.')).toEqual([]);
  });

  it('keeps a deadline distinct from a responsible owner', () => {
    expect(rules('The access form needs to be submitted by Friday.')).toEqual(['action-owner']);
  });

  it('flags a pricing guarantee without treating a pricing conversation as a promise', () => {
    expect(rules('There will be no additional charges for the migration.')).toEqual(['commitment-confirmation']);
    expect(rules('We will review your subscription cost on Tuesday.')).toEqual([]);
  });

  it('does not infer an agreement problem from an unrelated pending decision', () => {
    expect(rules('The rollout approval is pending. As agreed, I will send the notes tomorrow.')).toEqual([]);
  });

  it('checks a directly referenced pending proposal', () => {
    expect(rules('This is still a proposal. As agreed, this is the rollout plan.')).toEqual(['agreement-wording']);
  });

  it('recognises product plurals and does not confuse the month May with uncertainty', () => {
    expect(rules('We will deliver the new features by May.')).toEqual(['commitment-confirmation']);
    expect(rules('The integrations will support the archive format.')).toEqual(['commitment-confirmation']);
    expect(rules('The integrations may support the archive format.')).toEqual([]);
  });
});

describe('independent review regressions: timing and qualification scope', () => {
  // Independently authored review examples; these are not reserved evaluation fixtures.
  it('does not apply a request to conversational timing in a different clause', () => {
    const text = 'Please review the tenant list; it was lovely to meet your team and I hope we speak soon.';
    expect(rules(text)).toEqual([]);
  });

  it.each([
    'We are not sure the connector will support the archive format.',
    'The connector will support the archive format, though this has not been confirmed.',
    'We are not yet certain the migration tool will be ready by Friday.',
    "The connector will support the archive format, though this hasn't yet been verified.",
    'It is uncertain whether the subscription price will remain fixed.',
  ])('suppresses an explicitly qualified commitment: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it('still reviews timing on a request or a dependency in its own clause', () => {
    expect(rules('Please review the tenant list soon; it was lovely to meet your team.')).toEqual(['vague-timing']);
    expect(rules('Please review the tenant list; the sample data arrives soon, so you can test the import.')).toEqual(['vague-timing']);
  });

  it('retains a separate definite promise after uncertainty', () => {
    for (const separator of ['; ', '. ', ', but ', ', however ']) {
      const promise = 'we will ship the custom export by Friday.';
      const text = 'We are not sure the connector will support the archive format' + separator + promise;
      expect(rules(text)).toEqual(['commitment-confirmation']);
      expect(checkDraft(text).findings[0].quote).toBe(promise);
      verifySpans(text);
    }
  });

  it('retains an earlier definite promise before a separately qualified statement', () => {
    const promise = 'We will ship the custom export by Friday';
    const text = promise + '; we are not sure the connector will support the archive format.';
    expect(rules(text)).toEqual(['commitment-confirmation']);
    expect(checkDraft(text).findings[0].quote).toBe(promise);
    verifySpans(text);
  });

  it('continues to review definite functionality and pricing claims', () => {
    expect(rules('The connector will support the archive format.')).toEqual(['commitment-confirmation']);
    expect(rules('Your subscription price will remain fixed for three years.')).toEqual(['commitment-confirmation']);
  });
});

describe('independent review regressions: resolved status and grammatical context', () => {
  it.each([
    'The proposed date is now confirmed for Tuesday.',
    'The proposed rollout date has been confirmed.',
  ])('does not confuse a resolved proposal with a pending one: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it.each([
    'Test results are attached. Review notes are ready. Update details are in the guide.',
    'Test results are attached; review notes are ready; update details are in the guide.',
  ])('does not count noun phrases as imperative requests: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it('still recognises imperative requests with explicit objects', () => {
    const text = 'Test the backup workflow; review the failure report; update the configuration file.';
    expect(rules(text)).toEqual(['competing-requests']);
    verifySpans(text);
  });

  it.each([
    'The budget decision is still pending, and we will discuss it next week.',
    'The budget decision is still pending, and we will discuss that next week.',
    'The budget decision is still pending, and we will discuss this next week.',
    'Your budget approval is still pending this week.',
    'This week, your budget approval is still pending.',
    'That budget decision is still pending.',
    'This budget decision is still pending.',
  ])('does not borrow a local object or time expression: %s', next => {
    const text = 'As agreed, I will send the meeting notes tomorrow. ' + next;
    expect(rules(text)).toEqual([]);
  });

  it('uses a direct reference to an unresolved approval in the next sentence', () => {
    const text = 'As agreed, we are using the shared sandbox. This is still awaiting your approval.';
    expect(rules(text)).toEqual(['agreement-wording']);
    verifySpans(text);
  });

  it.each([
    'We have not approved this budget.',
    'You have not approved that plan.',
    'We have not approved these decisions.',
    'You have not approved those changes.',
    'We have not approved this topic.',
    'You have not accepted that decision yet.',
    'We have not confirmed these budget decisions.',
    'You have not confirmed those topics.',
  ])('does not link a demonstrative introducing a different noun: %s', next => {
    expect(rules('As agreed, I will send the meeting notes tomorrow. ' + next)).toEqual([]);
  });

  it.each([
    'You have not approved this.',
    'You have not approved that yet.',
    'We have not approved these.',
    'We have not approved those yet.',
    'This is still awaiting your approval.',
    'It is still awaiting your approval.',
    'You have not approved this sandbox setup.',
  ])('retains a standalone or explicitly shared-topic pending reference: %s', next => {
    const text = 'As agreed, we are using the shared sandbox. ' + next;
    expect(rules(text)).toEqual(['agreement-wording']);
    verifySpans(text);
  });
});

describe('lead review regressions: preceding context and definite wording', () => {
  it.each([
    'As agreed, I will send the meeting notes this week.',
    'As agreed, I will send the meeting notes that afternoon.',
    'As agreed, I will discuss this budget tomorrow.',
    'As agreed, I will explain it tomorrow.',
  ])('does not use an internal or temporal reference to a prior decision: %s', agreement => {
    expect(rules('The budget decision is still pending. ' + agreement)).toEqual([]);
  });

  it.each([
    'This is the rollout plan.',
    'This will be the rollout plan.',
    'It is the rollout plan.',
  ])('keeps a direct prior-proposal reference: %s', agreement => {
    expect(rules('This is still a proposal. As agreed, ' + agreement)).toEqual(['agreement-wording']);
  });

  it.each([
    'The app needs to support archived records.',
    'The integration is difficult to build.',
    'We discussed whether the product can handle archived records.',
    'The migration cost is difficult to reduce.',
  ])('does not mistake non-definite wording for a definite promise: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it.each([
    'The app will support archived records.',
    'We guarantee the integration will be ready by Friday.',
    'The subscription price will remain fixed for three years.',
  ])('keeps explicit definite promises: %s', text => {
    expect(rules(text)).toEqual(['commitment-confirmation']);
    verifySpans(text);
  });
});

describe('competing requests and priority', () => {
  it('flags three unprioritised actions, but not just two or a long explanation', () => {
    const firstTwo = 'Please send the tenant ID. Could you approve the mapping?';
    expect(rules(firstTwo)).toEqual([]);
    expect(rules(`${firstTwo} Please confirm the attendees.`)).toEqual(['competing-requests']);
    expect(rules(`The sandbox data is fictional. ${'This is background detail. '.repeat(80)}${firstTwo}`)).toEqual([]);
  });

  it.each([
    '1. Please send the tenant ID.\n2. Please approve the mapping.\n3. Please confirm the attendees.',
    'First, please send the tenant ID. Then please approve the mapping. Finally, please confirm the attendees.',
    'Please start with the tenant ID. Please approve the mapping afterwards. Please confirm the attendees once those are complete.',
  ])('respects existing priority: %s', text => expect(rules(text)).toEqual([]));

  it('recognises unordered imperative bullets and a coordinated list of actions', () => {
    expect(rules('- Send the tenant ID.\n- Approve the mapping.\n- Confirm the attendees.')).toEqual(['competing-requests']);
    expect(rules('Please send the tenant ID, approve the mapping, and confirm the attendees.')).toEqual(['competing-requests']);
  });
});

describe('original evidence and history boundaries', () => {
  it('selects the active repeated promise at its actual Unicode offset', () => {
    const promise = 'We will ship the custom connector by Friday.';
    const text = `Hi Zoë 👩🏽‍💻,\r\n> ${promise}\r\n\r\n${promise}`;
    const result = checkDraft(text);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].start).toBe(text.lastIndexOf(promise));
    expect(result.findings[0].quote).toBe(promise);
    verifySpans(text);
  });

  it.each([
    '\n-- \nSomeone should upload the roster soon.',
    '\nOn Wednesday, Casey wrote:\nWe will ship the connector by Friday.',
    '\n-----Original Message-----\nWe guarantee the connector will support every format.',
    '\nFrom: Casey <casey@example.test>\nSent: Wednesday\nWe will ship the connector by Friday.',
    '\nSent from my fictional phone\nWe will ship the connector by Friday.',
  ])('ignores a recognised signature/history tail: %s', tail => {
    const text = 'Please share the tenant ID by Wednesday.' + tail;
    expect(rules(text)).toEqual([]);
    expect(checkDraft(text).excludedSections).toBeGreaterThan(0);
  });

  it('does not mistake a body request after thanks for a signature', () => {
    const text = 'Thanks,\nCould you share the workspace roster soon?';
    expect(rules(text)).toEqual(['vague-timing']);
    verifySpans(text);
  });

  it('does not include excluded quotations in competing-request evidence', () => {
    const text = 'Please share the roster.\n> Private history: We will ship a feature.\nPlease review the mapping.\nPlease confirm attendees.';
    expect(checkDraft(text).findings.every(finding => !finding.quote.includes('Private history'))).toBe(true);
    verifySpans(text);
  });

  it('handles whitespace, emoji, apostrophes, decimals and repeated phrases deterministically', () => {
    const texts = [
      '\t 👋 We’ll deliver the API integration by Friday.  ',
      'Hi Dr. Áine, the connector will support API v2.1 exports.',
      'Someone should upload the roster.\nSomeone should upload the roster.',
      'Could you share the team list\nwhen you get a chance?',
    ];
    for (const text of texts) {
      verifySpans(text);
      expect(checkDraft(text)).toEqual(checkDraft(text));
    }
  });

  it('recognises line-wrapped requests and preserves a line break inside evidence', () => {
    const request = 'Could you share the team list\r\nwhen you get a chance?';
    expect(rules(request)).toEqual(['vague-timing']);
    const promise = 'We will deliver the custom\nconnector by Friday.';
    expect(checkDraft(promise).findings[0].quote).toBe(promise);
    verifySpans(request);
    verifySpans(promise);
  });
});

describe('output contract, ranking and input limits', () => {
  it('returns an empty result for whitespace and checks the original character count', () => {
    expect(checkDraft(' \r\n\t')).toEqual({ findings: [], checkedCharacters: 4, excludedSections: 0 });
  });

  it('enforces the exact UTF-16 limit without silently truncating', () => {
    expect(checkDraft('x'.repeat(MAX_DRAFT_LENGTH)).findings).toEqual([]);
    expect(() => checkDraft('x'.repeat(MAX_DRAFT_LENGTH + 1))).toThrow(RangeError);
    expect(() => checkDraft('👋'.repeat(MAX_DRAFT_LENGTH / 2 + 1))).toThrow(RangeError);
  });

  it('ranks concerns, caps three and avoids repeated findings from the same family', () => {
    const text = 'Someone should upload the roster. Please share the tenant ID soon. We will ship the custom export by Friday. We will deliver the API connector by Monday. Please approve the mapping. Please confirm the training group.';
    expect(rules(text)).toEqual(['commitment-confirmation', 'action-owner', 'vague-timing']);
    expect(new Set(checkDraft(text).findings.map(item => item.id)).size).toBe(3);
    verifySpans(text);
  });

  it('does not double-review a commitment already covered by the agreement concern', () => {
    const text = 'As agreed, we will deliver the custom export by Friday, although approval is still pending.';
    expect(rules(text)).toEqual(['agreement-wording']);
  });

  it('does not invent replacement dates, names or unsupported verification claims', () => {
    const result = checkDraft('Someone should upload the form. Please send it soon. We will ship the new connector by Friday.');
    for (const finding of result.findings) {
      expect(finding.prompt).not.toMatch(/Monday|Tuesday|Noor|unauthori[sz]ed|false|verified|breach/);
      expect(Object.keys(finding).sort()).toEqual(['end', 'explanation', 'id', 'prompt', 'quote', 'ruleId', 'start', 'title']);
    }
  });
});
