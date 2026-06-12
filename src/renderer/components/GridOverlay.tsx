import { useEffect } from 'react';
import type { GridCell, GridDocument } from '../lib/grid.ts';

interface GridOverlayProps {
  active: boolean;
  grid: GridDocument;
  articleVersion: number;
  selectedCell: GridCell | null;
  highlightedTag: string | null;
  onSelectCell: (cell: GridCell) => void;
}

const wordPattern = /[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu;

function unwrapGridCells(): void {
  document.querySelectorAll('.forge-grid-cell').forEach((node) => {
    const parent = node.parentNode;
    if (!parent) return;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    node.remove();
    parent.normalize();
  });
}

function shouldSkipNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  return Boolean(parent.closest('script,style,nav,footer,button,select,.forge-grid-cell,.forge-layers,.block-toolbar'));
}

function wrapTextNode(textNode: Text, cells: GridCell[], cursor: { index: number }, onSelectCell: (cell: GridCell) => void): void {
  const text = textNode.textContent ?? '';
  if (!text.trim()) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;
  let changed = false;

  for (const match of text.matchAll(wordPattern)) {
    if (cursor.index >= cells.length) break;
    const matchIndex = match.index ?? 0;
    const word = match[0];
    const cell = cells[cursor.index];

    if (matchIndex > lastIndex) fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));

    const span = document.createElement('span');
    span.className = 'forge-grid-cell';
    span.dataset.gridRow = String(cell.row);
    span.dataset.gridCol = String(cell.col);
    span.dataset.blockId = cell.blockId;
    span.title = `Row ${cell.row}, Col ${cell.col} — ${cell.text}`;
    span.textContent = word;
    span.addEventListener('click', (event) => {
      event.stopPropagation();
      onSelectCell(cell);
    });
    fragment.appendChild(span);
    lastIndex = matchIndex + word.length;
    cursor.index += 1;
    changed = true;
  }

  if (!changed) return;
  if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  textNode.replaceWith(fragment);
}

function applySelectionState(selectedCell: GridCell | null, highlightedTag: string | null): void {
  document.querySelectorAll('.forge-grid-cell').forEach((node) => {
    const element = node as HTMLElement;
    const row = Number(element.dataset.gridRow);
    const col = Number(element.dataset.gridCol);
    const selected = Boolean(selectedCell && selectedCell.row === row && selectedCell.col === col);
    element.classList.toggle('selected', selected);
    element.classList.remove('tag-highlighted');
  });

  if (!highlightedTag) return;
  document.querySelectorAll('.forge-grid-cell').forEach((node) => {
    const element = node as HTMLElement;
    const row = Number(element.dataset.gridRow);
    const col = Number(element.dataset.gridCol);
    const cell = gridCellLookup(row, col, selectedCell);
    if (cell?.tags.includes(highlightedTag)) element.classList.add('tag-highlighted');
  });
}

function gridCellLookup(_row: number, _col: number, _selectedCell: GridCell | null): GridCell | null {
  return null;
}

export function GridOverlay({ active, grid, articleVersion, selectedCell, highlightedTag, onSelectCell }: GridOverlayProps): JSX.Element {
  useEffect(() => {
    unwrapGridCells();
    if (!active) return undefined;

    const root = document.querySelector('.article-shell .article-content');
    if (!root) return undefined;

    const cells = grid.rows.flatMap((row) => row.cells);
    const cursor = { index: 0 };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => (shouldSkipNode(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }
    textNodes.forEach((node) => wrapTextNode(node, cells, cursor, onSelectCell));

    return () => unwrapGridCells();
  }, [active, articleVersion, grid, onSelectCell]);

  useEffect(() => {
    document.querySelectorAll('.forge-grid-cell').forEach((node) => {
      const element = node as HTMLElement;
      const row = Number(element.dataset.gridRow);
      const col = Number(element.dataset.gridCol);
      const cell = grid.rows[row]?.cells[col] ?? null;
      const selected = Boolean(selectedCell && selectedCell.row === row && selectedCell.col === col);
      element.classList.toggle('selected', selected);
      element.classList.toggle('tag-highlighted', Boolean(highlightedTag && cell?.tags.includes(highlightedTag)));
    });
  }, [grid, highlightedTag, selectedCell]);

  return <></>;
}
