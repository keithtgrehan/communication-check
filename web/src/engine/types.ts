/** Offsets use JavaScript UTF-16 indices into the unchanged original draft. */
export type RuleId =
  | 'action-owner'
  | 'vague-timing'
  | 'competing-requests'
  | 'agreement-wording'
  | 'commitment-confirmation';

export interface Finding {
  id: string;
  ruleId: RuleId;
  title: string;
  start: number;
  end: number;
  quote: string;
  explanation: string;
  prompt: string;
}

export interface CheckResult {
  findings: Finding[];
  checkedCharacters: number;
  excludedSections: number;
}

export interface DemoDraft {
  id: string;
  label: string;
  description: string;
  text: string;
}

export const MAX_DRAFT_LENGTH = 12_000;
export const MAX_FINDINGS = 3;

export type ReviewLens = 'clarity' | 'tone';
export type ToneIntent = 'direct' | 'collaborative' | 'warm';
export type ToneRuleId = 'sweeping-blame' | 'dismissive-request' | 'pressure-wording' | 'judgmental-framing';
export interface ToneFinding extends Omit<Finding, 'ruleId'> {
  ruleId: ToneRuleId;
}
export interface ToneCheckResult extends Omit<CheckResult, 'findings'> {
  findings: ToneFinding[];
}
export type ReviewFinding = Finding | ToneFinding;
export interface ReviewResult extends Omit<CheckResult, 'findings'> {
  findings: ReviewFinding[];
}
export const MAX_TONE_FINDINGS = 2;

/** Decisions belong to a particular text/intent snapshot, never a title alone. */
export function findingIdentity(finding: ReviewFinding): string {
  return JSON.stringify([finding.ruleId, finding.start, finding.end, finding.quote]);
}

export interface ReviewSnapshot {
  textRevision: number;
  /** Null for clarity; tone uses the current intent revision. */
  intentRevision: number | null;
  result: ReviewResult;
  reviewedIds: string[];
  expandedId: string | null;
}
