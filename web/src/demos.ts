import type { DemoDraft } from './engine/types';

export const TONE_DEMO_ID = 'tone-to-reconsider';

export const DEMO_DRAFTS: DemoDraft[] = [
  {
    id: 'clear-next-steps',
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
    label: 'Tone to reconsider',
    description: 'Judgmental wording beside an ordinary request.',
    text: `Hi Riley,

Thanks for joining the workspace setup call.

This is not a good look, we are still waiting for your workspace list.

Please send the workspace list by Thursday.

Best,
Morgan`,
  },
];
