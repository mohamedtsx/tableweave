import type { createRequire } from "node:module";
export const workspace: string;
export const own: string;
export const appRequire: ReturnType<typeof createRequire>;
export const rootRequire: ReturnType<typeof createRequire>;
export const correctedSourceSha256: string;
export function generation(): string;
export function generationDirectory(): string;
export function confined(path: string): string;
export function publicEntry(
  name: string,
  subpath?: string,
  kind?: string,
): string;
export function digest(bytes: string | Uint8Array): string;
interface Snapshot {
  readonly sources: Record<string, string>;
  readonly outputs: Record<string, string>;
  readonly publicSha256: string;
  readonly sourcePublicSha256: string;
}
export function snapshots(): Snapshot;
export function assertCorrectedSource(): void;
export function assertFreshPublic(): Snapshot;
export function assertCapturedGeneration(): Snapshot;
