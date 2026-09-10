import { useRef, useState } from 'react';
import { checkDraft } from './engine';
import { MAX_DRAFT_LENGTH, type CheckResult, type Finding } from './engine/types';
import { DEMO_DRAFTS } from './demos';
import './styles.css';

function Mark({ small = false }: { small?: boolean }) {
  return (
    <svg width={small ? 20 : 26} height={small ? 20 : 26} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M4 13.5L9 18.5L21.5 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 18.5L22 10.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Arrow() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 9H15M10 4L15 9L10 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function App() {
  const [draft, setDraft] = useState('');
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [needsRecheck, setNeedsRecheck] = useState(false);
  const [status, setStatus] = useState('');
  const [manualCopy, setManualCopy] = useState(false);
  const [checkError, setCheckError] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const draftRef = useRef(draft);
  const tooLong = draft.length > MAX_DRAFT_LENGTH;
  const hasText = draft.trim().length > 0;
  const visibleFindings = result?.findings.filter((finding) => !dismissed.includes(finding.id)) ?? [];
  const selectedSample = DEMO_DRAFTS.find((sample) => sample.id === sampleId);

  function replaceDraft(text: string, selectedId: string | null = null) {
    const wasChecked = result !== null || needsRecheck;
    draftRef.current = text;
    setDraft(text);
    setSampleId(selectedId);
    setResult(null);
    setDismissed([]);
    setNeedsRecheck(wasChecked && text.trim().length > 0);
    setManualCopy(false);
    setCheckError(false);
    setStatus(wasChecked && text.trim() ? 'Draft changed. Recheck to review the current wording.' : '');
  }

  function runCheck() {
    if (!hasText || tooLong) return;
    setCheckError(false);
    try {
      const checked = checkDraft(draft);
      setResult(checked);
      setDismissed([]);
      setNeedsRecheck(false);
      setManualCopy(false);
      setStatus(checked.findings.length ? `${checked.findings.length} ${checked.findings.length === 1 ? 'check' : 'checks'} to consider.` : 'No checks flagged this draft. Facts and agreements were not verified.');
      requestAnimationFrame(() => resultsHeading.current?.focus());
    } catch {
      setResult(null);
      setDismissed([]);
      setNeedsRecheck(true);
      setCheckError(true);
      setStatus('Unable to check this draft. Your text is still here; try again.');
    }
  }

  function selectEvidence(finding: Finding) {
    const field = editor.current;
    if (!field) return;

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

  function dismissFinding(finding: Finding) {
    setDismissed((ids) => [...ids, finding.id]);
    setStatus(`Dismissed: ${finding.title}. Rechecking will review the draft again.`);
    requestAnimationFrame(() => resultsHeading.current?.focus());
  }

  async function copyDraft() {
    const currentText = draftRef.current;
    if (!currentText.trim()) return;
    try {
      await navigator.clipboard.writeText(currentText);
      if (currentText === draftRef.current) {
        setManualCopy(false);
        setStatus('Current draft copied.');
      }
    } catch {
      if (currentText !== draftRef.current) return;
      editor.current?.focus();
      editor.current?.select();
      setManualCopy(true);
      setStatus('Clipboard access is unavailable. Your draft is selected; press Ctrl+C or Command+C to copy.');
    }
  }

  function resetDraft() {
    replaceDraft('');
    setNeedsRecheck(false);
    setStatus('Draft cleared.');
    editor.current?.focus();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="brand"><span className="brand-mark"><Mark /></span><span>Communication Check</span></div>
        <span className="header-note"><span className="status-dot" />A little clarity before you send</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">FOR CUSTOMER ONBOARDING FOLLOW-UPS</p>
          <h1 id="page-title">Make the next step <span>clear.</span></h1>
          <p className="intro-description">A second look at your follow-up email. Catch unclear next steps and commitments worth confirming, then make the final call yourself.</p>
        </section>

        <section className="sample-strip" aria-labelledby="sample-heading">
          <div className="sample-intro"><span className="sample-icon" aria-hidden="true">↗</span><div><h2 id="sample-heading">Try a fictional example</h2><p>Or paste your own draft below.</p></div></div>
          <div className="sample-options">
            {DEMO_DRAFTS.map((sample, index) => (
              <button key={sample.id} className={`sample-button ${sampleId === sample.id ? 'selected' : ''}`} aria-pressed={sampleId === sample.id} onClick={() => replaceDraft(sample.text, sample.id)}>
                <span className="sample-number" aria-hidden="true">0{index + 1}</span>{sample.label}
              </button>
            ))}
          </div>
        </section>

        <div className="workspace">
          <section className="editor-panel" aria-labelledby="draft-heading">
            <div className="panel-heading">
              <div><p className="step-label">01 / YOUR WORDS</p><h2 id="draft-heading"><label htmlFor="draft">Your follow-up draft</label></h2></div>
              <button className="text-button reset-button" onClick={resetDraft} disabled={!draft}>Clear draft</button>
            </div>
            <p className="editor-description" id="draft-description">{selectedSample ? `Fictional example · ${selectedSample.description}` : 'Paste the email you’re planning to send. You can edit it here.'}</p>
            <div className={`editor-frame ${tooLong ? 'has-error' : ''}`}>
              <textarea
                id="draft"
                ref={editor}
                value={draft}
                onChange={(event) => replaceDraft(event.target.value)}
                placeholder={'Hi Jamie,\n\nThanks for your time today…'}
                aria-describedby={`draft-description draft-count${tooLong ? ' draft-limit' : ''}${manualCopy ? ' copy-help' : ''}`}
                aria-invalid={tooLong}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                name="follow-up-draft"
              />
              <div className="editor-meta"><span>Nothing is sent automatically</span><span id="draft-count" className={tooLong ? 'count-error' : ''}>{draft.length.toLocaleString()} / 12,000 characters</span></div>
            </div>
            {tooLong && <p id="draft-limit" className="inline-error" role="alert">Your full draft is still here. Remove {(draft.length - MAX_DRAFT_LENGTH).toLocaleString()} characters to check it; the limit is 12,000.</p>}
            {manualCopy && <p id="copy-help" className="copy-help">Your draft is selected. Press <kbd>Ctrl</kbd> + <kbd>C</kbd> or <kbd>⌘</kbd> + <kbd>C</kbd> to copy it manually.</p>}
            <div className="editor-actions">
              <button className="primary-button" onClick={runCheck} disabled={!hasText || tooLong}>{needsRecheck || result ? 'Recheck draft' : 'Check draft'}<Arrow /></button>
              <button className="secondary-button" onClick={() => void copyDraft()} disabled={!hasText}><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="5" y="5" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M10 3V2.5A1.5 1.5 0 0 0 8.5 1H3.5A1.5 1.5 0 0 0 2 2.5V9a1.5 1.5 0 0 0 1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>Copy draft</button>
            </div>
            <p className="editor-footnote">Your wording stays yours. Review, edit, and copy when you’re ready.</p>
          </section>

          <section className={`results-panel ${result ? 'has-results' : ''}`} aria-labelledby="results-heading">
            <div className="panel-heading">
              <div><p className="step-label">02 / A SECOND LOOK</p><h2 id="results-heading" tabIndex={-1} ref={resultsHeading}>Checks to consider</h2></div>
              {result && visibleFindings.length > 0 && <span className="findings-count" aria-label={`${visibleFindings.length} visible findings`}>{visibleFindings.length}</span>}
            </div>
            <p className="results-description">Up to three things worth a closer look.</p>
            {!result ? (
              <div className="result-empty">
                <div className="empty-illustration" aria-hidden="true"><div className="paper-lines"><i /><i /><i /></div><span><Mark /></span></div>
                <h3>{checkError ? 'This check couldn’t finish.' : needsRecheck ? 'New wording, fresh look.' : 'A clearer follow-up starts here.'}</h3>
                <p>{checkError ? 'Your draft is still in the editor. Select Recheck draft to try again.' : needsRecheck ? 'Your draft changed, so the previous findings have been cleared. Recheck to review this version.' : 'Add a draft and run a check. You’ll see the exact wording to review, with a prompt to help you decide.'}</p>
                <div className="empty-topics"><span>Next steps</span><span>Timing</span><span>Commitments</span></div>
              </div>
            ) : result.findings.length === 0 ? (
              <div className="result-empty result-complete"><span className="complete-mark"><Mark /></span><h3>No checks flagged this draft</h3><p>This rule-based review didn’t find wording to flag. Facts and agreements were not verified; give the draft your own final read.</p></div>
            ) : visibleFindings.length === 0 ? (
              <div className="result-empty result-complete"><span className="complete-mark"><Mark /></span><h3>All findings dismissed</h3><p>You’ve set aside these prompts. Facts and agreements were not verified. Recheck anytime to see the findings again.</p></div>
            ) : (
              <div className="findings-list">
                {visibleFindings.map((finding, index) => (
                  <article className="finding-card" key={finding.id} aria-labelledby={`title-${finding.id}`}>
                    <div className="finding-title"><span className="finding-number" aria-hidden="true">{index + 1}</span><h3 id={`title-${finding.id}`}>{finding.title}</h3></div>
                    <blockquote>{finding.quote}</blockquote>
                    <p className="finding-explanation">{finding.explanation}</p>
                    <div className="review-prompt"><span>ASK YOURSELF</span><p>{finding.prompt}</p></div>
                    <div className="finding-actions"><button className="text-button evidence-button" onClick={() => selectEvidence(finding)}>Select in draft <span aria-hidden="true">↗</span></button><button className="text-button dismiss-button" onClick={() => dismissFinding(finding)} aria-label={`Dismiss ${finding.title}`}>Dismiss</button></div>
                  </article>
                ))}
                <p className="results-caveat">Prompts for your judgment. Facts and agreements were not verified.</p>
              </div>
            )}
          </section>
        </div>
        <p className="live-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
        <footer className="page-footer">
          <div className="local-note"><svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true"><path d="M8 1L14 3.5V8C14 12 11.5 15 8 17C4.5 15 2 12 2 8V3.5L8 1Z" stroke="currentColor" strokeWidth="1.25" /><path d="M5 8.5L7 10.5L11 6.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg><span>Local, rule-based review. No account needed.</span></div>
          <details className="about-checks"><summary>What this check can do</summary><div><p>Communication Check uses a small set of rules to look for unclear actions, vague timing, competing requests, agreement wording, and strong product commitments in customer onboarding follow-ups.</p><p>It can miss issues or flag wording that is right for your situation. It cannot verify facts, meeting context, or agreements. Examples are fictional; real-world usefulness has not been validated.</p><p>Drafts and findings are held in this page’s memory. The checker does not save them, use a remote model, or send email. Copying puts the current draft on your clipboard.</p></div></details>
        </footer>
      </main>
    </div>
  );
}
