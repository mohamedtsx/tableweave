import fs from "node:fs";
import {
  own,
  changed,
  added,
  entry,
  hash,
  output,
  verify,
  capacity,
} from "./scope.mjs";
const [action, label] = process.argv.slice(2);
if (
  !["capture", "verify"].includes(action) ||
  !/^seal-[0-9]+$/.test(label ?? "")
)
  throw Error("Explicit fresh follow-up seal required");
const root = `${own}/evidence/${label}`;
function currentFiles() {
  const files = {};
  for (const file of [...changed, ...added]) files[file] = entry(file);
  function visit(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = `${directory}/${item.name}`;
      if (file === root) continue;
      if (item.isDirectory()) visit(file);
      else if (item.isFile()) files[file] = entry(file);
      else throw Error("E_SEAL_LINK");
    }
  }
  visit(own);
  return files;
}
if (action === "capture") {
  capacity();
  verify();
  if (fs.existsSync(root)) throw Error("Immutable follow-up seal exists");
  output(
    `${root}/seal.json`,
    `${JSON.stringify({ status: "provisional-runtime-source-light-not-executed-or-accepted", originalSealUnmodified: "ca6706bd83f1041fcf6e3115f411cab4e5dccb993e2c4f87651b0a222401ca7f", originalPinUnmodified: "ed3016137b3c24c26dc21e350738c87b85893da6613e68fac8cbc888af909498", files: currentFiles() }, null, 2)}\n`,
  );
}
const seal = JSON.parse(fs.readFileSync(`${root}/seal.json`)),
  actual = currentFiles();
if (
  JSON.stringify(Object.keys(actual).sort()) !==
  JSON.stringify(Object.keys(seal.files).sort())
)
  throw Error("E_SEAL_SET_DRIFT");
for (const [file, value] of Object.entries(seal.files))
  if (JSON.stringify(entry(file)) !== JSON.stringify(value))
    throw Error(`E_SEAL_DRIFT:${file}`);
console.log(
  JSON.stringify({
    inputs: Object.keys(seal.files).length,
    sha256: hash(fs.readFileSync(`${root}/seal.json`)),
    scope: verify(),
    status: seal.status,
  }),
);
