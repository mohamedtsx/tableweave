import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve, sep } from "node:path";
import { checkPackedControls } from "./packed-controls.mjs";

const assetNames = [
  "runtime.patch",
  "profile.json",
  "verify.mjs",
  "README.md",
  "NOTICE-RAC",
  "LICENSE-APACHE-2.0",
];
const runtimePaths = [
  "dist/private/Table.js",
  "dist/private/Table.mjs",
  "dist/private/Table.cjs",
];
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** A separate install; never convert the passing unpatched consumer in place. */
export async function checkPackedControlsProfile(
  root,
  run,
  unpatchedConsumer,
  archives,
) {
  const consumer = join(run, "consumer-styled-profiled");
  await mkdir(consumer);
  const assets = join(consumer, "patches/tableweave-rac-table-clone");
  await mkdir(assets, { recursive: true });
  const assetDigests = {};
  for (const name of assetNames) {
    // The archive has already passed the exact member allowlist. Extract only
    // individual bytes, not paths, links or code from a workspace installation.
    const result = spawnSync(
      "tar",
      ["-xOf", archives.heroui, `package/compat/rac-table-clone/${name}`],
      { maxBuffer: 4 * 1024 * 1024 },
    );
    if (result.error) throw result.error;
    assert.equal(
      result.status,
      0,
      `Missing actual archive profile asset: ${name}`,
    );
    assetDigests[name] = digest(result.stdout);
    await writeFile(join(assets, name), result.stdout);
  }
  const profile = JSON.parse(
    await readFile(join(assets, "profile.json"), "utf8"),
  );
  assert.deepEqual(
    profile.files.map((file) => file.path),
    runtimePaths,
  );
  const verifier = join(assets, "verify.mjs");
  const baseManifest = JSON.parse(
    await readFile(join(unpatchedConsumer, "package.json"), "utf8"),
  );
  await writeFile(
    join(consumer, "package.json"),
    JSON.stringify(
      { ...baseManifest, name: "wp08-profiled-controls-consumer" },
      null,
      2,
    ),
  );
  await writeFile(
    join(consumer, ".npmrc"),
    "auto-install-peers=false\nstrict-peer-dependencies=true\n",
  );
  await writeFile(
    join(consumer, "pnpm-workspace.yaml"),
    "packages: []\npatchedDependencies:\n  react-aria-components@1.22.1: patches/tableweave-rac-table-clone/runtime.patch\nallowUnusedPatches: false\nignorePatchFailures: false\n",
  );

  const baseRequire = createRequire(join(unpatchedConsumer, "package.json"));
  const baseVendor = dirname(
    await realpath(baseRequire.resolve("react-aria-components/package.json")),
  );
  assert(baseVendor.startsWith(`${await realpath(unpatchedConsumer)}${sep}`));
  const originalDigests = [];
  for (const [index, path] of runtimePaths.entries()) {
    const actual = digest(await readFile(join(baseVendor, path)));
    assert.equal(actual, profile.files[index].beforeSha256);
    originalDigests.push(actual);
  }
  const negative = spawnSync(process.execPath, [verifier, unpatchedConsumer], {
    cwd: consumer,
    encoding: "utf8",
  });
  if (negative.error) throw negative.error;
  assert.equal(
    negative.status,
    1,
    "Untouched unpatched runtime must be rejected",
  );
  assert.equal(negative.stdout, "");
  assert.equal(
    negative.stderr,
    "Tableweave RAC clone candidate profile verification failed: E_VENDOR.\n",
  );
  for (const [index, path] of runtimePaths.entries())
    assert.equal(
      digest(await readFile(join(baseVendor, path))),
      originalDigests[index],
      "Verification mutated the unpatched consumer",
    );

  function command(executable, args) {
    const result = spawnSync(executable, args, {
      cwd: consumer,
      stdio: "inherit",
      env: { ...process.env, CI: "1", DO_NOT_TRACK: "1" },
    });
    if (result.error) throw result.error;
    assert.equal(
      result.status,
      0,
      `Profiled consumer command failed: ${args.join(" ")}`,
    );
  }
  // --ignore-workspace would also ignore this project's patchedDependencies.
  // Its explicit empty workspace is the isolation boundary; prove pnpm selected it.
  const workspace = spawnSync("pnpm", ["root", "--workspace-root"], {
    cwd: consumer,
    encoding: "utf8",
  });
  if (workspace.error) throw workspace.error;
  assert.equal(workspace.status, 0);
  assert.equal(
    resolve(workspace.stdout.trim()),
    join(consumer, "node_modules"),
    "Profile installation selected a parent workspace",
  );
  command("pnpm", ["install", "--ignore-scripts", "--no-frozen-lockfile"]);
  const lock = digest(await readFile(join(consumer, "pnpm-lock.yaml")));
  command("pnpm", ["install", "--ignore-scripts", "--frozen-lockfile"]);
  assert.equal(digest(await readFile(join(consumer, "pnpm-lock.yaml"))), lock);
  command(process.execPath, [verifier, consumer]);
  await copyFile(
    join(unpatchedConsumer, "runtime.mjs"),
    join(consumer, "runtime.mjs"),
  );
  command(process.execPath, ["runtime.mjs", "--styled"]);

  const browser = await checkPackedControls(root, consumer);
  command(process.execPath, [verifier, consumer]);
  for (const name of assetNames)
    assert.equal(
      digest(await readFile(join(assets, name))),
      assetDigests[name],
      `Consumer profile asset changed during verification: ${name}`,
    );
  for (const [index, path] of runtimePaths.entries())
    assert.equal(
      digest(await readFile(join(baseVendor, path))),
      originalDigests[index],
      "Profiled lane mutated the independent unpatched runtime",
    );
  return {
    consumer,
    profile: profile.id,
    assetsFrom: "actual-styled-archive-before-install",
    assetDigests,
    explicitRuntimePatch: "application-owned",
    unpatchedNegative: "E_VENDOR; runtime bytes unchanged",
    installedProfileVerification: "before-and-after-production-browser",
    lock: "frozen-reinstall-unchanged",
    nodeImports: "actual-profiled-runtime-guards; not-CJS-table-interaction",
    browser,
  };
}
