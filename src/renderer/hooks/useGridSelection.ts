import { useEffect, useState } from 'react';
import type { GridCell, GridDocument } from '../lib/grid.ts';

export interface GridSelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface GridSelectionState {
  selectedCells: GridCell[];
  selectionRange: GridSelectionRange | null;
}

function cellsBetween(grid: GridDocument, startRow: number, startCol: number, endRow: number, endCol: number): GridCell[] {
  const cells: GridCell[] = [];
  for (const row of grid.rows) {
    if (row.index < startRow || row.index > endRow) continue;
    for (const cell of row.cells) {
      if (row.index === startRow && cell.col < startCol) continue;
      if (row.index === endRow && cell.col > endCol) continue;
      cells.push(cell);
    }
  }
  return cells;
}

function cellFromNode(node: Node | null): { row: number; col: number } | null {
  const element = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
  if (!(element instanceof Element)) return null;
  const cell = element.closest('[data-grid-row][data-grid-col]');
  if (!cell) return null;
  return {
    row: Number(cell.getAttribute('data-grid-row')),
    col: Number(cell.getAttribute('data-grid-col'))
  };
}

export function useGridSelection(grid: GridDocument, enabled: boolean): GridSelectionState {
  const [state, setState] = useState<GridSelectionState>({ selectedCells: [], selectionRange: null });

  useEffect(() => {
    if (!enabled) {
      setState({ selectedCells: [], selectionRange: null });
      return undefined;
    }

    const handleSelection = (): void => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setState({ selectedCells: [], selectionRange: null });
        return;
      }

      const range = selection.getRangeAt(0);
      const start = cellFromNode(range.startContainer);
      const end = cellFromNode(range.endContainer);
      if (!start || !end) return;

      const startKey = start.row * 100000 + start.col;
      const endKey = end.row * 100000 + end.col;
      const first = startKey <= endKey ? start : end;
      const last = startKey <= endKey ? end : start;
      const selectionRange = { startRow: first.row, startCol: first.col, endRow: last.row, endCol: last.col };
      setState({ selectedCells: cellsBetween(grid, first.row, first.col, last.row, last.col), selectionRange });
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [enabled, grid]);

  return state;
}
