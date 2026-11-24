import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { checkConsumerDeclarations } from "../foundation/consumer-declarations.mjs";
import { stageStartCompatibility } from "./compatibility.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const environment = { ...process.env, CI: "1", DO_NOT_TRACK: "1" };
function command(executable, args, cwd, extra = {}) {
  const result = spawnSync(executable, args, {
    cwd,
    env: { ...environment, ...extra },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${executable} ${args.join(" ")} failed`);
}

command(process.execPath, ["tests/start/prepare-packed.mjs"], root);
const { target } = JSON.parse(
  await readFile(join(root, ".artifacts/start/last-prepared.json"), "utf8"),
);
assert(
  resolve(target).startsWith(`${resolve(root, ".artifacts/start")}${sep}`),
  "Packed preparation escaped its owned artifact directory",
);
await stageStartCompatibility(root, target);
command("pnpm", ["install", "--no-frozen-lockfile"], target);
const lock = await readFile(join(target, "pnpm-lock.yaml"), "utf8");
command("pnpm", ["install", "--frozen-lockfile"], target);
assert.equal(await readFile(join(target, "pnpm-lock.yaml"), "utf8"), lock);
const app = join(target, "apps/example-start");
const resolution = spawnSync(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    'console.log(import.meta.resolve("@tableweave/react"));',
  ],
  { cwd: app, env: environment, encoding: "utf8" },
);
if (resolution.error) throw resolution.error;
assert.equal(resolution.status, 0, resolution.stderr);
const installed = await realpath(fileURLToPath(resolution.stdout.trim()));
assert(
  installed.startsWith(`${await realpath(target)}${sep}node_modules${sep}`),
  "Actual Start consumer resolved Tableweave outside its isolated tarball install",
);
const manifest = JSON.parse(await readFile(join(app, "package.json"), "utf8"));
assert(
  manifest.dependencies["@tableweave/react"].startsWith("file:../../tarballs/"),
);
assert(!JSON.stringify(manifest).includes("workspace:"));
command("pnpm", ["typecheck"], app);
assert(
  (await readFile(join(app, "src/routeTree.gen.ts"), "utf8")).length > 0,
  "Actual framework typecheck must generate its own ignored route tree",
);
command(
  process.execPath,
  [
    join(root, "node_modules/typescript-5-9/bin/tsc"),
    "-p",
    join(app, "tsconfig.json"),
    "--noEmit",
  ],
  target,
);
const declarationsIsolation = [];
for (const compiler of ["typescript", "typescript-5-9"])
  declarationsIsolation.push(
    await checkConsumerDeclarations(
      root,
      target,
      compiler,
      "apps/example-start/tsconfig.json",
    ),
  );
command("pnpm", ["build"], app);
command("pnpm", ["test:e2e"], app);
command("pnpm", ["test:e2e"], app, { WP06_PRODUCTION: "1" });
// This checker reads actual production output relative to its cwd override.
command(
  process.execPath,
  [join(root, "tests/start/check-client.mjs"), app],
  root,
);
await writeFile(
  join(target, "acceptance.json"),
  `${JSON.stringify(
    {
      tarball: JSON.parse(
        await readFile(join(target, "artifact.json"), "utf8"),
      ),
      installed,
      strictInstall: "passed",
      declarations: ["6.0.3", "5.9.3"],
      generatedRoutes: "created-by-actual-framework-typecheck-build",
      declarationsIsolation,
      build: "passed",
      actualStartDevelopment: "passed",
      actualStartProduction: "passed",
    },
    null,
    2,
  )}\n`,
);
console.log(`Actual-tarball Start checks passed: ${target}`);
