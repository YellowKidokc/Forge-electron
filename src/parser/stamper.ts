import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { parseMarkdown, type ForgeBlock } from './markdownParser.ts';

export interface StampAddition {
  line: number;
  blockId: string;
  text: string;
}

export interface StampResult {
  changed: boolean;
  additions: StampAddition[];
  output: string;
  backupPath?: string;
}

function headingLineWithId(line: string, block: ForgeBlock): string {
  return `${line} <!-- forge:id=${block.id} -->`;
}

function blockComment(block: ForgeBlock): string {
  return `<!-- forge:block=${block.id} -->`;
}

export function stampMarkdown(markdown: string, sourcePath: string): StampResult {
  const document = parseMarkdown(markdown, sourcePath);
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const additions: StampAddition[] = [];
  const inlineHeadingUpdates = new Map<number, string>();
  const afterLineInsertions = new Map<number, string[]>();

  for (const block of document.blocks) {
    if (block.idSource !== 'generated') continue;

    if (block.type === 'heading') {
      const index = block.startLine - 1;
      inlineHeadingUpdates.set(index, headingLineWithId(lines[index], block));
      additions.push({ line: block.startLine, blockId: block.id, text: `<!-- forge:id=${block.id} -->` });
      continue;
    }

    const comment = blockComment(block);
    const existing = afterLineInsertions.get(block.endLine) ?? [];
    existing.push(comment);
    afterLineInsertions.set(block.endLine, existing);
    additions.push({ line: block.endLine + 1, blockId: block.id, text: comment });
  }

  if (additions.length === 0) {
    return { changed: false, additions, output: markdown };
  }

  const outputLines: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    outputLines.push(inlineHeadingUpdates.get(index) ?? lines[index]);
    const insertions = afterLineInsertions.get(index + 1) ?? [];
    outputLines.push(...insertions);
  }

  return { changed: true, additions, output: outputLines.join('\n') };
}

export function stampMarkdownFile(markdownPath: string, dryRun: boolean): StampResult {
  const markdown = readFileSync(markdownPath, 'utf8');
  const result = stampMarkdown(markdown, markdownPath);
  if (!dryRun && result.changed) {
    const backupPath = `${markdownPath}.bak`;
    copyFileSync(markdownPath, backupPath);
    writeFileSync(markdownPath, result.output, 'utf8');
    result.backupPath = backupPath;
  }
  return result;
}
