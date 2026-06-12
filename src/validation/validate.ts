import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { getClaimsPath, getForgeSidecarPath, getLayersPath } from '../layers/layerStore.ts';
import type { ClaimsDocument, LayerDocument } from '../layers/layerTypes.ts';
import { parseMarkdown, type ForgeDocument } from '../parser/markdownParser.ts';

export type ValidationLevel = 'pass' | 'warn' | 'fail';

export interface ValidationMessage {
  level: ValidationLevel;
  message: string;
}

export interface ValidationResult {
  markdownPath: string;
  ok: boolean;
  messages: ValidationMessage[];
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function blockIds(blocks: { id: string }[]): string[] {
  return blocks.map((block) => block.id);
}

function duplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates];
}

export function validateMarkdownFile(markdownPath: string): ValidationResult {
  const messages: ValidationMessage[] = [];
  const markdown = readFileSync(markdownPath, 'utf8');
  const parsed = parseMarkdown(markdown, markdownPath);
  messages.push({ level: 'pass', message: 'Markdown parsed' });

  for (const diagnostic of parsed.diagnostics ?? []) {
    messages.push({
      level: 'fail',
      message: `duplicate block ID '${diagnostic.requestedId}' at line ${diagnostic.line}; parser repaired to '${diagnostic.repairedId}'`
    });
  }

  const parsedIds = blockIds(parsed.blocks);
  const parsedIdSet = new Set(parsedIds);
  for (const id of duplicateIds(parsedIds)) {
    messages.push({ level: 'fail', message: `duplicate parsed block ID: ${id}` });
  }

  const forgePath = getForgeSidecarPath(markdownPath);
  if (!existsSync(forgePath)) {
    messages.push({ level: 'fail', message: `${basename(forgePath)} missing` });
  } else {
    messages.push({ level: 'pass', message: `${basename(forgePath)} found` });
    const forgeDocument = readJson<ForgeDocument>(forgePath);
    const sidecarIds = blockIds(forgeDocument.blocks);
    const sidecarIdSet = new Set(sidecarIds);

    for (const id of duplicateIds(sidecarIds)) {
      messages.push({ level: 'fail', message: `duplicate sidecar block ID: ${id}` });
    }

    const missingFromSidecar = parsedIds.filter((id) => !sidecarIdSet.has(id));
    const missingFromMarkdown = sidecarIds.filter((id) => !parsedIdSet.has(id));
    if (missingFromSidecar.length === 0 && missingFromMarkdown.length === 0) {
      messages.push({ level: 'pass', message: `${parsed.blocks.length} blocks matched` });
    } else {
      for (const id of missingFromSidecar) messages.push({ level: 'fail', message: `.forge.json missing parsed block: ${id}` });
      for (const id of missingFromMarkdown) messages.push({ level: 'fail', message: `.forge.json contains stale block: ${id}` });
    }
  }

  const layersPath = getLayersPath(markdownPath);
  if (!existsSync(layersPath)) {
    messages.push({ level: 'warn', message: `${basename(layersPath)} missing` });
  } else {
    const layerDocument = readJson<LayerDocument>(layersPath);
    messages.push({ level: 'pass', message: `${basename(layersPath)} found` });
    for (const id of Object.keys(layerDocument.layers ?? {})) {
      if (!parsedIdSet.has(id)) messages.push({ level: 'fail', message: `layers reference unknown block: ${id}` });
    }
  }

  const claimsPath = getClaimsPath(markdownPath);
  if (!existsSync(claimsPath)) {
    messages.push({ level: 'warn', message: `${basename(claimsPath)} missing` });
  } else {
    const claimsDocument = readJson<ClaimsDocument>(claimsPath);
    messages.push({ level: 'pass', message: `${basename(claimsPath)} found` });
    for (const claim of claimsDocument.claims ?? []) {
      if (!parsedIdSet.has(claim.block_id)) messages.push({ level: 'fail', message: `claims reference unknown block: ${claim.block_id}` });
    }
  }

  return {
    markdownPath,
    ok: !messages.some((message) => message.level === 'fail'),
    messages
  };
}

export function formatValidation(result: ValidationResult): string {
  const icon = (level: ValidationLevel) => {
    if (level === 'pass') return '✅';
    if (level === 'warn') return '⚠';
    return '❌';
  };

  return [`FORGE validation: ${result.markdownPath}`, '', ...result.messages.map((message) => `${icon(message.level)} ${message.message}`)].join('\n');
}
