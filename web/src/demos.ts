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

Thanks for joining the onboarding session today. Here are the things we need to move forward.

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

Please send the name of your technical contact by Wednesday, 16 September so I can include them in the setup discussion.

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

As agreed, the phased rollout starts on Monday, although your approval is still pending.

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

As I already told you, please send the workspace list.

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

Best,
Casey`,
  },
];
