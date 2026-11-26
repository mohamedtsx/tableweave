import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, symlink, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// FINAL PHASE ONLY. Own output directories only; never builds installed dist,
// rewrites source imports, or relabels source/private evidence as package proof.
const compiler = process.argv[2],
  label = process.argv[3];
assert(["typescript", "typescript-5-9"].includes(compiler));
assert(
  label && /^[a-zA-Z0-9_-]+$/.test(label),
  "Supply a fresh final-phase label",
);
const root = fileURLToPath(new URL("../../", import.meta.url));
await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
const directory = new URL(
  `./.artifacts/${label}-${compiler}-emitted/`,
  import.meta.url,
);
await mkdir(directory);
const out = new URL("./out/", directory),
  config = new URL("./tsconfig.json", directory);
await writeFile(
  config,
  JSON.stringify({
    extends: fileURLToPath(new URL("./tsconfig.json", import.meta.url)),
    compilerOptions: {
      noEmit: false,
      declaration: true,
      outDir: fileURLToPath(out),
      incremental: false,
    },
    include: [],
    exclude: [],
    files: [fileURLToPath(new URL("./emitted-consumer.ts", import.meta.url))],
  }),
);
const compile = spawnSync(
  process.execPath,
  [
    `${root}node_modules/${compiler}/bin/tsc`,
    "-p",
    fileURLToPath(config),
    "--pretty",
    "false",
  ],
  { cwd: root, encoding: "utf8" },
);
await writeFile(
  new URL("compile.log", directory),
  `${compile.stdout ?? ""}${compile.stderr ?? ""}`,
);
assert.equal(
  compile.status,
  0,
  "Private emission must compile before any runtime launch",
);
await writeFile(
  new URL("./package.json", out),
  JSON.stringify({ private: true, type: "module" }),
);
const emittedReact = new URL("./packages/react/", out);
await writeFile(
  new URL("./package.json", emittedReact),
  JSON.stringify({
    name: "@tableweave/react",
    private: true,
    type: "module",
    exports: {
      ".": "./src/index.js",
      "./contracts": "./src/contracts/index.js",
      "./filters": "./src/filters/index.js",
    },
  }),
);
await mkdir(new URL("./node_modules/@tableweave/", out), { recursive: true });
await symlink(
  fileURLToPath(emittedReact),
  new URL("./node_modules/@tableweave/react", out),
  "dir",
);
// Only the genuine declaring vendor graph, not a rewritten dependency version.
await symlink(
  `${root}packages/react/node_modules`,
  new URL("./node_modules", emittedReact),
  "dir",
);
const run = spawnSync(
  process.execPath,
  [fileURLToPath(new URL("./tests/criteria-commit/emitted-consumer.js", out))],
  { cwd: root, encoding: "utf8" },
);
await writeFile(
  new URL("runtime.log", directory),
  `${run.stdout ?? ""}${run.stderr ?? ""}`,
);
assert.equal(
  run.status,
  0,
  "Private emitted consumer failed; see own runtime log",
);
console.log(
  `Private emitted feasibility consumer passed (${compiler}); no public/packed/install claim.`,
);
