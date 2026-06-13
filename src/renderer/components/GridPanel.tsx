import type { GridCell, GridDocument } from '../lib/grid.ts';

interface GridPanelProps {
  grid: GridDocument;
  selectedCell: GridCell | null;
  selectedCells: GridCell[];
  tags: string[];
  highlightedTag: string | null;
  onHighlightTag: (tag: string | null) => void;
  onTagSelectedCell: (tag: string) => void;
}

export function GridPanel({
  grid,
  selectedCell,
  selectedCells,
  tags,
  highlightedTag,
  onHighlightTag,
  onTagSelectedCell
}: GridPanelProps): JSX.Element {
  return (
    <aside className="flex w-80 flex-col border-l border-zinc-900 bg-forge-card/90 p-4">
      <div>
        <p className="font-display text-xs uppercase tracking-[0.24em] text-forge-accent">Layer 2</p>
        <h2 className="mt-1 font-display text-lg uppercase tracking-wide text-forge-bright">Grid Substrate</h2>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-zinc-900 bg-black/30 p-3">
          <dt className="text-forge-text/50">Rows</dt>
          <dd className="font-mono text-xl text-forge-bright">{grid.blockCount}</dd>
        </div>
        <div className="rounded-lg border border-zinc-900 bg-black/30 p-3">
          <dt className="text-forge-text/50">Cells</dt>
          <dd className="font-mono text-xl text-forge-bright">{grid.cellCount}</dd>
        </div>
        <div className="rounded-lg border border-zinc-900 bg-black/30 p-3">
          <dt className="text-forge-text/50">Words</dt>
          <dd className="font-mono text-xl text-forge-bright">{grid.wordCount}</dd>
        </div>
        <div className="rounded-lg border border-zinc-900 bg-black/30 p-3">
          <dt className="text-forge-text/50">Selected</dt>
          <dd className="font-mono text-xl text-forge-bright">{selectedCells.length}</dd>
        </div>
      </dl>

      <section className="mt-5 rounded-xl border border-zinc-900 bg-black/30 p-3">
        <h3 className="font-display text-sm uppercase tracking-[0.18em] text-forge-amber">Selected Cell</h3>
        {selectedCell ? (
          <div className="mt-3 space-y-2 text-sm">
            <p className="font-mono text-forge-bright">Row {selectedCell.row}, Col {selectedCell.col}</p>
            <p className="rounded bg-black/40 p-2 text-forge-text">{selectedCell.text}</p>
            <p className="break-all text-xs text-forge-text/50">{selectedCell.blockId}</p>
            <button
              type="button"
              className="rounded-full border border-forge-amber/60 px-3 py-1 text-xs text-forge-amber hover:bg-forge-amber hover:text-black"
              onClick={() => onTagSelectedCell('selected')}
            >
              Tag as selected
            </button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-forge-text/55">Click a grid cell to inspect it.</p>
        )}
      </section>

      <section className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-xl border border-zinc-900 bg-black/30 p-3">
        <h3 className="font-display text-sm uppercase tracking-[0.18em] text-forge-amber">Tags</h3>
        {tags.length === 0 ? (
          <p className="mt-3 text-sm text-forge-text/55">No semantic tags yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`rounded-full border px-3 py-1 text-xs ${
                  highlightedTag === tag
                    ? 'border-forge-accent bg-forge-accent text-white'
                    : 'border-zinc-700 text-forge-text hover:border-forge-amber hover:text-forge-bright'
                }`}
                onClick={() => onHighlightTag(highlightedTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
