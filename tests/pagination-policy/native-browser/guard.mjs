import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = dirname(fileURLToPath(import.meta.url));
export const root = resolve(own, "../../..");
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sorted = (map) =>
  Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? -1 : 1)));
async function walk(base, directory, map) {
  for (const entry of await readdir(join(base, directory), {
    withFileTypes: true,
  })) {
    if ([".git", ".repo", "node_modules", "dist"].includes(entry.name))
      continue;
    const path = join(directory, entry.name);
    if (resolve(base, path) === own) continue;
    if (entry.isDirectory()) await walk(base, path, map);
    else if (entry.isFile()) {
      const info = await stat(join(base, path));
      map[path] = {
        mode: info.mode & 0o111 ? "100755" : "100644",
        sha256: hash(await readFile(join(base, path))),
      };
    }
  }
}
async function snapshot() {
  const inputs = {};
  await walk(root, "", inputs);
  const source = sorted(
    Object.fromEntries(
      Object.entries(inputs).filter(([path]) =>
        /^packages\/(react|heroui)\/src\//.test(path),
      ),
    ),
  );
  assert.equal(Object.keys(source).length, 105);
  const sourceBytes = `${JSON.stringify(source, null, 2)}\n`;
  assert.equal(
    hash(sourceBytes),
    "497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790",
  );
  const vendor = createRequire(join(root, "packages/heroui/package.json"));
  const installed = {};
  for (const name of ["react-aria-components", "@heroui/react"]) {
    const base = dirname(vendor.resolve(`${name}/package.json`));
    for (const line of (
      await readFile(
        join(
          root,
          "patches",
          name === "react-aria-components"
            ? "react-aria-components@1.22.1-tableweave.patch"
            : "@heroui__react@3.2.8.patch",
        ),
        "utf8",
      )
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
    source105: source,
    sourceAggregate: hash(sourceBytes),
    inputs: sorted(inputs),
    installed: sorted(installed),
    runtimeCLI: cli.stdout.trim(),
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const phase = process.argv[2];
  assert.ok(["before", "after"].includes(phase));
  const artifacts = join(own, ".artifacts");
  await mkdir(artifacts, { recursive: true });
  const current = await snapshot();
  if (phase === "after")
    assert.deepEqual(
      current,
      JSON.parse(
        await readFile(join(artifacts, "protected-before.json"), "utf8"),
      ),
    );
  await writeFile(
    join(artifacts, `protected-${phase}.json`),
    `${JSON.stringify(current, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `${phase}: ${Object.keys(current.source105).length} sources / ${Object.keys(current.inputs).length} existing files / ${Object.keys(current.installed).length} installed profiled assets unchanged; ${current.sourceAggregate}`,
  );
}
