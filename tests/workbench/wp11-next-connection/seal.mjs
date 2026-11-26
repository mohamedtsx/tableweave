import fs from "node:fs";
import { own, target, hash, entry, check } from "./scope.mjs";
const file = `${own}/handoff-hashes.json`;
if (process.argv[2] === "capture") {
  if (fs.existsSync(file)) throw Error("Immutable correction seal exists");
  const report = check();
  fs.writeFileSync(
    `${own}/.artifacts/final-scope.json`,
    `${JSON.stringify(report, null, 2)}\n`,
    { flag: "wx" },
  );
  const entries = { [target]: entry(target) };
  function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) walk(file);
      else if (item.isFile()) entries[file] = entry(file);
    }
  }
  walk(own);
  const bytes = `${JSON.stringify(Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;
  fs.writeFileSync(file, bytes, { flag: "wx" });
  console.log(
    JSON.stringify({
      inputs: Object.keys(entries).length,
      sha256: hash(bytes),
      correctedTarget: entries[target],
      originalSeal: "Unmodified; exactly one disclosed body drift",
      runtime: "UNRUN",
    }),
  );
} else if (process.argv[2] === "verify") {
  check();
  const bytes = fs.readFileSync(file),
    entries = JSON.parse(bytes);
  for (const [file, expected] of Object.entries(entries))
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
      throw Error(`Correction seal drift ${file}`);
  console.log(
    `Stable ${Object.keys(entries).length} correction inputs; seal SHA256 ${hash(bytes)}. Original seal/map remain unchanged, not re-signed.`,
  );
} else throw Error("Explicit seal action required");
