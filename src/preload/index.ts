import { contextBridge, ipcRenderer } from 'electron';
import type { ForgeDocument } from '../parser/markdownParser.ts';
import type { BlockLayerData, Claim } from '../layers/layerTypes.ts';

export type DocumentSource = 'content' | 'samples' | 'vault';

export interface DocumentTreeNode {
  id: string;
  name: string;
  relativePath: string;
  source: DocumentSource;
  type: 'folder' | 'file';
  extension?: string;
  children?: DocumentTreeNode[];
}

export interface LoadedDocument {
  node: DocumentTreeNode;
  sourceText: string;
  mode: 'html' | 'forge';
  html?: string;
  forgeDocument?: ForgeDocument;
  layersByBlock: Record<string, BlockLayerData>;
  claimsByBlock: Record<string, Claim[]>;
  layerFileLoaded: boolean;
  claimsFileLoaded: boolean;
}

export interface ExportResult {
  outputPath: string;
}

export interface ForgeElectronApi {
  listDocuments: () => Promise<DocumentTreeNode[]>;
  loadDocument: (source: DocumentSource, relativePath: string) => Promise<LoadedDocument>;
  readSharedAsset: (relativePath: string) => Promise<string>;
  exportDocument: (source: DocumentSource, relativePath: string) => Promise<ExportResult>;
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<void>;
  close: () => Promise<void>;
}

const api: ForgeElectronApi = {
  listDocuments: () => ipcRenderer.invoke('documents:list'),
  loadDocument: (source, relativePath) => ipcRenderer.invoke('documents:load', source, relativePath),
  readSharedAsset: (relativePath) => ipcRenderer.invoke('shared:read', relativePath),
  exportDocument: (source, relativePath) => ipcRenderer.invoke('documents:export', source, relativePath),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  close: () => ipcRenderer.invoke('window:close')
};

contextBridge.exposeInMainWorld('forge', api);
