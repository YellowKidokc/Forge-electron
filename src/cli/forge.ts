#!/usr/bin/env node
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { exportHtml } from '../export/htmlExporter.ts';
import { getForgeSidecarPath, loadLayers } from '../layers/layerStore.ts';
import { parseMarkdown } from '../parser/markdownParser.ts';
import { stampMarkdownFile } from '../parser/stamper.ts';
import { formatValidation, validateMarkdownFile } from '../validation/validate.ts';
import { importFolderToVault } from '../vault/importer.ts';
import { loadEngines, resolveEnginesRoot, runEngine } from '../engine/engine.ts';
import { syncMirror } from '../mirror/mirror.ts';

interface CliOptions {
  dryRun: boolean;
  preserveIds: boolean;
  vaultPath?: string;
  mirrorPath?: string;
  engineId?: string;
}

function usage(): never {
  console.error(`Usage: npm run forge -- <command> <path> [options]

Commands:
  parse <file.md> [--preserve-ids]
  stamp <file.md> [--dry-run]
  validate <file.md>
  export <file.md>
  export-folder <folder> [--dry-run]
  import-folder <folder> [--vault vault/imported] [--dry-run]
  mirror <folder> [--mirror folder/_data] [--dry-run]
  engines <folder>
  run-engine <folder> <engine-id> [--mirror folder/_data] [--dry-run]`);
  process.exit(1);
}

function optionValue(flags: string[], name: string): string | undefined {
  const index = flags.indexOf(name);
  if (index === -1) return undefined;
  return flags[index + 1];
}

function positionalValues(values: string[]): string[] {
  const positional: string[] = [];
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value.startsWith('--')) {
      if (value === '--vault' || value === '--mirror') index += 1;
      continue;
    }
    positional.push(value);
  }
  return positional;
}

function parseOptions(args: string[]): { command?: string; target?: string; options: CliOptions } {
  const [command, target, ...flags] = args;
  const positional = positionalValues(flags);
  return {
    command,
    target,
    options: {
      dryRun: flags.includes('--dry-run'),
      preserveIds: flags.includes('--preserve-ids'),
      vaultPath: optionValue(flags, '--vault'),
      mirrorPath: optionValue(flags, '--mirror'),
      engineId: positional[0]
    }
  };
}

function parseDocument(markdownPath: string) {
  const absolutePath = resolve(markdownPath);
  const markdown = readFileSync(absolutePath, 'utf8');
  return { absolutePath, document: parseMarkdown(markdown, absolutePath) };
}

function writeForgeSidecar(absolutePath: string): { outputPath: string; diagnostics: string[] } {
  const { document } = parseDocument(absolutePath);
  const outputPath = getForgeSidecarPath(absolutePath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return {
    outputPath,
    diagnostics: (document.diagnostics ?? []).map(
      (diagnostic) => `Duplicate ID '${diagnostic.requestedId}' at line ${diagnostic.line}; repaired to '${diagnostic.repairedId}'`
    )
  };
}

function parseCommand(markdownPath: string): void {
  const result = writeForgeSidecar(resolve(markdownPath));
  for (const diagnostic of result.diagnostics) console.warn(`Warning: ${diagnostic}`);
  console.log(`Wrote ${result.outputPath}`);
}

function stampCommand(markdownPath: string, dryRun: boolean): void {
  const absolutePath = resolve(markdownPath);
  const result = stampMarkdownFile(absolutePath, dryRun);

  if (result.additions.length === 0) {
    console.log(`No missing FORGE IDs found in ${absolutePath}`);
    return;
  }

  const prefix = dryRun ? 'Would add' : 'Added';
  for (const addition of result.additions) {
    console.log(`${prefix} line ${addition.line}: ${addition.text}`);
  }

  if (dryRun) {
    console.log('Dry run only; file was not modified.');
  } else {
    console.log(`Backup written to ${result.backupPath}`);
    console.log(`Stamped ${absolutePath}`);
  }
}

function validateCommand(markdownPath: string): void {
  const result = validateMarkdownFile(resolve(markdownPath));
  console.log(formatValidation(result));
  if (!result.ok) process.exit(1);
}

function exportCommand(markdownPath: string, outputPath?: string): string {
  const { absolutePath, document } = parseDocument(markdownPath);
  const sidecar = writeForgeSidecar(absolutePath);
  const layers = loadLayers(absolutePath);
  const html = exportHtml(document, layers, { sourcePath: absolutePath });
  const stem = basename(absolutePath, extname(absolutePath));
  const resolvedOutputPath = outputPath ?? join(process.cwd(), 'exports', `${stem}.html`);
  mkdirSync(dirname(resolvedOutputPath), { recursive: true });
  writeFileSync(resolvedOutputPath, html, 'utf8');
  for (const diagnostic of sidecar.diagnostics) console.warn(`Warning: ${diagnostic}`);
  console.log(`Wrote ${sidecar.outputPath}`);
  console.log(`Wrote ${resolvedOutputPath}`);
  return resolvedOutputPath;
}

function shouldSkipDirectory(name: string): boolean {
  return name === 'node_modules' || name === '.git' || name === 'exports' || name.startsWith('.');
}

function findMarkdownFiles(folderPath: string): string[] {
  const entries = readdirSync(folderPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = join(folderPath, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipDirectory(entry.name)) files.push(...findMarkdownFiles(entryPath));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) files.push(entryPath);
  }

  return files;
}



function mirrorCommand(folderPath: string, options: CliOptions): void {
  const plan = syncMirror(folderPath, options.mirrorPath, options.dryRun);
  for (const directory of plan.directories) {
    const prefix = options.dryRun ? 'Would create' : 'Ensured';
    console.log(`${prefix} ${directory}`);
  }

  if (options.dryRun) {
    console.log(`Dry run only; mirror would track ${plan.files.length} file(s) at ${plan.mirrorRoot}.`);
  } else {
    console.log(`Mirror synced ${plan.files.length} file(s) at ${plan.mirrorRoot}.`);
    console.log(`Wrote ${plan.manifestPath}`);
  }
}

function enginesCommand(folderPath: string): void {
  const enginesRoot = resolveEnginesRoot(folderPath);
  const engines = loadEngines(folderPath, enginesRoot);
  console.log(`FORGE engines: ${enginesRoot}`);
  for (const engine of engines) {
    console.log(`${engine.enabled ? '✅' : '⚠'} ${engine.id} (${engine.engine}) trigger=${engine.trigger ?? 'manual'}`);
  }
}


function runEngineCommand(folderPath: string, options: CliOptions): void {
  if (!options.engineId) throw new Error('run-engine requires an engine id, for example: npm run forge -- run-engine notes export_html');
  const result = runEngine(folderPath, options.engineId, options.mirrorPath, options.dryRun);
  for (const output of result.outputs) {
    console.log(`${output.action === 'would-write' ? 'Would write' : 'Wrote'} ${output.outputPath}`);
  }
  console.log(`${options.dryRun ? 'Dry run for' : 'Ran'} engine ${result.engine.id}; ${result.outputs.length} output(s).`);
}

function importFolderCommand(folderPath: string, options: CliOptions): void {
  const vaultPath = options.vaultPath ?? join(process.cwd(), 'vault', basename(resolve(folderPath)));
  const result = importFolderToVault(folderPath, vaultPath, options.dryRun);

  for (const file of result.files) {
    const prefix = options.dryRun ? 'Would import' : 'Imported';
    console.log(`${prefix} ${file.sourcePath} -> ${file.targetPath}`);
  }

  if (options.dryRun) {
    console.log(`Dry run only; ${result.files.length} file(s) would be imported into ${result.vaultRoot}.`);
  } else {
    console.log(`Imported ${result.files.length} file(s) into ${result.vaultRoot}.`);
    console.log(`Wrote ${result.manifestPath}`);
  }
}

function exportFolderCommand(folderPath: string, dryRun: boolean): void {
  const root = resolve(folderPath);
  if (!statSync(root).isDirectory()) throw new Error(`Not a directory: ${root}`);
  const files = findMarkdownFiles(root);

  for (const file of files) {
    const relativePath = relative(root, file);
    const outputPath = join(process.cwd(), 'exports', dirname(relativePath), `${basename(file, extname(file))}.html`);
    if (dryRun) {
      console.log(`Would export ${file} -> ${outputPath}`);
    } else {
      exportCommand(file, outputPath);
    }
  }

  console.log(`${dryRun ? 'Found' : 'Exported'} ${files.length} Markdown file(s).`);
}

const { command, target, options } = parseOptions(process.argv.slice(2));
if (!command || !target) usage();
const targetPath = target;

switch (command) {
  case 'parse':
    parseCommand(targetPath);
    break;
  case 'stamp':
    stampCommand(targetPath, options.dryRun);
    break;
  case 'validate':
    validateCommand(targetPath);
    break;
  case 'export':
    exportCommand(targetPath);
    break;
  case 'export-folder':
    exportFolderCommand(targetPath, options.dryRun);
    break;
  case 'import-folder':
    importFolderCommand(targetPath, options);
    break;
  case 'mirror':
    mirrorCommand(targetPath, options);
    break;
  case 'engines':
    enginesCommand(targetPath);
    break;
  case 'run-engine':
    runEngineCommand(targetPath, options);
    break;
  default:
    usage();
}
