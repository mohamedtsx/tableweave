import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const own = "tests/consumers/wp13-runtime";
export const old = "tests/consumers/wp13";
export const changed = [
  "families/vite.mjs",
  "families/next.mjs",
  "families/start.mjs",
  "lib/generation.mjs",
  "lib/installer.mjs",
].map((file) => `${old}/${file}`);
export const added = [
  "lib/runtime.mjs",
  "fixtures/family-runtime.mjs",
  "fixtures/start-host.mjs",
].map((file) => `${old}/${file}`);
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const entry = (file) => {
  const s = fs.statSync(file);
  return {
    mode: s.mode & 0o777,
    size: s.size,
    sha256: hash(fs.readFileSync(file)),
  };
};
export function capacity() {
  const s = fs.statfsSync(".");
  const available = s.bavail * s.bsize;
  if (available < 134217728) throw Error("E_CAPACITY_NO_CLEANUP_AUTHORITY");
  return available;
}
export function output(file, value) {
  capacity();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, { flag: "wx" });
}
function inventory(directory = "", files = {}) {
  for (const item of fs.readdirSync(directory || ".", {
    withFileTypes: true,
  })) {
    const file = directory ? `${directory}/${item.name}` : item.name;
    if (
      [".git", ".repo", "node_modules"].includes(item.name) ||
      file === own ||
      /^\.env(?:\.|$)|\.(?:pem|key)$/.test(item.name)
    )
      continue;
    if (item.isDirectory()) inventory(file, files);
    else if (item.isFile()) files[file] = entry(file);
  }
  return files;
}
const metadata = (file) => /^(?:TASKS|REVIEW)\.md$|^docs\//.test(file);
export function verify() {
  const baseline = JSON.parse(fs.readFileSync(`${own}/evidence/before.json`));
  const current = inventory(),
    drift = [],
    main = [];
  for (const file of new Set([
    ...Object.keys(current),
    ...Object.keys(baseline.files),
  ])) {
    if (JSON.stringify(current[file]) === JSON.stringify(baseline.files[file]))
      continue;
    if (changed.includes(file) || added.includes(file)) continue;
    (metadata(file) ? main : drift).push(file);
  }
  if (drift.length) throw Error(`E_SCOPE:${drift.join(",")}`);
  for (const [file, value] of Object.entries(baseline.installed))
    if (JSON.stringify(entry(file)) !== JSON.stringify(value))
      throw Error(`E_INSTALLED:${file}`);
  const original = JSON.parse(
    fs.readFileSync(`${old}/evidence/source-seal-001/seal.json`),
  );
  for (const [file, value] of Object.entries(original.files))
    if (
      !changed.includes(file) &&
      JSON.stringify(entry(file)) !== JSON.stringify(value)
    )
      throw Error(`E_ORIGINAL_SEAL_INPUT:${file}`);
  const historical = JSON.parse(fs.readFileSync(`${old}/evidence/before.json`));
  const historicalMain = [];
  for (const [file, value] of Object.entries(historical))
    if (JSON.stringify(entry(file)) !== JSON.stringify(value)) {
      if (metadata(file)) historicalMain.push(file);
      else throw Error(`E_ORIGINAL_2286:${file}`);
    }
  const initial = JSON.parse(
    fs.readFileSync(`${old}/evidence/installed-before.json`),
  );
  for (const [file, value] of Object.entries(initial))
    if (JSON.stringify(entry(file)) !== JSON.stringify(value))
      throw Error(`E_ORIGINAL_14:${file}`);
  const originalPin = JSON.parse(
    fs.readFileSync(`${old}/evidence/positive-inputs-001/inputs.json`),
  );
  for (const [file, value] of Object.entries(originalPin.files))
    if (
      !changed.map((file) => path.resolve(file)).includes(file) &&
      JSON.stringify(entry(file)) !== JSON.stringify(value)
    )
      throw Error(`E_ORIGINAL_PIN_NONLEASE_DRIFT:${file}`);
  if (
    hash(fs.readFileSync(`${old}/evidence/source155.json`)) !==
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
  )
    throw Error("E_CANONICAL155_MAP_DRIFT");
  return {
    oldRegularInputs: Object.keys(baseline.files).length,
    originalSealInputs: 137,
    originalSealSHA256: baseline.originalSealSHA256,
    originalPinSHA256: baseline.originalPinSHA256,
    originalPinnedInputs: 1179,
    originalProgramFiles: 1128,
    originalOldRegularInputs: Object.keys(historical).length,
    originalInitialInstalledInputs: Object.keys(initial).length,
    canonicalLibraryInputs: 155,
    historicalMainMetadataDrift: historicalMain,
    allowedBodyDrifts: changed.filter(
      (file) =>
        JSON.stringify(entry(file)) !== JSON.stringify(baseline.files[file]),
    ),
    mainMetadataDrift: main,
    installedInputs: Object.keys(baseline.installed).length,
  };
}
function capture() {
  capacity();
  if (fs.existsSync(`${own}/evidence/before.json`))
    throw Error("Immutable follow-up baseline exists");
  const sealBytes = fs.readFileSync(
      `${old}/evidence/source-seal-001/seal.json`,
    ),
    pinBytes = fs.readFileSync(
      `${old}/evidence/positive-inputs-001/inputs.json`,
    );
  if (
    hash(sealBytes) !==
      "ca6706bd83f1041fcf6e3115f411cab4e5dccb993e2c4f87651b0a222401ca7f" ||
    hash(pinBytes) !==
      "ed3016137b3c24c26dc21e350738c87b85893da6613e68fac8cbc888af909498"
  )
    throw Error("E_ORIGINAL_IDENTITIES");
  const seal = JSON.parse(sealBytes),
    pin = JSON.parse(pinBytes);
  if (
    Object.keys(seal.files).length !== 137 ||
    Object.keys(pin.files).length !== 1179 ||
    pin.compilerFiles !== 1128
  )
    throw Error("E_ORIGINAL_COUNTS");
  for (const [file, value] of Object.entries({ ...seal.files, ...pin.files }))
    if (JSON.stringify(entry(file)) !== JSON.stringify(value))
      throw Error(`E_PREEDIT_DRIFT:${file}`);
  const installed = Object.fromEntries(
    Object.entries(pin.files).filter(
      ([file]) => file.includes("/node_modules/") || file === process.execPath,
    ),
  );
  for (const file of changed)
    output(
      `${own}/evidence/preimages/${file.slice(old.length + 1)}.txt`,
      fs.readFileSync(file),
    );
  output(
    `${own}/evidence/before.json`,
    `${JSON.stringify({ suppliedRevision: "10f6a8a", files: inventory(), installed, originalSealSHA256: hash(sealBytes), originalPinSHA256: hash(pinBytes), versions: pin.versions, capacityBytes: capacity() }, null, 2)}\n`,
  );
  console.log(JSON.stringify(verify()));
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv[2] === "capture") capture();
  else if (process.argv[2] === "verify") console.log(JSON.stringify(verify()));
  else throw Error("Explicit evidence action required");
}
