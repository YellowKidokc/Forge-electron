interface ArticleViewerProps {
  html?: string;
  isLoading: boolean;
  version: number;
  children?: JSX.Element;
}

export function ArticleViewer({ html, isLoading, version, children }: ArticleViewerProps): JSX.Element {
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-zinc-900 bg-forge-card">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-forge-accent/40" />
          <p className="mt-4 font-display uppercase tracking-[0.2em] text-forge-text">Loading document</p>
        </div>
      </div>
    );
  }

  return (
    <article key={version} className="article-shell h-full overflow-y-auto rounded-2xl border border-zinc-900 bg-[#080808] shadow-2xl shadow-black/50">
      <div className="article-content">{children ?? <div dangerouslySetInnerHTML={{ __html: html ?? '' }} />}</div>
    </article>
  );
}
