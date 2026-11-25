import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const own = "tests/consumers/wp13-storage";
const leased = [
  "tests/consumers/wp13/cli.mjs",
  "tests/consumers/wp13/lib/boundary.mjs",
  "tests/consumers/wp13/lib/installer.mjs",
  "tests/consumers/wp13/lib/generation.mjs",
  "tests/consumers/wp13/protocol.json",
  "tests/consumers/wp13/README.md",
];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function entry(file) {
  const s = fs.statSync(file);
  return {
    mode: s.mode & 0o777,
    size: s.size,
    sha256: sha(fs.readFileSync(file)),
  };
}
function capacity() {
  const s = fs.statfsSync(".");
  const free = s.bavail * s.bsize;
  if (free < 134217728) throw Error("E_CAPACITY_NO_CLEANUP");
  return free;
}
function inventory(dir = "", result = {}) {
  for (const item of fs.readdirSync(dir || ".", { withFileTypes: true })) {
    const file = dir ? `${dir}/${item.name}` : item.name;
    if (
      [".git", ".repo", "node_modules"].includes(item.name) ||
      file === own ||
      /^\.env(?:\.|$)|\.(?:pem|key)$/.test(item.name)
    )
      continue;
    if (item.isDirectory()) inventory(file, result);
    else if (item.isFile()) result[file] = entry(file);
  }
  return result;
}
function save(file, value) {
  capacity();
  fs.writeFileSync(`${own}/${file}`, `${JSON.stringify(value, null, 2)}\n`, {
    flag: "wx",
  });
}
function pins() {
  const result = {};
  for (const pin of [
    "tests/consumers/wp13/evidence/positive-inputs-001/inputs.json",
    "tests/consumers/wp13-runtime/evidence/positive-inputs-001/inputs.json",
  ]) {
    if (!fs.existsSync(pin)) continue;
    const value = JSON.parse(fs.readFileSync(pin));
    for (const file of Object.keys(value.files))
      result[fs.realpathSync(file)] = entry(file);
  }
  for (const file of [
    process.execPath,
    "package.json",
    "pnpm-lock.yaml",
    "biome.json",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/typescript/lib/_tsc.js",
    path.resolve(
      path.dirname(fs.realpathSync("node_modules/@biomejs/biome/package.json")),
      "../cli-linux-x64/biome",
    ),
  ]) {
    result[fs.realpathSync(file)] = entry(file);
  }
  return result;
}
export function scope() {
  const sourceBytes = fs.readFileSync(`${own}/source155.json`);
  if (
    sha(sourceBytes) !==
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
  )
    throw Error("E_SOURCE155_MAP");
  const source = JSON.parse(sourceBytes);
  if (Object.keys(source).length !== 155) throw Error("E_SOURCE155_SET");
  for (const [file, expected] of Object.entries(source)) {
    const actual = entry(file);
    if (
      actual.sha256 !== expected.sha256 ||
      (actual.mode & 0o111) !== (parseInt(expected.mode, 8) & 0o111)
    )
      throw Error(`E_SOURCE155 ${file}`);
  }
  const before = JSON.parse(fs.readFileSync(`${own}/before.json`));
  const now = inventory();
  const delta = [],
    metadata = [];
  for (const file of new Set([
    ...Object.keys(before.files),
    ...Object.keys(now),
  ])) {
    if (JSON.stringify(before.files[file]) === JSON.stringify(now[file]))
      continue;
    if (
      leased.includes(file) ||
      file === "tests/consumers/wp13/lib/storage-roots.mjs"
    )
      delta.push(file);
    else if (/^(?:TASKS|REVIEW|README)\.md$|^docs\//.test(file))
      metadata.push(file);
    else throw Error(`E_SCOPE ${file}`);
  }
  const pinDrift = [];
  for (const [file, expected] of Object.entries(before.pins)) {
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected)) {
      if (!leased.includes(path.relative(process.cwd(), file)))
        throw Error(`E_PIN ${file}`);
      pinDrift.push(file);
    }
  }
  return {
    oldFiles: Object.keys(before.files).length,
    canonical155: Object.keys(source).length,
    delta,
    metadata,
    pinDrift,
  };
}
function main(action) {
  if (action === "before") {
    const free = capacity(),
      files = inventory(),
      installed = pins();
    const source = fs.readFileSync(
      "tests/consumers/wp13/evidence/source155.json",
    );
    if (
      sha(source) !==
      "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
    )
      throw Error("E_SOURCE155");
    for (const file of leased) {
      capacity();
      const name = file.replaceAll("/", "__");
      fs.writeFileSync(`${own}/preimage-${name}`, fs.readFileSync(file), {
        flag: "wx",
        mode: files[file].mode,
      });
    }
    save("before.json", {
      capturedAt: new Date().toISOString(),
      suppliedBase: "68bd197 (main supplied, no Git operation)",
      free,
      files,
      pins: installed,
    });
    fs.writeFileSync(`${own}/source155.json`, source, { flag: "wx" });
    console.log(
      JSON.stringify({
        free,
        oldFiles: Object.keys(files).length,
        pins: Object.keys(installed).length,
      }),
    );
  } else if (action === "scope") console.log(JSON.stringify(scope()));
  else throw Error("Explicit evidence action required");
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main(process.argv[2]);
