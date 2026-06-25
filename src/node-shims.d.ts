declare module "node:fs/promises" {
  export interface Dirent {
    name: string;
    isDirectory(): boolean;
    isFile(): boolean;
  }

  export function readdir(path: string | URL, options: { withFileTypes: true }): Promise<Dirent[]>;
  export function readdir(path: string | URL): Promise<string[]>;
  export function readFile(path: string | URL, encoding: string): Promise<string>;
  export function writeFile(path: string | URL, data: string, encoding?: string): Promise<void>;
}

declare module "node:path" {
  export function basename(path: string): string;
  export function join(...paths: string[]): string;
  export function relative(from: string, to: string): string;
  export function resolve(...paths: string[]): string;
}

declare module "node:process" {
  export const argv: string[];
  export const env: Record<string, string | undefined>;
  export const stderr: { write(message: string): boolean };
  export const stdout: { write(message: string): boolean };
  export function exit(code?: number): never;
  export function emitWarning(warning: string): void;
}

declare module "node:crypto" {
  export interface Hash {
    update(data: string): Hash;
    digest(encoding: "hex"): string;
  }

  export function createHash(algorithm: string): Hash;
}

declare module "node:child_process" {
  export interface ExecFileOptions {
    maxBuffer?: number;
  }

  export function execFile(
    file: string,
    args: readonly string[],
    options: ExecFileOptions,
    callback: (error: Error | null, stdout: string, stderr: string) => void,
  ): void;
}
