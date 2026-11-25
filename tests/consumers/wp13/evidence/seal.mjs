import fs from "node:fs";
import { own, entry, sha, capacity, verifyScope } from "./scope.mjs";

const [action, label] = process.argv.slice(2);
if (
  !["capture", "verify"].includes(action) ||
  !/^source-seal-\d+$/.test(label ?? "")
)
  throw Error("Explicit fresh seal label required");
const root = `${own}/evidence/${label}`;
if (action === "capture") {
  capacity();
  verifyScope();
  if (fs.existsSync(root)) throw Error("Immutable seal exists");
  const files = {};
  function visit(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (item.isDirectory()) visit(file);
      else if (item.isFile()) files[file] = entry(file);
      else throw Error("Nonregular owned artifact");
    }
  }
  visit(own);
  capacity();
  fs.mkdirSync(root);
  fs.writeFileSync(
    `${root}/seal.json`,
    `${JSON.stringify({ status: "provisional-source-light-handoff-not-acceptance", files }, null, 2)}\n`,
    { flag: "wx" },
  );
}
const seal = JSON.parse(fs.readFileSync(`${root}/seal.json`));
for (const [file, value] of Object.entries(seal.files))
  if (JSON.stringify(entry(file)) !== JSON.stringify(value))
    throw Error(`Seal drift: ${file}`);
console.log(
  JSON.stringify({
    inputs: Object.keys(seal.files).length,
    sha256: sha(fs.readFileSync(`${root}/seal.json`)),
    scope: verifyScope(),
    status: seal.status,
  }),
);
