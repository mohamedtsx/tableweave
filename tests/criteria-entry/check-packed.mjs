// FINAL PHASE ONLY. No install/pack/build/config patch; no default local consumer.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import ts from "typescript";
import { runtimeNames, typeNames } from "./api.mjs";
import { archiveFiles } from "./archive.mjs";
import { explicitEntryExports, plainGraph } from "./graph.mjs";
import { own, root } from "./scope.mjs";

const args = process.argv.slice(2),
  values = new Map();
for (let i = 0; i < args.length; i += 2) {
  assert(
    ["--consumer", "--archive", "--sha256"].includes(args[i]) &&
      args[i + 1] &&
      !values.has(args[i]),
    "Expected --consumer PATH --archive TGZ --sha256 REVIEWED_SHA256",
  );
  values.set(args[i], args[i + 1]);
}
assert.equal(
  values.size,
  3,
  "Explicit genuine installed archive consumer + archive + independently supplied reviewed SHA required",
);
const sha = values.get("--sha256");
assert(/^[a-f0-9]{64}$/.test(sha), "Invalid expected archive SHA");
const consumer = await realpath(resolve(values.get("--consumer"))),
  archive = await realpath(resolve(values.get("--archive")));
const inside = (parent, child) => {
  const path = relative(parent, child);
  return path !== ".." && !path.startsWith("../") && !isAbsolute(path);
};
assert(
  !inside(root, consumer) && !inside(consumer, root),
  "Monorepo/source workspace is not a genuine consumer proof",
);
const consumerManifest = JSON.parse(
  await readFile(join(consumer, "package.json"), "utf8"),
);
assert(
  !consumerManifest.workspaces && consumerManifest.name !== "@tableweave/react",
  "Workspace/package root is not a consumer",
);
for (let current = consumer; ; current = dirname(current)) {
  try {
    await lstat(join(current, "pnpm-workspace.yaml"));
    throw new Error("Workspace consumer rejected");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (dirname(current) === current) break;
}
const spec =
  consumerManifest.dependencies?.["@tableweave/react"] ??
  consumerManifest.devDependencies?.["@tableweave/react"];
assert(
  typeof spec === "string" &&
    spec.startsWith("file:") &&
    /\.(tgz|tar\.gz)$/.test(spec),
  "Consumer must declare the supplied local archive, not workspace/link/source/registry fallback",
);
assert.equal(
  await realpath(resolve(consumer, spec.slice(5))),
  archive,
  "Consumer dependency is not the supplied archive",
);
const archiveBytes = await readFile(archive),
  hash = (value) => createHash("sha256").update(value).digest("hex");
assert.equal(
  hash(archiveBytes),
  sha,
  "Archive differs from externally supplied reviewed SHA",
);
const members = archiveFiles(archiveBytes);
const modules = await realpath(join(consumer, "node_modules"));
assert(
  modules !== consumer && inside(consumer, modules),
  "Consumer node_modules redirects outside consumer",
);
const installed = await realpath(
  join(consumer, "node_modules/@tableweave/react"),
);
assert(
  installed !== modules && inside(modules, installed),
  "Workspace/source package symlink rejected (ordinary pnpm archive store inside node_modules is allowed)",
);
const packageBytes = await readFile(join(installed, "package.json"));
assert.deepEqual(
  packageBytes,
  members.get("package.json"),
  "Installed manifest is not the archive manifest",
);
const manifest = JSON.parse(packageBytes);
assert.equal(manifest.name, "@tableweave/react");
assert.equal(manifest.type, "module");
assert.deepEqual(manifest.exports?.["./criteria"], {
  types: "./dist/criteria/index.d.ts",
  import: "./dist/criteria/index.js",
});
assert(
  members.has("dist/criteria/index.js") &&
    members.has("dist/criteria/index.d.ts"),
  "Archive omits new public entry outputs",
);
async function installedFiles(directory, prefix = "") {
  const result = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.name === "node_modules") continue; // Installer-owned nested dependencies, never this package's archive image.
    const path = `${prefix}${item.name}`;
    assert(
      !item.isSymbolicLink(),
      `Installed package member symlink rejected: ${path}`,
    );
    if (item.isDirectory())
      result.push(
        ...(await installedFiles(join(directory, item.name), `${path}/`)),
      );
    else {
      assert(item.isFile());
      result.push(path);
    }
  }
  return result.sort();
}
assert.deepEqual(
  await installedFiles(installed),
  [...members.keys()].sort(),
  "Installed package adds/removes archive members or private shims",
);
for (const [path, bytes] of members)
  assert.equal(
    hash(await readFile(join(installed, path))),
    hash(bytes),
    `Installed/archive byte mismatch: ${path}`,
  );

const entry = join(installed, "dist/criteria/index.js"),
  declarations = join(installed, "dist/criteria/index.d.ts");
const graph = await plainGraph(entry, join(installed, "dist"), false);
assert.deepEqual([...graph.nodes.values()].map((value) => value.path).sort(), [
  "controller/criteria-publication.js",
  "controller/criteria.js",
  "criteria/index.js",
]);
const dts = ts.createSourceFile(
  declarations,
  await readFile(declarations, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
assert.deepEqual(explicitEntryExports(dts), {
  runtime: runtimeNames,
  types: typeNames,
});
const probe = `
import assert from 'node:assert/strict';
import {realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
assert.equal(typeof window, 'undefined'); assert.equal(typeof document, 'undefined');
const specifier='@tableweave/react/criteria';
const url=import.meta.resolve(specifier);
assert.equal(await realpath(fileURLToPath(url)), ${JSON.stringify(entry)});
const entry=await import(specifier);
assert.deepEqual(Object.keys(entry).sort(),${JSON.stringify(runtimeNames)});
const authority=await import(new URL('../controller/criteria.js',url));
const publication=await import(new URL('../controller/criteria-publication.js',url));
for(const name of ${JSON.stringify(runtimeNames)}) { assert.equal(typeof entry[name], 'function'); assert.equal(entry[name], authority[name] ?? publication[name]); }
console.log(JSON.stringify({resolved:fileURLToPath(url),runtimeNames:Object.keys(entry).sort(),constructorsOrAppReadersInvoked:false}));
`;
const result = spawnSync(
  process.execPath,
  ["--input-type=module", "--eval", probe],
  {
    cwd: consumer,
    encoding: "utf8",
    timeout: 15000,
    env: {
      ...process.env,
      NODE_OPTIONS: "",
      NODE_PATH: "",
      NODE_V8_COVERAGE: "",
      NODE_DISABLE_COMPILE_CACHE: "1",
    },
  },
);
const output = join(own, ".artifacts/final-packed");
await mkdir(output, { recursive: true });
await writeFile(join(output, "node.stdout.log"), result.stdout ?? "");
await writeFile(join(output, "node.stderr.log"), result.stderr ?? "");
if (result.error) throw result.error;
assert.equal(
  result.status,
  0,
  "Isolated actual Node ESM public import failed; see retained logs",
);
const report = {
  status: "PASS genuine archive image + installed public discovery/import only",
  consumer,
  archive,
  archiveSha256: sha,
  installed,
  archiveMembers: members.size,
  runtimeNodes: [...graph.nodes.values()].map((value) => value.path).sort(),
  runtimeEdges: graph.edges,
  declarationNames: { runtime: runtimeNames, types: typeNames },
  nodeImport: JSON.parse(result.stdout.trim()),
  actualPublicTypeProgramExecuted: false,
  ssrSessionOrBackendAuthorizationProof: false,
  productGateApproval: false,
};
await writeFile(
  join(output, "report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
