import type { createRequire } from "node:module";
export const workspace: string;
export const own: string;
export const appRequire: ReturnType<typeof createRequire>;
export const rootRequire: ReturnType<typeof createRequire>;
export function publicEntry(
  name: string,
  subpath?: string,
  kind?: string,
): string;
export function vendorRoot(
  requester: ReturnType<typeof createRequire>,
  name: string,
): string;
export function rootDigests(): Record<string, string>;
