// Harness-only approval data. Never populate this table from a build or caller.
const generations = Object.freeze({
  original: Object.freeze({
    outputCount: 180,
    outputSha256:
      "ad59470c7d472563ed273b8b167073953f6f574df0a1910510480082da63a8ce",
  }),
  fc01: Object.freeze({
    outputCount: 180,
    outputSha256:
      "de82ce232f3021a754b1e30df780eac27cd358604766cde4110cc922bf25f095",
  }),
});

// Main changes this only AFTER independent source/build/archive review.
export const CURRENT_PUBLIC_GENERATION = "fc01";

export function getPublicGeneration(label) {
  if (typeof label !== "string" || !Object.hasOwn(generations, label))
    throw new Error("Unknown main-approved filter-controls output generation");
  return generations[label];
}

/** Ambient metadata may assert consistency; it never supplies approval data. */
export function assertGenerationEnvironment(label, environment) {
  const approved = getPublicGeneration(label);
  if (
    environment.FILTER_CONTROLS_GENERATION !== undefined &&
    environment.FILTER_CONTROLS_GENERATION !== label
  )
    throw new Error("Contradictory filter-controls generation environment");
  if (
    environment.FILTER_CONTROLS_PUBLIC_SHA256 !== undefined &&
    environment.FILTER_CONTROLS_PUBLIC_SHA256 !== approved.outputSha256
  )
    throw new Error("Contradictory filter-controls public SHA environment");
}

/** Capture once in the parent, before allocating evidence or starting children. */
export function selectPublicGeneration(args, environment) {
  let mode = "browser";
  let index = 0;
  if (args[0] !== undefined && !args[0].startsWith("--")) {
    mode = args[0];
    index++;
  }
  if (mode !== "browser" && mode !== "types")
    throw new Error("Choose the browser or types composition boundary");
  let explicit;
  while (index < args.length) {
    if (args[index] !== "--generation" || explicit !== undefined)
      throw new Error("Invalid or duplicate composition gate argument");
    const label = args[index + 1];
    if (label === undefined || !/^[a-z][a-z0-9-]{0,63}$/.test(label))
      throw new Error("Supply an explicit safe output generation label");
    explicit = label;
    index += 2;
  }
  const generation = explicit ?? CURRENT_PUBLIC_GENERATION;
  const approved = getPublicGeneration(generation);
  assertGenerationEnvironment(generation, environment);
  return Object.freeze({
    generation,
    selection: explicit === undefined ? "current" : "explicit-replay",
    mode,
    ...approved,
  });
}
