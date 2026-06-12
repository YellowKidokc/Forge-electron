export interface GridCell {
  row: number;
  col: number;
  text: string;
  charStart: number;
  charEnd: number;
  blockId: string;
  tags: string[];
  meta: Record<string, unknown>;
}

export interface GridRow {
  index: number;
  blockId: string;
  blockType: string;
  cells: GridCell[];
  rawText: string;
}

export interface GridDocument {
  rows: GridRow[];
  cellCount: number;
  wordCount: number;
  blockCount: number;
}

interface BlockCandidate {
  blockId?: string;
  blockType: string;
  rawText: string;
}

const wordPattern = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/g, '');
  return slug || 'untitled';
}

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function createUniqueBlockId(type: string, text: string, used: Map<string, number>, explicitId?: string): string {
  const base = explicitId || `${type}-${slugify(text)}`;
  const count = used.get(base) ?? 0;
  used.set(base, count + 1);
  return count === 0 ? base : `${base}-${String(count + 1).padStart(3, '0')}`;
}

function detectBlockType(element: Element): string {
  const tag = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag)) return 'heading';
  if (tag === 'li' || tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'blockquote') return 'blockquote';
  if (tag === 'pre' || tag === 'code') return 'code';
  if (element.classList.contains('math-block') || element.querySelector('.math-block')) return 'math';
  if (tag === 'section' && element.getAttribute('data-forge-block')?.startsWith('heading-')) return 'heading';
  return tag === 'p' ? 'paragraph' : 'block';
}

function blocksFromDom(htmlContent: string): BlockCandidate[] | null {
  if (typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
  doc.querySelectorAll('script, style, nav, footer, .forge-tabs, .forge-layer:not(.active), .block-toolbar').forEach((node) => node.remove());
  const forgeBlocks = Array.from(doc.querySelectorAll('[data-forge-block]'));
  const elements = forgeBlocks.length > 0
    ? forgeBlocks
    : Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6,p,blockquote,li,pre,details[data-eq-id],.mtl-callout,.math-translation-block'));

  return elements
    .map((element) => ({
      blockId: element.getAttribute('data-forge-block') ?? undefined,
      blockType: detectBlockType(element),
      rawText: (element.textContent ?? '').replace(/\s+/g, ' ').trim()
    }))
    .filter((block) => block.rawText.length > 0);
}

function blocksFromRegex(htmlContent: string): BlockCandidate[] {
  const candidates: BlockCandidate[] = [];
  const forgePattern = /<([a-z0-9-]+)([^>]*data-forge-block=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/\1>/gi;
  let forgeMatch: RegExpExecArray | null;
  while ((forgeMatch = forgePattern.exec(htmlContent)) !== null) {
    const rawText = textFromHtml(forgeMatch[4]);
    if (rawText) {
      candidates.push({
        blockId: forgeMatch[3],
        blockType: forgeMatch[3].split('-')[0] || 'block',
        rawText
      });
    }
  }

  const blockPattern = /<(h[1-6]|p|blockquote|li|pre|code)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockPattern.exec(htmlContent)) !== null) {
    const rawText = textFromHtml(match[3]);
    if (!rawText || candidates.some((candidate) => candidate.rawText === rawText)) continue;
    const tag = match[1].toLowerCase();
    candidates.push({
      blockType: /^h[1-6]$/.test(tag) ? 'heading' : tag === 'li' ? 'list' : tag,
      rawText
    });
  }

  if (candidates.length > 0) return candidates;
  const fallback = textFromHtml(htmlContent);
  return fallback ? [{ blockType: 'paragraph', rawText: fallback }] : [];
}

function cellsForRow(rowIndex: number, blockId: string, rawText: string): GridCell[] {
  const cells: GridCell[] = [];
  for (const match of rawText.matchAll(wordPattern)) {
    const text = match[0];
    const charStart = match.index ?? 0;
    cells.push({
      row: rowIndex,
      col: cells.length,
      text,
      charStart,
      charEnd: charStart + text.length,
      blockId,
      tags: [],
      meta: {}
    });
  }
  return cells;
}

export function buildGrid(htmlContent: string): GridDocument {
  const usedIds = new Map<string, number>();
  const blocks = blocksFromDom(htmlContent) ?? blocksFromRegex(htmlContent);
  const rows = blocks.map((block, index) => {
    const blockId = createUniqueBlockId(block.blockType, block.rawText, usedIds, block.blockId);
    return {
      index,
      blockId,
      blockType: block.blockType,
      rawText: block.rawText,
      cells: cellsForRow(index, blockId, block.rawText)
    };
  });
  const cellCount = rows.reduce((total, row) => total + row.cells.length, 0);
  return {
    rows,
    cellCount,
    wordCount: cellCount,
    blockCount: rows.length
  };
}

export function getCell(grid: GridDocument, row: number, col: number): GridCell | null {
  return grid.rows[row]?.cells[col] ?? null;
}

export function getRow(grid: GridDocument, rowIndex: number): GridRow | null {
  return grid.rows[rowIndex] ?? null;
}

export function setCell(grid: GridDocument, row: number, col: number, newText: string): GridDocument {
  return {
    ...grid,
    rows: grid.rows.map((gridRow) => {
      if (gridRow.index !== row) return gridRow;
      const cells = gridRow.cells.map((cell) => (cell.col === col ? { ...cell, text: newText, charEnd: cell.charStart + newText.length } : cell));
      return {
        ...gridRow,
        cells,
        rawText: cells.map((cell) => cell.text).join(' ')
      };
    })
  };
}

export function queryCells(grid: GridDocument, predicate: (cell: GridCell) => boolean): GridCell[] {
  return grid.rows.flatMap((row) => row.cells.filter(predicate));
}

export function tagCell(grid: GridDocument, row: number, col: number, tag: string): GridDocument {
  return {
    ...grid,
    rows: grid.rows.map((gridRow) => {
      if (gridRow.index !== row) return gridRow;
      return {
        ...gridRow,
        cells: gridRow.cells.map((cell) => {
          if (cell.col !== col || cell.tags.includes(tag)) return cell;
          return { ...cell, tags: [...cell.tags, tag] };
        })
      };
    })
  };
}

export function getCellsByTag(grid: GridDocument, tag: string): GridCell[] {
  return queryCells(grid, (cell) => cell.tags.includes(tag));
}

export function searchText(grid: GridDocument, query: string): GridCell[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return queryCells(grid, (cell) => cell.text.toLowerCase().includes(normalized));
}

export function getAllTags(grid: GridDocument): string[] {
  return [...new Set(grid.rows.flatMap((row) => row.cells.flatMap((cell) => cell.tags)))].sort();
}
