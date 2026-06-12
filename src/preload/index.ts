import { contextBridge, ipcRenderer } from 'electron';

export interface DocumentTreeNode {
  id: string;
  name: string;
  relativePath: string;
  source: 'content' | 'vault';
  type: 'folder' | 'file';
  extension?: string;
  children?: DocumentTreeNode[];
}

export interface DocumentFile {
  id: string;
  title: string;
  relativePath: string;
  source: 'content' | 'vault';
  extension: string;
}

export interface ForgeElectronApi {
  listDocuments: () => Promise<DocumentTreeNode[]>;
  readDocument: (source: 'content' | 'vault', relativePath: string) => Promise<string>;
  readSharedAsset: (relativePath: string) => Promise<string>;
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
}

const api: ForgeElectronApi = {
  listDocuments: () => ipcRenderer.invoke('documents:list'),
  readDocument: (source, relativePath) => ipcRenderer.invoke('documents:read', source, relativePath),
  readSharedAsset: (relativePath) => ipcRenderer.invoke('shared:read', relativePath),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close')
};

contextBridge.exposeInMainWorld('forge', api);
