import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { checkDraft } from './engine';
import { checkTone, tonePromptFor } from './engine/tone';
import { MAX_DRAFT_LENGTH, findingIdentity, type ReviewFinding, type ReviewLens, type ReviewSnapshot, type ToneIntent, type ToneRuleId } from './engine/types';
import { DEMO_DRAFTS } from './demos';
import { InfoPages, type InfoPage } from './InfoPages';
import { DesignExploration } from './DesignExploration';
import './styles.css';

type Page = 'checker' | InfoPage | 'exploration';
function currentPage(): Page {
  if (window.location.hash === '#/about') return 'about';
  if (window.location.hash === '#/video-demo') return 'video-demo';
  if (window.location.hash === '#/exploration') return 'exploration';
  return 'checker';
}

const LENSES = [{ id: 'clarity', label: 'Clarity & commitments' }, { id: 'tone', label: 'Tone cues' }] as const;
const INTENTS: ToneIntent[] = ['direct', 'collaborative', 'warm'];
const emptySnapshots = (): Record<ReviewLens, ReviewSnapshot | null> => ({ clarity: null, tone: null });
const emptyErrors = (): Record<ReviewLens, boolean> => ({ clarity: false, tone: false });
const lensName = (lens: ReviewLens) => lens === 'clarity' ? 'Clarity & commitments' : 'Tone cues';
function resultStatus(snapshot: ReviewSnapshot | null, lens: ReviewLens, errors: Record<ReviewLens, boolean>) {
  if (errors[lens]) return `The ${lensName(lens)} check couldn’t finish. Your draft is still in the editor. Select ${lens === 'tone' ? 'Recheck tone cues' : 'Recheck draft'} to try again.`;
  if (!snapshot) return `${lensName(lens)} has not been checked.`;
  const count = snapshot.result.findings.length;
  const summary = count ? `${count} ${count === 1 ? 'finding' : 'findings'} to consider. ${snapshot.reviewedIds.length} of ${count} reviewed.` : lens === 'tone' ? 'No tone cues flagged. These checks cover a few wording patterns. They can miss nuance and can’t predict how your message will be received. Give it your own final read.' : 'No wording flagged by these checks. The checks may still miss something. Facts and agreements haven’t been verified, so give the draft your own final read.';
  const other = lens === 'clarity' ? 'tone' : 'clarity';
  return errors[other] ? `${summary} The ${lensName(other)} check couldn’t finish. Open that tab to try again.` : summary;
}

function Mark() {
  return <svg width="28" height="28" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M18 8H12a7 7 0 0 0-7 7v10a7 7 0 0 0 7 7h6v-6h-5a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h5V8Z" /><path d="M22 8h6a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7h-6v-6h5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-5V8Z" /></svg>;
}

export default function App() {
  const [page, setPage] = useState(currentPage);
  const previousPage = useRef(page);
  const checkerHeading = useRef<HTMLHeadingElement>(null);
  const infoHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const navigate = () => setPage(currentPage());
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useLayoutEffect(() => {
    const metadata = page === 'about'
      ? { title: 'About Communication Check', description: 'Learn how Communication Check offers focused, browser-local questions about customer follow-up drafts.' }
      : page === 'video-demo'
        ? { title: 'Video Demo · Communication Check', description: 'Follow a short, static walkthrough of the Communication Check review workflow.' }
        : page === 'exploration'
          ? { title: 'Design exploration · Communication Check', description: 'Compare the three visual directions that informed the Communication Check prototype.' }
          : { title: 'Communication Check — Review your customer follow-up', description: 'Review your customer onboarding follow-up for unclear next steps, commitments and limited tone cues. A small, browser-local writing check.' };
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    for (const [property, content] of [['og:title', metadata.title], ['og:description', metadata.description]] as const) {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.append(tag);
      }
      tag.setAttribute('content', content);
    }
    // Preserve the normal first-visit focus. Route changes, including browser
    // back/forward, announce the new page without unmounting the review desk.
    if (previousPage.current === page) return;
    previousPage.current = page;
    (page === 'checker' ? checkerHeading : infoHeading).current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [page]);
  const [draft, setDraft] = useState('');
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [scenarioId, setScenarioId] = useState('promises-to-confirm');
  const [lens, setLens] = useState<ReviewLens>('clarity');
  const [intent, setIntent] = useState<ToneIntent>('collaborative');
  const [snapshots, setSnapshots] = useState(emptySnapshots);
  const [needsRecheck, setNeedsRecheck] = useState({ clarity: false, tone: false });
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const [checkErrors, setCheckErrors] = useState(emptyErrors);
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
      const narrow = window.matchMedia('(max-width: 1000px)').matches;
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
  const checkLabel = lens === 'tone' ? (snapshot || needsRecheck.tone ? 'Recheck tone cues' : 'Check tone cues') : (snapshot || needsRecheck.clarity ? 'Recheck draft' : 'Check draft');

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
    setCheckErrors(emptyErrors());
    setStatus(wasChecked && text.trim() ? 'Your draft has changed. Earlier findings have been cleared. Check the current wording when you’re ready.' : '');
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
      ? 'Question style updated. Your draft, findings and review decisions are unchanged.'
      : 'Question style selected. Select Check tone cues when you’re ready.');
  }

  function checkedSnapshot(text: string, targetLens: ReviewLens, previous: ReviewSnapshot | null, revision: number): ReviewSnapshot {
    const checked = targetLens === 'clarity' ? checkDraft(text) : checkTone(text, intent);
    const identities = checked.findings.map(findingIdentity);
    const reviewedIds = previous?.reviewedIds.filter(id => identities.includes(id)) ?? [];
    const expandedId = previous?.expandedId && identities.includes(previous.expandedId)
      ? previous.expandedId : identities.find(id => !reviewedIds.includes(id)) ?? null;
    return { textRevision: revision, result: checked, reviewedIds, expandedId };
  }

  function runCheck() {
    if (!hasText || tooLong) return;
    const errors = { ...checkErrors, [lens]: false };
    let next: ReviewSnapshot | null = null;
    try {
      next = checkedSnapshot(draftRef.current, lens, isCurrent(snapshot) ? snapshot : null, textRevision.current);
    } catch {
      errors[lens] = true;
    }
    setSnapshots(current => ({ ...current, [lens]: next }));
    setCheckErrors(errors);
    setNeedsRecheck(current => ({ ...current, [lens]: errors[lens] }));
    setManualCopy(false);
    setStatus(resultStatus(next, lens, errors));
    reviewFocus.current = true;
  }

  function reviewSample() {
    const sample = DEMO_DRAFTS.find(item => item.id === scenarioId);
    if (!sample) return;
    replaceDraft(sample.text, sample.id);
    const revision = textRevision.current;
    const next = emptySnapshots();
    const errors = emptyErrors();
    // Both explicit checks use the replacement text and one revision. A failure
    // in either lens must neither erase the other result nor pretend it passed.
    for (const targetLens of ['clarity', 'tone'] as const) {
      try {
        next[targetLens] = checkedSnapshot(sample.text, targetLens, null, revision);
      } catch {
        errors[targetLens] = true;
      }
    }
    setLens(sample.preferredLens);
    setSnapshots(next);
    setCheckErrors(errors);
    setNeedsRecheck({ ...errors });
    setStatus(resultStatus(next[sample.preferredLens], sample.preferredLens, errors));
    reviewFocus.current = true;
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
    setStatus(undo ? `Back in your review: ${finding.title}.` : `Kept as written: ${finding.title}. Your draft is unchanged.`);
  }

  function resetReview() {
    if (!isCurrent(snapshot)) return;
    setSnapshots(current => ({ ...current, [lens]: { ...snapshot!, reviewedIds: [], expandedId: snapshot!.result.findings[0] ? findingIdentity(snapshot!.result.findings[0]) : null } }));
    setStatus('Decisions reset for this tab. Your draft is unchanged.');
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
    setStatus(resultStatus(isCurrent(snapshots[next]) ? snapshots[next] : null, next, checkErrors));
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#/" aria-current={page === 'checker' ? 'page' : undefined}><span className="brand-mark"><Mark /></span><span>Communication Check</span></a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#/about" aria-current={page === 'about' ? 'page' : undefined}>About Communication Check</a>
          <a href="#/video-demo" aria-current={page === 'video-demo' ? 'page' : undefined}>Video Demo</a>
        </nav>
      </header>
      <main hidden={page !== 'checker'}>
        <section className="intro" aria-labelledby="page-title">
          <div><h1 id="page-title" ref={checkerHeading} tabIndex={-1}>Review your customer follow-up.</h1><p className="intro-description">A second look at next steps, commitments and wording. You decide what to change.</p></div>
        </section>
        <section className="review-desk" aria-label="Communication review workspace">
          <div className="review-desk-content">
          <section className="start-options" aria-label="Start a review">
            <div className="sample-picker"><label htmlFor="sample-scenario">Fictional example</label><select id="sample-scenario" value={scenarioId} onChange={event => setScenarioId(event.target.value)} aria-describedby="sample-note">{DEMO_DRAFTS.map(sample => <option key={sample.id} value={sample.id}>{sample.label}</option>)}</select></div>
            <button className="sample-button" onClick={reviewSample} aria-describedby="sample-note">Try a sample review</button>
            <p id="sample-note">Replaces your draft with the example and runs both checks.</p>
          </section>
          <p className="local-note">Drafts and findings stay in this page. Reloading clears them.</p>
          <div className="lens-tabs" role="tablist" aria-label="Choose a review">
          {LENSES.map(option => <button key={option.id} id={`tab-${option.id}`} role="tab" className="lens-tab" ref={element => { if (element) lensButtons.current.set(option.id, element); else lensButtons.current.delete(option.id); }} aria-selected={lens === option.id} aria-controls="review-panel" tabIndex={lens === option.id ? 0 : -1} onClick={() => switchLens(option.id)} onKeyDown={event => {
            if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 'clarity' : event.key === 'End' ? 'tone' : option.id === 'clarity' ? 'tone' : 'clarity';
            switchLens(next);
            lensButtons.current.get(next)?.focus();
          }}>{option.label}{option.id === 'tone' && <span className="optional-label">· Optional</span>}</button>)}
          </div>
          {lens === 'tone' && <p className="tone-scope">Looks for a few phrases that may sound blaming, dismissive, judgmental or pressuring. It won’t catch every tone issue.</p>}
          <div className="workspace">
          <section className="editor-panel" aria-labelledby="draft-heading">
            <div className="panel-heading"><div><h2 id="draft-heading"><label htmlFor="draft">Your follow-up draft</label></h2></div><button className="text-button paste-button" onClick={() => { editor.current?.focus(); editor.current?.scrollIntoView({ block: 'center' }); }}>Start with your draft <span aria-hidden="true">↘</span></button></div>
            <p className={selectedSample ? 'editor-description' : 'editor-description sr-only'} id="draft-description">{selectedSample ? `Fictional example · ${selectedSample.description}` : 'Paste or write your customer follow-up here.'}</p>
            <div className="editor-actions"><button className="primary-button" onClick={runCheck} disabled={!hasText || tooLong} aria-describedby={!hasText ? 'check-help' : undefined}>{checkLabel}</button><button className="secondary-button" aria-label="Copy draft" onClick={() => void copyDraft()} disabled={!hasText}>Copy draft</button><button className="text-button reset-button" aria-label="Clear draft" onClick={resetDraft} disabled={!draft}>Clear draft</button>{result && <button className="text-button mobile-jump" onClick={() => { resultsHeading.current?.focus(); resultsHeading.current?.scrollIntoView({ block: 'start' }); }}>Go to review ↓</button>}</div>
            {!hasText && <p id="check-help" className="check-help sr-only">Add a draft to begin.</p>}
            <div className={`editor-frame ${tooLong ? 'has-error' : ''}`}>
              <textarea id="draft" ref={editor} value={draft} onChange={event => replaceDraft(event.target.value)} placeholder="Paste your customer follow-up here…" aria-describedby={`draft-description draft-count draft-count-help${tooLong ? ' draft-limit' : ''}${manualCopy ? ' copy-help' : ''}`} aria-invalid={tooLong} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} name="follow-up-draft" />
              <div className="editor-meta"><span>Nothing is rewritten or sent.</span><span id="draft-count" className={tooLong ? 'count-error' : ''}>{draft.length.toLocaleString()} / 12,000 characters</span><span id="draft-count-help" className="count-help">Some characters, including emoji, count as more than one.</span></div>
            </div>
            {tooLong && <p id="draft-limit" className="inline-error" role="alert"><strong>This draft is over the limit.</strong> Your full draft is still here. Remove {(draft.length - MAX_DRAFT_LENGTH).toLocaleString()} {draft.length - MAX_DRAFT_LENGTH === 1 ? 'character' : 'characters'} to check it. The limit is 12,000.</p>}
            {manualCopy && <p id="copy-help" className="copy-help">Your draft is selected. Press <kbd>Ctrl</kbd> + <kbd>C</kbd> or <kbd>⌘</kbd> + <kbd>C</kbd> to copy it manually.</p>}

          </section>
          <section id="review-panel" role="tabpanel" aria-labelledby={`tab-${lens}`} className={`results-panel ${result ? 'has-results' : ''}`}>
            <div className="panel-heading"><h2 id="results-heading" tabIndex={-1} ref={resultsHeading}>Your review</h2></div>
            {lens === 'tone' && <fieldset className="intent-picker"><legend>How should the review questions sound?</legend><div className="intent-options">{INTENTS.map(option => <label key={option} className={`intent-option ${intent === option ? 'selected' : ''}`}><input type="radio" name="tone-intent" value={option} checked={intent === option} onChange={() => chooseIntent(option)} /><span>{option[0].toUpperCase() + option.slice(1)}</span></label>)}</div><p>Changes the questions you see, not your draft or which phrases are flagged.</p></fieldset>}
            {result && checkErrors[lens === 'clarity' ? 'tone' : 'clarity'] && <p className="inline-error" role="alert">The {lensName(lens === 'clarity' ? 'tone' : 'clarity')} check couldn’t finish. Open that tab to try again.</p>}
            {!result ? <div className="result-empty"><h3>{checkErrors[lens] ? 'This check couldn’t finish.' : needsRecheck[lens] ? 'Your draft has changed.' : lens === 'tone' ? 'Take a look at the wording.' : hasText ? 'Ready for a second look?' : 'Your review will appear here.'}</h3><p>{checkErrors[lens] ? `Your draft is still in the editor. Select ${checkLabel} to try again.` : needsRecheck[lens] ? 'Earlier findings have been cleared. Check the current wording when you’re ready.' : lens === 'tone' ? 'Select Check tone cues to look for a few phrases worth reconsidering.' : hasText ? 'Select Check draft to review next steps and commitments.' : 'Paste a draft and select Check draft, or try a fictional example.'}</p></div>
              : result.findings.length === 0 ? <div className="result-empty result-complete"><h3>{lens === 'tone' ? 'No tone cues flagged' : 'No wording flagged by these checks'}</h3><p>{lens === 'tone' ? 'These checks cover a few wording patterns. They can miss nuance and can’t predict how your message will be received. Give it your own final read.' : 'The checks may still miss something. Facts and agreements haven’t been verified, so give the draft your own final read.'}</p></div>
              : <>
                <div className="review-progress"><div className="progress-segments" aria-hidden="true">{result.findings.map(finding => <span key={finding.id} className={snapshot!.reviewedIds.includes(findingIdentity(finding)) ? 'is-reviewed' : ''} />)}</div><div className="progress-labels"><span className="findings-count">{reviewedCount} of {result.findings.length} reviewed</span></div></div>
                {reviewedCount === result.findings.length && <div className="reviewed-summary"><h3>All shown findings in this tab reviewed</h3><p>Your wording is unchanged. You can undo any decision.</p></div>}
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
                        <p className="evidence-label">From your draft</p><blockquote>{finding.quote}</blockquote>
                        <p className="finding-explanation">{finding.explanation}</p>
                        <div className="review-prompt"><span>A question to consider</span><p>{finding.prompt}</p></div>
                        <div className="finding-actions">
                          <button
                            className="secondary-button evidence-button"
                            ref={element => { if (element) editButtons.current.set(id, element); else editButtons.current.delete(id); }}
                            disabled={!valid}
                            onClick={() => selectEvidence(finding)}
                          >Edit this wording</button>
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
                {reviewedCount > 0 && <button className="text-button reset-review" onClick={resetReview}>Reset decisions in this tab</button>}
              </>}
            {lens === 'clarity' && result && result.findings.length > 0 && <p className="results-caveat">Facts and agreements haven’t been verified.</p>}
            <button className="text-button mobile-jump" onClick={() => { editor.current?.focus(); editor.current?.scrollIntoView({ block: 'center' }); }}>Back to draft ↑</button>
          </section>
          </div>
          </div>
          <span className="workspace-orb" aria-hidden="true" />
        </section>
        <p className={status.startsWith('Current draft copied') || status.startsWith('Clipboard') ? 'live-status' : 'live-status sr-only'} role="status" aria-live="polite" aria-atomic="true">{status}</p>
        <footer className="page-footer"><details className="about-checks"><summary>What this checks</summary><div><p>Communication Check looks for a limited set of wording patterns in customer onboarding follow-ups: unclear actions or owners, vague timing, competing requests, agreement wording and strong product commitments.</p><p>Tone cues looks for a few phrases that may sound blaming, dismissive, judgmental or pressuring. Choosing Direct, Collaborative or Warm changes the review questions, not which phrases are flagged.</p><p>The checks can miss issues or flag wording that works in your situation. They don’t verify facts, meeting context or agreements, and they can’t predict a customer’s response. No flags does not mean the draft is approved.</p><p>Your draft and findings stay in page memory. Reloading clears them. Copy draft puts your current wording on your clipboard; nothing is rewritten or sent automatically.</p><p>The examples are fictional. This is a portfolio prototype, and its usefulness in day-to-day work has not yet been validated.</p></div></details><a className="exploration-link" href="#/exploration">Design exploration</a></footer>
      </main>
      {(page === 'about' || page === 'video-demo') && <InfoPages page={page} headingRef={infoHeading} />}
      {page === 'exploration' && <DesignExploration headingRef={infoHeading} />}
    </div>
  );
}
