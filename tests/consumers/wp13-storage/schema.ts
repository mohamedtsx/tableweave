import type { Stats } from "node:fs";

// Source-only schema/API probe. This is NOT a declaration for the unchecked MJS.
export interface PhysicalIdentity {
  dev: number;
  ino: number;
  uid: number;
}
export interface FixedRoots {
  parent: string;
  namespace: string;
  run: string;
  producer: string;
  tools: string;
  consumers: Record<string, string>;
}
export interface StorageBinding {
  layout: "hdd-v1";
  leaseSHA256: string;
  roots: FixedRoots;
}
export interface NamespaceLease {
  schema: "wp13-storage-lease-v1";
  status: "main-owned-new-namespace";
  layout: "hdd-v1";
  run: string;
  candidate: string;
  uid: number;
  selectedRevision: string;
  producerInputsSHA256: string;
  toolingInputsSHA256: string;
  toolingRuntimeInputsSHA256: string;
  toolchainInputsSHA256: string;
  roots: FixedRoots;
  parent: PhysicalIdentity;
  namespace: PhysicalIdentity;
  roles: Record<"run" | "producer" | "tools", PhysicalIdentity>;
}
export interface ConsumerStorage {
  layout: "hdd-v1";
  leaseSHA256: string;
  root: string;
  identity: PhysicalIdentity;
}
export interface ReceiptBinding {
  leaseSHA256: string;
  sha256: string;
}
export interface ScratchEnvironment {
  TMPDIR: string;
  TMP: string;
  TEMP: string;
  XDG_CACHE_HOME: string;
}
export function describeStat(stat: Stats): PhysicalIdentity {
  return { dev: stat.dev, ino: stat.ino, uid: stat.uid };
}
export function describeLease(lease: NamespaceLease): readonly string[] {
  return [
    lease.roots.run,
    lease.roots.producer,
    lease.roots.tools,
    lease.selectedRevision,
  ];
}
export function temporaryDirectory(environment: ScratchEnvironment): string {
  return environment.TMPDIR;
}
