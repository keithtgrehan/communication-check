import { describe, expect, it } from 'vitest';
import { DEMO_DRAFTS } from './demos';
import { checkDraft } from './engine';
import { checkTone } from './engine/tone';
import type { ReviewFinding, ReviewLens } from './engine/types';

interface DemoExpectation {
  id: string;
  lens: ReviewLens;
  ruleId?: ReviewFinding['ruleId'];
  quote?: string;
}

// These fixed fictional demos verify product examples, not detection accuracy.
const EXPECTED: DemoExpectation[] = [
  { id: 'clear-next-steps', lens: 'clarity' },
  {
    id: 'too-many-asks', lens: 'clarity', ruleId: 'competing-requests',
    quote: 'Please send your team roster.\nPlease upload your sample data.\nPlease review the workspace settings.',
  },
  {
    id: 'promises-to-confirm', lens: 'clarity', ruleId: 'commitment-confirmation',
    quote: 'We guarantee that the custom integration will be ready by Friday.',
  },
  {
    id: 'tone-to-reconsider', lens: 'tone', ruleId: 'judgmental-framing',
    quote: 'This is not a good look, we are still waiting for your workspace list.',
  },
  {
    id: 'kickoff-owner', lens: 'clarity', ruleId: 'action-owner',
    quote: 'Someone should send the workspace list.',
  },
  { id: 'blocked-import', lens: 'clarity', ruleId: 'vague-timing', quote: 'soon' },
  {
    id: 'pending-rollout', lens: 'clarity', ruleId: 'agreement-wording',
    quote: 'As agreed, the phased rollout starts on Monday, although your approval is still pending.',
  },
  {
    id: 'dismissive-chase', lens: 'tone', ruleId: 'dismissive-request',
    quote: 'As I already told you, please send the workspace list.',
  },
  {
    id: 'deadline-pressure', lens: 'tone', ruleId: 'pressure-wording',
    quote: 'Please send the workspace list by Thursday, no more excuses.',
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
      if (lens !== expected.lens || !expected.ruleId) {
        expect(findings).toEqual([]);
        continue;
      }
      expect(findings).toHaveLength(1);
      const finding = findings[0];
      expect(finding.ruleId).toBe(expected.ruleId);
      expect(finding.quote).toBe(expected.quote);
      const start = demo.text.indexOf(expected.quote!);
      expect(start).toBeGreaterThanOrEqual(0);
      expect(finding.start).toBe(start);
      expect(finding.end).toBe(start + expected.quote!.length);
      expect(demo.text.slice(finding.start, finding.end)).toBe(expected.quote);
    }
  });
});
