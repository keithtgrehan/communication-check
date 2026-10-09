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
          <h1 id="info-title" ref={headingRef} tabIndex={-1}>{page === 'about' ? 'About Communication Check' : 'Video Demo'}</h1>
          <p className="info-lede">{page === 'about' ? 'A second look at the email between a good conversation and a clear next step.' : 'See how a follow-up becomes a few clear decisions.'}</p>
        </header>
        {page === 'about' ? <>
          <section className="info-section" aria-labelledby="about-why">
            <h2 id="about-why">Built for customer follow-ups</h2>
            <p>After a discovery call, partner handoff or renewal discussion, there’s often a lot to put into one email: who’s doing what, what happens next and what still needs confirming. A message can feel clear to its writer while leaving the customer with questions.</p>
            <p>Communication Check is a portfolio prototype for salespeople and partner-facing commercial teams in B2B SaaS. It offers a few focused questions about your follow-up, tied to your own words. You decide whether they help.</p>
          </section>
          <section className="info-section" aria-labelledby="about-keith"><h2 id="about-keith">About this project</h2><p>Keith Grehan drew on his experience in SaaS sales and partner coaching. He set the product direction, audience, scope and presentation priorities and directed the AI-assisted build. Codex/Astra agents implemented the application and ran the documented engineering checks.</p><p>The message checks themselves are rule-based. This is a portfolio demonstration, with no claims of commercial adoption or measured customer outcomes.</p></section>
          <section className="info-section" aria-labelledby="about-example">
            <h2 id="about-example">From a sentence to a decision</h2>
            <p className="example-caption">Fictional example · illustration of the workflow</p>
            <div className="workflow-example">
              <p className="evidence-label">From the draft</p>
              <blockquote>We guarantee that the custom integration will be ready by Friday.</blockquote>
              <div className="review-prompt"><span>A question to consider</span><p>Has the responsible person or team confirmed this commitment, including any conditions or dependencies?</p></div>
              <p className="evidence-label decision-label">Your decision</p>
              <p>Select the wording to edit it yourself, or keep it as written. The tool does not decide whether the commitment is correct.</p>
            </div>
          </section>
          <section className="info-section" aria-labelledby="about-how">
            <h2 id="about-how">How to use it</h2>
            <ol className="info-steps">
              <li><strong>Add your follow-up.</strong> Paste your draft or try a fictional example.</li>
              <li><strong>Take a second look.</strong> Review up to three clarity and commitment findings. Optional Tone cues offers up to two questions about a few specific wording patterns.</li>
              <li><strong>Make the call.</strong> Select wording to edit, or keep it as written. You can undo a keep decision. After editing, run the checks again, then copy your current draft.</li>
            </ol>
          </section>
          <section className="info-section" aria-labelledby="about-data">
            <h2 id="about-data">What happens to your draft</h2>
            <p>The checks run in your browser using local rules. No AI model reviews your message. Drafts and findings stay in page memory; reloading clears them. Nothing is automatically rewritten or sent.</p>
          </section>
          <section className="info-section" aria-labelledby="about-limits">
            <h2 id="about-limits">Where your judgment matters</h2>
            <p>The checks can miss nuance or flag wording that is right for your situation. They don’t verify facts, meeting context or agreements, and they can’t predict how your customer will respond. No flags is not approval.</p>
            <p>This prototype’s usefulness in day-to-day work has not yet been validated.</p>
          </section>
          <a className="primary-button info-action" href="#/">Try the checker <span aria-hidden="true">→</span></a>
        </> : <>
          <section className="video-placeholder" aria-labelledby="video-coming-soon">
            <h2 id="video-coming-soon">Video walkthrough coming soon</h2>
            <p>The video isn’t available yet. You can follow the same steps in the checker now.</p>
          </section>
          <ol className="storyboard" aria-label="Walkthrough steps">
            <li><span className="storyboard-number" aria-hidden="true">01</span><div><h2>Start with a fictional example</h2><p>Choose Partner handoff, then select Try an example. Both checks run on the fictional message. If you have entered your own draft, you’ll be asked before replacing it.</p></div></li>
            <li><span className="storyboard-number" aria-hidden="true">02</span><div><h2>Read the wording in context</h2><p>The review quotes the exact passage and offers a question to consider. Switch between Clarity &amp; commitments and Tone cues to see the different checks.</p></div></li>
            <li><span className="storyboard-number" aria-hidden="true">03</span><div><h2>Decide what to keep or change</h2><p>Keep as written leaves the draft unchanged. Edit this wording selects the passage for you to edit. After a change, run the checks again before copying your draft.</p></div></li>
          </ol>
          <a className="primary-button info-action" href="#/">Try the checker <span aria-hidden="true">→</span></a>
        </>}
      </article>
      <RepositoryFooter />
    </main>
  );
}
