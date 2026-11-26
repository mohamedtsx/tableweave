export interface PublicGeneration {
  readonly outputCount: number;
  readonly outputSha256: string;
}
export interface GenerationEnvironment {
  readonly FILTER_CONTROLS_GENERATION?: string;
  readonly FILTER_CONTROLS_PUBLIC_SHA256?: string;
}
export interface PublicGenerationSelection extends PublicGeneration {
  readonly generation: string;
  readonly selection: "current" | "explicit-replay";
  readonly mode: "browser" | "types";
}
export const CURRENT_PUBLIC_GENERATION: "fc01";
export function getPublicGeneration(label: string): PublicGeneration;
export function assertGenerationEnvironment(
  label: string,
  environment: GenerationEnvironment,
): void;
export function selectPublicGeneration(
  args: readonly string[],
  environment: GenerationEnvironment,
): PublicGenerationSelection;
