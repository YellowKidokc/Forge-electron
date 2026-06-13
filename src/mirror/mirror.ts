import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

export interface MirrorFile {
  sourcePath: string;
  relativePath: string;
  mirrorDirectory: string;
  type: 'markdown' | 'text';
}

export interface MirrorPlan {
  contentRoot: string;
  mirrorRoot: string;
  dryRun: boolean;
  files: MirrorFile[];
  directories: string[];
  manifestPath: string;
}

const CONTENT_EXTENSIONS = new Set(['.md', '.markdown', '.txt']);
const SKIP_DIRECTORIES = new Set(['.git', 'node_modules', 'exports', '_data', '_engines']);

export function shouldSkipMirrorDirectory(name: string): boolean {
  return SKIP_DIRECTORIES.has(name) || name.startsWith('.');
}

function classifyContentFile(path: string): MirrorFile['type'] {
  return extname(path).toLowerCase() === '.txt' ? 'text' : 'markdown';
}

export function defaultMirrorRoot(contentRoot: string): string {
  return join(resolve(contentRoot), '_data');
}

export function mirrorDirectoryForFile(contentRoot: string, mirrorRoot: string, filePath: string): string {
  const relativePath = relative(contentRoot, filePath);
  const relativeDirectory = dirname(relativePath) === '.' ? '' : dirname(relativePath);
  const stem = basename(filePath, extname(filePath));
  return join(mirrorRoot, relativeDirectory, stem);
}

export function findMirrorContentFiles(contentRoot: string, mirrorRoot = defaultMirrorRoot(contentRoot), currentPath = resolve(contentRoot)): MirrorFile[] {
  const root = resolve(contentRoot);
  const entries = readdirSync(currentPath, { withFileTypes: true });
  const files: MirrorFile[] = [];

  for (const entry of entries) {
    const entryPath = join(currentPath, entry.name);
    if (entry.isDirectory()) {
      if (!shouldSkipMirrorDirectory(entry.name)) files.push(...findMirrorContentFiles(root, mirrorRoot, entryPath));
      continue;
    }

    if (!entry.isFile() || !CONTENT_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue;

    files.push({
      sourcePath: entryPath,
      relativePath: relative(root, entryPath),
      mirrorDirectory: mirrorDirectoryForFile(root, mirrorRoot, entryPath),
      type: classifyContentFile(entryPath)
    });
  }

  return files;
}

export function createMirrorPlan(contentFolder: string, mirrorFolder?: string, dryRun = false): MirrorPlan {
  const contentRoot = resolve(contentFolder);
  if (!statSync(contentRoot).isDirectory()) throw new Error(`Not a directory: ${contentRoot}`);
  const mirrorRoot = resolve(mirrorFolder ?? defaultMirrorRoot(contentRoot));
  const files = findMirrorContentFiles(contentRoot, mirrorRoot);
  const directories = [...new Set([mirrorRoot, ...files.map((file) => file.mirrorDirectory)])];

  return {
    contentRoot,
    mirrorRoot,
    dryRun,
    files,
    directories,
    manifestPath: join(mirrorRoot, 'manifest.json')
  };
}

export function writeMirrorManifest(plan: MirrorPlan): void {
  mkdirSync(plan.mirrorRoot, { recursive: true });
  writeFileSync(
    plan.manifestPath,
    `${JSON.stringify(
      {
        mirror_version: 1,
        content_root: plan.contentRoot,
        mirror_root: plan.mirrorRoot,
        synced_at: new Date().toISOString(),
        file_count: plan.files.length,
        files: plan.files.map((file) => ({
          path: file.relativePath,
          type: file.type,
          mirror_directory: file.mirrorDirectory
        }))
      },
      null,
      2
    )}\n`,
    'utf8'
  );
}

export function syncMirror(contentFolder: string, mirrorFolder?: string, dryRun = false): MirrorPlan {
  const plan = createMirrorPlan(contentFolder, mirrorFolder, dryRun);

  if (!dryRun) {
    for (const directory of plan.directories) mkdirSync(directory, { recursive: true });
    writeMirrorManifest(plan);
  }

  return plan;
}
