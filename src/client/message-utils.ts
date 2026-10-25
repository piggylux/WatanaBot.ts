/** Groups complete lines without exceeding a Discord text limit. */
export function chunkLines(lines: string[], maxLength: number): string[] {
  const chunks: string[] = [];
  let current = '';

  for (const line of lines) {
    if (line.length > maxLength) {
      throw new RangeError('A line exceeds the message length limit');
    }
    if (current && current.length + 1 + line.length > maxLength) {
      chunks.push(current);
      current = '';
    }
    current = current ? `${current}\n${line}` : line;
  }

  if (current) {
    chunks.push(current);
  }
  return chunks;
}
