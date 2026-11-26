import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { own, rootDigests } from "./public-roots.mjs";

const entries = rootDigests();
const text = `${JSON.stringify(entries, null, 2)}\n`;
const aggregate = createHash("sha256").update(text).digest("hex");
mkdirSync(join(own, ".artifacts"), { recursive: true });
if (process.argv.includes("--before")) {
  writeFileSync(join(own, ".artifacts/roots-before.json"), text);
  console.log(
    `Frozen public roots: ${Object.keys(entries).length} files, ${aggregate}`,
  );
} else {
  const before = readFileSync(
    join(own, ".artifacts/roots-before.json"),
    "utf8",
  );
  writeFileSync(join(own, ".artifacts/roots-after.json"), text);
  if (before !== text)
    throw new Error(
      "Public runtime/declaration/CSS outputs changed during the owned run",
    );
  console.log(
    `Public roots unchanged: ${Object.keys(entries).length} files, ${aggregate}`,
  );
}
