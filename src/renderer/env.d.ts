import type { ForgeElectronApi } from '../preload/index.ts';

declare global {
  interface Window {
    forge: ForgeElectronApi;
  }
}

export {};
