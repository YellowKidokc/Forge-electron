import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, basename } from 'node:path';
import type { ClaimsDocument, LayerDocument, LoadedLayers } from './layerTypes.ts';

function sidecarPath(sourcePath: string, suffix: string): string {
  const extension = extname(sourcePath);
  const stem = basename(sourcePath, extension);
  return join(dirname(sourcePath), `${stem}${suffix}`);
}

function readOptionalJson<T>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function getForgeSidecarPath(sourcePath: string): string {
  return sidecarPath(sourcePath, '.forge.json');
}

export function getLayersPath(sourcePath: string): string {
  return sidecarPath(sourcePath, '.layers.json');
}

export function getClaimsPath(sourcePath: string): string {
  return sidecarPath(sourcePath, '.claims.json');
}

export function loadLayers(sourcePath: string): LoadedLayers {
  const layerPath = getLayersPath(sourcePath);
  const claimPath = getClaimsPath(sourcePath);
  const layerDocument = readOptionalJson<LayerDocument>(layerPath);
  const claimsDocument = readOptionalJson<ClaimsDocument>(claimPath);
  const claimsByBlock = Object.fromEntries(
    (claimsDocument?.claims ?? []).reduce<Map<string, ClaimsDocument['claims']>>((map, claim) => {
      const claims = map.get(claim.block_id) ?? [];
      claims.push(claim);
      map.set(claim.block_id, claims);
      return map;
    }, new Map())
  );

  return {
    layerDocument,
    claimsDocument,
    layersByBlock: layerDocument?.layers ?? {},
    claimsByBlock,
    layerFile: { path: layerPath, loaded: Boolean(layerDocument) },
    claimsFile: { path: claimPath, loaded: Boolean(claimsDocument) }
  };
}
