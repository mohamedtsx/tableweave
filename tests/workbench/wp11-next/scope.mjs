import fs from "node:fs";
import { createHash } from "node:crypto";
const own = "tests/workbench/wp11-next";
export const app = "apps/example-next";
export const allowed = [
  "next.config.mjs",
  "postcss.config.mjs",
  "tsconfig.json",
  "tsconfig.light.json",
  "next-env.d.ts",
  "styles.d.ts",
  ".gitignore",
  "README.md",
  "app/layout.tsx",
  "app/page.tsx",
  "app/ClientDataTableBoundary.tsx",
  "app/globals.css",
  "app/headless/route.ts",
  "lib/payload.ts",
  "lib/server-contract.ts",
  "lib/client-owner.ts",
].map((file) => `${app}/${file}`);
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const entry = (file) => ({
  mode: fs.statSync(file).mode & 0o777,
  sha256: hash(fs.readFileSync(file)),
});
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
if (process.argv[2] === "capture") {
  if (fs.existsSync(`${own}/before.json`))
    throw Error("Immutable before map already exists");
  const bytes = fs.readFileSync(
    "/tmp/opencode/wp10-move-reason-integrated-source155.json",
  );
  if (
    hash(bytes) !==
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
  )
    throw Error("Wrong source155 identity");
  const source = JSON.parse(bytes);
  for (const [file, value] of Object.entries(source))
    if (
      entry(file).sha256 !== value.sha256 ||
      (entry(file).mode & 0o111) !== (parseInt(value.mode, 8) & 0o111)
    )
      throw Error(`Source mismatch ${file}`);
  if (
    entry(`${app}/package.json`).sha256 !==
      "55ed9a4ee4a560846548a94c9ef223c01627ac3ad649f338c0b9f19d5224ce42" ||
    entry("pnpm-lock.yaml").sha256 !==
      "6cc5f56f8377ce15d85576ca2d2f9b487925cf423899002dbff51db05ef1c688"
  )
    throw Error("Wrong manifest/lock materialization");
  for (const file of allowed)
    if (fs.existsSync(file))
      throw Error(`New-only path already exists ${file}`);
  fs.mkdirSync(`${own}/receipts`, { recursive: true });
  fs.writeFileSync(`${own}/source155-before.json`, bytes, { flag: "wx" });
  for (const [name, file] of Object.entries({
    "install-plan.md":
      "/tmp/opencode/tableweave-wp11-workbench/docs/planning/wp-11-next-install-plan.md",
    "lock-review.json":
      "/tmp/opencode/wp11-next-additive-lock-review-complete.json",
    "installed-inspection.json":
      "/tmp/opencode/wp11-next-installed-inspection.json",
    "frozen-install.log": "/tmp/opencode/wp11-next-frozen-install.log",
  }))
    fs.copyFileSync(file, `${own}/receipts/${name}`);
  const before = walk();
  fs.writeFileSync(
    `${own}/before.json`,
    `${JSON.stringify(before, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    `Captured actual${Object.keys(before).length} old regular inputs and modes,155 source bytes, all present Stage A artifacts and main-owned manifest/lock before edits`,
  );
} else {
  const before = JSON.parse(fs.readFileSync(`${own}/before.json`)),
    now = walk(),
    drift = [];
  for (const [file, expected] of Object.entries(before))
    if (JSON.stringify(now[file]) !== JSON.stringify(expected))
      drift.push(file);
  for (const file of Object.keys(now))
    if (!(file in before) && !allowed.includes(file)) drift.push(`NEW ${file}`);
  if (drift.length) throw Error(`Frozen inputs changed: ${drift.join(", ")}`);
  console.log(
    `Preserved all${Object.keys(before).length} old regular hashes/modes, all155 sources, shared Stage A and frozen manifests/profiles; only new exact app paths and own fixtures allowed`,
  );
}
