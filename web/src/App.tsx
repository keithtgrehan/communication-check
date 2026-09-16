import { useLayoutEffect, useRef, useState } from 'react';
import { checkDraft } from './engine';
import { checkTone, tonePromptFor } from './engine/tone';
import { MAX_DRAFT_LENGTH, findingIdentity, type ReviewFinding, type ReviewLens, type ReviewSnapshot, type ToneIntent, type ToneRuleId } from './engine/types';
import { DEMO_DRAFTS } from './demos';
import './styles.css';

const LENSES = [{ id: 'clarity', label: 'Clarity & commitments' }, { id: 'tone', label: 'Tone cues' }] as const;
const INTENTS: ToneIntent[] = ['direct', 'collaborative', 'warm'];
const emptySnapshots = (): Record<ReviewLens, ReviewSnapshot | null> => ({ clarity: null, tone: null });

function Mark() {
  return <svg width="22" height="22" viewBox="0 0 26 26" fill="none" aria-hidden="true"><path d="M4 13.5L9 18.5L21.5 6M14 18.5L22 10.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function App() {
  const [draft, setDraft] = useState('');
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState('promises-to-confirm');
  const [lens, setLens] = useState<ReviewLens>('clarity');
  const [intent, setIntent] = useState<ToneIntent>('collaborative');
  const [snapshots, setSnapshots] = useState(emptySnapshots);
  const [needsRecheck, setNeedsRecheck] = useState({ clarity: false, tone: false });
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const [checkError, setCheckError] = useState<ReviewLens | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const draftRef = useRef(draft);
  const textRevision = useRef(0);
  const undoButtons = useRef(new Map<string, HTMLButtonElement>());
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const lensButtons = useRef(new Map<ReviewLens, HTMLButtonElement>());
  const reviewFocus = useRef(false);
  const decisionFocus = useRef<{ id: string; undo: boolean } | null>(null);
  useLayoutEffect(() => {
    if (reviewFocus.current) {
      reviewFocus.current = false;
      resultsHeading.current?.focus({ preventScroll: true });
      const narrow = window.matchMedia('(max-width: 880px)').matches;
      resultsHeading.current?.scrollIntoView({ block: narrow ? 'start' : 'nearest', inline: 'nearest' });
      if (!narrow && resultsHeading.current) {
        const actions = resultsHeading.current.closest('section')?.querySelector('.is-expanded .finding-actions');
        // Keep the heading and evidence in view too. Enlarged reviews may need
        // natural scrolling; don't skip their explanation to reach the buttons.
        if (actions && actions.getBoundingClientRect().bottom - resultsHeading.current.getBoundingClientRect().top <= window.innerHeight) {
          actions.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
      }
    }
    const target = decisionFocus.current;
    if (!target) return;
    decisionFocus.current = null;
    (target.undo ? editButtons : undoButtons).current.get(target.id)?.focus();
  }, [snapshots]);
  const tooLong = draft.length > MAX_DRAFT_LENGTH;
  const hasText = draft.trim().length > 0;
  const snapshot = snapshots[lens];
  const result = snapshot?.result;
  const reviewedCount = snapshot?.reviewedIds.length ?? 0;
  const selectedSample = DEMO_DRAFTS.find((sample) => sample.id === sampleId);
  const checkLabel = lens === 'tone' ? (snapshot || needsRecheck.tone ? 'Review tone again' : 'Check tone') : (snapshot || needsRecheck.clarity ? 'Recheck draft' : 'Check draft');

  function isCurrent(current: ReviewSnapshot | null) {
    return current !== null && current.textRevision === textRevision.current;
  }

  function validFinding(finding: ReviewFinding) {
    return isCurrent(snapshot) && draftRef.current.slice(finding.start, finding.end) === finding.quote &&
      snapshot!.result.findings.some(item => findingIdentity(item) === findingIdentity(finding));
  }

  function replaceDraft(text: string, selectedId: string | null = null) {
    const wasChecked = snapshots.clarity !== null || snapshots.tone !== null || needsRecheck.clarity || needsRecheck.tone;
    textRevision.current += 1;
    draftRef.current = text;
    setDraft(text);
    setSampleId(selectedId);
    setSnapshots(emptySnapshots());
    setNeedsRecheck({ clarity: wasChecked && !!text.trim(), tone: wasChecked && !!text.trim() });
    setManualCopy(false);
    setCheckError(null);
    setStatus(wasChecked && text.trim() ? 'Draft changed. Review again.' : '');
  }

  function chooseIntent(next: ToneIntent) {
    if (next === intent) return;
    setIntent(next);
    // Style selects guidance only. An unchecked or edited draft stays unchecked;
    // exact evidence, open rows and decisions still belong to the current text.
    setSnapshots(current => {
      const tone = current.tone;
      if (!isCurrent(tone)) return current;
      return { ...current, tone: { ...tone!, result: { ...tone!.result,
        findings: tone!.result.findings.map(finding => ({ ...finding,
          prompt: tonePromptFor(finding.ruleId as ToneRuleId, next),
        })),
      } } };
    });
    setStatus(isCurrent(snapshots.tone)
      ? 'Review style updated. Your findings and review decisions are unchanged.'
      : 'Review style selected. Check tone when you’re ready.');
  }

  function runCheck() {
    if (!hasText || tooLong) return;
    checkText(draftRef.current, lens, isCurrent(snapshot) ? snapshot : null);
  }

  function reviewSample() {
    const sample = DEMO_DRAFTS.find(item => item.id === scenarioId);
    if (!sample) return;
    replaceDraft(sample.text, sample.id);
    setLens(sample.preferredLens);
    setNeedsRecheck({ clarity: false, tone: false });
    checkText(sample.text, sample.preferredLens, null);
  }

  function checkText(text: string, targetLens: ReviewLens, previous: ReviewSnapshot | null) {
    const checkedRevision = textRevision.current;
    setCheckError(null);
    try {
      const checked = targetLens === 'clarity' ? checkDraft(text) : checkTone(text, intent);
      const identities = checked.findings.map(findingIdentity);
      const reviewedIds = previous?.reviewedIds.filter(id => identities.includes(id)) ?? [];
      const expandedId = previous?.expandedId && identities.includes(previous.expandedId)
        ? previous.expandedId : identities.find(id => !reviewedIds.includes(id)) ?? null;
      setSnapshots(current => ({ ...current, [targetLens]: { textRevision: checkedRevision,
        result: checked, reviewedIds, expandedId } }));
      setNeedsRecheck(current => ({ ...current, [targetLens]: false }));
      setManualCopy(false);
      setStatus(checked.findings.length ? `${checked.findings.length} ${targetLens === 'tone' ? (checked.findings.length === 1 ? 'tone cue' : 'tone cues') : (checked.findings.length === 1 ? 'check' : 'checks')} to consider. ${reviewedIds.length} reviewed.` : targetLens === 'tone' ? 'No tone cues flagged. This limited review cannot judge how your message will be received.' : 'No checks flagged this draft. Facts and agreements were not verified.');
      reviewFocus.current = true;
    } catch {
      setSnapshots(current => ({ ...current, [targetLens]: null }));
      setNeedsRecheck(current => ({ ...current, [targetLens]: true }));
      setCheckError(targetLens);
      setStatus('Unable to check this draft. Your text is still here; try again.');
    }
  }

  function selectEvidence(finding: ReviewFinding) {
    const field = editor.current;
    if (!field || !validFinding(finding) || field.value.slice(finding.start, finding.end) !== finding.quote) return;

    // A textarea exposes selection offsets but no text rectangles. Measure its
    // wrapping briefly in memory, then remove the measuring element immediately.
    const mirror = document.createElement('div');
    mirror.className = 'evidence-measurement';
    mirror.setAttribute('aria-hidden', 'true');
    const style = getComputedStyle(field);
    for (const property of [
      'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch',
      'font-variant', 'line-height', 'letter-spacing', 'word-spacing',
      'text-indent', 'text-transform', 'text-align', 'tab-size', 'direction',
      'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'word-break',
    ]) mirror.style.setProperty(property, style.getPropertyValue(property));
    mirror.style.width = `${field.clientWidth}px`;
    const text = document.createTextNode(field.value);
    mirror.append(text);
    document.body.append(mirror);
    try {
      const range = document.createRange();
      range.setStart(text, finding.start);
      range.setEnd(text, finding.end);
      const bounds = range.getBoundingClientRect();
      const mirrorBounds = mirror.getBoundingClientRect();
      const scale = mirrorBounds.width / mirror.offsetWidth || 1;
      const top = (bounds.top - mirrorBounds.top) / scale;
      const height = bounds.height / scale;
      const availableHeight = field.clientHeight;
      const scrollTop = height < availableHeight
        ? top - (availableHeight - height) / 2
        : top - parseFloat(style.paddingTop);
      field.setSelectionRange(finding.start, finding.end);
      field.focus({ preventScroll: true });
      field.scrollTop = Math.max(0, scrollTop);
      field.scrollIntoView({ block: 'center', inline: 'nearest' });
    } finally {
      mirror.remove();
    }
    setStatus('Quoted wording selected in your draft. Edit it if a change would help.');
  }


  function toggleFinding(finding: ReviewFinding) {
    if (!validFinding(finding)) return;
    const id = findingIdentity(finding);
    setSnapshots(current => ({ ...current, [lens]: { ...snapshot!, expandedId: snapshot!.expandedId === id ? null : id } }));
  }

  function keepFinding(finding: ReviewFinding, undo = false) {
    if (!validFinding(finding)) return;
    const id = findingIdentity(finding);
    decisionFocus.current = { id, undo };
    setSnapshots(current => ({ ...current, [lens]: { ...snapshot!,
      reviewedIds: undo ? snapshot!.reviewedIds.filter(item => item !== id) : [...new Set([...snapshot!.reviewedIds, id])],
      expandedId: undo ? id : snapshot!.result.findings.map(findingIdentity).find(item => item !== id && !snapshot!.reviewedIds.includes(item)) ?? null,
    } }));
    setStatus(undo ? `Review restored: ${finding.title}.` : `Reviewed: ${finding.title}. Your wording is unchanged.`);
  }

  function resetReview() {
    if (!isCurrent(snapshot)) return;
    setSnapshots(current => ({ ...current, [lens]: { ...snapshot!, reviewedIds: [], expandedId: snapshot!.result.findings[0] ? findingIdentity(snapshot!.result.findings[0]) : null } }));
    setStatus('Review decisions reset for this lens. Your wording is unchanged.');
    resultsHeading.current?.focus();
  }

  async function copyDraft() {
    const currentText = draftRef.current;
    const copiedRevision = textRevision.current;
    if (!currentText.trim()) return;
    try {
      await navigator.clipboard.writeText(currentText);
      if (copiedRevision === textRevision.current) {
        setManualCopy(false);
        setStatus('Current draft copied.');
      }
    } catch {
      if (copiedRevision !== textRevision.current) return;
      editor.current?.focus();
      editor.current?.select();
      setManualCopy(true);
      setStatus('Clipboard access is unavailable. Your draft is selected; press Ctrl+C or Command+C to copy.');
    }
  }

  function resetDraft() {
    replaceDraft('');
    setNeedsRecheck({ clarity: false, tone: false });
    setStatus('Draft cleared.');
    editor.current?.focus();
  }

  function switchLens(next: ReviewLens) {
    setLens(next);
    setStatus('');
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand"><span className="brand-mark"><Mark /></span><span>Communication Check</span></div>
        <span className="header-note">Review desk <span aria-hidden="true">·</span> Local preview</span>
      </header>
      <main>
        <section className="intro" aria-labelledby="page-title">
          <div><h1 id="page-title">A second look before you send.</h1><p className="intro-description">Check your customer follow-up. Keep what works; edit what doesn’t.</p></div>
        </section>
        <section className="start-options" aria-label="Start a review">
          <button className="paste-button" onClick={() => { editor.current?.focus(); editor.current?.scrollIntoView({ block: 'center' }); }}>Paste your draft <span aria-hidden="true">↘</span></button>
          <span className="start-divider">or</span>
          <div className="sample-picker"><label htmlFor="sample-scenario">Fictional scenario</label><select id="sample-scenario" value={scenarioId} onChange={event => setScenarioId(event.target.value)} aria-describedby="sample-note">{DEMO_DRAFTS.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}</select></div>
          <button className="sample-button" onClick={reviewSample}>Try a sample review <span aria-hidden="true">→</span></button>
          <p id="sample-note">Replaces your draft with the sample and checks it.</p>
        </section>
        <div className="lens-tabs" role="tablist" aria-label="Review lens">
          {LENSES.map(option => <button key={option.id} id={`tab-${option.id}`} role="tab" className="lens-tab" ref={element => { if (element) lensButtons.current.set(option.id, element); else lensButtons.current.delete(option.id); }} aria-selected={lens === option.id} aria-controls="review-panel" tabIndex={lens === option.id ? 0 : -1} onClick={() => switchLens(option.id)} onKeyDown={event => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 'clarity' : event.key === 'End' ? 'tone' : option.id === 'clarity' ? 'tone' : 'clarity';
            switchLens(next);
            lensButtons.current.get(next)?.focus();
          }}>{option.label}{option.id === 'tone' && <span className="optional-label">Optional</span>}</button>)}
        </div>
        {lens === 'tone' && <p className="tone-scope">Checks a few wording patterns of accusation, judgment, dismissal and pressure. Coverage is limited.</p>}
        <div className="workspace">
          <section className="editor-panel" aria-labelledby="draft-heading">
            <div className="panel-heading"><div><p className="panel-kicker">01 / Draft</p><h2 id="draft-heading"><label htmlFor="draft">Your follow-up draft</label></h2></div><span className="editable-note"><span aria-hidden="true">●</span> Editable</span></div>
            <p className="editor-description" id="draft-description">{selectedSample ? `Fictional example · ${selectedSample.description}` : 'Paste or write your follow-up below.'}</p>
            <div className="editor-actions"><button className="primary-button" onClick={runCheck} disabled={!hasText || tooLong} aria-describedby={!hasText ? 'check-help' : undefined}>{checkLabel}<span aria-hidden="true">→</span></button><button className="secondary-button" aria-label="Copy draft" onClick={() => void copyDraft()} disabled={!hasText}>Copy</button><button className="secondary-button reset-button" aria-label="Clear draft" onClick={resetDraft} disabled={!draft}>Clear</button>{result && <button className="text-button mobile-jump" onClick={() => { resultsHeading.current?.focus(); resultsHeading.current?.scrollIntoView({ block: 'start' }); }}>Go to review ↓</button>}</div>
            {!hasText && <p id="check-help" className="check-help">Add a draft to check.</p>}
            <div className={`editor-frame ${tooLong ? 'has-error' : ''}`}>
              <textarea id="draft" ref={editor} value={draft} onChange={event => replaceDraft(event.target.value)} placeholder="Paste your customer follow-up here…" aria-describedby={`draft-description draft-count${tooLong ? ' draft-limit' : ''}${manualCopy ? ' copy-help' : ''}`} aria-invalid={tooLong} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="follow-up-draft" />
              <div className="editor-meta"><span>Nothing is rewritten or sent</span><span id="draft-count" className={tooLong ? 'count-error' : ''}>{draft.length.toLocaleString()} / 12,000 characters</span></div>
            </div>
            {tooLong && <p id="draft-limit" className="inline-error" role="alert">Your full draft is still here. Remove {(draft.length - MAX_DRAFT_LENGTH).toLocaleString()} characters to check it; the limit is 12,000.</p>}
            {manualCopy && <p id="copy-help" className="copy-help">Your draft is selected. Press <kbd>Ctrl</kbd> + <kbd>C</kbd> or <kbd>⌘</kbd> + <kbd>C</kbd> to copy it manually.</p>}

          </section>
          <section id="review-panel" role="tabpanel" aria-labelledby={`tab-${lens}`} className={`results-panel ${result ? 'has-results' : ''}`}>
            <div className="panel-heading"><div><p className="panel-kicker">02 / Review</p><h2 id="results-heading" tabIndex={-1} ref={resultsHeading}>Checks to consider</h2></div>{result && result.findings.length > 0 && <span className="queue-count" aria-label={`${result.findings.length} findings`}>{result.findings.length}</span>}</div>
            <p className="results-description">{lens === 'clarity' ? 'Up to three things worth a closer look.' : 'Up to two specific wording cues to consider.'}</p>
            {lens === 'tone' && <fieldset className="intent-picker"><legend>How do you want to come across?</legend><div className="intent-options">{INTENTS.map(option => <label key={option} className={`intent-option ${intent === option ? 'selected' : ''}`}><input type="radio" name="tone-intent" value={option} checked={intent === option} onChange={() => chooseIntent(option)} /><span>{option[0].toUpperCase() + option.slice(1)}</span></label>)}</div><p>Changes the review question, not what gets flagged.</p></fieldset>}
            {!result ? <div className="result-empty"><h3>{checkError === lens ? 'This check couldn’t finish.' : needsRecheck[lens] ? 'Review the current wording.' : lens === 'tone' ? 'Choose a style. Take a second look.' : 'Your review will appear here.'}</h3><p>{checkError === lens ? `Your draft is still in the editor. Select ${checkLabel} to try again.` : needsRecheck[lens] ? 'Previous findings are cleared. Run the review when you’re ready.' : lens === 'tone' ? 'Select Check tone when you’re ready. Specific wording cues can help you consider how a request is framed.' : 'Paste a draft and check it, or try a fictional sample above.'}</p></div>
              : result.findings.length === 0 ? <div className="result-empty result-complete"><h3>{lens === 'tone' ? 'No tone cues flagged' : 'No checks flagged this draft'}</h3><p>{lens === 'tone' ? 'This limited wording review may miss nuance. It cannot judge how your message will be received. Give it your own final read.' : 'This rule-based review didn’t find wording to flag. Facts and agreements were not verified; give the draft your own final read.'}</p></div>
              : <>
                <div className="review-progress"><div className="progress-segments" aria-hidden="true">{result.findings.map(finding => <span key={finding.id} className={snapshot!.reviewedIds.includes(findingIdentity(finding)) ? 'is-reviewed' : ''} />)}</div><div className="progress-labels"><span>{reviewedCount === result.findings.length ? 'Review complete' : 'Worth a closer look'}</span><span className="findings-count">{reviewedCount} of {result.findings.length} reviewed</span></div></div>
                {reviewedCount === result.findings.length && <div className="reviewed-summary"><h3>All shown findings reviewed</h3><p>Your wording is unchanged. You can undo any decision.</p></div>}
                <div className="findings-list">{result.findings.map((finding, index) => {
                  const id = findingIdentity(finding);
                  const reviewed = snapshot!.reviewedIds.includes(id);
                  const expanded = snapshot!.expandedId === id;
                  const valid = validFinding(finding);
                  return (
                    <article
                      className={`finding-card ${expanded ? 'is-expanded' : ''} ${reviewed ? 'is-reviewed' : ''}`}
                      key={id}
                      aria-labelledby={`title-${finding.id}`}
                    >
                      <h3 id={`title-${finding.id}`} className="finding-title">
                        <button
                          className="finding-toggle"
                          aria-expanded={expanded}
                          aria-controls={`detail-${finding.id}`}
                          disabled={!valid}
                          onClick={() => toggleFinding(finding)}
                        >
                          <span className="finding-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><span className="finding-name">{finding.title}</span>
                          <span className="finding-chevron" aria-hidden="true">{expanded ? '⌄' : '›'}</span>
                        </button>
                      </h3>
                      {!expanded && !reviewed && <p className="quote-preview">“{finding.quote}”</p>}
                      {reviewed && (
                        <div className="reviewed-row">
                          <span>Reviewed · kept as written</span>
                          <button
                            className="text-button undo-button"
                            ref={element => { if (element) undoButtons.current.set(id, element); else undoButtons.current.delete(id); }}
                            disabled={!valid}
                            onClick={() => keepFinding(finding, true)}
                            aria-label={`Undo keep: ${finding.title}`}
                          >Undo</button>
                        </div>
                      )}
                      <div id={`detail-${finding.id}`} className="finding-detail" hidden={!expanded}>
                        <blockquote>{finding.quote}</blockquote>
                        <p className="finding-explanation">{finding.explanation}</p>
                        <div className="review-prompt"><span>Consider</span><p>{finding.prompt}</p></div>
                        <div className="finding-actions">
                          <button
                            className="secondary-button evidence-button"
                            ref={element => { if (element) editButtons.current.set(id, element); else editButtons.current.delete(id); }}
                            disabled={!valid}
                            onClick={() => selectEvidence(finding)}
                          >Edit this wording <span aria-hidden="true">↗</span></button>
                          {!reviewed && (
                            <button className="secondary-button keep-button" disabled={!valid} onClick={() => keepFinding(finding)}>
                              Keep as written
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}</div>
                {reviewedCount > 0 && <button className="text-button reset-review" onClick={resetReview}>Reset review decisions</button>}
              </>}
            {lens === 'clarity' && result && result.findings.length > 0 && <p className="results-caveat">Facts and agreements are not verified.</p>}
            <button className="text-button mobile-jump" onClick={() => { editor.current?.focus(); editor.current?.scrollIntoView({ block: 'center' }); }}>Back to draft ↑</button>
          </section>
        </div>
        <p className={status.startsWith('Current draft copied') || status.startsWith('Clipboard') ? 'live-status' : 'live-status sr-only'} role="status" aria-live="polite" aria-atomic="true">{status}</p>
        <footer className="page-footer"><div className="local-note"><Mark /><span>Local review. Your draft stays in this page.</span></div><details className="about-checks"><summary>What this checks</summary><div><p>Communication Check uses a small set of rules to look for unclear actions, vague timing, competing requests, agreement wording, and strong product commitments in customer onboarding follow-ups. Tone cues looks for a few patterns of accusation (“you always ignore our requests”), judgment (“not a good look”), dismissal (“as I already told you”) and extra pressure (“no excuses”). Your chosen style changes the review question, not what gets flagged.</p><p>It can miss issues or flag wording that is right for your situation. It cannot verify facts, meeting context, or agreements, or predict a recipient’s response. Examples are fictional; real-world usefulness has not been validated.</p><p>Copying puts the current draft on your clipboard. Nothing is rewritten or sent automatically.</p></div></details></footer>
      </main>
    </div>
  );
}
