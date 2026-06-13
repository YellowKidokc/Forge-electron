import { GridPanel } from './GridPanel.tsx';
import { LayerToggleBar } from './LayerToggleBar.tsx';
import type { LoadedDocument } from '../../preload/index.ts';
import type { GridCell, GridDocument } from '../lib/grid.ts';

interface RightSidebarProps {
  collapsed: boolean;
  loadedDocument: LoadedDocument | null;
  articleVersion: number;
  gridActive: boolean;
  grid: GridDocument;
  selectedCell: GridCell | null;
  selectedCells: GridCell[];
  tags: string[];
  highlightedTag: string | null;
  onToggleGrid: () => void;
  onHighlightTag: (tag: string | null) => void;
  onTagSelectedCell: (tag: string) => void;
  onExportHtml: () => void;
  lastExportPath: string;
}

export function RightSidebar({
  collapsed,
  loadedDocument,
  articleVersion,
  gridActive,
  grid,
  selectedCell,
  selectedCells,
  tags,
  highlightedTag,
  onToggleGrid,
  onHighlightTag,
  onTagSelectedCell,
  onExportHtml,
  lastExportPath
}: RightSidebarProps): JSX.Element | null {
  if (collapsed) return null;

  return (
    <aside className="flex w-96 min-w-80 flex-col border-l border-zinc-900 bg-forge-card/90">
      <div className="border-b border-zinc-900 p-4">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-forge-accent">Layers / Metadata</p>
        <h2 className="mt-1 font-display text-lg uppercase tracking-wide text-forge-bright">Document Controls</h2>
        {loadedDocument && (
          <dl className="mt-4 space-y-2 text-xs text-forge-text/70">
            <div className="flex justify-between gap-3"><dt>Mode</dt><dd className="font-mono text-forge-bright">{loadedDocument.mode}</dd></div>
            <div className="flex justify-between gap-3"><dt>Layer sidecar</dt><dd>{loadedDocument.layerFileLoaded ? 'loaded' : 'missing'}</dd></div>
            <div className="flex justify-between gap-3"><dt>Claims sidecar</dt><dd>{loadedDocument.claimsFileLoaded ? 'loaded' : 'missing'}</dd></div>
          </dl>
        )}
        <button
          type="button"
          className="mt-4 w-full rounded-xl border border-forge-accent bg-forge-accent/15 px-3 py-2 text-sm text-forge-bright hover:bg-forge-accent"
          onClick={onExportHtml}
        >
          Export HTML
        </button>
        {lastExportPath && <p className="mt-2 break-all font-mono text-[11px] text-forge-text/55">{lastExportPath}</p>}
      </div>
      <LayerToggleBar articleVersion={articleVersion} gridActive={gridActive} onToggleGrid={onToggleGrid} />
      {gridActive && (
        <GridPanel
          grid={grid}
          selectedCell={selectedCell}
          selectedCells={selectedCells}
          tags={tags}
          highlightedTag={highlightedTag}
          onHighlightTag={onHighlightTag}
          onTagSelectedCell={onTagSelectedCell}
        />
      )}
    </aside>
  );
}
