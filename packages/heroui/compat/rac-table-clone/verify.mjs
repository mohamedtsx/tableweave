// Explicit, read-only candidate-profile CLI. Never imports vendor runtime code.
import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const NAME = "react-aria-components";
const VERSION = "1.22.1";
const INTEGRITY =
  "sha512-UTHaYHOaM71bOCjGPF50DcLywlrwAodE63IP64LB4kO+OizatQEL8TesVEOM8+TkBeSgHoflJ45388IlJfa7aw==";
const TARBALL =
  "https://registry.npmjs.org/react-aria-components/-/react-aria-components-1.22.1.tgz";
const ORIGINAL = [
  [
    "dist/private/Table.js",
    "legacy-esm",
    "93ef6ab34eb5da85006dc7615e76d2e52eb506114cb0a8a71d0a0f13f7f5152d",
  ],
  [
    "dist/private/Table.mjs",
    "esm",
    "aa49fcfc87cc494b97c6e77eb79e79b9dec6d13de9a0090ae249ee7683d32623",
  ],
  [
    "dist/private/Table.cjs",
    "commonjs",
    "ba44d79b191776374c4fdf998a38e8af4dd323665f3191627dca37f7400aa4cf",
  ],
];
const ASSETS = [
  "runtime.patch",
  "verify.mjs",
  "README.md",
  "NOTICE-RAC",
  "LICENSE-APACHE-2.0",
];
const SHA256 = /^[a-f0-9]{64}$/;
class ProfileFailure extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
const fail = (code) => {
  throw new ProfileFailure(code);
};
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const record = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
function keys(value, expected) {
  return (
    record(value) &&
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}
function within(parent, child) {
  const path = relative(parent, child);
  return (
    path !== "" &&
    !isAbsolute(path) &&
    path !== ".." &&
    !path.startsWith(`..${sep}`)
  );
}
function readLocal(base, name, code) {
  try {
    const path = realpathSync(join(base, name));
    if (!within(base, path) || !statSync(path).isFile()) fail(code);
    return { path, bytes: readFileSync(path) };
  } catch {
    return fail(code);
  }
}
function json(bytes, code) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    return fail(code);
  }
}

function verify(projectArgument) {
  const assetsRoot = realpathSync(dirname(fileURLToPath(import.meta.url)));
  const descriptor = json(
    readLocal(assetsRoot, "profile.json", "E_DESCRIPTOR").bytes,
    "E_DESCRIPTOR",
  );
  if (
    !keys(descriptor, [
      "schemaVersion",
      "id",
      "status",
      "layout",
      "sourceMaps",
      "upstream",
      "assets",
      "files",
    ])
  )
    fail("E_DESCRIPTOR");
  const {
    schemaVersion,
    id,
    status,
    layout,
    sourceMaps,
    upstream,
    assets,
    files,
  } = descriptor;
  if (
    schemaVersion !== 1 ||
    id !== "rac-1.22.1-table-clone-v1" ||
    status !== "private-unlicensed-candidate" ||
    layout !== "isolated-pnpm-project" ||
    sourceMaps !==
      "changed-file-terminal-annotations-removed; maps-not-regenerated"
  )
    fail("E_DESCRIPTOR");
  if (
    !keys(upstream, ["name", "version", "tarball", "integrity", "shasum"]) ||
    upstream.name !== NAME ||
    upstream.version !== VERSION ||
    upstream.tarball !== TARBALL ||
    upstream.integrity !== INTEGRITY ||
    upstream.shasum !== "abc446c527e1804673ac84d43a6909828d1e1724"
  )
    fail("E_DESCRIPTOR");
  if (
    !keys(assets, ASSETS) ||
    !Array.isArray(files) ||
    files.length !== ORIGINAL.length
  )
    fail("E_DESCRIPTOR");
  // JSON data only, captured once. No callback ports, enabled flag or property merging.
  const targets = files.map((entry, index) => {
    const [path, format, before] = ORIGINAL[index];
    if (!keys(entry, ["path", "format", "beforeSha256", "afterSha256"]))
      fail("E_DESCRIPTOR");
    const {
      path: suppliedPath,
      format: suppliedFormat,
      beforeSha256,
      afterSha256,
    } = entry;
    if (
      suppliedPath !== path ||
      suppliedFormat !== format ||
      beforeSha256 !== before ||
      typeof afterSha256 !== "string" ||
      !SHA256.test(afterSha256) ||
      afterSha256 === before
    )
      fail("E_DESCRIPTOR");
    return { path, afterSha256 };
  });
  for (const name of ASSETS) {
    const expected = assets[name];
    if (typeof expected !== "string" || !SHA256.test(expected))
      fail("E_DESCRIPTOR");
    if (hash(readLocal(assetsRoot, name, "E_ASSET").bytes) !== expected)
      fail("E_ASSET");
  }

  let projectRoot;
  try {
    projectRoot = realpathSync(resolve(projectArgument));
  } catch {
    fail("E_LAYOUT");
  }
  const projectManifest = readLocal(projectRoot, "package.json", "E_LAYOUT");
  if (projectManifest.path !== join(projectRoot, "package.json"))
    fail("E_LAYOUT");
  const project = json(projectManifest.bytes, "E_LAYOUT");
  if (!record(project)) fail("E_LAYOUT");
  const dependencies = record(project.dependencies) ? project.dependencies : {};
  const devDependencies = record(project.devDependencies)
    ? project.devDependencies
    : {};
  const specs = [dependencies[NAME], devDependencies[NAME]].filter(
    (value) => value !== undefined,
  );
  if (specs.length === 0 || specs.some((value) => value !== VERSION))
    fail("E_LAYOUT");
  const modules = join(projectRoot, "node_modules");
  try {
    if (realpathSync(modules) !== modules || !statSync(modules).isDirectory())
      fail("E_LAYOUT");
  } catch {
    fail("E_LAYOUT");
  }
  const localManifest = readLocal(modules, `${NAME}/package.json`, "E_LAYOUT");
  const packageRoot = dirname(localManifest.path);
  const parts = relative(modules, packageRoot).split(sep);
  if (
    parts.length !== 4 ||
    parts[0] !== ".pnpm" ||
    !parts[1].startsWith(`${NAME}@${VERSION}`) ||
    parts[2] !== "node_modules" ||
    parts[3] !== NAME
  )
    fail("E_LAYOUT");
  // Resolve from THIS manifest, then require equality with its direct, local link.
  // .resolve reads package metadata; no require()/import() of vendor code occurs.
  try {
    const requester = createRequire(projectManifest.path);
    if (
      realpathSync(requester.resolve(`${NAME}/package.json`)) !==
      localManifest.path
    )
      fail("E_LAYOUT");
  } catch {
    fail("E_LAYOUT");
  }
  const vendor = json(localManifest.bytes, "E_VENDOR");
  if (!record(vendor) || vendor.name !== NAME || vendor.version !== VERSION)
    fail("E_VENDOR");
  for (const { path, afterSha256 } of targets) {
    if (hash(readLocal(packageRoot, path, "E_VENDOR").bytes) !== afterSha256)
      fail("E_VENDOR");
  }
}

try {
  if (
    process.argv.length !== 3 ||
    typeof process.argv[2] !== "string" ||
    process.argv[2].length === 0
  )
    fail("E_ARGUMENT");
  verify(process.argv[2]);
  process.stdout.write("Tableweave RAC clone candidate profile verified.\n");
} catch (error) {
  const code = error instanceof ProfileFailure ? error.code : "E_VERIFY";
  process.stderr.write(
    `Tableweave RAC clone candidate profile verification failed: ${code}.\n`,
  );
  process.exitCode = 1;
}
