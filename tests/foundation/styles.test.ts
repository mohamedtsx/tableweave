import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { copyStyles } from "./copy-styles.mjs";

async function fixture() {
  const parent =
    process.env.TABLEWEAVE_TMPDIR ??
    (process.env.CI ? tmpdir() : "/tmp/opencode");
  const root = await mkdtemp(join(parent, "tableweave-styles-"));
  const source = join(root, "src");
  const destination = join(root, "dist");
  await mkdir(source);
  await writeFile(join(source, "styles.css"), "@layer tableweave;\n");
  return { root, source, destination };
}

it("copies nested owned CSS without importing assets or unallocated source roots", async () => {
  const { source, destination } = await fixture();
  await mkdir(join(source, "filters", "values"), { recursive: true });
  await mkdir(join(source, "unallocated"));
  await writeFile(join(source, "filters", "values", "rule.css"), ".rule {}\n");
  await writeFile(join(source, "filters", "example.txt"), "not a stylesheet\n");
  await writeFile(join(source, "unallocated", "ignored.css"), ".ignored {}\n");
  expect((await copyStyles(source, destination)).sort()).toEqual(
    ["styles.css", join("filters", "values", "rule.css")].sort(),
  );
  expect(
    await readFile(join(destination, "filters", "values", "rule.css"), "utf8"),
  ).toBe(".rule {}\n");
  expect((await readdir(destination)).sort()).toEqual([
    "filters",
    "styles.css",
  ]);
  expect(await readdir(join(destination, "filters"))).toEqual(["values"]);
});

it("rejects source symlinks rather than copying external stylesheet material", async () => {
  const { root, source, destination } = await fixture();
  await mkdir(join(source, "filters"));
  const outside = join(root, "outside.css");
  await writeFile(outside, ".external {}\n");
  await symlink(outside, join(source, "filters", "external.css"));
  await expect(copyStyles(source, destination)).rejects.toThrow(
    "Stylesheet source symlinks are unsupported",
  );
});
