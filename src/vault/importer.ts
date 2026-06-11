import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

export interface ImportableFile {
  sourcePath: string;
  relativePath: string;
  targetPath: string;
  type: 'markdown' | 'text';
}

export interface VaultImportResult {
  sourceRoot: string;
  vaultRoot: string;
  dryRun: boolean;
  files: ImportableFile[];
  manifestPath: string;
}

const IMPORT_EXTENSIONS = new Set(['.md', '.markdown', '.txt']);

export function shouldSkipVaultDirectory(name: string): boolean {
  return name === 'node_modules' || name === '.git' || name === 'exports' || name.startsWith('.');
}

function classifyFile(path: string): ImportableFile['type'] {
  const extension = extname(path).toLowerCase();
  return extension === '.txt' ? 'text' : 'markdown';
}

export function findImportableFiles(sourceRoot: string, vaultRoot: string, currentPath = sourceRoot): ImportableFile[] {
  const entries = readdirSync(currentPath, { withFileTypes: true });
  const files: ImportableFile[] = [];

  for (const entry of entries) {
    const entryPath = join(currentPath, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipVaultDirectory(entry.name)) files.push(...findImportableFiles(sourceRoot, vaultRoot, entryPath));
      continue;
    }

    if (!entry.isFile() || !IMPORT_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;

    const relativePath = relative(sourceRoot, entryPath);
    files.push({
      sourcePath: entryPath,
      relativePath,
      targetPath: join(vaultRoot, relativePath),
      type: classifyFile(entryPath)
    });
  }

  return files;
}

export function importFolderToVault(sourceFolder: string, vaultFolder: string, dryRun: boolean): VaultImportResult {
  const sourceRoot = resolve(sourceFolder);
  const vaultRoot = resolve(vaultFolder);
  if (!statSync(sourceRoot).isDirectory()) throw new Error(`Not a directory: ${sourceRoot}`);

  const files = findImportableFiles(sourceRoot, vaultRoot);
  const manifestPath = join(vaultRoot, 'manifest.json');
  const result: VaultImportResult = { sourceRoot, vaultRoot, dryRun, files, manifestPath };

  if (!dryRun) {
    for (const file of files) {
      mkdirSync(dirname(file.targetPath), { recursive: true });
      copyFileSync(file.sourcePath, file.targetPath);
    }

    mkdirSync(vaultRoot, { recursive: true });
    writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          vault_id: basename(vaultRoot),
          source_root: sourceRoot,
          imported_at: new Date().toISOString(),
          file_count: files.length,
          files: files.map((file) => ({
            path: file.relativePath,
            type: file.type,
            source: file.sourcePath
          }))
        },
        null,
        2
      )}\n`,
      'utf8'
    );
  }

  return result;
}
