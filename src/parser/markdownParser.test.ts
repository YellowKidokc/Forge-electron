import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { exportHtml } from '../export/htmlExporter.ts';
import { loadLayers } from '../layers/layerStore.ts';
import { validateMarkdownFile } from '../validation/validate.ts';
import { importFolderToVault } from '../vault/importer.ts';
import { loadEngines, runEngine } from '../engine/engine.ts';
import { syncMirror } from '../mirror/mirror.ts';
import { createBlockId } from './blockId.ts';
import { parseMarkdown } from './markdownParser.ts';

const fixturePath = 'test.md';

test('stable block ID generation uses type and slug', () => {
  const used = new Map<string, number>();
  assert.equal(createBlockId('heading', 'Introduction', used).id, 'heading-introduction');
});

test('duplicate suffix handling appends a three-digit counter', () => {
  const used = new Map<string, number>();
  assert.equal(createBlockId('paragraph', 'Same text', used).id, 'paragraph-same-text');
  assert.equal(createBlockId('paragraph', 'Same text', used).id, 'paragraph-same-text-002');
});

test('parses headings and paragraphs', () => {
  const document = parseMarkdown('# Title\n\nParagraph text.', fixturePath);
  assert.equal(document.blocks[0].type, 'heading');
  assert.equal(document.blocks[0].text, 'Title');
  assert.equal(document.blocks[1].type, 'paragraph');
  assert.equal(document.blocks[1].text, 'Paragraph text.');
});

test('parses blockquotes', () => {
  const document = parseMarkdown('> Quote line', fixturePath);
  assert.equal(document.blocks[0].type, 'blockquote');
  assert.equal(document.blocks[0].text, 'Quote line');
});

test('parses lists', () => {
  const document = parseMarkdown('- One\n- Two', fixturePath);
  assert.equal(document.blocks[0].type, 'list');
  assert.deepEqual(document.blocks[0].items, ['One', 'Two']);
});

test('parses fenced code', () => {
  const document = parseMarkdown('```ts\nconst x = 1;\n```', fixturePath);
  assert.equal(document.blocks[0].type, 'code');
  assert.equal(document.blocks[0].language, 'ts');
  assert.equal(document.blocks[0].text, 'const x = 1;');
});

test('parses math blocks', () => {
  const document = parseMarkdown('$$\na + b = c\n$$', fixturePath);
  assert.equal(document.blocks[0].type, 'math');
  assert.equal(document.blocks[0].text, 'a + b = c');
});

test('preserves existing FORGE IDs', () => {
  const document = parseMarkdown('## Introduction <!-- forge:id=heading-introduction -->\n\nParagraph.\n<!-- forge:block=paragraph-custom -->', fixturePath);
  assert.equal(document.blocks[0].id, 'heading-introduction');
  assert.equal(document.blocks[0].idSource, 'explicit');
  assert.equal(document.blocks[1].id, 'paragraph-custom');
  assert.equal(document.blocks[1].idSource, 'explicit');
});

test('validation catches unknown block references', () => {
  const root = join(process.cwd(), '.tmp-forge-tests');
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  const markdownPath = join(root, 'bad.md');
  writeFileSync(markdownPath, '# Title\n', 'utf8');
  writeFileSync(join(root, 'bad.forge.json'), JSON.stringify(parseMarkdown('# Title\n', markdownPath), null, 2), 'utf8');
  writeFileSync(join(root, 'bad.claims.json'), JSON.stringify({ document_id: 'bad', claims: [{ id: 'claim-1', block_id: 'missing-block', claim: 'Bad', evidence: [] }] }), 'utf8');

  const result = validateMarkdownFile(markdownPath);
  assert.equal(result.ok, false);
  assert.ok(result.messages.some((message) => message.message.includes('claims reference unknown block: missing-block')));
  rmSync(root, { recursive: true, force: true });
});

test('missing layer and claim sidecars do not crash export', () => {
  const root = join(process.cwd(), '.tmp-forge-tests');
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  const markdownPath = join(root, 'plain.md');
  writeFileSync(markdownPath, '# Title\n\nBody.', 'utf8');
  const document = parseMarkdown('# Title\n\nBody.', markdownPath);
  const html = exportHtml(document, loadLayers(markdownPath), { sourcePath: markdownPath, exportedAt: 'test-time' });
  assert.match(html, /Layer file<\/dt><dd>plain\.layers\.json: missing/);
  assert.match(html, /Claims file<\/dt><dd>plain\.claims\.json: missing/);
  assert.match(html, /Toggle files/);
  assert.match(html, /Toggle layers/);
  rmSync(root, { recursive: true, force: true });
});


test('imports many markdown and text files into a vault manifest', () => {
  const root = join(process.cwd(), '.tmp-forge-tests');
  const source = join(root, 'source');
  const vault = join(root, 'vault');
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(source, 'nested'), { recursive: true });
  mkdirSync(join(source, '.hidden'), { recursive: true });
  writeFileSync(join(source, 'note.md'), '# Note', 'utf8');
  writeFileSync(join(source, 'nested', 'message.txt'), 'hello', 'utf8');
  writeFileSync(join(source, '.hidden', 'skip.md'), '# Skip', 'utf8');

  const result = importFolderToVault(source, vault, false);
  assert.equal(result.files.length, 2);
  assert.match(readFileSync(join(vault, 'manifest.json'), 'utf8'), /message.txt/);
  assert.equal(readFileSync(join(vault, 'nested', 'message.txt'), 'utf8'), 'hello');
  rmSync(root, { recursive: true, force: true });
});


test('syncs a data mirror for content files', () => {
  const root = join(process.cwd(), '.tmp-forge-tests');
  const content = join(root, 'content');
  rmSync(root, { recursive: true, force: true });
  mkdirSync(join(content, 'folder'), { recursive: true });
  writeFileSync(join(content, 'folder', 'note.md'), '# Note', 'utf8');

  const plan = syncMirror(content, undefined, false);
  assert.equal(plan.files.length, 1);
  assert.match(readFileSync(plan.manifestPath, 'utf8'), /folder\/note.md/);
  assert.ok(plan.files[0].mirrorDirectory.endsWith('folder/note'));
  rmSync(root, { recursive: true, force: true });
});

test('loads default engines and dry-runs statistics output', () => {
  const root = join(process.cwd(), '.tmp-forge-tests');
  const content = join(root, 'content');
  rmSync(root, { recursive: true, force: true });
  mkdirSync(content, { recursive: true });
  writeFileSync(join(content, 'note.md'), '# Note\n\nhello world', 'utf8');

  const result = runEngine(content, 'statistics', undefined, true);
  const engines = loadEngines(content);
  assert.ok(engines.some((engine) => engine.id === 'statistics'));
  assert.equal(result.engine.id, 'statistics');
  assert.equal(result.outputs.length, 1);
  assert.equal(result.outputs[0].action, 'would-write');
  assert.ok(result.outputs[0].outputPath.endsWith('note.stats.json'));
  rmSync(root, { recursive: true, force: true });
});
