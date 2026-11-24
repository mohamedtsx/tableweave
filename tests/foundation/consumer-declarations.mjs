import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { realpath } from "node:fs/promises";
import { basename, join, sep } from "node:path";

export async function checkConsumerDeclarations(
  root,
  consumer,
  compiler,
  configuration = "tsconfig.json",
) {
  const executable = join(root, "node_modules", compiler, "bin/tsc");
  const result = spawnSync(
    process.execPath,
    [executable, "-p", configuration, "--pretty", "false", "--listFilesOnly"],
    { cwd: consumer, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const files = result.stdout.trim().split(/\r?\n/);
  assert(files.length > 1, "Consumer declaration resolution was not inspected");
  const local = `${await realpath(consumer)}${sep}`;
  const standard = `${await realpath(join(root, "node_modules", compiler, "lib"))}${sep}`;
  for (const file of files) {
    const resolved = await realpath(file);
    assert(
      resolved.startsWith(local) ||
        (resolved.startsWith(standard) &&
          /^lib(?:\..+)?\.d\.ts$/.test(basename(resolved))),
      `Consumer borrowed a declaration/source outside its install: ${resolved}`,
    );
  }
  return {
    compiler,
    files: files.length,
    outsideConsumer: "compiler-standard-library-only",
  };
}
