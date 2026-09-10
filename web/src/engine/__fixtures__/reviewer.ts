/** Public development/review regression cases for the shared clause/action-frame refactor; never a heldout evaluation set.
 * Independently authored by the reviewer from docs/PRODUCT_BRIEF.md on 2026-09-10. No reserved or consumed corpus, development fixtures, demos, or in-progress refactor code was opened for this task. These agent-authored labels express intended review behavior, not human validation or measured engine performance. The cases have not been run against the implementation.
 */
export const REVIEWER_CASES = [
  {
    "id": "review-owner-modal-chain",
    "draft": "For the welcome pack to go out, somebody will have to approve the recipient groups.",
    "expectedRuleIds": [
      "action-owner"
    ],
    "rationale": "An explicit prerequisite is assigned to an unspecified person through a future obligation chain.",
    "provenance": "Novel fictional reviewer-authored development case; public regression use only."
  },
  {
    "id": "review-owner-passive-prerequisite",
    "draft": "The regional contact details need to be verified before the kickoff invitations are prepared.",
    "expectedRuleIds": [
      "action-owner"
    ],
    "rationale": "The verification must happen before another task, but the passive wording never identifies who performs it.",
    "provenance": "Novel fictional reviewer-authored development case; public regression use only."
  },
  {
    "id": "review-timing-dependent-return",
    "draft": "Once the questionnaires are back, we can prepare your workspace. Please return yours whenever you have a moment.",
    "expectedRuleIds": [
      "vague-timing"
    ],
    "rationale": "A direct return request uses an indefinite time while the preceding sentence establishes dependent preparation.",
    "provenance": "Novel fictional reviewer-authored development case; public regression use only."
  },
  {
    "id": "review-timing-politeness-and-dependency",
    "draft": "Please approve the training outline at your earliest convenience; the facilitator cannot finish the materials until then.",
    "expectedRuleIds": [
      "vague-timing"
    ],
    "rationale": "Polite but nonspecific timing governs an approval that is explicitly blocking the facilitator's work; the separate negative dependency does not cancel the request.",
    "provenance": "Novel fictional reviewer-authored development case; public regression use only."
  },
  {
    "id": "review-agreement-pending-arrangement",
    "draft": "We agreed on letting each region choose its own onboarding date, although your approval of that arrangement is still pending.",
    "expectedRuleIds": [
      "agreement-wording"
    ],
    "rationale": "The sentence states agreement while explicitly leaving approval of the same arrangement pending.",
    "provenance": "Novel fictional reviewer-authored development case; public regression use only."
  },
  {
    "id": "review-agreement-referenced-approach",
    "draft": "We confirmed the approach of training the administrators first. You have not yet accepted that approach.",
    "expectedRuleIds": [
      "agreement-wording"
    ],
    "rationale": "The next sentence expressly refers to the same approach and says acceptance is outstanding, so confirmation wording warrants review.",
    "provenance": "Novel fictional reviewer-authored development case; public regression use only."
  },
  {
    "id": "review-clean-named-modal-owner",
    "draft": "Marin will have to approve the recipient groups before the welcome pack goes out.",
    "expectedRuleIds": [],
    "rationale": "The named person owns the approval even though its obligation uses multiple verbs and has a dependent task.",
    "provenance": "Novel fictional reviewer-authored development control; public regression use only."
  },
  {
    "id": "review-clean-causative-with-explicit-agent",
    "draft": "Please get the regional contact details verified by Noura before the kickoff invitations are prepared.",
    "expectedRuleIds": [],
    "rationale": "The recipient is asked to arrange a verification that explicitly names Noura as its performer; the prerequisite does not make ownership unclear.",
    "provenance": "Novel fictional reviewer-authored development control; public regression use only."
  },
  {
    "id": "review-clean-return-with-deadline",
    "draft": "Please return your completed questionnaire by 14 October. That leaves two days for preparation.",
    "expectedRuleIds": [],
    "rationale": "The request has a legitimate explicit deadline and one clear action. The checker must not assess the factual claim about available preparation time.",
    "provenance": "Novel fictional reviewer-authored development control; public regression use only."
  },
  {
    "id": "review-clean-event-trigger",
    "draft": "The facilitator's draft is ready. Please approve the training outline when you can see the revisions in the portal.",
    "expectedRuleIds": [],
    "rationale": "The time clause states a concrete visibility trigger; 'when you can' is followed by the event and is not an indefinite convenience request.",
    "provenance": "Novel fictional reviewer-authored development control; public regression use only."
  },
  {
    "id": "review-clean-confirmation-after-approval",
    "draft": "Each region suggested its preferred onboarding date, and we've now confirmed the selections after receiving approval.",
    "expectedRuleIds": [],
    "rationale": "The draft expressly resolves the earlier suggestions by recording approval before confirmation; there is no stated outstanding decision.",
    "provenance": "Novel fictional reviewer-authored development control; public regression use only."
  },
  {
    "id": "review-clean-qualified-unagreed-format",
    "draft": "The facilitator may combine the two training groups, subject to your approval. No final format has been agreed.",
    "expectedRuleIds": [],
    "rationale": "Both the qualification and the explicit absence of agreement describe a tentative format without presenting it as settled.",
    "provenance": "Novel fictional reviewer-authored development control; public regression use only."
  }
] as const;
