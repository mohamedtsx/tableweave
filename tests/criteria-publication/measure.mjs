import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const own = new URL("./", import.meta.url);
const paths = ["packages/react/src/controller/criteria-publication.ts"];
for (const entry of await readdir(own, { withFileTypes: true })) {
  if (entry.isFile() && /\.(ts|mjs|json)$/.test(entry.name))
    paths.push(`tests/criteria-publication/${entry.name}`);
}
const files = [];
for (const path of paths.sort()) {
  files.push({
    path,
    sha256: createHash("sha256")
      .update(await readFile(new URL(path, root)))
      .digest("hex"),
  });
}
const aggregate = createHash("sha256")
  .update(files.map((file) => `${file.sha256}  ${file.path}\n`).join(""))
  .digest("hex");
const manifest = {
  algorithm: "sha256 of sorted '<file sha256>  <relative path>\\n' UTF-8 lines",
  aggregate,
  files,
};
await mkdir(new URL(".artifacts/", own), { recursive: true });
await writeFile(
  new URL(".artifacts/source-test-manifest.json", own),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(JSON.stringify(manifest, null, 2));
