/** Mask only recognised history/signature spans, retaining every UTF-16 position. */
export function activeText(text: string): { masked: string; excludedSections: number } {
  const lines = [...text.matchAll(/[^\r\n]+/g)];
  const exclusions: Array<[number, number]> = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i];
    const line = match[0].trim();
    const start = match.index;
    if (/^>/.test(line)) {
      exclusions.push([start, start + match[0].length]);
      continue;
    }
    const replyHeader = /^On\s+.{1,250}\bwrote:\s*$/i.test(line)
      || /^[-_]{2,}\s*(?:original|forwarded) message\s*[-_]{2,}$/i.test(line)
      || /^Begin forwarded message:\s*$/i.test(line)
      || (/^From:\s*\S/i.test(line) && lines.slice(i + 1, i + 5).some(next => /^(?:Sent|Date):/i.test(next[0].trim())));
    const signatureDivider = /^--\s*$/.test(match[0]) || /^Sent from my\s+/i.test(line);
    // Conventional valedictions only count if followed by a compact name/contact block.
    const valediction = /^(?:thanks|thank you|best|best regards|kind regards|regards|cheers)[,!]?$/i.test(line);
    const tail = valediction ? lines.slice(i + 1, i + 7).map(next => next[0].trim()) : [];
    const name = tail[0] ?? '';
    const signatureTail = valediction
      && /^[\p{L}][\p{L}' .-]{1,50}$/u.test(name)
      && tail.length <= 5 && tail.join('\n').length <= 250
      && !tail.some(part => /[?!]|\b(?:please|will|should|must|need|guarantee|can you|could you)\b/i.test(part));
    if (replyHeader || signatureDivider || signatureTail) {
      exclusions.push([start, text.length]);
      break;
    }
  }
  let masked = text;
  for (const [start, end] of exclusions) {
    masked = masked.slice(0, start) + masked.slice(start, end).replace(/[^\r\n]/g, ' ') + masked.slice(end);
  }
  return { masked, excludedSections: exclusions.length };
}
