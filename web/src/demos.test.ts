import { describe, expect, it } from 'vitest';
import { DEMO_DRAFTS, PORTFOLIO_DEMO_DRAFTS, PRIMARY_DEMO_ID } from './demos';
import { checkDraft } from './engine';
import { checkTone } from './engine/tone';
import type { ReviewFinding, ReviewLens } from './engine/types';

interface DemoExpectation {
  id: string;
  lens: ReviewLens;
  ruleId?: ReviewFinding['ruleId'];
  quote?: string;
  otherRuleId?: ReviewFinding['ruleId'];
  otherQuote?: string;
}

// These fixed fictional demos verify product examples, not detection accuracy.
const EXPECTED: DemoExpectation[] = [
  { id: 'clear-next-steps', lens: 'clarity' },
  {
    id: 'too-many-asks', lens: 'clarity', ruleId: 'competing-requests',
    quote: 'Please send your team roster.\nPlease upload your sample data.\nPlease review the workspace settings.',
    otherRuleId: 'judgmental-framing', otherQuote: "We shouldn't have to keep chasing your team.",
  },
  {
    id: 'promises-to-confirm', lens: 'clarity', ruleId: 'commitment-confirmation',
    quote: 'We guarantee that the custom integration will be ready by Friday.',
    otherRuleId: 'pressure-wording', otherQuote: 'Please send the name of your technical contact by Wednesday, 16 September so I can include them in the setup discussion, no more excuses.',
  },
  {
    id: 'tone-to-reconsider', lens: 'tone', ruleId: 'judgmental-framing',
    quote: 'This is not a good look, we are still waiting for your workspace list.',
    otherRuleId: 'action-owner', otherQuote: 'Someone should confirm the next setup session.',
  },
  {
    id: 'kickoff-owner', lens: 'clarity', ruleId: 'action-owner',
    quote: 'Someone should send the workspace list.',
    otherRuleId: 'dismissive-request', otherQuote: 'As I already told you, please confirm your administrator names.',
  },
  { id: 'blocked-import', lens: 'clarity', ruleId: 'vague-timing', quote: 'soon',
    otherRuleId: 'judgmental-framing', otherQuote: 'This is not a good look, we are still waiting for your data.' },
  {
    id: 'pending-rollout', lens: 'clarity', ruleId: 'agreement-wording',
    quote: 'As agreed, the phased rollout starts on Monday, although your approval is still pending.',
    otherRuleId: 'dismissive-request', otherQuote: 'We need you to stop holding this up and confirm the rollout decision.',
  },
  {
    id: 'dismissive-chase', lens: 'tone', ruleId: 'dismissive-request',
    quote: 'As I already told you, please send the workspace list soon so we can map each data file to the correct destination before the import.',
    otherRuleId: 'vague-timing', otherQuote: 'soon',
  },
  {
    id: 'deadline-pressure', lens: 'tone', ruleId: 'pressure-wording',
    quote: 'Please send the workspace list by Thursday, no more excuses.',
    otherRuleId: 'commitment-confirmation', otherQuote: 'We guarantee that the workspace integration will be ready by Friday.',
  },
];

describe('fictional scenario examples', () => {
  it('covers all nine examples with distinct identifiers', () => {
    expect(DEMO_DRAFTS.map(demo => demo.id)).toEqual(EXPECTED.map(item => item.id));
    expect(new Set(DEMO_DRAFTS.map(demo => demo.id)).size).toBe(9);
  });

  it.each(EXPECTED)('$id produces the intended finding and exact evidence', expected => {
    const demo = DEMO_DRAFTS.find(item => item.id === expected.id)!;
    expect(demo.preferredLens).toBe(expected.lens);
    const results = {
      clarity: checkDraft(demo.text),
      tone: checkTone(demo.text, 'collaborative'),
    };
    for (const lens of ['clarity', 'tone'] as const) {
      const findings = results[lens].findings;
      const ruleId = lens === expected.lens ? expected.ruleId : expected.otherRuleId;
      const quote = lens === expected.lens ? expected.quote : expected.otherQuote;
      if (!ruleId) {
        expect(findings).toEqual([]);
        continue;
      }
      expect(findings).toHaveLength(1);
      const finding = findings[0];
      expect(finding.ruleId).toBe(ruleId);
      expect(finding.quote).toBe(quote);
      const start = demo.text.indexOf(quote!);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(finding.start).toBe(start);
      expect(finding.end).toBe(start + quote!.length);
      expect(demo.text.slice(finding.start, finding.end)).toBe(quote);
    }
  });
});

describe('commercial portfolio examples', () => {
  const expected: DemoExpectation[] = [
    {
      id: 'partner-co-selling', lens: 'clarity', ruleId: 'action-owner',
      quote: 'Someone should send the meeting invite.',
    },
    {
      id: 'discovery-follow-up', lens: 'clarity', ruleId: 'vague-timing',
      quote: 'soon',
    },
    {
      id: 'renewal-discussion', lens: 'clarity', ruleId: 'agreement-wording',
      quote: 'As agreed, the renewal includes the analytics add-on, although your approval is still pending.',
      otherRuleId: 'dismissive-request',
      otherQuote: 'As I already told you, please confirm the renewal decision.',
    },
    { id: 'clear-commercial-follow-up', lens: 'clarity' },
  ];

  it('makes the partner handoff primary and keeps identifiers distinct from legacy examples', () => {
    expect(PORTFOLIO_DEMO_DRAFTS.map(demo => demo.id)).toEqual(expected.map(item => item.id));
    expect(PORTFOLIO_DEMO_DRAFTS[0].id).toBe(PRIMARY_DEMO_ID);
    const all = [...DEMO_DRAFTS, ...PORTFOLIO_DEMO_DRAFTS];
    expect(new Set(all.map(demo => demo.id)).size).toBe(all.length);
  });

  it.each(expected)('$id demonstrates real checks with exact original evidence', item => {
    const demo = PORTFOLIO_DEMO_DRAFTS.find(example => example.id === item.id)!;
    expect(demo.preferredLens).toBe(item.lens);
    const clarity = checkDraft(demo.text).findings;
    expect(clarity.map(finding => finding.ruleId)).toEqual(item.ruleId ? [item.ruleId] : []);
    if (item.quote) expect(clarity[0].quote).toBe(item.quote);

    for (const style of ['direct', 'collaborative', 'warm'] as const) {
      const tone = checkTone(demo.text, style).findings;
      expect(tone.map(finding => finding.ruleId)).toEqual(item.otherRuleId ? [item.otherRuleId] : []);
      if (item.otherQuote) expect(tone[0].quote).toBe(item.otherQuote);
      for (const finding of [...clarity, ...tone]) {
        expect(finding.start).toBe(demo.text.indexOf(finding.quote));
        expect(finding.end).toBe(finding.start + finding.quote.length);
        expect(demo.text.slice(finding.start, finding.end)).toBe(finding.quote);
      }
    }
  });
});
