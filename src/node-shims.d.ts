declare module "node:fs/promises" {
  export function readFile(path: string | URL, encoding: string): Promise<string>;
  export function writeFile(path: string | URL, data: string, encoding?: string): Promise<void>;
}

declare module "node:path" {
  export function resolve(...paths: string[]): string;
}

declare module "node:process" {
  export const argv: string[];
  export const env: Record<string, string | undefined>;
  export const stderr: { write(message: string): boolean };
  export const stdout: { write(message: string): boolean };
  export function exit(code?: number): never;
}
