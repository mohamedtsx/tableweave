import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../../", import.meta.url);
const output = new URL("./.artifacts/protected-before.json", import.meta.url);
const sealed = new URL("./protected-inputs.json", import.meta.url);
const excluded = [
  "packages/react/src/controller/criteria-publication.ts",
  "packages/react/src/contracts/execution.ts",
];
const files = [];
async function walk(relative) {
  for (const entry of await readdir(new URL(relative, root), {
    withFileTypes: true,
  })) {
    if (["node_modules", "dist", ".artifacts", ".git"].includes(entry.name))
      continue;
    const path = `${relative}${entry.name}`;
    if (entry.isDirectory()) await walk(`${path}/`);
    else if (entry.isFile() && !excluded.includes(path)) files.push(path);
  }
}
await walk("packages/");
await walk("apps/");
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isFile() && /\.(json|jsonc|yaml|yml|ts|mjs)$/.test(entry.name))
    files.push(entry.name);
}
const hashes = {};
for (const path of files.sort()) {
  hashes[path] = createHash("sha256")
    .update(await readFile(new URL(path, root)))
    .digest("hex");
}
assert.equal(
  hashes["packages/react/src/controller/criteria.ts"],
  "80da37ffc9cbfad9b15ead39f0b24833e382adfa45d6d8f6481656d83af654db",
);
if (process.argv[2] === "capture") {
  await mkdir(new URL("./.artifacts/", import.meta.url), { recursive: true });
  await writeFile(
    output,
    `${JSON.stringify({ excluded, hashes }, null, 2)}\n`,
    {
      flag: "wx",
    },
  );
} else if (process.argv[2] === "seal") {
  const before = JSON.parse(await readFile(output, "utf8"));
  assert.deepEqual({ excluded, hashes }, before);
  await writeFile(sealed, `${JSON.stringify(before, null, 2)}\n`, {
    flag: "wx",
  });
} else {
  const before = JSON.parse(await readFile(sealed, "utf8"));
  assert.deepEqual({ excluded, hashes }, before);
}
console.log(
  `${Object.keys(hashes).length} protected package/app/config files; ${process.argv[2] ?? "check"}; ${fileURLToPath(output)}`,
);
