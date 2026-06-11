import { basename } from 'node:path';
import type { ForgeBlock, ForgeDocument } from '../parser/markdownParser.ts';
import type { BlockLayerData, Claim, LoadedLayers } from '../layers/layerTypes.ts';

export interface ExportOptions {
  sourcePath?: string;
  exportedAt?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(markdown: string): string {
  return escapeHtml(markdown)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

function renderBlock(block: ForgeBlock): string {
  switch (block.type) {
    case 'heading': {
      const level = block.level ?? 2;
      return `<h${level} id="${escapeHtml(block.id)}">${renderInline(block.text)}</h${level}>`;
    }
    case 'blockquote':
      return `<blockquote>${renderInline(block.text)}</blockquote>`;
    case 'list':
      return `<ul>${(block.items ?? []).map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`;
    case 'code':
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    case 'math':
      return `<pre class="math-block"><code>${escapeHtml(block.text)}</code></pre>`;
    case 'paragraph':
    default:
      return `<p>${renderInline(block.text)}</p>`;
  }
}

function renderLayerPanel(block: ForgeBlock, layers: BlockLayerData | undefined, claims: Claim[]): string {
  const hasLayers = Boolean(
    layers?.easy ||
      layers?.academic ||
      layers?.math_translation ||
      layers?.commentary?.length ||
      claims.length
  );

  if (!hasLayers) return '';

  const commentary = layers?.commentary?.length
    ? `<dl>${layers.commentary
        .map((item) => `<dt>${escapeHtml(item.label)}</dt><dd>${renderInline(item.value)}</dd>`)
        .join('')}</dl>`
    : '<p class="empty-layer">No commentary for this block.</p>';

  const claimMarkup = claims.length
    ? claims
        .map(
          (claim) => `<article class="claim-card">
            <h4>${escapeHtml(claim.id)}</h4>
            <p>${renderInline(claim.claim)}</p>
            ${claim.kill_condition ? `<p><strong>Kill condition:</strong> ${renderInline(claim.kill_condition)}</p>` : ''}
            <p><strong>Confidence:</strong> ${claim.confidence ?? 'unset'}</p>
          </article>`
        )
        .join('')
    : '<p class="empty-layer">No claims for this block.</p>';

  return `<section class="forge-layers" aria-label="Layers for ${escapeHtml(block.id)}">
    <div class="forge-tabs" role="tablist">
      <button class="active" data-layer="original">Original</button>
      <button data-layer="easy">Easy</button>
      <button data-layer="academic">Academic</button>
      <button data-layer="math">Math Translation</button>
      <button data-layer="claims">Claims</button>
      <button data-layer="commentary">Commentary</button>
    </div>
    <div class="forge-layer active" data-layer-panel="original">${renderBlock(block)}</div>
    <div class="forge-layer" data-layer-panel="easy">${layers?.easy ? `<p>${renderInline(layers.easy)}</p>` : '<p class="empty-layer">No easy layer for this block.</p>'}</div>
    <div class="forge-layer" data-layer-panel="academic">${layers?.academic ? `<p>${renderInline(layers.academic)}</p>` : '<p class="empty-layer">No academic layer for this block.</p>'}</div>
    <div class="forge-layer" data-layer-panel="math">${layers?.math_translation ? `<p>${renderInline(layers.math_translation)}</p>` : '<p class="empty-layer">No math translation for this block.</p>'}</div>
    <div class="forge-layer" data-layer-panel="claims">${claimMarkup}</div>
    <div class="forge-layer" data-layer-panel="commentary">${commentary}</div>
  </section>`;
}

function renderToc(document: ForgeDocument): string {
  const headings = document.blocks.filter((block) => block.type === 'heading');
  if (headings.length === 0) return '';
  return `<nav class="forge-toc" aria-label="Table of contents">
    <h2>Contents</h2>
    <ol>
      ${headings
        .map((heading) => `<li class="toc-level-${heading.level ?? 1}"><a href="#block-${escapeHtml(heading.id)}">${renderInline(heading.text)}</a></li>`)
        .join('')}
    </ol>
  </nav>`;
}

function statusLabel(loaded: boolean): string {
  return loaded ? 'loaded' : 'missing';
}

function renderMetadata(document: ForgeDocument, loadedLayers: LoadedLayers, options: Required<ExportOptions>): string {
  return `<aside class="forge-metadata" aria-label="Document metadata">
    <h2>Document Metadata</h2>
    <dl>
      <dt>Source</dt><dd>${escapeHtml(options.sourcePath || document.source)}</dd>
      <dt>Document ID</dt><dd><code>${escapeHtml(document.document_id)}</code></dd>
      <dt>Block count</dt><dd>${document.blocks.length}</dd>
      <dt>Export timestamp</dt><dd>${escapeHtml(options.exportedAt)}</dd>
      <dt>Layer file</dt><dd>${escapeHtml(basename(loadedLayers.layerFile.path))}: ${statusLabel(loadedLayers.layerFile.loaded)}</dd>
      <dt>Claims file</dt><dd>${escapeHtml(basename(loadedLayers.claimsFile.path))}: ${statusLabel(loadedLayers.claimsFile.loaded)}</dd>
    </dl>
  </aside>`;
}

export function exportHtml(document: ForgeDocument, loadedLayers: LoadedLayers, options: ExportOptions = {}): string {
  const resolvedOptions: Required<ExportOptions> = {
    sourcePath: options.sourcePath ?? document.source,
    exportedAt: options.exportedAt ?? new Date().toISOString()
  };
  const title = document.blocks.find((block) => block.type === 'heading')?.text ?? document.document_id;
  const blocks = document.blocks
    .map((block) => {
      const layers = loadedLayers.layersByBlock[block.id];
      const claims = loadedLayers.claimsByBlock[block.id] ?? [];
      return `<section id="block-${escapeHtml(block.id)}" class="forge-block" data-forge-block="${escapeHtml(block.id)}">
        <div class="block-toolbar"><a class="block-anchor" href="#block-${escapeHtml(block.id)}">#</a><button class="copy-link" data-copy-target="block-${escapeHtml(block.id)}">Copy link</button></div>
        <div class="forge-original">${renderBlock(block)}</div>
        ${renderLayerPanel(block, layers, claims)}
      </section>`;
    })
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · FORGE Export</title>
  <style>
    :root {
      --dark: #050505;
      --card: #0a0a0a;
      --accent: #dc2626;
      --amber: #f59e0b;
      --text: #d1d5db;
      --text-bright: #f9fafb;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--dark); color: var(--text); font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; }
    .panel-controls { display: flex; gap: 8px; left: 50%; position: fixed; top: 12px; transform: translateX(-50%); z-index: 20; }
    .panel-controls button { background: #141414; border: 1px solid #2a2a2a; border-radius: 999px; color: var(--text-bright); cursor: pointer; padding: 7px 12px; }
    .forge-shell { display: grid; gap: 20px; grid-template-columns: 280px minmax(0, 960px) 300px; margin: 0 auto; max-width: 1600px; padding: 48px 20px 80px; transition: grid-template-columns 180ms ease; }
    .forge-document { min-width: 0; }
    .side-panel { align-self: start; background: var(--card); border: 1px solid #1f1f1f; border-radius: 16px; max-height: calc(100vh - 96px); overflow: auto; padding: 18px; position: sticky; top: 48px; transition: opacity 180ms ease, transform 180ms ease; }
    body.left-panel-collapsed .forge-shell { grid-template-columns: 0 minmax(0, 1040px) 300px; }
    body.right-panel-collapsed .forge-shell { grid-template-columns: 280px minmax(0, 1040px) 0; }
    body.left-panel-collapsed.right-panel-collapsed .forge-shell { grid-template-columns: 0 minmax(0, 1120px) 0; }
    body.left-panel-collapsed .left-panel { opacity: 0; pointer-events: none; transform: translateX(-110%); }
    body.right-panel-collapsed .right-panel { opacity: 0; pointer-events: none; transform: translateX(110%); }
    header, .forge-toc, .forge-metadata, .forge-import-note { background: var(--card); border: 1px solid #1f1f1f; border-radius: 16px; margin-bottom: 20px; padding: 18px 20px; }
    .eyebrow { color: var(--accent); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
    h1, h2, h3, h4, h5, h6 { color: var(--text-bright); line-height: 1.15; }
    a { color: var(--amber); }
    code, pre { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace; }
    pre { background: #111; border: 1px solid #242424; border-radius: 12px; overflow: auto; padding: 16px; }
    blockquote { border-left: 3px solid var(--amber); color: var(--text-bright); margin-left: 0; padding-left: 18px; }
    .forge-toc ol { margin: 0; padding-left: 22px; }
    .left-panel .forge-toc, .right-panel .forge-metadata { border: 0; margin: 0; padding: 0; }
    .forge-import-note { color: #a3a3a3; font-size: 0.92rem; }
    .toc-level-2 { margin-left: 16px; } .toc-level-3, .toc-level-4, .toc-level-5, .toc-level-6 { margin-left: 32px; }
    .forge-metadata dl { display: grid; gap: 8px 16px; grid-template-columns: max-content 1fr; }
    .forge-metadata dt { color: var(--amber); font-weight: 700; }
    .forge-metadata dd { margin: 0; }
    .forge-block { background: rgba(10,10,10,0.82); border: 1px solid #1f1f1f; border-radius: 16px; margin: 18px 0; padding: 20px; scroll-margin-top: 16px; }
    .forge-block::before { content: attr(data-forge-block); color: #777; display: block; font-family: "JetBrains Mono", monospace; font-size: 0.74rem; margin-bottom: 10px; }
    .block-toolbar { display: flex; gap: 8px; justify-content: flex-end; }
    .block-anchor, .copy-link { background: #141414; border: 1px solid #2a2a2a; border-radius: 999px; color: var(--text); font-size: 0.78rem; padding: 5px 9px; text-decoration: none; }
    .copy-link { cursor: pointer; }
    .forge-layers { border-top: 1px solid #222; margin-top: 16px; padding-top: 14px; }
    .forge-original + .forge-layers .forge-layer[data-layer-panel="original"] { display: none; }
    .forge-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
    .forge-tabs button { background: #141414; border: 1px solid #2a2a2a; border-radius: 999px; color: var(--text); cursor: pointer; padding: 7px 11px; }
    .forge-tabs button.active { background: var(--accent); border-color: var(--accent); color: white; }
    .forge-layer { display: none; background: #070707; border: 1px solid #202020; border-radius: 12px; padding: 14px 16px; }
    .forge-layer.active { display: block; }
    .empty-layer { color: #777; font-style: italic; }
    dt { color: var(--amber); font-weight: 700; }
    dd { margin: 0 0 12px; }
    .claim-card { border-left: 3px solid var(--accent); padding-left: 14px; }
    @media (max-width: 1100px) {
      .forge-shell { display: block; padding-left: 16px; padding-right: 16px; }
      .side-panel { margin-bottom: 16px; max-height: none; position: static; }
      body.left-panel-collapsed .left-panel, body.right-panel-collapsed .right-panel { display: none; }
    }
  </style>
</head>
<body>
  <div class="panel-controls" aria-label="Sliding columns">
    <button data-toggle-panel="left" type="button">Toggle files</button>
    <button data-toggle-panel="right" type="button">Toggle layers</button>
  </div>
  <div class="forge-shell">
    <aside class="side-panel left-panel" aria-label="Files and organization">
      <div class="eyebrow">Files / Organization</div>
      <p class="forge-import-note">Import many Markdown or text files with <code>npm run forge -- import-folder &lt;folder&gt;</code>. This export shows the current document outline.</p>
      ${renderToc(document)}
    </aside>
    <main class="forge-document">
    <header>
      <div class="eyebrow">FORGE Markdown Export</div>
      <h1>${escapeHtml(title)}</h1>
      <p>Document ID: <code>${escapeHtml(document.document_id)}</code></p>
    </header>
    ${blocks}
    </main>
    <aside class="side-panel right-panel" aria-label="Layers and metadata">
      <div class="eyebrow">Layers / Metadata</div>
      ${renderMetadata(document, loadedLayers, resolvedOptions)}
      <section class="forge-import-note">
        <h2>Layer Column</h2>
        <p>This side stays separate from the writing surface so notes, claims, and commentary can slide in and out without rewriting the source Markdown.</p>
      </section>
    </aside>
  </div>
  <script>
    document.querySelectorAll('[data-toggle-panel]').forEach((button) => {
      button.addEventListener('click', () => {
        document.body.classList.toggle(button.dataset.togglePanel + '-panel-collapsed');
      });
    });
    document.querySelectorAll('.forge-layers').forEach((layerRoot) => {
      layerRoot.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-layer]');
        if (!button) return;
        const layer = button.dataset.layer;
        layerRoot.querySelectorAll('button[data-layer]').forEach((tab) => tab.classList.toggle('active', tab === button));
        layerRoot.querySelectorAll('[data-layer-panel]').forEach((panel) => panel.classList.toggle('active', panel.dataset.layerPanel === layer));
      });
    });
    document.querySelectorAll('.copy-link').forEach((button) => {
      button.addEventListener('click', async () => {
        const target = button.dataset.copyTarget;
        const url = new URL(window.location.href);
        url.hash = target;
        await navigator.clipboard?.writeText(url.toString());
        button.textContent = 'Copied';
        setTimeout(() => { button.textContent = 'Copy link'; }, 1200);
      });
    });
  </script>
</body>
</html>
`;
}
