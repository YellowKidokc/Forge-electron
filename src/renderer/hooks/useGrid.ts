import { useEffect, useMemo, useState } from 'react';
import {
  buildGrid,
  getAllTags,
  getCell as getGridCell,
  getCellsByTag as getTaggedCells,
  getRow as getGridRow,
  queryCells as queryGridCells,
  searchText as searchGridText,
  setCell as setGridCell,
  tagCell as tagGridCell,
  type GridCell,
  type GridDocument,
  type GridRow
} from '../lib/grid.ts';

export interface UseGridResult {
  grid: GridDocument;
  getCell: (row: number, col: number) => GridCell | null;
  setCell: (row: number, col: number, newText: string) => void;
  tagCell: (row: number, col: number, tag: string) => void;
  queryCells: (predicate: (cell: GridCell) => boolean) => GridCell[];
  searchText: (query: string) => GridCell[];
  getCellsByTag: (tag: string) => GridCell[];
  getRow: (rowIndex: number) => GridRow | null;
  tags: string[];
}

export function useGrid(htmlContent: string): UseGridResult {
  const baseGrid = useMemo(() => buildGrid(htmlContent), [htmlContent]);
  const [editedGrid, setEditedGrid] = useState<GridDocument | null>(null);

  useEffect(() => {
    setEditedGrid(null);
  }, [baseGrid]);

  const grid = editedGrid ?? baseGrid;
  const tags = useMemo(() => getAllTags(grid), [grid]);

  return {
    grid,
    getCell: (row, col) => getGridCell(grid, row, col),
    setCell: (row, col, newText) => setEditedGrid(setGridCell(grid, row, col, newText)),
    tagCell: (row, col, tag) => setEditedGrid(tagGridCell(grid, row, col, tag)),
    queryCells: (predicate) => queryGridCells(grid, predicate),
    searchText: (query) => searchGridText(grid, query),
    getCellsByTag: (tag) => getTaggedCells(grid, tag),
    getRow: (rowIndex) => getGridRow(grid, rowIndex),
    tags
  };
}
