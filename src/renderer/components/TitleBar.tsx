interface TitleBarProps {
  articleTitle: string;
}

export function TitleBar({ articleTitle }: TitleBarProps): JSX.Element {
  return (
    <header className="drag-region flex h-12 items-center justify-between border-b border-zinc-900 bg-forge-card/95 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-forge-accent font-display text-sm font-bold text-white shadow-red-glow">
          F
        </div>
        <div className="min-w-0">
          <p className="font-display text-sm uppercase tracking-[0.24em] text-forge-bright">FORGE</p>
          <p className="truncate text-xs text-forge-text/70">{articleTitle || 'Theophysics document viewer'}</p>
        </div>
      </div>
      <div className="no-drag flex items-center overflow-hidden rounded-lg border border-zinc-800">
        <button className="window-button" type="button" aria-label="Minimize" onClick={() => void window.forge.minimize()}>
          −
        </button>
        <button className="window-button" type="button" aria-label="Maximize" onClick={() => void window.forge.toggleMaximize()}>
          □
        </button>
        <button className="window-button hover:bg-forge-accent hover:text-white" type="button" aria-label="Close" onClick={() => void window.forge.close()}>
          ×
        </button>
      </div>
    </header>
  );
}
