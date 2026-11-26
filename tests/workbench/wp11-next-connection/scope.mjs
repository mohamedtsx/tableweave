import fs from "node:fs";
import { createHash } from "node:crypto";

export const own = "tests/workbench/wp11-next-connection";
export const target = "apps/example-next/lib/client-owner.ts";
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const entry = (file) => ({
  mode: fs.statSync(file).mode & 0o777,
  sha256: hash(fs.readFileSync(file)),
});
const original = "tests/workbench/wp11-next";
function walk(directory = "", result = {}) {
  for (const item of fs.readdirSync(directory || ".", {
    withFileTypes: true,
  })) {
    const file = directory ? `${directory}/${item.name}` : item.name;
    if ([".git", "node_modules", ".repo"].includes(item.name) || file === own)
      continue;
    if (item.isDirectory()) walk(file, result);
    else if (item.isFile()) result[file] = entry(file);
  }
  return result;
}
function drift(map) {
  return Object.entries(map)
    .filter(
      ([file, expected]) =>
        !fs.existsSync(file) ||
        JSON.stringify(entry(file)) !== JSON.stringify(expected),
    )
    .map(([file]) => file);
}
export function check(scope = "after") {
  const before = JSON.parse(fs.readFileSync(`${own}/before.json`));
  const changed = drift(before);
  if (
    changed.some((file) => file !== target) ||
    entry(target).mode !== before[target].mode
  )
    throw Error(`Unleased drift: ${changed.join(", ")}`);
  const added = Object.keys(walk()).filter((file) => !(file in before));
  if (added.length) throw Error(`Unleased additions: ${added.join(", ")}`);
  const oldSeal = JSON.parse(
    fs.readFileSync(`${original}/handoff-hashes.json`),
  );
  const sealDrift = drift(oldSeal);
  if (
    scope === "before"
      ? sealDrift.length !== 0
      : sealDrift.length !== 1 || sealDrift[0] !== target
  )
    throw Error(`Original seal drift: ${sealDrift.join(", ")}`);
  const oldPins = JSON.parse(
    fs.readFileSync(`${original}/.artifacts/positive-inputs-001/inputs.json`),
  );
  const pinDrift = drift(oldPins);
  if (
    scope === "before"
      ? pinDrift.length !== 0
      : pinDrift.length !== 1 || pinDrift[0] !== target
  )
    throw Error(`Original pinned drift: ${pinDrift.join(", ")}`);
  const source = JSON.parse(
    fs.readFileSync(`${original}/source155-before.json`),
  );
  for (const [file, value] of Object.entries(source)) {
    if (
      entry(file).sha256 !== value.sha256 ||
      (entry(file).mode & 0o111) !== (parseInt(value.mode, 8) & 0o111)
    )
      throw Error(`Source155 drift ${file}`);
  }
  const protectedOld = JSON.parse(fs.readFileSync(`${original}/before.json`));
  if (drift(protectedOld).length) throw Error("Original1692 drift");
  return {
    regularInputs: Object.keys(before).length,
    originalProtected: Object.keys(protectedOld).length,
    source155: Object.keys(source).length,
    originalSeal: {
      unchanged: Object.keys(oldSeal).length - sealDrift.length,
      drift: sealDrift,
    },
    originalPins: {
      unchanged: Object.keys(oldPins).length - pinDrift.length,
      drift: pinDrift,
    },
    changed,
  };
}
if (process.argv[2] === "capture") {
  if (fs.existsSync(`${own}/before.json`))
    throw Error("Immutable before map exists");
  const bytes = fs.readFileSync(`${original}/handoff-hashes.json`);
  if (
    hash(bytes) !==
    "391ded6f0de58c5e17cdead4c83bfc8cdef61f4cd70fdd7b26f95b6786ccb810"
  )
    throw Error("Original seal identity differs");
  if (
    hash(fs.readFileSync(`${original}/source155-before.json`)) !==
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
  )
    throw Error("Source155 map differs");
  fs.mkdirSync(`${own}/receipts`, { recursive: true });
  fs.copyFileSync(
    target,
    `${own}/receipts/client-owner.before.txt`,
    fs.constants.COPYFILE_EXCL,
  );
  fs.copyFileSync(
    "/tmp/opencode/tableweave-wp11-workbench/docs/planning/wp-11-next-install-plan.md",
    `${own}/receipts/selected-plan.md`,
    fs.constants.COPYFILE_EXCL,
  );
  fs.writeFileSync(
    `${own}/before.json`,
    `${JSON.stringify(walk(), null, 2)}\n`,
    { flag: "wx" },
  );
  const report = check("before");
  fs.writeFileSync(
    `${own}/receipts/before-report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(JSON.stringify(report));
} else if (process.argv[2] === "check") {
  console.log(JSON.stringify(check()));
}
