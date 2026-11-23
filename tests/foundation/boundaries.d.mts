export interface ModuleGraph {
  files: string[];
  externals: string[];
  directives: Map<string, boolean>;
}

export function inspectGraph(entry: string, root: string): Promise<ModuleGraph>;
export function forbiddenImports(
  graph: ModuleGraph,
  forbidden: readonly string[],
): string[];
