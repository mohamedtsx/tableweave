import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const app = process.argv[2]
  ? resolve(process.argv[2])
  : join(root, "apps/example-start");
const directory = join(app, "dist/client/assets");
const reports = [];
for (const name of await readdir(directory)) {
  if (!name.endsWith(".js")) continue;
  const bytes = await readFile(join(directory, name));
  const text = bytes.toString();
  for (const marker of [
    "WP06_SERVER_READER_FIXTURES_NOT_CLIENT_CODE",
    "Synthetic access denied.",
    "function makeRows(",
    "function readRows(",
  ])
    assert(
      !text.includes(marker),
      `Server-only reader implementation leaked into ${name}`,
    );
  reports.push({
    name,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
assert(reports.length > 0);
console.log(
  JSON.stringify(
    { clientChunks: reports, serverReaderMarkersAbsent: true },
    null,
    2,
  ),
);
