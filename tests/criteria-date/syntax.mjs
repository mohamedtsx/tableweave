import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const files = (await readdir(new URL("./", import.meta.url))).filter((name) =>
  name.endsWith(".mjs"),
);
for (const name of files) {
  const checked = spawnSync(
    process.execPath,
    ["--check", fileURLToPath(new URL(name, import.meta.url))],
    { encoding: "utf8" },
  );
  if (checked.error) throw checked.error;
  assert.equal(checked.status, 0, `${name}: ${checked.stderr}`);
}
console.log(
  `${files.length} own scripts/configs passed node --check; no config/application modules loaded.`,
);
