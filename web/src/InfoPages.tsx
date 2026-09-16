import type { Ref } from 'react';

export type InfoPage = 'about' | 'video-demo';

function RepositoryFooter() {
  return (
    <footer className="info-footer">
      <a href="https://github.com/keithtgrehan/communication-check#readme" target="_blank" rel="noreferrer">Read the project README <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      <span>Repository access required</span>
    </footer>
  );
}

export function InfoPages({ page, headingRef }: { page: InfoPage; headingRef: Ref<HTMLHeadingElement> }) {
  return (
    <main className="info-page" aria-labelledby="info-title">
      <article>
        <header className="info-header">
          <p className="panel-kicker">{page === 'about' ? 'The idea behind the review' : 'See the workflow'}</p>
          <h1 id="info-title" ref={headingRef} tabIndex={-1}>{page === 'about' ? 'About Communication Check' : 'Video Demo'}</h1>
          <p className="info-lede">{page === 'about' ? 'A short pause between writing a customer follow-up and sending it.' : 'A closer look at reviewing a follow-up, one decision at a time.'}</p>
        </header>
        {page === 'about' ? <>
          <section className="info-section" aria-labelledby="about-why">
            <h2 id="about-why">Why it exists</h2>
            <p>A follow-up can sound clear to its writer while leaving the customer unsure who acts next, what takes priority, or whether a promise is confirmed. Communication Check is a portfolio prototype for B2B SaaS account managers and customer-success managers writing onboarding follow-up emails.</p>
            <p>It offers a second look at the next action, owner, timing, competing requests and commitments. Optional Tone cues highlights a few supported patterns of accusation, judgment, dismissal and pressure. You decide whether each prompt helps.</p>
          </section>
          <section className="info-section" aria-labelledby="about-how">
            <h2 id="about-how">Three steps, with you in control</h2>
            <ol className="info-steps">
              <li><strong>Paste or try a sample.</strong> Add your follow-up, or explore a fictional scenario through the same checks.</li>
              <li><strong>Review the wording.</strong> See up to three clarity prompts and two tone cues, each tied to an exact quote. Direct, Collaborative or Warm changes the tone question, not detection.</li>
              <li><strong>Make the call.</strong> Select wording to edit, or keep it as written with Undo. Recheck after edits, then copy your current draft.</li>
            </ol>
          </section>
          <section className="info-section" aria-labelledby="about-limits">
            <h2 id="about-limits">How the checks work</h2>
            <p>Local rules run in your browser; no AI model reviews your draft. Drafts and findings stay in page memory, and reloading clears them. Nothing is automatically rewritten or sent.</p>
            <p>The checks can miss nuance or flag appropriate wording. They do not verify facts, call context or agreements, or predict a recipient’s response. No flags is not approval. This prototype’s real-world usefulness remains unvalidated.</p>
          </section>
          <a className="primary-button info-action" href="#/">Try the checker <span aria-hidden="true">→</span></a>
        </> : <>
          <section className="video-placeholder" aria-labelledby="video-coming-soon">
            <span className="video-placeholder-mark" aria-hidden="true">CC</span>
            <h2 id="video-coming-soon">Walkthrough coming soon</h2>
            <p>A short YouTube walkthrough will appear here when it’s ready.</p>
          </section>
          <section className="info-section" aria-labelledby="video-preview">
            <h2 id="video-preview">What the walkthrough will show</h2>
            <p>Follow a fictional customer email from sample review to exact quoted findings. See how to switch between clarity and tone, keep wording or select it to edit, then recheck and copy the draft.</p>
            <p>You can explore that workflow yourself while the video is being prepared.</p>
          </section>
          <a className="primary-button info-action" href="#/">Try the checker <span aria-hidden="true">→</span></a>
        </>}
      </article>
      <RepositoryFooter />
    </main>
  );
}
