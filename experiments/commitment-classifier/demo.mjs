import model from './artifacts/model.mjs';
import { predict, validateModel } from './inference.mjs';

const input = document.querySelector('#passage');
const classify = document.querySelector('#classify');
const result = document.querySelector('#result');
const status = document.querySelector('#status');
let ready = false;
try {
  validateModel(model);
  ready = true;
  status.textContent = model.devGatePassed ? 'Ready. Fictional examples only; this model is experimental.' :
    'Development precision gate not met. This is a failed baseline experiment; results are for inspection only.';
} catch {
  status.textContent = 'The model could not be loaded. Check the local artifact and reload.';
}
function invalidate(announce = true) {
  result.hidden = true;
  document.querySelector('#quote').textContent = '';
  document.querySelector('#count').textContent = `${input.value.length.toLocaleString('en-US')} / 2,000 characters`;
  classify.disabled = !ready || !input.value.trim();
  if (announce && ready) status.textContent = input.value.length > 2000 ?
    'This passage exceeds 2,000 characters. Shorten it before classification; your text has been retained.' :
    input.value.trim() ? 'Passage changed. Classify again to see a current result.' : 'Passage and result cleared.';
}
input.value = '';
invalidate(false);
input.addEventListener('input', invalidate);
document.querySelector('#clear').addEventListener('click', () => { input.value = ''; invalidate(); input.focus(); });
const examples = { firm: 'We will ship the connector on Friday.', qualified: 'We hope to ship the connector on Friday, subject to testing.' };
document.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => {
  if (input.value.trim() && !window.confirm('Replace the current passage with a fictional example?')) return;
  input.value = examples[button.dataset.sample]; invalidate(); input.focus();
}));
classify.addEventListener('click', () => {
  try {
    const prediction = predict(input.value, model);
    if (prediction.category === 'abstain') { status.textContent = prediction.reason; return; }
    document.querySelector('#result-title').textContent = prediction.category === 'firm_delivery' ? 'Firm delivery wording' : 'No firm delivery classification';
    document.querySelector('#result-explanation').textContent = !prediction.hasKnownFeatures ?
      'None of these word features appeared in training. This forced classification is based only on the model intercept and should not be interpreted as an assessment.' :
      prediction.category === 'firm_delivery' ? 'The trained model classifies this as an unqualified future delivery assertion. Context and approval still need human judgment.' :
        'The trained model did not select the firm-delivery class. It can miss commitments and does not establish that the wording is safe or clear.';
    document.querySelector('#quote').textContent = prediction.quote.text;
    result.hidden = false;
    status.textContent = 'Classification complete. Editing clears this result.';
  } catch {
    result.hidden = true; status.textContent = 'Classification could not finish. Reload the local lab.';
  }
});
document.querySelector('#select').addEventListener('click', () => { input.focus(); input.setSelectionRange(0, input.value.length); });
