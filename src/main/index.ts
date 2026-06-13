import { app, BrowserWindow, ipcMain } from 'electron';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportHtml } from '../export/htmlExporter.ts';
import { loadLayers } from '../layers/layerStore.ts';
import { parseMarkdown } from '../parser/markdownParser.ts';

type DocumentSource = 'content' | 'samples' | 'vault';

interface DocumentTreeNode {
  id: string;
  name: string;
  relativePath: string;
  source: DocumentSource;
  type: 'folder' | 'file';
  extension?: string;
  children?: DocumentTreeNode[];
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = app.isPackaged ? join(process.resourcesPath, 'app.asar.unpacked') : join(__dirname, '../..');
const roots: Record<DocumentSource, string> = {
  content: join(repoRoot, 'content'),
  samples: join(repoRoot, 'samples'),
  vault: join(repoRoot, 'vault')
};
const sharedRoot = join(repoRoot, 'shared');
const documentExtensions = new Set(['.html', '.md', '.markdown', '.txt']);

function extensionOf(name: string): string {
  const match = name.match(/\.[^.]+$/);
  return match?.[0].toLowerCase() ?? '';
}

function titleFromPath(relativePath: string): string {
  return relativePath
    .replace(/\.[^.]+$/i, '')
    .split(/[\\/]/)
    .at(-1)!
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function safeJoin(root: string, unsafeRelativePath: string): string {
  const normalized = unsafeRelativePath.replace(/^[/\\]+/, '');
  const fullPath = resolve(root, normalized);
  const resolvedRoot = resolve(root);
  if (!fullPath.startsWith(resolvedRoot)) throw new Error('Path escapes allowed root');
  return fullPath;
}

function rootForSource(source: DocumentSource): string {
  return roots[source];
}

async function walkDocumentTree(root: string, source: DocumentSource, directory = root): Promise<DocumentTreeNode[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nodes = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '_data' && entry.name !== '_engines')
      .map(async (entry): Promise<DocumentTreeNode | null> => {
        const fullPath = join(directory, entry.name);
        const relativePath = relative(root, fullPath).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          const children = await walkDocumentTree(root, source, fullPath);
          if (children.length === 0) return null;
          return { id: `${source}:${relativePath}`, name: entry.name, relativePath, source, type: 'folder', children };
        }

        const extension = extensionOf(entry.name);
        if (!entry.isFile() || !documentExtensions.has(extension)) return null;
        return { id: `${source}:${relativePath}`, name: titleFromPath(relativePath), relativePath, source, type: 'file', extension };
      })
  );

  return nodes
    .filter((node): node is DocumentTreeNode => Boolean(node))
    .sort((left, right) => {
      if (left.type !== right.type) return left.type === 'folder' ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
}

async function listDocuments(): Promise<DocumentTreeNode[]> {
  const sourceOrder: DocumentSource[] = ['content', 'samples', 'vault'];
  const tree: DocumentTreeNode[] = [];
  for (const source of sourceOrder) {
    const root = rootForSource(source);
    if (!(await pathExists(root))) continue;
    tree.push({ id: `${source}-root`, name: source, relativePath: '', source, type: 'folder', children: await walkDocumentTree(root, source) });
  }
  return tree;
}

function nodeFor(source: DocumentSource, relativePath: string): DocumentTreeNode {
  const extension = extensionOf(relativePath);
  return { id: `${source}:${relativePath}`, name: titleFromPath(relativePath), relativePath, source, type: 'file', extension };
}

async function loadDocument(source: DocumentSource, relativePath: string) {
  const root = rootForSource(source);
  const fullPath = safeJoin(root, relativePath);
  const sourceText = await readFile(fullPath, 'utf8');
  const extension = extensionOf(relativePath);
  const node = nodeFor(source, relativePath);

  if (extension === '.html') {
    return { node, sourceText, mode: 'html', html: sourceText, layersByBlock: {}, claimsByBlock: {}, layerFileLoaded: false, claimsFileLoaded: false };
  }

  const forgeDocument = parseMarkdown(sourceText, fullPath);
  const layers = loadLayers(fullPath);
  return {
    node,
    sourceText,
    mode: 'forge',
    forgeDocument,
    layersByBlock: layers.layersByBlock,
    claimsByBlock: layers.claimsByBlock,
    layerFileLoaded: layers.layerFile.loaded,
    claimsFileLoaded: layers.claimsFile.loaded
  };
}

async function exportDocument(source: DocumentSource, relativePath: string): Promise<{ outputPath: string }> {
  const root = rootForSource(source);
  const fullPath = safeJoin(root, relativePath);
  const sourceText = await readFile(fullPath, 'utf8');
  const extension = extensionOf(relativePath);
  const outputPath = join(repoRoot, 'exports', source, relativePath.replace(new RegExp(`${extension}$`), '.html'));
  await mkdir(dirname(outputPath), { recursive: true });

  if (extension === '.html') {
    await writeFile(outputPath, sourceText, 'utf8');
    return { outputPath };
  }

  const document = parseMarkdown(sourceText, fullPath);
  const layers = loadLayers(fullPath);
  await writeFile(outputPath, exportHtml(document, layers, { sourcePath: fullPath }), 'utf8');
  return { outputPath };
}

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#050505',
    show: false,
    webPreferences: { preload: join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  if (process.env.ELECTRON_RENDERER_URL) await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  else await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(async () => {
  ipcMain.handle('documents:list', () => listDocuments());
  ipcMain.handle('documents:load', (_event, source: DocumentSource, relativePath: string) => loadDocument(source, relativePath));
  ipcMain.handle('documents:export', (_event, source: DocumentSource, relativePath: string) => exportDocument(source, relativePath));
  ipcMain.handle('shared:read', async (_event, relativePath: string) => readFile(safeJoin(sharedRoot, relativePath), 'utf8'));
  ipcMain.handle('window:minimize', (event) => BrowserWindow.fromWebContents(event.sender)?.minimize());
  ipcMain.handle('window:toggleMaximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (window.isMaximized()) window.unmaximize();
    else window.maximize();
  });
  ipcMain.handle('window:close', (event) => BrowserWindow.fromWebContents(event.sender)?.close());
  await createWindow();
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
