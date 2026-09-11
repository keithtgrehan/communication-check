import type { RuleId } from '../types';

/** Fictional development examples, distinct from the three UI demos and reserved evaluation. */
export interface DevelopmentDraft {
  id: string;
  text: string;
  expected: RuleId[];
  rationale: string;
}

export const DEVELOPMENT_DRAFTS: DevelopmentDraft[] = [
  {
    id: 'unclear-owner',
    text: 'Hi Noor,\nSomeone should upload the workspace roster before the setup session.\nThanks,\nEllis',
    expected: ['action-owner'],
    rationale: 'A real next action is assigned to an unspecified person.',
  },
  {
    id: 'passive-owner',
    text: 'The access form needs to be submitted before Wednesday so that provisioning can begin.',
    expected: ['action-owner'],
    rationale: 'The passive next step has no responsible party.',
  },
  {
    id: 'vague-request',
    text: 'Could you share the tenant ID when you get a chance? We need it to connect the sandbox.',
    expected: ['vague-timing'],
    rationale: 'A requested dependency uses a nonspecific time.',
  },
  {
    id: 'dependent-timing',
    text: 'The SSO configuration will be ready soon, so you can begin the access review.',
    expected: ['vague-timing', 'commitment-confirmation'],
    rationale: 'Dependent work is tied to vague timing and a definite product-readiness promise.',
  },
  {
    id: 'three-requests',
    text: 'Please send your workspace roster. Could you review the import mapping? Please confirm the training attendees.',
    expected: ['competing-requests'],
    rationale: 'Three separate actions lack an explicit first step.',
  },
  {
    id: 'proposal-as-agreed',
    text: 'As agreed, the phased rollout starts on Monday, although your approval is still pending.',
    expected: ['agreement-wording'],
    rationale: 'Agreement language explicitly conflicts with a pending approval.',
  },
  {
    id: 'delivery-promise',
    text: 'We will deliver the custom audit export by 18 October.',
    expected: ['commitment-confirmation'],
    rationale: 'A definite product delivery commitment merits confirmation.',
  },
  {
    id: 'pricing-promise',
    text: 'Your subscription price will remain fixed for the next three years.',
    expected: ['commitment-confirmation'],
    rationale: 'A strong future pricing commitment merits confirmation.',
  },
  {
    id: 'functionality-promise',
    text: 'The connector will support all of your legacy account fields without any manual changes.',
    expected: ['commitment-confirmation'],
    rationale: 'A definite functionality promise merits confirmation.',
  },
  {
    id: 'clear-owner-date',
    text: 'Mika will send the completed access form by Thursday. Please review section B by 14 October.',
    expected: [],
    rationale: 'Clear responsibilities and legitimate deadlines are not problems.',
  },
  {
    id: 'ordered-checklist',
    text: 'Please work through these steps in order:\n1. Send the workspace roster.\n2. Review the import mapping.\n3. Confirm the training attendees.',
    expected: [],
    rationale: 'An ordered checklist already establishes a first action.',
  },
  {
    id: 'long-technical-control',
    text: 'For reference, the SCIM configuration guide describes how identity records map into the workspace. The SAML metadata contains an entity ID, a certificate, and the sign-in URL. Our sandbox uses fictional test accounts and the audit screen shows the most recent sync attempt. The attached diagram explains each field and the validation messages. Please ask Rowan to review the mapping by Tuesday. I will send the meeting notes tomorrow.',
    expected: [],
    rationale: 'Length, acronyms, technical detail and routine notes are not overload or risky promises.',
  },
  {
    id: 'negated-commitment',
    text: 'We cannot guarantee that the connector will support the archive format. We will not ship the migration tool this month.',
    expected: [],
    rationale: 'The draft expressly declines the commitments.',
  },
  {
    id: 'qualified-commitment',
    text: 'We aim to deliver the audit export in November, subject to engineering review. The connector may support the archive format; this still needs testing.',
    expected: [],
    rationale: 'Aspirations and uncertainty are already explicit.',
  },
  {
    id: 'ordinary-agreement-timing',
    text: "As agreed, I’ll send the meeting notes tomorrow. It was lovely to meet you; speak soon!",
    expected: [],
    rationale: 'Agreement alone and conversational timing are not grounds for a flag.',
  },
  {
    id: 'signature-history',
    text: 'Please send the team list by Monday.\n\nBest regards,\nAvery Moss\nCustomer Success\n\nOn Tuesday, Jules wrote:\n> We guarantee that the connector will support every format.\n> Someone should sort this out soon.',
    expected: [],
    rationale: 'Recognised history and signatures are excluded without changing offsets.',
  },
  {
    id: 'unicode-repeated-evidence',
    text: 'Hi Zoë 👋,\n> We will ship the custom connector by Friday.\nWe will ship the custom connector by Friday.',
    expected: ['commitment-confirmation'],
    rationale: 'Only the active promise is evidence, even with emoji and a repeated quoted sentence.',
  },
  {
    id: 'explicit-priority',
    text: 'Please start with the access form. Could you review the field mapping afterwards? Please confirm the session attendees once those steps are complete.',
    expected: [],
    rationale: 'Several requests have an explicit first action and sequence.',
  },
];
