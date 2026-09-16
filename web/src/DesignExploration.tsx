import { useState, type Ref } from 'react';
import { explorationFixture } from './design-fixture';
import './exploration.css';

type Direction = 'prism' | 'frame' | 'kindred';
type ReviewState = 'active' | 'kept';

const directions: ReadonlyArray<{
  id: Direction;
  number: string;
  name: string;
  personality: string;
  idea: string;
  improvement: string;
  tradeoff: string;
  symbol: string;
}> = [
  { id: 'prism', number: '01', name: 'Prism Review', personality: 'Confident · colourful · immediate', idea: 'A bold split workspace uses purposeful colour blocks to make the draft, evidence and decision instantly distinct.', improvement: 'The working task is clearest here: the full draft and finding remain side by side without decoration getting in the way.', tradeoff: 'Its high-energy colour system feels more assertive than reflective.', symbol: 'Two open conversation forms create a compact CC monogram.' },
  { id: 'frame', number: '02', name: 'Second Look', personality: 'Refined · graphic · editorial', idea: 'An asymmetric review frame treats the source text as the central exhibit and the finding as a precise overlay.', improvement: 'The quoted evidence has strong visual authority and the vertical navigation leaves more room for focused reading.', tradeoff: 'The layered composition is memorable, but accommodates long drafts less efficiently.', symbol: 'A quotation aperture and review stroke share one piece of negative space.' },
  { id: 'kindred', number: '03', name: 'Considered Reply', personality: 'Warm · approachable · guided', idea: 'A spacious sequence presents the draft first, then moves naturally into a colleague-like question and clear next step.', improvement: 'The gentler pace and plain-language hierarchy make an unfamiliar review especially easy to understand.', tradeoff: 'The sequential flow requires more scrolling and makes rapid comparison slower.', symbol: 'Two complementary message forms suggest a draft and its thoughtful second look.' },
];

export function DesignExploration({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  const [direction, setDirection] = useState<Direction>('prism');
  const [reviewState, setReviewState] = useState<ReviewState>('active');
  const selected = directions.find((item) => item.id === direction)!;

  return <main className="exploration-shell" aria-labelledby="exploration-title">
    <header className="exploration-header">
      <p className="exploration-eyebrow">Communication Check · Visual exploration</p>
      <div className="exploration-title-row">
        <h1 id="exploration-title" ref={headingRef} tabIndex={-1}>One careful task.<br />Three distinct points of view.</h1>
        <p>An earlier study, kept for comparison. Prism Review was selected and developed into the live prototype. These previews use prepared fixtures: design concept · sample states only.</p>
      </div>
      <p className="exploration-back"><a href="#/">Back to the checker</a></p>
    </header>

    <nav className="direction-switcher" aria-label="Choose a design direction">
      {directions.map((item) => <button key={item.id} type="button" className="direction-option" aria-pressed={direction === item.id} onClick={() => setDirection(item.id)}>
        <span>{item.number}</span><span><strong>{item.name}</strong><small>{item.personality}</small></span><span aria-hidden="true">→</span>
      </button>)}
    </nav>

    <section className="direction-summary" aria-labelledby="direction-title">
      <div className="direction-heading"><span>{selected.number}</span><div><p>{selected.personality}</p><h2 id="direction-title">{selected.name}</h2></div></div>
      <p className="direction-idea">{selected.idea}</p>
      <dl><div><dt>What improves</dt><dd>{selected.improvement}</dd></div><div><dt>Trade-off</dt><dd>{selected.tradeoff}</dd></div></dl>
    </section>

    <section className="identity-strip" aria-labelledby="identity-title">
      <div className="identity-copy"><p className="section-label">Identity study</p><h2 id="identity-title">A symbol with a reason to be here.</h2><p>{selected.symbol} The form stays recognisable in one colour and at favicon size.</p></div>
      <div className={`identity-samples identity-${direction}`}>
        <div className="identity-wordmark"><LogoMark direction={direction} /><strong>Communication Check</strong></div>
        <IdentityTile direction={direction} label="Favicon" />
        <IdentityTile direction={direction} label="One colour · light" />
        <IdentityTile direction={direction} label="One colour · dark" dark />
      </div>
    </section>

    <div className="preview-toolbar">
      <div><p className="section-label">Responsive product study</p><h2>Same content, at two working sizes.</h2></div>
      <div className="state-switcher" role="group" aria-label="Finding state shown in both previews"><span>Show finding</span>
        <button type="button" aria-pressed={reviewState === 'active'} onClick={() => setReviewState('active')}>Active</button>
        <button type="button" aria-pressed={reviewState === 'kept'} onClick={() => setReviewState('kept')}>Kept / reviewed</button>
      </div>
    </div>

    <section className="preview-comparison" aria-label={`${selected.name} responsive previews`}>
      <div className="preview-column preview-desktop"><p className="viewport-label"><span />Desktop composition</p><ConceptPreview direction={direction} state={reviewState} /></div>
      <div className="preview-column preview-mobile"><p className="viewport-label"><span />Mobile composition</p><ConceptPreview direction={direction} state={reviewState} compact /></div>
    </section>
  </main>;
}

function IdentityTile({ direction, label, dark = false }: { direction: Direction; label: string; dark?: boolean }) {
  return <div className={`identity-tile${dark ? ' identity-dark' : ''}`}><LogoMark direction={direction} /><small>{label}</small></div>;
}

function ConceptPreview({ direction, state, compact = false }: { direction: Direction; state: ReviewState; compact?: boolean }) {
  const kept = state === 'kept';
  return <article className={`concept-preview direction-${direction}${compact ? ' is-compact' : ''}`}>
    <header className="concept-header"><div className="concept-brand"><LogoMark direction={direction} /><strong>Communication Check</strong></div>{!compact && <nav aria-label="Concept navigation"><span>Checker</span><span>About</span><span>Video Demo</span></nav>}<small>Design concept · sample states only</small></header>
    <div className="concept-body">
      <div className="sample-intro"><div><span>Prepared example</span><strong>Promises to confirm</strong></div><span className="specimen-button">Open sample</span><small>This uses prepared findings. It does not check your writing.</small></div>
      <div className="review-tabs"><span className="is-selected">Clarity &amp; commitments</span><span>Tone cues · Optional</span></div>
      <div className="review-workspace">
        <section className="draft-panel"><div className="panel-heading"><div><span>Draft</span><h3>Your follow-up</h3></div><div><span>Copy</span><span>Clear</span></div></div><div className="draft-copy">{explorationFixture.draft}</div></section>
        <section className={`finding-panel${kept ? ' finding-kept' : ''}`}><div className="finding-topline"><span>{kept ? 'Reviewed' : 'Ready to review'}</span><span>{kept ? '1 of 1 reviewed' : '0 of 1 reviewed'}</span></div>
          {kept && <div className="kept-label"><span aria-hidden="true">✓</span> Kept as written</div>}
          <p className="finding-type">{explorationFixture.finding.title}</p><blockquote><span>From your draft</span>“{explorationFixture.finding.quote}”</blockquote><p className="finding-explanation">{explorationFixture.finding.explanation}</p>
          <div className="finding-question"><span>A question to consider</span><h3>{explorationFixture.finding.question}</h3></div>
          {kept ? <div className="kept-footer"><p>Your wording is unchanged.</p><span className="specimen-action">Undo</span></div> : <div className="finding-actions"><span className="specimen-action">Edit this wording</span><span className="specimen-action specimen-primary">Keep as written <span aria-hidden="true">→</span></span></div>}
        </section>
      </div>
    </div>
    <footer>Fictional sample · text stays in page memory and clears on reload</footer>
  </article>;
}

function LogoMark({ direction }: { direction: Direction }) {
  if (direction === 'prism') return <svg className="logo-mark" viewBox="0 0 40 40" role="img" aria-label="Open CC monogram"><path d="M18 8H12a7 7 0 0 0-7 7v10a7 7 0 0 0 7 7h6v-6h-5a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h5V8Z" /><path d="M22 8h6a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7h-6v-6h5a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-5V8Z" /></svg>;
  if (direction === 'frame') return <svg className="logo-mark" viewBox="0 0 40 40" role="img" aria-label="Quotation aperture mark"><path d="M5 7h30v24H20l-7 5v-5H5V7Zm7 7v8h6v-8h-6Zm10 0v8h6v-8h-6Z" /><path className="logo-cut" d="m18 27 4 4 9-11-3-3-6 8-2-2-2 4Z" /></svg>;
  return <svg className="logo-mark" viewBox="0 0 40 40" role="img" aria-label="Paired message forms"><path d="M4 7h23v17H14l-6 5v-5H4V7Z" /><path d="M15 16h21v17H25l-6 4v-4h-4V16Z" /></svg>;
}
