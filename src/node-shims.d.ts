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

declare const process: {
  argv: string[];
  cwd(): string;
  exit(code?: number): never;
};
