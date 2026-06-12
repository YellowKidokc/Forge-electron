import type { DocumentTreeNode } from '../../preload/index.ts';
import { FileTree } from './FileTree.tsx';

interface SidebarProps {
  tree: DocumentTreeNode[];
  selectedDocumentId: string;
  onSelectDocument: (node: DocumentTreeNode) => void;
}

export function Sidebar({ tree, selectedDocumentId, onSelectDocument }: SidebarProps): JSX.Element {
  return (
    <aside className="flex min-h-0 w-80 flex-col border-r border-zinc-900 bg-forge-card/85">
      <div className="border-b border-zinc-900 p-4">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-forge-accent">Vault</p>
        <h2 className="mt-1 font-display text-lg uppercase tracking-wide text-forge-bright">Document Tree</h2>
        <p className="mt-2 text-xs leading-5 text-forge-text/65">Browse local content and imported vault files.</p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        <FileTree nodes={tree} selectedDocumentId={selectedDocumentId} onSelectDocument={onSelectDocument} />
      </nav>
    </aside>
  );
}
