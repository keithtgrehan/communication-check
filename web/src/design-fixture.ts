/**
 * Fictional, fixed content used only by the design-exploration route. This is
 * deliberately separate from the checker engine: changing these controls does
 * not analyse text or affect the working review desk.
 */
export const explorationFixture = {
  draft: `Hi Sam,

It was helpful to hear how your team plans to use the reporting workspace.

We guarantee that the custom integration will be ready by Friday.

Please send the name of your technical contact by Wednesday, 16 September so I can include them in the setup discussion, no more excuses.

Best,
Morgan`,
  finding: {
    title: 'Check this commitment',
    quote: 'We guarantee that the custom integration will be ready by Friday.',
    explanation: 'This wording makes a definite promise about delivery, pricing or product functionality.',
    question: 'Has the responsible person or team confirmed this commitment, including any conditions or dependencies?',
  },
} as const;
