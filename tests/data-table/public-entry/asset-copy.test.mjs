import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { copyStyles } from "../../foundation/copy-styles.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const source = join(root, "packages/heroui/src");

test("owned CSS copy includes the actual shell and complete local import closure", async () => {
  const destination = join(
    root,
    "tests/data-table/public-entry/.artifacts",
    `asset-copy-${randomUUID()}`,
  );
  await mkdir(destination, { recursive: true });
  const copied = await copyStyles(source, destination);
  assert(copied.includes("data-table/styles.css"));
  const files = new Set(copied);
  for (const entry of copied) {
    const original = await readFile(join(source, entry));
    const actual = await readFile(join(destination, entry));
    assert.deepEqual(actual, original, entry);
    for (const match of actual
      .toString("utf8")
      .matchAll(/@import\s+"(\.[^"]+)"/g)) {
      const imported = resolve(destination, dirname(entry), match[1]);
      const key = relative(destination, imported);
      assert(files.has(key), `${entry} is missing copied import ${key}`);
    }
  }
  assert.deepEqual(await readdir(join(destination, "data-table")), [
    "styles.css",
  ]);
});
