import { useState } from 'react';
import type { BlockLayerData, Claim } from '../../layers/layerTypes.ts';
import type { ForgeBlock, ForgeDocument } from '../../parser/markdownParser.ts';

interface ForgeDocumentViewProps {
  document: ForgeDocument;
  layersByBlock: Record<string, BlockLayerData>;
  claimsByBlock: Record<string, Claim[]>;
}

function renderInline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function BlockContent({ block }: { block: ForgeBlock }): JSX.Element {
  const html = renderInline(block.text);
  if (block.type === 'heading') {
    const level = Math.min(Math.max(block.level ?? 2, 1), 6);
    const Tag = `h${level}`;
    return <Tag id={block.id} className="text-forge-bright" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  if (block.type === 'blockquote') return <blockquote dangerouslySetInnerHTML={{ __html: html }} />;
  if (block.type === 'list') {
    return (
      <ul className="list-disc pl-6">
        {(block.items ?? []).map((item, index) => <li key={`${block.id}-${index}`} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />)}
      </ul>
    );
  }
  if (block.type === 'code' || block.type === 'math') return <pre><code>{block.text}</code></pre>;
  return <p dangerouslySetInnerHTML={{ __html: html }} />;
}

function LayerTabs({ block, layer, claims }: { block: ForgeBlock; layer?: BlockLayerData; claims: Claim[] }): JSX.Element | null {
  const [activeTab, setActiveTab] = useState('original');
  const hasLayer = Boolean(layer?.easy || layer?.academic || layer?.math_translation || layer?.commentary?.length || claims.length);
  if (!hasLayer) return null;
  const tabs = ['original', 'easy', 'academic', 'math', 'claims', 'commentary'];

  return (
    <section className="mt-4 border-t border-zinc-800 pt-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-3 py-1 text-xs capitalize ${activeTab === tab ? 'border-forge-accent bg-forge-accent text-white' : 'border-zinc-800 bg-black/30 text-forge-text hover:border-forge-amber'}`}
          >
            {tab === 'math' ? 'Math Translation' : tab}
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-900 bg-black/30 p-4 text-sm">
        {activeTab === 'original' && <BlockContent block={block} />}
        {activeTab === 'easy' && <p>{layer?.easy || 'No easy layer for this block.'}</p>}
        {activeTab === 'academic' && <p>{layer?.academic || 'No academic layer for this block.'}</p>}
        {activeTab === 'math' && <p>{layer?.math_translation || 'No math translation for this block.'}</p>}
        {activeTab === 'commentary' && (
          layer?.commentary?.length ? <dl>{layer.commentary.map((item) => <div key={`${item.label}-${item.value}`}><dt className="text-forge-amber">{item.label}</dt><dd>{item.value}</dd></div>)}</dl> : <p>No commentary for this block.</p>
        )}
        {activeTab === 'claims' && (
          claims.length ? <div className="space-y-3">{claims.map((claim) => <article key={claim.id} className="border-l-2 border-forge-accent pl-3"><h4 className="text-forge-bright">{claim.id}</h4><p>{claim.claim}</p>{claim.kill_condition && <p><strong>Kill condition:</strong> {claim.kill_condition}</p>}</article>)}</div> : <p>No claims for this block.</p>
        )}
      </div>
    </section>
  );
}

function BlockCard({ block, layer, claims }: { key?: string; block: ForgeBlock; layer?: BlockLayerData; claims: Claim[] }): JSX.Element {
  return (
    <section id={`block-${block.id}`} data-forge-block={block.id} className="forge-block rounded-2xl border border-zinc-900 bg-forge-card/90 p-5">
      <div className="mb-3 flex justify-between gap-3 font-mono text-[11px] text-forge-text/45">
        <span>{block.id}</span>
        <a className="text-forge-amber" href={`#block-${block.id}`}>#</a>
      </div>
      <BlockContent block={block} />
      <LayerTabs block={block} layer={layer} claims={claims} />
    </section>
  );
}

export function ForgeDocumentView({ document, layersByBlock, claimsByBlock }: ForgeDocumentViewProps): JSX.Element {
  const title = document.blocks.find((block) => block.type === 'heading')?.text ?? document.document_id;
  const headings = document.blocks.filter((block) => block.type === 'heading');

  return (
    <article className="prose-body mx-auto max-w-5xl space-y-5 p-8 text-forge-text">
      <header className="rounded-2xl border border-zinc-900 bg-forge-card p-6">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-forge-accent">FORGE Markdown Document</p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-wide text-forge-bright">{title}</h1>
        <p className="mt-2 font-mono text-xs text-forge-text/55">{document.document_id} · {document.blocks.length} blocks</p>
      </header>
      {headings.length > 0 && (
        <nav className="rounded-2xl border border-zinc-900 bg-forge-card p-5">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-forge-amber">Contents</h2>
          <ol className="mt-3 space-y-1 pl-5">
            {headings.map((heading) => <li key={heading.id}><a href={`#block-${heading.id}`} className="text-forge-text hover:text-forge-amber">{heading.text}</a></li>)}
          </ol>
        </nav>
      )}
      {document.blocks.map((block) => <BlockCard key={block.id} block={block} layer={layersByBlock[block.id]} claims={claimsByBlock[block.id] ?? []} />)}
    </article>
  );
}
