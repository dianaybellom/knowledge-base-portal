// Divide un Markdown por sus encabezados "## " (ignorando los bloques de código).
// "Texto…\n\n## Funcionalidades\n- A" → { intro: "Texto…", sections: [{ title: "Funcionalidades", content: "- A" }] }
export function splitByHeadings(markdown) {
  const intro = [];
  const sections = [];
  let current = null;
  let inCodeBlock = false;

  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) inCodeBlock = !inCodeBlock;
    const heading = !inCodeBlock && line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (heading) {
      current = { title: heading[1], lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  }

  return {
    intro: intro.join('\n').trim(),
    sections: sections.map((section) => ({ title: section.title, content: section.lines.join('\n').trim() })),
  };
}
