import type { Alias, UserConfig } from "vite";
export const root: string;
export const rootRequire: NodeJS.Require;
export const vendor: NodeJS.Require;
export const storybook: NodeJS.Require;
export const sourcePaths: Record<string, string>;
export function declared(
  specifier: string,
  issuer?: "root" | "heroui" | "react" | "storybook",
): string;
export function packageRoot(
  name: string,
  issuer?: "root" | "heroui" | "react" | "storybook",
): string;
export function typeEntry(
  specifier: string,
  issuer?: "root" | "heroui" | "react" | "storybook",
): string;
export function sourceAliases(): Alias[];
export function runtimeAliases(): Alias[];
export function sourceTypePaths(): Record<string, string[]>;
export function sourceVite(configURL: string): Promise<UserConfig>;
