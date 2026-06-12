import { basename } from 'node:path';
import { createBlockId, extractForgeId, removeForgeComments, slugify } from './blockId.ts';

export type ForgeBlockType = 'heading' | 'paragraph' | 'blockquote' | 'list' | 'code' | 'math';
export type ForgeIdSource = 'explicit' | 'generated' | 'repaired-collision';

export interface ForgeBlock {
  id: string;
  type: ForgeBlockType;
  text: string;
  raw: string;
  startLine: number;
  endLine: number;
  idSource: ForgeIdSource;
  originalId?: string;
  level?: number;
  language?: string;
  items?: string[];
}

export interface ForgeParseDiagnostic {
  type: 'duplicate-id';
  requestedId: string;
  repairedId: string;
  line: number;
}

export interface ForgeDocument {
  document_id: string;
  source: string;
  blocks: ForgeBlock[];
  diagnostics?: ForgeParseDiagnostic[];
}

export function createDocumentId(sourcePath: string): string {
  return slugify(basename(sourcePath).replace(/\.md$/i, ''));
}

export function parseMarkdown(markdown: string, sourcePath: string): ForgeDocument {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const usedIds = new Map<string, number>();
  const blocks: ForgeBlock[] = [];
  const diagnostics: ForgeParseDiagnostic[] = [];

  const pushBlock = (
    type: ForgeBlockType,
    raw: string,
    text: string,
    startLine: number,
    endLine: number,
    extra: Partial<ForgeBlock> = {}
  ) => {
    const explicitId = extractForgeId(raw);
    const cleanText = removeForgeComments(text);
    const idResult = createBlockId(type, cleanText, usedIds, explicitId);
    const idSource: ForgeIdSource = explicitId ? (idResult.collision ? 'repaired-collision' : 'explicit') : 'generated';

    if (idResult.collision) {
      diagnostics.push({
        type: 'duplicate-id',
        requestedId: idResult.collision.requestedId,
        repairedId: idResult.collision.repairedId,
        line: startLine
      });
    }

    blocks.push({
      id: idResult.id,
      type,
      text: cleanText,
      raw,
      startLine,
      endLine,
      idSource,
      originalId: explicitId,
      ...extra
    });
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const fenceMatch = line.match(/^```\s*([^`]*)\s*$/);
    if (fenceMatch) {
      const start = i;
      const language = fenceMatch[1]?.trim() || undefined;
      i += 1;
      while (i < lines.length && !lines[i].match(/^```\s*$/)) i += 1;
      if (i < lines.length) i += 1;
      if (i < lines.length && lines[i].trim().match(/^<!--\s*forge:block=/)) i += 1;
      const blockLines = lines.slice(start, i);
      const raw = blockLines.join('\n');
      const contentLines = blockLines.slice(1);
      if (contentLines.at(-1)?.trim().startsWith('<!-- forge:block=')) contentLines.pop();
      if (contentLines.at(-1)?.match(/^```\s*$/)) contentLines.pop();
      pushBlock('code', raw, contentLines.join('\n'), start + 1, i, { language });
      continue;
    }

    if (line.trim() === '$$') {
      const start = i;
      i += 1;
      while (i < lines.length && lines[i].trim() !== '$$') i += 1;
      if (i < lines.length) i += 1;
      if (i < lines.length && lines[i].trim().match(/^<!--\s*forge:block=/)) i += 1;
      const blockLines = lines.slice(start, i);
      const raw = blockLines.join('\n');
      const contentLines = blockLines.slice(1);
      if (contentLines.at(-1)?.trim().startsWith('<!-- forge:block=')) contentLines.pop();
      if (contentLines.at(-1)?.trim() === '$$') contentLines.pop();
      pushBlock('math', raw, contentLines.join('\n'), start + 1, i);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      pushBlock('heading', line, headingMatch[2], i + 1, i + 1, { level: headingMatch[1].length });
      i += 1;
      continue;
    }

    if (line.match(/^\s*>\s?/)) {
      const start = i;
      while (i < lines.length && lines[i].match(/^\s*>\s?/)) i += 1;
      if (i < lines.length && lines[i].trim().match(/^<!--\s*forge:block=/)) i += 1;
      const raw = lines.slice(start, i).join('\n');
      const text = raw.replace(/^\s*>\s?/gm, '').trim();
      pushBlock('blockquote', raw, text, start + 1, i);
      continue;
    }

    if (line.match(/^\s*(?:[-*+] |\d+\. )/)) {
      const start = i;
      while (i < lines.length && lines[i].match(/^\s*(?:[-*+] |\d+\. )/)) i += 1;
      if (i < lines.length && lines[i].trim().match(/^<!--\s*forge:block=/)) i += 1;
      const raw = lines.slice(start, i).join('\n').trimEnd();
      const items = raw
        .split('\n')
        .filter((item) => item.trim() !== '' && !item.trim().startsWith('<!-- forge:block='))
        .map((item) => removeForgeComments(item.replace(/^\s*(?:[-*+] |\d+\. )/, '').trim()));
      pushBlock('list', raw, items.join(' '), start + 1, i, { items });
      continue;
    }

    const start = i;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^(#{1,6})\s+/) &&
      !lines[i].match(/^```\s*/) &&
      lines[i].trim() !== '$$' &&
      !lines[i].match(/^\s*>\s?/) &&
      !lines[i].match(/^\s*(?:[-*+] |\d+\. )/)
    ) {
      i += 1;
    }
    const raw = lines.slice(start, i).join('\n');
    pushBlock('paragraph', raw, raw.replace(/\n+/g, ' ').trim(), start + 1, i);
  }

  return {
    document_id: createDocumentId(sourcePath),
    source: basename(sourcePath),
    blocks,
    diagnostics: diagnostics.length ? diagnostics : undefined
  };
}
