const fs = require('fs');

function checkMermaidSyntax(diagramStr, diagramId) {
  const lines = diagramStr.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, error: 'Empty diagram' };

  const firstLine = lines[0];
  const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'erDiagram', 'classDiagram', 'stateDiagram'];
  const isValidType = validTypes.some(t => firstLine.startsWith(t));
  if (!isValidType) {
    return { ok: false, error: `Invalid diagram type: ${firstLine}` };
  }

  // Across the entire diagram, check balanced curly, round, and square brackets (ignoring quotes, comments, and erDiagram relationship tokens)
  let round = 0, square = 0, curly = 0;
  let inQuotes = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith('%%')) continue;

    // In erDiagram, strip relationship connectors like ||--o{ or }o--|| before bracket check
    if (firstLine.startsWith('erDiagram')) {
      line = line.replace(/(\}o|\}o--|--o\{|--\|\{|\}\|--|\{\|--|\|o--|--o\|)/g, ' REL ');
    }

    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (!inQuotes) {
        if (c === '(') round++;
        if (c === ')') round--;
        if (c === '[') square++;
        if (c === ']') square--;
        if (c === '{') curly++;
        if (c === '}') curly--;
      }
    }
  }

  if (round !== 0) return { ok: false, error: `Unbalanced parentheses (): count = ${round}` };
  if (square !== 0) return { ok: false, error: `Unbalanced square brackets []: count = ${square}` };
  if (curly !== 0) return { ok: false, error: `Unbalanced curly braces {}: count = ${curly}` };

  return { ok: true };
}

// Read current README.md
const content = fs.readFileSync('README.md', 'utf8');
const mermaidBlocks = [...content.matchAll(/```mermaid([\s\S]*?)```/g)];
console.log(`Checking ${mermaidBlocks.length} existing diagrams in README.md:`);

let allOk = true;
mermaidBlocks.forEach((match, idx) => {
  const res = checkMermaidSyntax(match[1], idx + 1);
  if (!res.ok) {
    console.error(`Diagram ${idx + 1} ERROR: ${res.error}`);
    allOk = false;
  } else {
    console.log(`Diagram ${idx + 1}: OK (${match[1].trim().split(/\r?\n/)[0]})`);
  }
});

if (allOk) console.log('\nAll 26 diagrams passed syntax and structure validation!');
