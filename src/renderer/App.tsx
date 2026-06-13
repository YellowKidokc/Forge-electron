import { useEffect, useMemo, useState } from 'react';
import { ArticleViewer } from './components/ArticleViewer.tsx';
import { ForgeDocumentView } from './components/ForgeDocumentView.tsx';
import { GridOverlay } from './components/GridOverlay.tsx';
import { RightSidebar } from './components/RightSidebar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { TitleBar } from './components/TitleBar.tsx';
import { LayerProvider } from './context/LayerProvider.tsx';
import { useGrid } from './hooks/useGrid.ts';
import { useGridSelection } from './hooks/useGridSelection.ts';
import type { GridCell } from './lib/grid.ts';
import type { DocumentTreeNode, LoadedDocument } from '../preload/index.ts';
import type { ForgeBlock, ForgeDocument } from '../parser/markdownParser.ts';

const PREFERRED_START_ARTICLE = 'content/mda-language-of-surrender/mda-language-of-surrender.html';
const FALLBACK_START_ARTICLE = 'article.md';
const FALLBACK_HTML_ARTICLE = 'moral-decline/mda-part-01-measuring-moral-health.html';

function flattenFiles(nodes: DocumentTreeNode[]): DocumentTreeNode[] {
  return nodes.flatMap((node) => node.type === 'file' ? [node] : flattenFiles(node.children ?? []));
}

function pickInitialDocument(tree: DocumentTreeNode[]): DocumentTreeNode | undefined {
  const files = flattenFiles(tree);
  return (
    files.find((file) => file.relativePath === PREFERRED_START_ARTICLE) ??
    files.find((file) => file.relativePath === FALLBACK_START_ARTICLE) ??
    files.find((file) => file.relativePath === FALLBACK_HTML_ARTICLE) ??
    files[0]
  );
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function blockToGridHtml(block: ForgeBlock): string {
  const text = escapeHtml(block.text);
  if (block.type === 'heading') return `<section data-forge-block="${block.id}"><h${block.level ?? 2}>${text}</h${block.level ?? 2}></section>`;
  if (block.type === 'list') return `<section data-forge-block="${block.id}"><ul>${(block.items ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>`;
  if (block.type === 'blockquote') return `<section data-forge-block="${block.id}"><blockquote>${text}</blockquote></section>`;
  if (block.type === 'code' || block.type === 'math') return `<section data-forge-block="${block.id}"><pre><code>${text}</code></pre></section>`;
  return `<section data-forge-block="${block.id}"><p>${text}</p></section>`;
}

function forgeDocumentToGridHtml(document: ForgeDocument): string {
  return document.blocks.map(blockToGridHtml).join('\n');
}

function gridHtmlForDocument(loadedDocument: LoadedDocument | null): string {
  if (!loadedDocument) return '';
  if (loadedDocument.mode === 'forge' && loadedDocument.forgeDocument) return forgeDocumentToGridHtml(loadedDocument.forgeDocument);
  return loadedDocument.html ?? loadedDocument.sourceText;
}

function AppShell(): JSX.Element {
  const [tree, setTree] = useState<DocumentTreeNode[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentTreeNode | undefined>();
  const [loadedDocument, setLoadedDocument] = useState<LoadedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [articleVersion, setArticleVersion] = useState(0);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [gridActive, setGridActive] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [highlightedTag, setHighlightedTag] = useState<string | null>(null);
  const [lastExportPath, setLastExportPath] = useState('');
  const gridTools = useGrid(gridHtmlForDocument(loadedDocument));
  const gridSelection = useGridSelection(gridTools.grid, gridActive);

  useEffect(() => {
    let isMounted = true;
    void window.forge.listDocuments().then((nextTree) => {
      if (!isMounted) return;
      setTree(nextTree);
      setSelectedDocument(pickInitialDocument(nextTree));
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedDocument) return;
    let isMounted = true;
    setIsLoading(true);
    setSelectedCell(null);
    setHighlightedTag(null);
    void window.forge
      .loadDocument(selectedDocument.source, selectedDocument.relativePath)
      .then((document) => {
        if (!isMounted) return;
        setLoadedDocument(document);
        setArticleVersion((version) => version + 1);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, [selectedDocument]);

  const fileCount = useMemo(() => flattenFiles(tree).length, [tree]);
  const selectedCells = gridSelection.selectedCells.length > 0 ? gridSelection.selectedCells : selectedCell ? [selectedCell] : [];

  const exportCurrentDocument = (): void => {
    if (!selectedDocument) return;
    void window.forge.exportDocument(selectedDocument.source, selectedDocument.relativePath).then((result) => setLastExportPath(result.outputPath));
  };

  return (
    <div className="flex h-screen flex-col bg-forge-dark text-forge-text">
      <TitleBar articleTitle={selectedDocument?.name ?? ''} />
      <div className="flex min-h-0 flex-1">
        {!leftCollapsed && <Sidebar tree={tree} selectedDocumentId={selectedDocument?.id ?? ''} onSelectDocument={setSelectedDocument} />}
        <main className="flex min-w-0 flex-1 flex-col bg-gradient-to-br from-forge-dark via-black to-[#130505]">
          <section className="flex items-center justify-between border-b border-zinc-900 px-5 py-3">
            <div>
              <p className="font-display text-xs uppercase tracking-[0.24em] text-forge-amber">Document Surface</p>
              <h1 className="font-display text-2xl uppercase tracking-wide text-forge-bright">{selectedDocument?.name ?? 'Hello World'}</h1>
              <p className="mt-1 font-mono text-[11px] text-forge-text/50">{selectedDocument?.source ?? 'content'} / {selectedDocument?.relativePath ?? 'loading'}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="rounded-full border border-zinc-800 px-3 py-2 text-xs text-forge-text hover:border-forge-amber" onClick={() => setLeftCollapsed((collapsed) => !collapsed)}>{leftCollapsed ? 'Show Files' : 'Hide Files'}</button>
              <button type="button" className="rounded-full border border-zinc-800 px-3 py-2 text-xs text-forge-text hover:border-forge-amber" onClick={() => setRightCollapsed((collapsed) => !collapsed)}>{rightCollapsed ? 'Show Layers' : 'Hide Layers'}</button>
            </div>
          </section>
          <section className="relative min-h-0 flex-1 p-5">
            <ArticleViewer html={loadedDocument?.html} isLoading={isLoading} version={articleVersion}>
              {loadedDocument?.mode === 'forge' && loadedDocument.forgeDocument ? (
                <ForgeDocumentView document={loadedDocument.forgeDocument} layersByBlock={loadedDocument.layersByBlock} claimsByBlock={loadedDocument.claimsByBlock} />
              ) : undefined}
            </ArticleViewer>
            <GridOverlay active={gridActive && !isLoading} grid={gridTools.grid} articleVersion={articleVersion} selectedCell={selectedCell} highlightedTag={highlightedTag} onSelectCell={setSelectedCell} />
          </section>
        </main>
        <RightSidebar
          collapsed={rightCollapsed}
          loadedDocument={loadedDocument}
          articleVersion={articleVersion}
          gridActive={gridActive}
          grid={gridTools.grid}
          selectedCell={selectedCell}
          selectedCells={selectedCells}
          tags={gridTools.tags}
          highlightedTag={highlightedTag}
          onToggleGrid={() => setGridActive((active) => !active)}
          onHighlightTag={setHighlightedTag}
          onExportHtml={exportCurrentDocument}
          lastExportPath={lastExportPath}
          onTagSelectedCell={(tag) => {
            if (!selectedCell) return;
            gridTools.tagCell(selectedCell.row, selectedCell.col, tag);
            setSelectedCell({ ...selectedCell, tags: selectedCell.tags.includes(tag) ? selectedCell.tags : [...selectedCell.tags, tag] });
          }}
        />
      </div>
      <footer className="flex h-9 items-center justify-between border-t border-zinc-900 bg-forge-card px-4 font-mono text-[11px] text-forge-text/60">
        <span>POF 2828 · FORGE Electron Shell · Markdown renderer</span>
        <span>{fileCount} local documents indexed · {gridTools.grid.cellCount} grid cells</span>
      </footer>
    </div>
  );
}

export default function App(): JSX.Element {
  return <LayerProvider><AppShell /></LayerProvider>;
}
