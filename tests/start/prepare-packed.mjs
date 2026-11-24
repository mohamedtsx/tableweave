import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Preparation only. Dependency installation is explicitly main-owned.
const root = fileURLToPath(new URL("../../", import.meta.url));
const base = join(root, ".artifacts/start");
await mkdir(base, { recursive: true });
const target = await mkdtemp(join(base, "packed-"));
const tarballs = join(target, "tarballs");
await mkdir(tarballs);
const packed = spawnSync("pnpm", ["pack", "--pack-destination", tarballs], {
  cwd: join(root, "packages/react"),
  stdio: "inherit",
});
assert.equal(
  packed.status,
  0,
  "Pack the actual current built headless package",
);
const name = (await readdir(tarballs)).find((name) => name.endsWith(".tgz"));
assert(name);
const app = join(target, "apps/example-start");
await mkdir(join(target, "apps"));
await cp(join(root, "apps/example-start"), app, {
  recursive: true,
  filter: (source) =>
    ![
      "node_modules",
      "dist",
      ".tanstack",
      "test-results",
      "routeTree.gen.ts",
    ].some((part) => source.split("/").includes(part)),
});
await assert.rejects(readFile(join(app, "src/routeTree.gen.ts")), {
  code: "ENOENT",
});
await cp(join(root, "tsconfig.base.json"), join(target, "tsconfig.base.json"));
const manifest = JSON.parse(await readFile(join(app, "package.json"), "utf8"));
manifest.dependencies["@tableweave/react"] = `file:../../tarballs/${name}`;
assert(!JSON.stringify(manifest).includes("workspace:"));
await writeFile(
  join(app, "package.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  join(target, "package.json"),
  `${JSON.stringify({ name: "wp06-packed-consumer", private: true, type: "module", packageManager: "pnpm@10.13.1" }, null, 2)}\n`,
);
await writeFile(
  join(target, "pnpm-workspace.yaml"),
  'packages:\n  - "apps/*"\nonlyBuiltDependencies:\n  - esbuild\n',
);
await cp(join(root, ".npmrc"), join(target, ".npmrc"));
const bytes = await readFile(join(tarballs, name));
await writeFile(
  join(target, "artifact.json"),
  `${JSON.stringify({ tarball: name, sha256: createHash("sha256").update(bytes).digest("hex") }, null, 2)}\n`,
);
console.log(`Prepared isolated actual-tarball Start consumer: ${target}`);
await writeFile(
  join(base, "last-prepared.json"),
  `${JSON.stringify({ target })}\n`,
);
console.log(
  "No install performed. Main must stage any approved app-required upstream declaration/dependency repairs, install strictly, then run app typecheck/build and dev/production test:e2e from this isolated consumer.",
);
