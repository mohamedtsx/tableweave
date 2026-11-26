import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const allocated = [
  "packages/heroui/src/pagination/Pagination.tsx",
  "packages/heroui/src/pagination/usePaginationCorrection.ts",
  "packages/heroui/src/pagination/types.ts",
];
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sorted = (map) =>
  Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)));
async function snapshot() {
  const inputs = {};
  async function walk(directory) {
    for (const entry of await readdir(join(root, directory), {
      withFileTypes: true,
    })) {
      if ([".git", ".repo", "node_modules", "dist"].includes(entry.name))
        continue;
      const path = join(directory, entry.name);
      if (resolve(root, path) === own) continue;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile())
        inputs[path] = {
          mode:
            (await stat(join(root, path))).mode & 0o111 ? "100755" : "100644",
          sha256: hash(await readFile(join(root, path))),
        };
    }
  }
  await walk("");
  const sources = sorted(
    Object.fromEntries(
      Object.entries(inputs).filter(([path]) =>
        /^packages\/(react|heroui)\/src\//.test(path),
      ),
    ),
  );
  assert.equal(Object.keys(sources).length, 105);
  const protectedSources = Object.fromEntries(
    Object.entries(sources).filter(([path]) => !allocated.includes(path)),
  );
  const browser = sorted(
    Object.fromEntries(
      Object.entries(inputs).filter(([path]) =>
        path.startsWith("tests/pagination-policy/native-browser/"),
      ),
    ),
  );
  const vendor = createRequire(join(root, "packages/heroui/package.json"));
  const installed = {};
  for (const [name, patch] of [
    ["react-aria-components", "react-aria-components@1.22.1-tableweave.patch"],
    ["@heroui/react", "@heroui__react@3.2.8.patch"],
  ]) {
    const base = dirname(vendor.resolve(`${name}/package.json`));
    for (const line of (
      await readFile(join(root, "patches", patch), "utf8")
    ).matchAll(/^\+\+\+ b\/(.+)$/gm))
      installed[`${name}/${line[1]}`] = hash(
        await readFile(join(base, line[1])),
      );
  }
  const cli = spawnSync(
    process.execPath,
    [join(root, "tests/foundation/verify-workspace-compat.mjs")],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  return {
    sources,
    sourceAggregate: hash(`${JSON.stringify(sources, null, 2)}\n`),
    protectedSources,
    browser,
    inputs: sorted(
      Object.fromEntries(
        Object.entries(inputs).filter(([path]) => !allocated.includes(path)),
      ),
    ),
    installed: sorted(installed),
    runtimeCLI: cli.stdout.trim(),
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const phase = process.argv[2];
  assert.ok(["before", "after"].includes(phase));
  const art = join(own, ".artifacts");
  await mkdir(art, { recursive: true });
  const current = await snapshot();
  if (phase === "before") {
    assert.equal(
      current.sourceAggregate,
      "497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790",
    );
    for (const path of allocated)
      await writeFile(
        join(art, `original-${path.split("/").at(-1)}`),
        await readFile(join(root, path)),
        { flag: "wx" },
      );
  } else {
    const before = JSON.parse(await readFile(join(art, "before.json"), "utf8"));
    for (const key of [
      "protectedSources",
      "browser",
      "inputs",
      "installed",
      "runtimeCLI",
    ])
      assert.deepEqual(current[key], before[key], key);
  }
  await writeFile(
    join(art, `${phase}.json`),
    `${JSON.stringify(current, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `${phase}: ${Object.keys(current.protectedSources).length} protected sources; ${Object.keys(current.inputs).length} protected existing files; ${Object.keys(current.browser).length} separately sealed browser files; ${Object.keys(current.installed).length} installed assets`,
  );
}
