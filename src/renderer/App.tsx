import { useEffect, useMemo, useState } from 'react';
import { ArticleViewer } from './components/ArticleViewer.tsx';
import { GridOverlay } from './components/GridOverlay.tsx';
import { GridPanel } from './components/GridPanel.tsx';
import { LayerToggleBar } from './components/LayerToggleBar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TitleBar } from './components/TitleBar.tsx';
import { LayerProvider } from './context/LayerProvider.tsx';
import { useGrid } from './hooks/useGrid.ts';
import { useGridSelection } from './hooks/useGridSelection.ts';
import type { GridCell } from './lib/grid.ts';
import type { DocumentTreeNode } from '../preload/index.ts';

const PREFERRED_START_ARTICLE = 'content/mda-language-of-surrender/mda-language-of-surrender.html';
const FALLBACK_START_ARTICLE = 'moral-decline/mda-part-01-measuring-moral-health.html';

function flattenFiles(nodes: DocumentTreeNode[]): DocumentTreeNode[] {
  return nodes.flatMap((node) => {
    if (node.type === 'file') return [node];
    return flattenFiles(node.children ?? []);
  });
}

function pickInitialDocument(tree: DocumentTreeNode[]): DocumentTreeNode | undefined {
  const files = flattenFiles(tree);
  return (
    files.find((file) => file.relativePath === PREFERRED_START_ARTICLE) ??
    files.find((file) => file.relativePath === FALLBACK_START_ARTICLE) ??
    files[0]
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPlainDocument(source: string, document: DocumentTreeNode): string {
  if (document.extension === '.html') return source;
  return `<main class="prose-body" style="max-width: 920px; margin: 0 auto; padding: 48px; color: #d1d5db; font-family: Inter, sans-serif;"><h1 style="color:#f9fafb;font-family:Oswald,sans-serif;">${escapeHtml(document.name)}</h1><pre style="white-space: pre-wrap; line-height: 1.7; font-family: JetBrains Mono, monospace;">${escapeHtml(source)}</pre></main>`;
}

function AppShell(): JSX.Element {
  const [tree, setTree] = useState<DocumentTreeNode[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentTreeNode | undefined>();
  const [articleHtml, setArticleHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [articleVersion, setArticleVersion] = useState(0);
  const [gridActive, setGridActive] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [highlightedTag, setHighlightedTag] = useState<string | null>(null);
  const gridTools = useGrid(articleHtml);
  const gridSelection = useGridSelection(gridTools.grid, gridActive);

  useEffect(() => {
    let isMounted = true;
    void window.forge.listDocuments().then((nextTree) => {
      if (!isMounted) return;
      setTree(nextTree);
      setSelectedDocument(pickInitialDocument(nextTree));
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDocument) return;
    let isMounted = true;
    setIsLoading(true);
    setSelectedCell(null);
    setHighlightedTag(null);
    void window.forge
      .readDocument(selectedDocument.source, selectedDocument.relativePath)
      .then((source) => {
        if (!isMounted) return;
        setArticleHtml(renderPlainDocument(source, selectedDocument));
        setArticleVersion((version) => version + 1);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedDocument]);

  const fileCount = useMemo(() => flattenFiles(tree).length, [tree]);
  const selectedCells = gridSelection.selectedCells.length > 0 ? gridSelection.selectedCells : selectedCell ? [selectedCell] : [];

  return (
    <div className="flex h-screen flex-col bg-forge-dark text-forge-text">
      <TitleBar articleTitle={selectedDocument?.name ?? ''} />
      <div className="flex min-h-0 flex-1">
        <Sidebar tree={tree} selectedDocumentId={selectedDocument?.id ?? ''} onSelectDocument={setSelectedDocument} />
        <main className="flex min-w-0 flex-1 flex-col bg-gradient-to-br from-forge-dark via-black to-[#130505]">
          <section className="flex items-center justify-between border-b border-zinc-900 px-5 py-3">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.24em] text-forge-amber">Document Surface</p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-forge-bright">{selectedDocument?.name ?? 'Hello World'}</h1>
              <p className="mt-1 font-mono text-[11px] text-forge-text/50">{selectedDocument?.source ?? 'content'} / {selectedDocument?.relativePath ?? 'loading'}</p>
            </div>
          </section>
          <section className="relative min-h-0 flex-1 p-5">
            <ArticleViewer html={articleHtml} isLoading={isLoading} version={articleVersion} />
            <GridOverlay
              active={gridActive && !isLoading}
              grid={gridTools.grid}
              articleVersion={articleVersion}
              selectedCell={selectedCell}
              highlightedTag={highlightedTag}
              onSelectCell={setSelectedCell}
            />
          </section>
          <LayerToggleBar articleVersion={articleVersion} gridActive={gridActive} onToggleGrid={() => setGridActive((active) => !active)} />
        </main>
        {gridActive && (
          <GridPanel
            grid={gridTools.grid}
            selectedCell={selectedCell}
            selectedCells={selectedCells}
            tags={gridTools.tags}
            highlightedTag={highlightedTag}
            onHighlightTag={setHighlightedTag}
            onTagSelectedCell={(tag) => {
              if (!selectedCell) return;
              gridTools.tagCell(selectedCell.row, selectedCell.col, tag);
              setSelectedCell({ ...selectedCell, tags: selectedCell.tags.includes(tag) ? selectedCell.tags : [...selectedCell.tags, tag] });
            }}
          />
        )}
      </div>
      <footer className="flex h-9 items-center justify-between border-t border-zinc-900 bg-forge-card px-4 font-mono text-[11px] text-forge-text/60">
        <span>POF 2828 · FORGE Electron Shell · Layer 2 Grid</span>
        <span>{fileCount} local documents indexed · {gridTools.grid.cellCount} grid cells</span>
      </footer>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <LayerProvider>
      <AppShell />
    </LayerProvider>
  );
}
