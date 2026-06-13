import { useState } from 'react';
import type { DocumentTreeNode } from '../../preload/index.ts';

interface FileTreeProps {
  nodes: DocumentTreeNode[];
  selectedDocumentId: string;
  onSelectDocument: (node: DocumentTreeNode) => void;
}

interface TreeNodeProps extends FileTreeProps {
  key?: string;
  node: DocumentTreeNode;
  depth: number;
}

function TreeNode({ node, depth, selectedDocumentId, onSelectDocument }: TreeNodeProps): JSX.Element {
  const [expanded, setExpanded] = useState(depth < 1);
  const isFolder = node.type === 'folder';
  const selected = selectedDocumentId === node.id;
  const paddingLeft = `${depth * 14 + 10}px`;

  if (isFolder) {
    return (
      <div>
        <button
          type="button"
          style={{ paddingLeft }}
          className="mb-1 flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left text-xs uppercase tracking-[0.18em] text-forge-text/70 hover:bg-white/5 hover:text-forge-bright"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="font-mono text-forge-amber">{expanded ? '▾' : '▸'}</span>
          <span>{node.name}</span>
        </button>
        {expanded && node.children?.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            nodes={[]}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={onSelectDocument}
          />
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      style={{ paddingLeft }}
      onClick={() => onSelectDocument(node)}
      className={`mb-1 flex w-full items-center gap-2 rounded-lg py-2 pr-2 text-left transition ${
        selected
          ? 'border border-forge-accent bg-forge-accent/10 text-forge-bright shadow-red-glow'
          : 'border border-transparent text-forge-text hover:border-forge-amber/60 hover:bg-white/5 hover:text-forge-bright'
      }`}
    >
      <span className="font-mono text-[11px] text-forge-amber">{node.extension === '.html' ? 'HTML' : 'MD'}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{node.name}</span>
    </button>
  );
}

export function FileTree({ nodes, selectedDocumentId, onSelectDocument }: FileTreeProps): JSX.Element {
  return (
    <div className="space-y-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          nodes={nodes}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={onSelectDocument}
        />
      ))}
    </div>
  );
}
