import fs from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const own = "tests/consumers/wp13";
export const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function capacity() {
  const s = fs.statfsSync(".");
  const bytes = s.bavail * s.bsize;
  if (bytes < 128 * 1024 * 1024)
    throw Error("E_CAPACITY: no cleanup authority");
  return bytes;
}
export const entry = (file) => ({
  mode: fs.statSync(file).mode & 0o777,
  size: fs.statSync(file).size,
  sha256: sha(fs.readFileSync(file)),
});
export function inventory(directory = "", result = {}) {
  for (const item of fs.readdirSync(directory || ".", {
    withFileTypes: true,
  })) {
    const file = directory ? `${directory}/${item.name}` : item.name;
    if (
      [".git", "node_modules", ".repo"].includes(item.name) ||
      file === own ||
      /^\.env(?:\.|$)|\.(?:pem|key)$/.test(item.name)
    )
      continue;
    if (item.isDirectory()) inventory(file, result);
    else if (item.isFile()) result[file] = entry(file);
  }
  return result;
}
export function verifyScope() {
  const before = JSON.parse(fs.readFileSync(`${own}/evidence/before.json`));
  const now = inventory(),
    metadata = [],
    drift = [];
  for (const file of new Set([...Object.keys(before), ...Object.keys(now)])) {
    if (JSON.stringify(before[file]) === JSON.stringify(now[file])) continue;
    (/^(?:TASKS|REVIEW|README)\.md$|^docs\//.test(file)
      ? metadata
      : drift
    ).push(file);
  }
  if (drift.length) throw Error(`E_SCOPE: ${drift.join(", ")}`);
  const source = JSON.parse(fs.readFileSync(`${own}/evidence/source155.json`));
  for (const [file, value] of Object.entries(source))
    if (
      entry(file).sha256 !== value.sha256 ||
      (entry(file).mode & 0o111) !== (parseInt(value.mode, 8) & 0o111)
    )
      throw Error(`E_SOURCE: ${file}`);
  const installed = JSON.parse(
    fs.readFileSync(`${own}/evidence/installed-before.json`),
  );
  for (const [file, expected] of Object.entries(installed))
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
      throw Error(`E_INSTALLED: ${file}`);
  return {
    protectedRegularInputs: Object.keys(before).length,
    source155: Object.keys(source).length,
    installedInputs: Object.keys(installed).length,
    disclosedMainMetadataDrift: metadata,
  };
}
function capture() {
  capacity();
  if (fs.existsSync(`${own}/evidence/before.json`))
    throw Error("Immutable before map exists");
  const bytes = fs.readFileSync(
    "/tmp/opencode/wp10-move-reason-integrated-source155.json",
  );
  if (
    sha(bytes) !==
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
  )
    throw Error("Wrong canonical155 map");
  const installed = {};
  for (const name of [
    "typescript",
    "typescript-5-9",
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "@biomejs/biome",
  ]) {
    const file = `node_modules/${name}/package.json`,
      manifest = JSON.parse(fs.readFileSync(file));
    installed[file] = entry(file);
    if (manifest.types)
      installed[`node_modules/${name}/${manifest.types}`] = entry(
        `node_modules/${name}/${manifest.types}`,
      );
  }
  for (const file of [
    "node_modules/typescript/bin/tsc",
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/_tsc.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/typescript-5-9/bin/tsc",
  ])
    installed[file] = entry(file);
  for (const [name, value] of Object.entries({
    "before.json": inventory(),
    "installed-before.json": installed,
  }))
    fs.writeFileSync(
      `${own}/evidence/${name}`,
      `${JSON.stringify(value, null, 2)}\n`,
      { flag: "wx" },
    );
  fs.writeFileSync(`${own}/evidence/source155.json`, bytes, { flag: "wx" });
  console.log(JSON.stringify(verifyScope()));
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv[2] === "capture") capture();
  else if (process.argv[2] === "verify")
    console.log(JSON.stringify(verifyScope()));
  else throw Error("Explicit evidence action required");
}
