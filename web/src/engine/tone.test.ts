import { describe, expect, it } from 'vitest';
import { checkTone, tonePromptFor } from './tone';
import { findingIdentity, MAX_DRAFT_LENGTH, MAX_TONE_FINDINGS, type ToneIntent, type ToneRuleId } from './types';

// Fresh fictional development inputs only. These exercise the bounded policy;
// they are not a heldout evaluation or evidence of general tone accuracy.
const intents: ToneIntent[] = ['direct', 'collaborative', 'warm'];
const rules = (text: string, intent: ToneIntent = 'collaborative') => checkTone(text, intent).findings.map(finding => finding.ruleId);

function verifyEvidence(text: string): void {
  const result = checkTone(text, 'collaborative');
  expect(result.findings.length).toBeLessThanOrEqual(MAX_TONE_FINDINGS);
  expect(result.checkedCharacters).toBe(text.length);
  for (const finding of result.findings) {
    expect(finding.start).toBeGreaterThanOrEqual(0);
    expect(finding.end).toBeGreaterThan(finding.start);
    expect(finding.end).toBeLessThanOrEqual(text.length);
    expect(text.slice(finding.start, finding.end)).toBe(finding.quote);
    expect(finding.explanation.length).toBeGreaterThan(0);
    expect(finding.prompt.length).toBeGreaterThan(0);
  }
}

describe('bounded tone wording cues', () => {
  it.each([
    'You always ignore our requests.',
    'You always miss the deadlines for the import checklist.',
    'You never respond to my emails about access.',
    'You never follow the instructions for the sandbox.',
    'You always fail to share the account roster.',
    'YOU ALWAYS DISREGARD OUR FEEDBACK!',
    'You never reply.',
  ])('grounds sweeping wording in an addressed coordination action: %s', text => {
    expect(rules(text)).toEqual(['sweeping-blame']);
    expect(checkTone(text, 'collaborative').findings[0].quote).toBe(text);
    verifyEvidence(text);
  });

  it.each([
    'Stop making excuses and send the sandbox roster.',
    'Stop wasting our time and please confirm the owner.',
    'Stop wasting my time and upload the revised CSV!',
  ])('requires an explicit accusation attached to a request: %s', text => {
    expect(rules(text)).toEqual(['dismissive-request']);
    verifyEvidence(text);
  });

  it.each([
    'Please send the workspace list by Thursday, no excuses.',
    'You must submit the checklist by 16:00—no excuses!',
    'I expect you to confirm the sandbox owner; or else.',
    'Reply by Friday, or else.',
    'You need to review the form–no excuses.',
  ])('requires explicit added pressure rather than urgency alone: %s', text => {
    expect(rules(text)).toEqual(['pressure-wording']);
    verifyEvidence(text);
  });

  it('analyses fresh arbitrary request contents rather than a demo lookup', () => {
    for (const action of ['send', 'upload', 'review']) {
      for (const object of ['the Juniper workspace roster', 'record 739 for the café team', 'the 🧩 pilot checklist']) {
        const text = `Please ${action} ${object} by Wednesday, no excuses.`;
        expect(rules(text)).toEqual(['pressure-wording']);
        verifyEvidence(text);
      }
    }
  });
});

describe('bounded judgment and request additions', () => {
  it.each([
    'This is not a good look, is it?!',
    'This is not a good look!?',
    'You should know better, right?!',
    'You should know better!?',
    'You always ignore our requests?!',
    'Please send the list, no more excuses?!',
  ])('abstains on questions with mixed terminal punctuation: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it.each([
    'Not a good look.',
    'This is not a good look.',
    'That’s not a good look.',
    "It's not a good look!",
    'THIS IS NOT A GOOD LOOK!',
    'This is not a good look, we are still waiting for the workspace list.',
    'Not a good look, the import checklist is still incomplete.',
    'Several teams are waiting on access and the project lead is asking about progress, not a good look',
    'The checklist is incomplete, that is not a good look.',
    'You should know better.',
    'YOU SHOULD KNOW BETTER!',
    'You should know better, please review the import checklist.',
    'You should know better than to skip the agreed review.',
  ])('recognises only the defined evaluative constructions: %s', text => {
    for (const intent of intents) expect(rules(text, intent)).toEqual(['judgmental-framing']);
    expect(checkTone(text, 'warm').findings[0].quote).toBe(text);
    verifyEvidence(text);
  });

  it.each([
    'As I already told you, send the workspace list.',
    'As I already told you, please confirm the import owner.',
    'AS I ALREADY TOLD YOU, UPLOAD THE CHECKLIST!',
    'As I already told you, you need to review the sandbox details.',
    'As I already told you, I expect you to reply by Thursday.',
  ])('grounds the dismissive reminder in an explicit request: %s', text => {
    expect(rules(text)).toEqual(['dismissive-request']);
    expect(checkTone(text, 'direct').findings[0].quote).toBe(text);
    verifyEvidence(text);
  });

  it.each([
    'Please send the workspace list by Thursday, no more excuses.',
    'You must submit the form—no more excuses!',
    'I need you to review the checklist; no more excuses.',
    'UPLOAD THE LIST, NO MORE EXCUSES!',
  ])('extends only the request-ending pressure construction: %s', text => {
    expect(rules(text)).toEqual(['pressure-wording']);
    expect(checkTone(text, 'direct').findings[0].quote).toBe(text);
    verifyEvidence(text);
  });

  it.each([
    'This is not a good look at the workspace.',
    'Not a good look at the revised dashboard.',
    'The screenshot is not a good look at the settings.',
    'This is not a good look view of the workspace.',
    'This is not a good view of the dashboard.',
    'That is not a good lookup key.',
    'You should know better than anyone how the import works.',
    'You should know better how the settings work after training.',
    'We should know better.',
    'You could have handled that better.',
    'This reflects poorly on the team.',
    'That looks bad.',
    'This is a bad look.',
    'As I told you, please send the checklist.',
    'As I already told you, the workspace is ready.',
    'As I already told you, thanks for sending the checklist.',
    'As I already told you, could you send the checklist?',
    'As I already told you to send the checklist, the owner is waiting.',
    'No more excuses.',
    'There are no more excuses.',
    'Please send the list with no more excuses.',
    'Please send the list, no further excuses.',
    'Please send the list, no more excuses are needed.',
    'Please send the list, no more excuses about the delay.',
  ])('retains ordinary uses and unsupported paraphrases as boundaries: %s', text => {
    for (const intent of intents) expect(rules(text, intent)).toEqual([]);
  });

  it.each([
    'This is not a good look?',
    'You should know better?',
    'This is not a good look, but that is not true.',
    'The delay is not unusual, not a good look.',
    'This is not a good look, not a good look.',
    'This is not a good look, unless the screenshot is outdated.',
    'This is not a good look, if the report is accurate.',
    'If this is not a good look, we can discuss it.',
    'Perhaps this is not a good look.',
    'This is not a good look, apparently.',
    'Do not say you should know better.',
    'You should not know better.',
    'You should know better, but that is untrue.',
    'You should know better, if the checklist was available.',
    'You should know better, said the project lead.',
    'You should know better, wrote the project lead.',
    'You should know better, the project lead told me.',
    'This is not a good look, according to the project lead.',
    'The report says this is not a good look.',
    'I forgot the checklist, not a good look.',
    'We missed the deadline, not a good look.',
    'This is not a good look, my own mistake.',
    'You should know better, I tell myself.',
    'As I already told you, please do not send the checklist.',
    'As I already told you, please send the checklist if ready.',
    'As I already told you, please send the sample.',
    'As I already told you, please send the checklist, according to the example.',
    'Please send the list if ready, no more excuses.',
    'Please do not send the list, no more excuses.',
    'Please send the list, no more excuses, unless access is blocked.',
    'The lead said: Please send the list, no more excuses.',
  ])('preserves qualification, reporting and identifiable self-reflection safeguards: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it.each([
    'This is not a good look.',
    'You should know better.',
    'As I already told you, please send the workspace list.',
    'Please send the workspace list, no more excuses.',
  ])('excludes new cues in quotation and recognised history: %s', cue => {
    for (const text of [`“${cue}”`, `"${cue}"`, `> ${cue}`, `On Monday, Riley wrote:\n${cue}`]) {
      expect(rules(text)).toEqual([]);
    }
  });

  it('keeps exact UTF-16 evidence for the active repeated evaluative sentence', () => {
    const cue = 'This is not a good look, the 🧩 import checklist is still incomplete.';
    const text = `🪴 Notes for Zoë\r\n> ${cue}\r\n\r\n  • ${cue}\n${cue}`;
    const finding = checkTone(text, 'warm').findings[0];
    expect(finding.start).toBe(text.indexOf(cue, text.indexOf(cue) + cue.length));
    expect(finding.end).toBe(finding.start + cue.length);
    expect(finding.quote).toBe(cue);
    expect(checkTone(text, 'warm').findings).toHaveLength(1);
    verifyEvidence(text);
  });

  it('preserves original priorities and caps judgmental framing after the other families', () => {
    const judgment = 'This is not a good look.';
    const pressure = 'Please send the list, no more excuses.';
    const dismissal = 'As I already told you, upload the checklist.';
    const blame = 'You always ignore our requests.';
    expect(rules(`${judgment} ${pressure}`)).toEqual(['pressure-wording', 'judgmental-framing']);
    expect(rules(`${judgment} ${pressure} ${dismissal}`)).toEqual(['dismissive-request', 'pressure-wording']);
    expect(rules(`${judgment} ${pressure} ${dismissal} ${blame}`)).toEqual(['sweeping-blame', 'dismissive-request']);
    expect(rules(`${judgment} You should know better.`)).toEqual(['judgmental-framing']);
    expect(rules(`${dismissal} Stop making excuses and send the list.`)).toEqual(['dismissive-request']);
    expect(rules(`${pressure} Send the checklist, no excuses.`)).toEqual(['pressure-wording']);
  });

  it.each([
    'This is not a good look.',
    'As I already told you, please send the workspace list.',
    'Please send the workspace list, no more excuses.',
  ])('changes only the review question across intents for each addition: %s', text => {
    const findings = intents.map(intent => checkTone(text, intent).findings[0]);
    expect(new Set(findings.map(findingIdentity)).size).toBe(1);
    expect(new Set(findings.map(finding => finding.prompt)).size).toBe(3);
    expect(checkTone(text, 'direct')).toEqual(checkTone(text, 'direct'));
  });
});

describe('conservative clean controls', () => {
  it.each([
    'Please share the admin list.',
    'Send the access list by 15:00 on Thursday.',
    'You must submit the form today to keep the agreed launch date.',
    'If access is still blocked on Friday, I will escalate to the project owner.',
    'I will escalate this to support today.',
    'Thanks. I will send the notes tomorrow.',
    'Confirmed.',
    'Just send the sandbox name.',
    'Just read the instructions on page four.',
    'You always deliver on time.',
    'You never miss a deadline.',
    'You never ignore my requests.',
    'You always ignore spam messages.',
    'You always follow our instructions.',
    'You never respond to phishing emails.',
    'Please send feedback with no excuses.',
    'Please share the template titled No excuses.',
    'The error message contains the phrase or else.',
    'We always miss our internal deadlines.',
    'The team never responds to my emails.',
    'Stop making excuses.',
    'Please stop wasting time on the retired workflow.',
  ])('does not infer a concern from ordinary or unsupported wording: %s', text => {
    for (const intent of intents) expect(rules(text, intent)).toEqual([]);
  });

  it.each([
    'You always ignore our requests, but that is not true.',
    'You always ignore our requests unless we mark them urgent.',
    'You always miss the deadlines, except during the pilot.',
    'You never respond to our emails without checking the facts first.',
    'You never follow the instructions, apparently.',
    'You always ignore our requests?',
    'You always ignore our requests, don’t you?',
    'Please send the list, no excuses, if the workspace is ready.',
    'Please send the list if ready, no excuses.',
    'If you always ignore our requests, onboarding may stall.',
    'Do not say you always ignore our requests.',
    'The sample says: You always ignore our requests.',
    'Please avoid this wording: Stop making excuses and upload the roster.',
  ])('abstains on qualified, negated, reported and hypothetical wording: %s', text => {
    expect(rules(text)).toEqual([]);
  });
});

describe('quotation, signature and exact original evidence', () => {
  it.each([
    '“You always ignore our requests.”',
    '"You always ignore our requests."',
    "'You always ignore our requests.'",
    '‘You always ignore our requests.’',
    '`You always ignore our requests.`',
    'The example is “You always ignore our requests. Stop making excuses and send the list.”',
    '“Example:\nYou always ignore our requests.\nPlease send the list, no excuses.”',
    '"Example:\nYou always ignore our requests.',
    '```text\nYou always ignore our requests.\n```',
    '~~~\nYou always ignore our requests.\n~~~',
    'You always ignore our “requests”.',
  ])('excludes quoted wording conservatively: %s', text => {
    expect(rules(text)).toEqual([]);
  });

  it.each([
    '> You always ignore our requests.',
    'On Monday, Morgan wrote:\nYou always ignore our requests.',
    '-----Original Message-----\nYou always ignore our requests.',
    'Begin forwarded message:\nYou always ignore our requests.',
    'From: Morgan\nSent: Monday\nYou always ignore our requests.',
    '-- \nYou always ignore our requests.',
    'Sent from my test phone\nYou always ignore our requests.',
    'Best regards,\nMorgan Moss\nYou always ignore our requests.',
  ])('uses recognised history/signature exclusions: %s', tail => {
    const text = `Please share the workspace ID.\n\n${tail}`;
    const result = checkTone(text, 'warm');
    expect(result.findings).toEqual([]);
    expect(result.excludedSections).toBeGreaterThan(0);
    verifyEvidence(text);
  });

  it('selects the active occurrence after identical quoted history and emoji', () => {
    const cue = 'You always ignore our requests.';
    const text = `🪴 Pilot for Zoë\r\n> ${cue}\r\n\r\n${cue}`;
    const finding = checkTone(text, 'direct').findings[0];
    expect(finding.start).toBe(text.lastIndexOf(cue));
    expect(finding.end).toBe(text.lastIndexOf(cue) + cue.length);
    expect(finding.quote).toBe(cue);
    expect(checkTone(text, 'direct').excludedSections).toBe(1);
    verifyEvidence(text);
  });

  it('recognises active text after a closed quotation without changing its offsets', () => {
    const cue = 'You never follow the instructions.';
    const text = `The old example: “${cue}”\n🧭 Checklist update\n  ${cue}\nThanks,\nMorgan Moss`;
    const finding = checkTone(text, 'direct').findings[0];
    expect(finding.start).toBe(text.lastIndexOf(cue));
    expect(finding.quote).toBe(cue);
    verifyEvidence(text);
  });

  it('handles bullets and multiple sentences while keeping exact evidence', () => {
    const cue = 'Stop wasting our time and send the account roster.';
    for (const prefix of ['  • ', '- ', '2) ', 'Welcome to the pilot. ']) {
      const text = prefix + cue + ' Please confirm the owner.';
      const finding = checkTone(text, 'collaborative').findings[0];
      expect(finding.start).toBe(prefix.length);
      expect(finding.quote).toBe(cue);
      verifyEvidence(text);
    }
  });

  it('does not treat contractions or possessive apostrophes as opening quotations', () => {
    const cue = 'You always ignore our requests.';
    const text = `Here's the customers' workspace.\n${cue}`;
    expect(checkTone(text, 'warm').findings[0].quote).toBe(cue);
    verifyEvidence(text);
  });
});

describe('intent, identity, ordering and limits', () => {
  it.each<[ToneRuleId, string]>([
    ['sweeping-blame', 'You always ignore our requests.'],
    ['dismissive-request', 'As I already told you, please send the workspace list.'],
    ['pressure-wording', 'Please send the workspace list, no more excuses.'],
    ['judgmental-framing', 'This is not a good look.'],
  ])('remaps only the prompt for %s, retaining original evidence and identity across all styles', (ruleId, cue) => {
    const text = `Hi Zoë 👋,\n\n> ${cue}\n\n${cue}\n\nBest,\nMorgan`;
    const checked = checkTone(text, 'collaborative');
    expect(checked.findings).toHaveLength(1);
    const original = Object.freeze(checked.findings[0]);
    expect(original.ruleId).toBe(ruleId);
    expect(original.start).toBe(text.lastIndexOf(cue));
    expect(original.quote).toBe(text.slice(original.start, original.end));
    const identity = findingIdentity(original);
    const prompts = intents.map(intent => tonePromptFor(ruleId, intent));
    expect(new Set(prompts).size).toBe(3);

    for (const intent of intents) {
      const remapped = { ...original, prompt: tonePromptFor(ruleId, intent) };
      expect(findingIdentity(remapped)).toBe(identity);
      expect({ ...remapped, prompt: original.prompt }).toEqual(original);
      expect({ ...checked, findings: [remapped] }).toEqual(checkTone(text, intent));
    }
    expect(tonePromptFor(ruleId, 'collaborative')).toBe(original.prompt);
  });

  it('remaps a capped multi-finding result without changing priority, exclusions or count', () => {
    const text = '🧭 Follow-up\n> You always ignore our requests.\nSend the list, no excuses.\nStop making excuses and upload the roster.\nYou always ignore our requests.\nThis is not a good look.';
    const checked = checkTone(text, 'collaborative');
    expect(checked.findings.map(finding => finding.ruleId)).toEqual(['sweeping-blame', 'dismissive-request']);
    expect(checked.excludedSections).toBe(1);
    for (const intent of intents) {
      const remapped = { ...checked, findings: checked.findings.map(finding => ({ ...finding, prompt: tonePromptFor(finding.ruleId, intent) })) };
      expect(remapped).toEqual(checkTone(text, intent));
      expect(remapped.findings.map(findingIdentity)).toEqual(checked.findings.map(findingIdentity));
    }
  });

  it('changes review guidance for a genuine cue without changing the evidence or finding count', () => {
    const text = 'You always ignore our requests. Please send the workspace list by Thursday.';
    const results = intents.map(intent => checkTone(text, intent));
    expect(results.map(result => result.findings.length)).toEqual([1, 1, 1]);
    const findings = results.map(result => result.findings[0]);
    expect(new Set(findings.map(findingIdentity)).size).toBe(1);
    expect(findings[0].prompt).toBe('Would naming the specific missed action make this request more precise?');
    expect(findings[1].prompt).toContain('a shared next step');
    expect(findings[2].prompt).toContain('this specific occasion');
    expect(new Set(findings.map(finding => finding.prompt)).size).toBe(3);
  });

  it('prioritises blame then dismissal then pressure, with one finding per family and a separate cap', () => {
    const text = 'Send the list, no excuses. Stop making excuses and upload the roster. You always ignore our requests. You always miss the deadlines.';
    const result = checkTone(text, 'direct');
    expect(result.findings).toHaveLength(MAX_TONE_FINDINGS);
    expect(result.findings.map(finding => finding.ruleId)).toEqual(['sweeping-blame', 'dismissive-request']);
    expect(result.findings[0].quote).toBe('You always ignore our requests.');
    expect(checkTone(text, 'direct')).toEqual(result);
    verifyEvidence(text);
  });

  it('uses the earliest occurrence when the same cue is repeated', () => {
    const cue = 'You always ignore our requests.';
    const text = `${cue}\n${cue}`;
    const result = checkTone(text, 'collaborative');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].start).toBe(0);
    verifyEvidence(text);
  });

  it.each(['', ' \r\n\t ', ' '.repeat(MAX_DRAFT_LENGTH)])('matches blank input behavior', text => {
    expect(checkTone(text, 'collaborative')).toEqual({ findings: [], checkedCharacters: text.length, excludedSections: 0 });
  });

  it('accepts the exact UTF-16 limit and rejects longer input rather than truncating', () => {
    const cue = 'You always ignore our requests.';
    const text = `${'🧩'.repeat(500)}\n${' '.repeat(MAX_DRAFT_LENGTH - 1001 - cue.length)}${cue}`;
    expect(text.length).toBe(MAX_DRAFT_LENGTH);
    expect(checkTone(text, 'warm').findings[0].quote).toBe(cue);
    verifyEvidence(text);
    expect(() => checkTone(text + 'x', 'warm')).toThrow(RangeError);
    expect(() => checkTone(' '.repeat(MAX_DRAFT_LENGTH + 1), 'direct')).toThrow('12,000-character limit');
  });

  it('returns fresh results without retained state between drafts', () => {
    const text = 'You always ignore our requests.';
    const first = checkTone(text, 'direct');
    first.findings[0].quote = 'local mutation';
    first.findings.length = 0;
    expect(checkTone(text, 'direct').findings[0].quote).toBe(text);
    expect(checkTone('Please share the sandbox ID.', 'direct').findings).toEqual([]);
  });
});
