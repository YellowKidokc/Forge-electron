import { app, BrowserWindow, ipcMain } from 'electron';
import { access, readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type DocumentSource = 'content' | 'vault';

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
const contentRoot = join(repoRoot, 'content');
const vaultRoot = join(repoRoot, 'vault');
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
          return {
            id: `${source}:${relativePath}`,
            name: entry.name,
            relativePath,
            source,
            type: 'folder',
            children
          };
        }

        const extension = extensionOf(entry.name);
        if (!entry.isFile() || !documentExtensions.has(extension)) return null;

        return {
          id: `${source}:${relativePath}`,
          name: titleFromPath(relativePath),
          relativePath,
          source,
          type: 'file',
          extension
        };
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
  const roots: DocumentTreeNode[] = [];
  roots.push({
    id: 'content-root',
    name: 'content',
    relativePath: '',
    source: 'content',
    type: 'folder',
    children: await walkDocumentTree(contentRoot, 'content')
  });

  if (await pathExists(vaultRoot)) {
    roots.push({
      id: 'vault-root',
      name: 'vault',
      relativePath: '',
      source: 'vault',
      type: 'folder',
      children: await walkDocumentTree(vaultRoot, 'vault')
    });
  }

  return roots;
}

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#050505',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  ipcMain.handle('documents:list', () => listDocuments());
  ipcMain.handle('documents:read', async (_event, source: DocumentSource, relativePath: string) => {
    const root = source === 'vault' ? vaultRoot : contentRoot;
    return readFile(safeJoin(root, relativePath), 'utf8');
  });
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
