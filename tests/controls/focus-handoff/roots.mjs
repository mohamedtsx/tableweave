import { createHash } from "node:crypto";
import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { join, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const workspace = fileURLToPath(new URL("../../../", import.meta.url));
export const own = fileURLToPath(new URL("./", import.meta.url));
export const appRequire = createRequire(
  join(workspace, "apps/storybook/package.json"),
);
export const rootRequire = createRequire(join(workspace, "package.json"));
export const correctedSourceSha256 =
  "4ce900626de4479db7d1d69a7c51db64fca4fbd41ede957280189d82ca347144";
const oldPublicSha256 =
  "ad59470c7d472563ed273b8b167073953f6f574df0a1910510480082da63a8ce";

export function generation() {
  const name = process.env.FILTER_CONTROLS_GENERATION;
  if (!name || !/^[a-z][a-z0-9-]{0,63}$/.test(name))
    throw new Error("Supply an explicit safe FILTER_CONTROLS_GENERATION name");
  return name;
}
export function generationDirectory() {
  const run = process.env.FILTER_CONTROLS_RUN;
  if (!run || !/^[a-z][a-z0-9-]{0,63}$/.test(run))
    throw new Error("Supply an explicit safe unique FILTER_CONTROLS_RUN name");
  return join(own, ".artifacts", generation(), run);
}
export function confined(path) {
  const actual = realpathSync(path);
  if (!actual.startsWith(`${realpathSync(workspace)}${sep}`))
    throw new Error(`External workspace dependency refused: ${path}`);
  return actual;
}
export function publicEntry(name, subpath = ".", kind = "import") {
  const root = join(workspace, "packages", name);
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const entry = manifest.exports[subpath];
  const relative = typeof entry === "string" ? entry : entry?.[kind];
  if (typeof relative !== "string" || !relative.startsWith("./dist/"))
    throw new Error(`Missing actual emitted ${name} ${subpath} ${kind} export`);
  return confined(join(root, relative));
}
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");

export function snapshots() {
  const source = {};
  const output = {};
  function visit(directory, entries) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path, entries);
      else if (entry.isFile())
        entries[path.slice(workspace.length)] = digest(readFileSync(path));
      else throw new Error(`Unexpected producer entry: ${path}`);
    }
  }
  for (const name of ["react", "heroui"]) {
    visit(join(workspace, "packages", name, "src"), source);
    visit(join(workspace, "packages", name, "dist"), output);
  }
  const sort = (entries) =>
    Object.fromEntries(
      Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
    );
  const sources = sort(source);
  const outputs = sort(output);
  const publicText = `${JSON.stringify(outputs, null, 2)}\n`;
  const combined = sort({ ...sources, ...outputs });
  return {
    sources,
    outputs,
    publicSha256: digest(publicText),
    sourcePublicSha256: digest(`${JSON.stringify(combined, null, 2)}\n`),
  };
}
export function assertCorrectedSource() {
  const path = join(
    workspace,
    "packages/heroui/src/selection/selection-toolbar.tsx",
  );
  if (digest(readFileSync(path)) !== correctedSourceSha256)
    throw new Error(
      "Corrected producer source differs from the main-approved handoff",
    );
}
export function assertFreshPublic() {
  assertCorrectedSource();
  const expected = process.env.FILTER_CONTROLS_PUBLIC_SHA256;
  if (
    !expected ||
    !/^[a-f0-9]{64}$/.test(expected) ||
    expected === oldPublicSha256
  )
    throw new Error(
      "Main must supply a NEW approved FILTER_CONTROLS_PUBLIC_SHA256; old180 output is not runnable evidence",
    );
  const current = snapshots();
  if (
    Object.keys(current.outputs).length !== 180 ||
    current.publicSha256 !== expected
  )
    throw new Error(
      "Actual public output does not match main's new180-file generation",
    );
  return current;
}
export function assertCapturedGeneration() {
  const before = JSON.parse(
    readFileSync(join(generationDirectory(), "roots-before.json"), "utf8"),
  );
  const current = assertFreshPublic();
  if (
    before.generation !== generation() ||
    JSON.stringify(before.roots) !== JSON.stringify(current)
  )
    throw new Error(
      "Named generation source/public bytes no longer match their own before proof",
    );
  return current;
}
