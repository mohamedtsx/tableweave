// FINAL ONLY, PREPARE/AUDIT only. No install/build/patch or guessed archive here.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  access,
  lstat,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const [mode, supplied, archive] = process.argv.slice(2);
assert(["prepare", "audit"].includes(mode));
assert(
  supplied && isAbsolute(supplied),
  "Explicit fresh outside target required",
);
const target = resolve(supplied),
  parent = await realpath(dirname(target));
const exists = async (path) => {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
};
async function outsideAncestors(directory) {
  let path = directory;
  for (;;) {
    for (const marker of [
      ".git",
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
      "lerna.json",
      "yarn.lock",
      "node_modules",
    ])
      assert(
        !(await exists(resolve(path, marker))),
        `Ancestor workspace/worktree/dependency boundary: ${path}/${marker}`,
      );
    if (await exists(resolve(path, "package.json"))) {
      const manifest = JSON.parse(
        await readFile(resolve(path, "package.json"), "utf8"),
      );
      assert(
        !manifest.workspaces && !manifest.pnpm?.workspace,
        `Ancestor package workspace: ${path}`,
      );
    }
    const next = dirname(path);
    if (path === next) break;
    path = next;
  }
}
assert.equal(
  resolve(parent, target.slice(dirname(target).length + 1)),
  target,
  "No lexical/symlink parent redirection",
);
await outsideAncestors(parent);
const below = (base, path) => path === base || path.startsWith(`${base}${sep}`);
assert(!below(await realpath(root), target));
if (mode === "prepare") {
  assert(
    !(await exists(target)),
    "Never overwrite any existing target/symlink",
  );
  assert(archive && isAbsolute(archive));
  const bytes = await readFile(await realpath(archive));
  await mkdir(target);
  const before = JSON.parse(
    await readFile(new URL("./before.json", import.meta.url), "utf8"),
  );
  const app = "apps/example-start-facade/";
  for (const path of [
    ...before.leased.filter(
      (path) =>
        path.startsWith(app) && !path.endsWith("tsconfig.source-light.json"),
    ),
    "tsconfig.base.json",
    ...["records.ts", "schemas.ts", "definitions.ts"].map(
      (name) => `apps/examples/shared/${name}`,
    ),
  ]) {
    await mkdir(dirname(resolve(target, path)), { recursive: true });
    await writeFile(
      resolve(target, path),
      await readFile(resolve(root, path)),
      { flag: "wx" },
    );
  }
  const manifest = JSON.parse(
    await readFile(resolve(root, `${app}package.json`), "utf8"),
  );
  manifest.dependencies["@tableweave/react"] =
    `file:${await realpath(archive)}`;
  await writeFile(
    resolve(target, `${app}package.json`),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" },
  );
  // Root dependencies also serve the sibling plain fixture directory, without a
  // workspace or a source alias. The nested app remains the actual Vite root.
  await writeFile(
    resolve(target, "package.json"),
    `${JSON.stringify({ ...manifest, name: "wp11-start-facade-archive-consumer" }, null, 2)}\n`,
    { flag: "wx" },
  );
  await writeFile(
    resolve(target, "receipt.json"),
    `${JSON.stringify({ status: "Prepared only; not installed/compatible/ordinary runtime proof", archive: { sha256: createHash("sha256").update(bytes).digest("hex") }, profile: "Main must explicitly materialize the unchanged required Start declaration profile; no RAC patch, no source alias, no new repair is applied by this driver" }, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    "Prepared only outside every detected ancestor workspace/worktree. No install/build/script/profile change executed.",
  );
} else {
  assert.equal(await realpath(target), target);
  const app = resolve(target, "apps/example-start-facade");
  const require = createRequire(resolve(app, "package.json"));
  const compilerPath = await realpath(require.resolve("typescript"));
  assert(
    below(target, compilerPath),
    "Consumer must use its own actual compiler, not host fallback",
  );
  const ts = require(compilerPath);
  const configPath = resolve(app, "tsconfig.json"),
    raw = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(raw.error, undefined);
  const config = ts.parseJsonConfigFileContent(raw.config, ts.sys, app);
  assert.equal(config.errors.length, 0);
  assert.equal(config.options.paths, undefined);
  assert.equal(config.options.skipLibCheck, false);
  await access(resolve(app, "src/routeTree.gen.ts"));
  const program = ts.createProgram(config.fileNames, config.options);
  const paths = [];
  for (const file of program.getSourceFiles()) {
    const path = await realpath(file.fileName);
    assert(below(target, path), `Host/worktree resolution escaped: ${path}`);
    paths.push(path);
  }
  assert.equal(
    ts.getPreEmitDiagnostics(program).length,
    0,
    "Actual consumer compiler must have zero diagnostics",
  );
  await writeFile(
    resolve(target, `confinement-${ts.version}.json`),
    `${JSON.stringify({ compiler: ts.version, status: "Local positive program only; no browser/runtime/ordinary compatibility inference", paths }, null, 2)}\n`,
    { flag: "wx" },
  );
}
