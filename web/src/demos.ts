import type { DemoDraft as BaseDemoDraft, ReviewLens } from './engine/types';

export interface DemoDraft extends BaseDemoDraft {
  preferredLens: ReviewLens;
}

export const TONE_DEMO_ID = 'tone-to-reconsider';

export const DEMO_DRAFTS: DemoDraft[] = [
  {
    id: 'clear-next-steps',
    preferredLens: 'clarity',
    label: 'Clear next steps',
    description: 'A focused follow-up with an owner and a specific next step.',
    text: `Hi Maya,

Thanks for walking through the workspace setup today.

First, please send me the names of your two workspace administrators by Tuesday, 15 September. Once I have those names, I’ll send each administrator the setup guide.

We can discuss the reporting options at our next onboarding session.

Best,
Alex`,
  },
  {
    id: 'too-many-asks',
    preferredLens: 'clarity',
    label: 'Too many asks',
    description: 'Several requests compete for the customer’s attention.',
    text: `Hi Jordan,

Thanks for today's onboarding check-in. We're still waiting on the roster and sample data requested last week. We shouldn't have to keep chasing your team.

Please send your team roster.
Please upload your sample data.
Please review the workspace settings.
Please book a training session.
Please confirm your reporting requirements.

Looking forward to getting your team started.

Best,
Casey`,
  },
  {
    id: 'promises-to-confirm',
    preferredLens: 'clarity',
    label: 'Promises to confirm',
    description: 'A product commitment that deserves a second look.',
    text: `Hi Sam,

It was helpful to hear how your team plans to use the reporting workspace.

We guarantee that the custom integration will be ready by Friday.

Please send the name of your technical contact by Wednesday, 16 September so I can include them in the setup discussion, no more excuses.

Best,
Morgan`,
  },
  {
    id: TONE_DEMO_ID,
    preferredLens: 'tone',
    label: 'Tone to reconsider',
    description: 'Judgmental wording beside an ordinary request.',
    text: `Hi Riley,

Thanks for joining the workspace setup call.

This is not a good look, we are still waiting for your workspace list.

Please send the workspace list by Thursday.

Someone should confirm the next setup session.

Best,
Morgan`,
  },
  {
    id: 'kickoff-owner',
    preferredLens: 'clarity',
    label: 'Kickoff handoff',
    description: 'A setup handoff leaves responsibility open.',
    text: `Hi Avery,

Thanks for joining the onboarding kickoff.

Someone should send the workspace list.

As I already told you, please confirm your administrator names.

Best,
Alex`,
  },
  {
    id: 'blocked-import',
    preferredLens: 'clarity',
    label: 'Blocked data import',
    description: 'An import depends on a request with vague timing.',
    text: `Hi Priya,

Thanks for walking through the data setup with me.

This is not a good look, we are still waiting for your data.

Please send the sample data soon so we can start the import.

Best,
Casey`,
  },
  {
    id: 'pending-rollout',
    preferredLens: 'clarity',
    label: 'Pending rollout decision',
    description: 'Agreement wording sits beside an approval still pending.',
    text: `Hi Jamie,

Thanks for discussing the rollout plan today.

As agreed, the phased rollout starts on Monday, although your approval is still pending. We need you to stop holding this up and confirm the rollout decision.

Best,
Morgan`,
  },
  {
    id: 'dismissive-chase',
    preferredLens: 'tone',
    label: 'Chasing a missing list',
    description: 'A follow-up request refers dismissively to an earlier reminder.',
    text: `Hi Taylor,

The workspace list is the topic for our next setup session.

As I already told you, please send the workspace list soon so we can map each data file to the correct destination before the import.

Best,
Alex`,
  },
  {
    id: 'deadline-pressure',
    preferredLens: 'tone',
    label: 'Deadline pressure',
    description: 'Pressure wording accompanies an ordinary deadline.',
    text: `Hi Devon,

Our next onboarding session covers workspace access.

Please send the workspace list by Thursday, no more excuses.

We guarantee that the workspace integration will be ready by Friday.

Best,
Casey`,
  },
];

export const PRIMARY_DEMO_ID = 'partner-co-selling';

// Curated fictional portfolio examples use the same checks as a pasted draft.
// Keep the earlier examples above unchanged for legacy and regression coverage.
export const PORTFOLIO_DEMO_DRAFTS: DemoDraft[] = [
  {
    id: PRIMARY_DEMO_ID,
    preferredLens: 'clarity',
    label: 'Partner co-selling handoff',
    description: 'A vendor, partner and customer leave the next step unassigned.',
    text: `Hi Maya and Jordan,

Thanks for the joint call. Maya, your partner team will lead the commercial discussion; our vendor team will cover the product demo. Jordan will bring the customer's operations team.

Someone should send the meeting invite.

Best,
Alex`,
  },
  {
    id: 'discovery-follow-up',
    preferredLens: 'clarity',
    label: 'Discovery-call follow-up',
    description: 'The proposed demo depends on a customer request with vague timing.',
    text: `Hi Priya,

Thanks for explaining how your sales team tracks partner referrals.

Please send the reporting requirements soon so we can prepare the demo.

I'll bring our solutions consultant to the next call.

Best,
Casey`,
  },
  {
    id: 'renewal-discussion',
    preferredLens: 'clarity',
    label: 'Renewal discussion',
    description: 'A pending renewal is presented as agreed, with a pointed reminder.',
    text: `Hi Sam,

Thanks for discussing the renewal options.

As agreed, the renewal includes the analytics add-on, although your approval is still pending.

As I already told you, please confirm the renewal decision.

Best,
Morgan`,
  },
  {
    id: 'clear-commercial-follow-up',
    preferredLens: 'clarity',
    label: 'Clear follow-up',
    description: 'A comparison with named owners and a specific next step.',
    text: `Hi Maya and Jordan,

Thanks for the joint call.

Maya, please send the customer meeting invite by Tuesday, 13 October. Our vendor team will demonstrate the reporting workflow; your partner team will lead the commercial discussion. Jordan will bring the customer's operations team.

The pricing proposal is still subject to your review and approval.

Best,
Alex`,
  },
];
