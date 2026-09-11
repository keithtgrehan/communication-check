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
