declare module 'node:fs' {
  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export interface Stats {
    isDirectory(): boolean;
  }

  export function copyFileSync(source: string, destination: string): void;
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): void;
  export function rmSync(path: string, options?: { recursive?: boolean; force?: boolean }): void;
  export function readdirSync(path: string, options: { withFileTypes: true }): Dirent[];
  export function readFileSync(path: string, encoding: BufferEncoding): string;
  export function statSync(path: string): Stats;
  export function writeFileSync(path: string, data: string, encoding?: BufferEncoding): void;
}

declare module 'node:path' {
  export function basename(path: string, suffix?: string): string;
  export function dirname(path: string): string;
  export function extname(path: string): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
}

declare module 'node:assert/strict' {
  const assert: {
    equal(actual: unknown, expected: unknown, message?: string): void;
    deepEqual(actual: unknown, expected: unknown, message?: string): void;
    ok(value: unknown, message?: string): void;
    match(value: string, regexp: RegExp, message?: string): void;
  };
  export default assert;
}

declare module 'node:test' {
  export function test(name: string, fn: () => void | Promise<void>): void;
}

type BufferEncoding = 'utf8' | 'utf-8';


declare module 'node:fs/promises' {
  import type { Dirent } from 'node:fs';
  export function access(path: string): Promise<void>;
  export function readFile(path: string, encoding: BufferEncoding): Promise<string>;
  export function readdir(path: string, options: { withFileTypes: true }): Promise<Dirent[]>;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

declare module 'electron' {
  export interface WebContents {
    readonly id: number;
  }

  export interface IpcMainInvokeEvent {
    sender: WebContents;
  }

  export const app: {
    isPackaged: boolean;
    whenReady(): Promise<void>;
    on(event: 'activate' | 'window-all-closed', listener: () => void | Promise<void>): void;
    quit(): void;
  };

  export class BrowserWindow {
    constructor(options: Record<string, unknown>);
    static fromWebContents(webContents: WebContents): BrowserWindow | null;
    static getAllWindows(): BrowserWindow[];
    once(event: 'ready-to-show', listener: () => void): void;
    loadURL(url: string): Promise<void>;
    loadFile(path: string): Promise<void>;
    show(): void;
    minimize(): void;
    maximize(): void;
    unmaximize(): void;
    isMaximized(): boolean;
    close(): void;
  }

  export const ipcMain: {
    handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: never[]) => unknown): void;
  };

  export const ipcRenderer: {
    invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  };

  export const contextBridge: {
    exposeInMainWorld(key: string, api: unknown): void;
  };
}

declare module 'electron-vite' {
  export function defineConfig(config: unknown): unknown;
  export function externalizeDepsPlugin(): unknown;
}

declare module 'react' {
  export interface ChangeEvent<T = Element> {
    target: T;
  }

  export interface Context<T> {
    Provider: (props: { value: T; children?: JSX.Element | JSX.Element[] }) => JSX.Element;
  }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useCallback<T extends (...args: never[]) => unknown>(callback: T, deps: readonly unknown[]): T;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useState<T = undefined>(): [T | undefined, (value: T | undefined | ((previous: T | undefined) => T | undefined)) => void];
  export function useState<T>(initialValue: T | (() => T)): [T, (value: T | ((previous: T) => T)) => void];

  const React: {
    StrictMode: (props: { children?: JSX.Element | JSX.Element[] }) => JSX.Element;
  };
  export default React;
}

declare module 'react-dom/client' {
  export function createRoot(element: Element): {
    render(children: JSX.Element): void;
  };
}

declare module 'react/jsx-runtime' {
  export const jsx: unknown;
  export const jsxs: unknown;
  export const Fragment: unknown;
}

declare module '*.css' {
  const css: string;
  export default css;
}

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}

declare const __dirname: string;

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  platform: string;
  resourcesPath: string;
  cwd(): string;
  exit(code?: number): never;
};
