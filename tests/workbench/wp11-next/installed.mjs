import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { hash, app } from "./scope.mjs";
const own = "tests/workbench/wp11-next",
  attempt = process.argv[2];
if (!/^installed-\d+$/.test(attempt ?? ""))
  throw Error("Unique installed-byte attempt required");
const directory = `${own}/.artifacts/${attempt}`;
if (fs.existsSync(directory)) throw Error("Keep prior receipt");
fs.mkdirSync(directory, { recursive: true });
const expected = JSON.parse(
  fs.readFileSync(`${own}/receipts/installed-inspection.json`),
);
const record = {};
for (const name of [
  "next",
  "@tailwindcss/postcss",
  "react",
  "react-dom",
  "@heroui/react",
  "@tableweave/react",
]) {
  const file = `${app}/node_modules/${name}/package.json`,
    bytes = fs.readFileSync(file),
    value = JSON.parse(bytes);
  if (
    value.version !== expected[name].version ||
    value.license !== expected[name].license ||
    hash(bytes) !== expected[name].manifestSHA256
  )
    throw Error(`Installed manifest drift ${name}`);
  record[name] = {
    version: value.version,
    license: value.license,
    sha256: hash(bytes),
    file,
    mode: fs.statSync(file).mode & 0o777,
  };
}
for (const name of [
  "next/index.d.ts",
  "next/types.d.ts",
  "@tailwindcss/postcss/dist/index.d.mts",
]) {
  const file = `${app}/node_modules/${name}`,
    bytes = fs.readFileSync(file);
  if (
    hash(bytes) !== expected[name].sha256 ||
    bytes.length !== expected[name].bytes
  )
    throw Error(`Installed declaration drift ${name}`);
  record[name] = {
    file,
    sha256: hash(bytes),
    bytes: bytes.length,
    mode: fs.statSync(file).mode & 0o777,
  };
}
for (const [name, version] of [
  ["next", "8.5.23"],
  ["@tailwindcss/postcss", "8.5.33"],
]) {
  // Resolve package.json only; do not import or execute the PostCSS processor.
  const require = createRequire(
    fs.realpathSync(path.resolve(app, "node_modules", name, "package.json")),
  );
  const file = require.resolve("postcss/package.json"),
    bytes = fs.readFileSync(file),
    value = JSON.parse(bytes);
  if (value.version !== version) throw Error(`PostCSS closure drift ${name}`);
  record[`${name}:postcss`] = {
    file,
    version: value.version,
    sha256: hash(bytes),
    license: value.license,
  };
}
const review = JSON.parse(fs.readFileSync(`${own}/receipts/lock-review.json`));
const lock = fs.readFileSync("pnpm-lock.yaml", "utf8"),
  blocks = lock.slice(
    lock.indexOf("\npackages:\n"),
    lock.indexOf("\nsnapshots:\n"),
  );
if (
  hash(Buffer.from(lock)) !== review.lockAfterSHA256 ||
  review.summary.importers.preserved !== 5 ||
  review.summary.packages.preserved !== 468 ||
  review.summary.snapshots.preserved !== 468 ||
  review.summary.packages.added.length !== 44
)
  throw Error("Main lock-review identity differs");
const entries = [...blocks.matchAll(/^ {2}(.+):\n/gm)];
const closure = Object.fromEntries(
  review.summary.packages.added.map((name) => {
    const index = entries.findIndex((match) => match[1] === name);
    if (index < 0) throw Error(`Missing selected lock block ${name}`);
    const start = entries[index].index,
      end = entries[index + 1]?.index ?? blocks.length,
      body = blocks.slice(start, end);
    const integrity = body.match(/integrity: ([^},\s]+)/)?.[1];
    if (!integrity?.startsWith("sha512-"))
      throw Error(`Missing locked integrity ${name}`);
    return [name, { integrity, sha256: hash(Buffer.from(body)), block: body }];
  }),
);
fs.writeFileSync(
  `${directory}/installed.json`,
  `${JSON.stringify(record, null, 2)}\n`,
  { flag: "wx" },
);
fs.writeFileSync(
  `${directory}/new-closure.json`,
  `${JSON.stringify(closure, null, 2)}\n`,
  { flag: "wx" },
);
console.log(
  "Exact selected manifests/licenses/type-entry bytes and separate PostCSS closures match;44 new locked package blocks/SRIs recorded against main's complete review. Native/platform bytes, tarball signatures, framework modules and runtime behavior NOT executed/verified.",
);
