import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { exportHtml } from '../export/htmlExporter.ts';
import { loadLayers } from '../layers/layerStore.ts';
import { createMirrorPlan, defaultMirrorRoot, type MirrorFile } from '../mirror/mirror.ts';
import { parseMarkdown } from '../parser/markdownParser.ts';

export interface EngineConfig {
  id: string;
  path: string;
  engine: string;
  enabled: boolean;
  trigger?: string;
  output_to?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface EngineRunOutput {
  engineId: string;
  sourcePath: string;
  outputPath: string;
  action: 'would-write' | 'wrote' | 'skipped';
}

export interface EngineRunResult {
  engine: EngineConfig;
  dryRun: boolean;
  outputs: EngineRunOutput[];
}

export function defaultEnginesRoot(contentRoot: string): string {
  return join(resolve(contentRoot), '_engines');
}

function parseScalar(value: string): string | number | boolean {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, '');
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

export function parseEngineYaml(source: string, path: string): EngineConfig {
  const config: Record<string, string | number | boolean> = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    config[match[1]] = parseScalar(match[2]);
  }

  const id = String(config.id ?? basename(path, extname(path)));
  const engine = String(config.engine ?? id);
  const enabled = config.enabled === undefined ? true : Boolean(config.enabled);

  return {
    id,
    path,
    engine,
    enabled,
    trigger: config.trigger === undefined ? undefined : String(config.trigger),
    output_to: config.output_to === undefined ? undefined : String(config.output_to),
    ...config
  };
}

export function ensureDefaultEngines(enginesRoot: string): void {
  mkdirSync(enginesRoot, { recursive: true });
  const defaults: Record<string, string> = {
    'export_html.yaml': `id: export_html\nengine: export_html\nenabled: true\ntrigger: manual\noutput_to: mirror_folder\n`,
    'statistics.yaml': `id: statistics\nengine: statistics\nenabled: true\ntrigger: manual\noutput_to: mirror_folder\n`
  };

  for (const [file, contents] of Object.entries(defaults)) {
    const path = join(enginesRoot, file);
    if (!existsSync(path)) writeFileSync(path, contents, 'utf8');
  }
}

export function resolveEnginesRoot(contentFolder: string, enginesFolder?: string): string {
  if (enginesFolder) return resolve(enginesFolder);
  const vaultEnginesRoot = defaultEnginesRoot(contentFolder);
  if (existsSync(vaultEnginesRoot)) return vaultEnginesRoot;
  return resolve('_engines');
}

export function loadEngines(contentFolder: string, enginesFolder?: string): EngineConfig[] {
  const enginesRoot = resolveEnginesRoot(contentFolder, enginesFolder);
  if (!existsSync(enginesRoot)) return [];

  return readdirSync(enginesRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')))
    .map((entry) => {
      const path = join(enginesRoot, entry.name);
      return parseEngineYaml(readFileSync(path, 'utf8'), path);
    });
}

function markdownFiles(files: MirrorFile[]): MirrorFile[] {
  return files.filter((file) => file.type === 'markdown');
}

function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function runExportHtml(engine: EngineConfig, contentFolder: string, mirrorFolder: string | undefined, dryRun: boolean): EngineRunResult {
  const plan = createMirrorPlan(contentFolder, mirrorFolder ?? defaultMirrorRoot(contentFolder), dryRun);
  const outputs: EngineRunOutput[] = [];

  for (const file of markdownFiles(plan.files)) {
    const outputPath = join(file.mirrorDirectory, `${basename(file.sourcePath, extname(file.sourcePath))}.html`);
    outputs.push({ engineId: engine.id, sourcePath: file.sourcePath, outputPath, action: dryRun ? 'would-write' : 'wrote' });

    if (!dryRun) {
      mkdirSync(dirname(outputPath), { recursive: true });
      const markdown = readFileSync(file.sourcePath, 'utf8');
      const document = parseMarkdown(markdown, file.sourcePath);
      writeFileSync(outputPath, exportHtml(document, loadLayers(file.sourcePath), { sourcePath: file.sourcePath }), 'utf8');
    }
  }

  return { engine, dryRun, outputs };
}

function runStatistics(engine: EngineConfig, contentFolder: string, mirrorFolder: string | undefined, dryRun: boolean): EngineRunResult {
  const plan = createMirrorPlan(contentFolder, mirrorFolder ?? defaultMirrorRoot(contentFolder), dryRun);
  const outputs: EngineRunOutput[] = [];

  for (const file of plan.files) {
    const outputPath = join(file.mirrorDirectory, `${basename(file.sourcePath, extname(file.sourcePath))}.stats.json`);
    outputs.push({ engineId: engine.id, sourcePath: file.sourcePath, outputPath, action: dryRun ? 'would-write' : 'wrote' });

    if (!dryRun) {
      mkdirSync(dirname(outputPath), { recursive: true });
      const text = readFileSync(file.sourcePath, 'utf8');
      writeFileSync(
        outputPath,
        `${JSON.stringify({ source: file.sourcePath, characters: text.length, words: wordCount(text), generated_by: engine.id }, null, 2)}\n`,
        'utf8'
      );
    }
  }

  return { engine, dryRun, outputs };
}

export function runEngine(contentFolder: string, engineId: string, mirrorFolder: string | undefined, dryRun: boolean): EngineRunResult {
  const enginesRoot = resolveEnginesRoot(contentFolder);
  const engine = loadEngines(contentFolder, enginesRoot).find((candidate) => candidate.id === engineId || candidate.engine === engineId);
  if (!engine) throw new Error(`Engine not found: ${engineId}`);
  if (!engine.enabled) return { engine, dryRun, outputs: [] };

  if (engine.engine === 'export_html') return runExportHtml(engine, contentFolder, mirrorFolder, dryRun);
  if (engine.engine === 'statistics') return runStatistics(engine, contentFolder, mirrorFolder, dryRun);

  throw new Error(`Unsupported engine '${engine.engine}'. Supported engines: export_html, statistics.`);
}
