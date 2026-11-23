/** "line 4" or "lines 5, 6": the Decklist line numbers an error refers to. */
export default function formatLines(lines: number[]): string {
  return `${lines.length === 1 ? "line" : "lines"} ${lines.join(", ")}`;
}
