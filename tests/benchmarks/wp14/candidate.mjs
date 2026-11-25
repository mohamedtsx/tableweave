/** FINAL-only production helpers. Importing performs NO IO/argv processing. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { packageArchive } from "../../consumers/wp13/lib/archive.mjs";
export const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function demand(value, code) {
  if (!value) throw new Error(code);
}
export function object(value) {
  demand(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
    "E_OBJECT",
  );
  for (const key of Reflect.ownKeys(value))
    demand(
      typeof key === "string" &&
        !["__proto__", "constructor", "prototype"].includes(key) &&
        Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value"),
      "E_OBJECT_KEY",
    );
  return value;
}
export function relative(value) {
  demand(
    typeof value === "string" &&
      value.length > 0 &&
      !path.isAbsolute(value) &&
      !value.includes("\\") &&
      value
        .split("/")
        .every(
          (part) =>
            part &&
            part !== "." &&
            part !== ".." &&
            part !== ".repo" &&
            !part.startsWith(".env"),
        ),
    "E_PATH",
  );
  return value;
}
export function directory(value) {
  demand(
    path.isAbsolute(value) &&
      path.resolve(value) === value &&
      fs.realpathSync(value) === value &&
      fs.lstatSync(value).isDirectory(),
    "E_CANONICAL_ROOT",
  );
  let next = value;
  while (next !== path.dirname(next)) {
    demand(!fs.lstatSync(next).isSymbolicLink(), "E_ROOT_LINK");
    next = path.dirname(next);
  }
  return value;
}
export function read(root, name) {
  directory(root);
  relative(name);
  const file = path.join(root, name);
  directory(path.dirname(file));
  const info = fs.lstatSync(file);
  demand(info.isFile() && !info.isSymbolicLink(), "E_REGULAR");
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const before = fs.fstatSync(fd);
    demand(
      before.ino === info.ino && before.dev === info.dev,
      "E_REPLACED_FILE",
    );
    const bytes = fs.readFileSync(fd),
      after = fs.fstatSync(fd);
    demand(
      before.size === bytes.length && before.mtimeMs === after.mtimeMs,
      "E_FILE_CHANGED",
    );
    return bytes;
  } finally {
    fs.closeSync(fd);
  }
}
export function json(root, file) {
  return object(JSON.parse(read(root, file).toString("utf8")));
}
export function record(root, file) {
  const bytes = read(root, file),
    info = fs.statSync(path.join(root, file));
  return { sha256: hash(bytes), size: bytes.length, mode: info.mode & 0o777 };
}
export function verifyMap(root, map) {
  object(map);
  demand(Object.keys(map).length > 0, "E_EMPTY_MAP");
  for (const [file, wanted] of Object.entries(map))
    demand(
      JSON.stringify(record(root, file)) ===
        JSON.stringify({
          sha256: wanted.sha256,
          size: wanted.size,
          mode: wanted.mode,
        }),
      "E_FROZEN_FILE_DRIFT",
    );
}
export function capacity(root) {
  const s = fs.statfsSync(root);
  demand(s.bavail * s.bsize >= 134217728, "E_CAPACITY_HOLD");
}
export function write(root, file, bytes) {
  directory(root);
  relative(file);
  capacity(root);
  const parent = path.dirname(path.join(root, file));
  if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
  directory(parent);
  fs.writeFileSync(path.join(root, file), bytes, { flag: "wx", mode: 0o600 });
}
export function put(root, file, value) {
  write(root, file, `${JSON.stringify(value, null, 2)}\n`);
}
function selected(ref) {
  object(ref);
  const root = directory(path.dirname(ref.path)),
    file = path.basename(ref.path),
    bytes = read(root, file);
  demand(hash(bytes) === ref.sha256, "E_SELECTION_HASH");
  return object(JSON.parse(bytes.toString("utf8")));
}
function inventory(root) {
  const files = {},
    links = {};
  function visit(prefix) {
    for (const item of fs.readdirSync(path.join(root, prefix), {
      withFileTypes: true,
    })) {
      const file = `${prefix}/${item.name}`,
        full = path.join(root, file);
      if (item.isSymbolicLink()) {
        const resolved = fs.realpathSync(full);
        demand(resolved.startsWith(`${root}/`), "E_INSTALLED_ESCAPE");
        links[file] = { target: fs.readlinkSync(full), resolved };
      } else if (item.isDirectory()) visit(file);
      else {
        demand(item.isFile(), "E_INSTALLED_SPECIAL");
        files[file] = record(root, file);
      }
    }
  }
  visit("node_modules");
  return { files, links };
}
function equivalent(a, b) {
  const sorted = (v) =>
    Array.isArray(v)
      ? v.map(sorted)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([key, value]) => [key, sorted(value)]),
          )
        : v;
  return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
}
export const RAC_FILES = Object.freeze(
  [
    {
      path: "dist/private/Table.js",
      format: "legacy-esm",
      beforeSha256:
        "93ef6ab34eb5da85006dc7615e76d2e52eb506114cb0a8a71d0a0f13f7f5152d",
      afterSha256:
        "4cbd2a4ba6e9a7e74082c497f3ec0c596c2048fb7d5f30c6e64176374091eacd",
    },
    {
      path: "dist/private/Table.mjs",
      format: "esm",
      beforeSha256:
        "aa49fcfc87cc494b97c6e77eb79e79b9dec6d13de9a0090ae249ee7683d32623",
      afterSha256:
        "22edf3fc5423744d2682beadddac018332431bb3e9ebb33c8335d12c776035b6",
    },
    {
      path: "dist/private/Table.cjs",
      format: "commonjs",
      beforeSha256:
        "ba44d79b191776374c4fdf998a38e8af4dd323665f3191627dca37f7400aa4cf",
      afterSha256:
        "dc263287e3d9b966416c47818f3adbb7d6d058ce24ffde6b90b183dacbb28ead",
    },
  ].map((file) => Object.freeze(file)),
);
export const RAC_COMPANIONS = Object.freeze({
  "runtime.patch":
    "f3073583972685a721995e0db935a5172cbbc777bcc679270a718a2f12736e35",
  "verify.mjs":
    "edb10823e1abc6801905641c8a90fce59a72f4eb5dc2fca0250899ccb556c95b",
  "README.md":
    "bd2c78e6ef2168f7f62c8f2a42cdb703a67a08107c89af1551a5a2da02dc8671",
  "NOTICE-RAC":
    "f8a0dd6c0c050362918b561b015b11e9d95412e655e5af263e5c88134d68dfdb",
  "LICENSE-APACHE-2.0":
    "7dfe6526888bac51759c99f9a51262ba2711a8c12a067f2181609dd9a4066b84",
});
const RAC_ASSETS = Object.freeze([
  "profile.json",
  ...Object.keys(RAC_COMPANIONS),
]);
const RAC_PREFIX = "patches/tableweave-rac-table-clone/";
export function exactKeys(value, required, code) {
  object(value);
  demand(equivalent(Object.keys(value).sort(), [...required].sort()), code);
}
export function validateRacDescriptor(profile) {
  object(profile);
  demand(
    profile.schemaVersion === 1 &&
      profile.id === "rac-1.22.1-table-clone-v1" &&
      profile.status === "private-unlicensed-candidate" &&
      profile.layout === "isolated-pnpm-project" &&
      profile.upstream?.name === "react-aria-components" &&
      profile.upstream.version === "1.22.1",
    "E_CANONICAL_RAC_PROFILE",
  );
  demand(
    equivalent(profile.files, RAC_FILES) &&
      equivalent(profile.assets, RAC_COMPANIONS),
    "E_CANONICAL_RAC_CLOSURE",
  );
}
export function packagedRac(members) {
  const prefix = "package/compat/rac-table-clone/";
  const names = [...members]
    .filter(
      ([file, member]) => file.startsWith(prefix) && member.type === "file",
    )
    .map(([file]) => file.slice(prefix.length));
  demand(
    equivalent(names.sort(), [...RAC_ASSETS].sort()),
    "E_PACKAGED_RAC_SIX_ASSETS",
  );
  const bytes = {};
  for (const name of RAC_ASSETS) {
    const member = members.get(`${prefix}${name}`);
    demand(
      member?.type === "file" && Buffer.isBuffer(member.bytes),
      "E_PACKAGED_RAC_ASSET",
    );
    bytes[name] = member.bytes;
  }
  const profile = object(JSON.parse(bytes["profile.json"].toString("utf8")));
  validateRacDescriptor(profile);
  for (const [name, expected] of Object.entries(RAC_COMPANIONS))
    demand(
      hash(bytes[name]) === expected && profile.assets[name] === expected,
      "E_PACKAGED_RAC_COMPANION_HASH",
    );
  return { profile, bytes };
}
/** Pure strict config check; no config application, environment inheritance or install. */
export function validateProfileConfig(
  profile,
  workspace,
  npmrc,
  expectedStore = null,
) {
  const ordinary = "packages: []\n";
  const rac = `${ordinary}patchedDependencies:\n  'react-aria-components@1.22.1': patches/tableweave-rac-table-clone/runtime.patch\n`;
  demand(
    ["ordinary", "rac-runtime"].includes(profile) &&
      workspace === (profile === "ordinary" ? ordinary : rac),
    "E_EXACT_PROFILE_REGISTRATION",
  );
  demand(
    typeof npmrc === "string" &&
      npmrc.endsWith("\n") &&
      !npmrc.includes("\r") &&
      !npmrc.includes("\0"),
    "E_NPMRC_SHAPE",
  );
  const entries = npmrc
    .slice(0, -1)
    .split("\n")
    .map((line) => {
      demand(/^[a-z][a-z-]*=[^\s$;#]+$/.test(line), "E_NPMRC_LINE");
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1)];
    });
  demand(
    new Set(entries.map(([key]) => key)).size === entries.length,
    "E_NPMRC_DUPLICATE",
  );
  const config = Object.fromEntries(entries),
    required = {
      registry: "https://registry.npmjs.org/",
      "save-exact": "true",
      "strict-peer-dependencies": "true",
      "auto-install-peers": "false",
      "engine-strict": "true",
      "package-manager-strict": "true",
      "ignore-scripts": "true",
      "ignore-pnpmfile": "true",
      "shared-workspace-lockfile": "false",
      "node-linker": "isolated",
      "package-import-method": "copy",
    };
  exactKeys(config, [...Object.keys(required), "store-dir"], "E_NPMRC_KEY_SET");
  for (const [key, value] of Object.entries(required))
    demand(config[key] === value, "E_NPMRC_VALUE");
  demand(
    path.isAbsolute(config["store-dir"]) &&
      path.resolve(config["store-dir"]) === config["store-dir"] &&
      !config["store-dir"].split("/").includes(".repo") &&
      (!expectedStore || config["store-dir"] === expectedStore),
    "E_NPMRC_STORE",
  );
  return Object.freeze(config);
}
export function requireIndependentFiles(before, after) {
  demand(
    before.nlink === 1 &&
      after.nlink === 1 &&
      !(before.dev === after.dev && before.ino === after.ino),
    "E_RAC_RUNTIME_NOT_INDEPENDENT",
  );
}
export function validateConsumerManifest(pkg) {
  object(pkg);
  demand(
    Object.keys(pkg).every((key) =>
      [
        "name",
        "private",
        "type",
        "packageManager",
        "dependencies",
        "devDependencies",
      ].includes(key),
    ) &&
      pkg.private === true &&
      pkg.type === "module" &&
      pkg.packageManager === "pnpm@10.13.1",
    "E_ISOLATED_PROFILE_MANIFEST",
  );
  const dependencies = object(pkg.dependencies ?? {}),
    development = object(pkg.devDependencies ?? {});
  demand(
    Object.keys(dependencies).every((key) => !Object.hasOwn(development, key)),
    "E_DUPLICATE_PROFILE_DEPENDENCY",
  );
}
function localRac(root) {
  const actual = directory(
    fs.realpathSync(path.join(root, "node_modules/react-aria-components")),
  );
  demand(actual.startsWith(`${root}/node_modules/`), "E_RAC_ROOT_ESCAPE");
  const manifest = json(actual, "package.json");
  demand(
    manifest.name === "react-aria-components" && manifest.version === "1.22.1",
    "E_RAC_LOCAL_VERSION",
  );
  return actual;
}
export function requireRuntimeMaps(profile, beforePaths, afterPaths) {
  exactKeys(
    profile.assets,
    RAC_ASSETS.map((name) => `${RAC_PREFIX}${name}`),
    "E_RAC_ASSET_MAP_SET",
  );
  exactKeys(profile.before, beforePaths, "E_RAC_BEFORE_MAP_SET");
  exactKeys(profile.after, afterPaths, "E_RAC_AFTER_MAP_SET");
  for (let index = 0; index < RAC_FILES.length; index++)
    demand(
      profile.before[beforePaths[index]].sha256 ===
        RAC_FILES[index].beforeSha256 &&
        profile.after[afterPaths[index]].sha256 ===
          RAC_FILES[index].afterSha256,
      "E_RAC_CANONICAL_RUNTIME_MAP",
    );
}
export function requireOrdinaryRuntimeMap(ordinary, paths) {
  object(ordinary.inputs);
  demand(paths.length === RAC_FILES.length, "E_ORDINARY_RUNTIME_PATHS");
  for (let index = 0; index < RAC_FILES.length; index++)
    demand(
      Object.hasOwn(ordinary.inputs, paths[index]) &&
        ordinary.inputs[paths[index]].sha256 === RAC_FILES[index].beforeSha256,
      "E_ORDINARY_REQUIRED_RUNTIME_MAP",
    );
}
function verifyProfile(
  root,
  input,
  wp13Root,
  request,
  approval,
  archive,
  packaged,
) {
  const currentConfig = validateProfileConfig(
    input.profile,
    read(root, "pnpm-workspace.yaml").toString("utf8"),
    read(root, ".npmrc").toString("utf8"),
  );
  const currentRac = localRac(root);
  if (input.profile === "ordinary") {
    for (const file of RAC_FILES)
      demand(
        record(currentRac, file.path).sha256 === file.beforeSha256,
        "E_ORDINARY_RAC_CHANGED",
      );
    return () => {
      for (const file of RAC_FILES)
        demand(
          record(currentRac, file.path).sha256 === file.beforeSha256,
          "E_ORDINARY_RAC_CHANGED",
        );
    };
  }
  demand(packaged, "E_MISSING_INSPECTED_RAC");
  const profile = selected(input.profileReceipt),
    ordinary = selected(profile.ordinaryReceipt);
  demand(
    profile.status === "main-reviewed-wp14-explicit-rac-profile" &&
      profile.root === root &&
      profile.archive === archive,
    "E_EXPLICIT_PROFILE",
  );
  demand(
    ordinary.status === "installed-not-runtime-approved" &&
      ordinary.profile === "ordinary" &&
      ordinary.candidate === input.candidate &&
      /^(styled|vite-styled|next)-ordinary$/.test(ordinary.key),
    "E_GENUINE_ORDINARY_RAC_RECEIPT",
  );
  const ordinaryName = `installed-${ordinary.key}.json`;
  demand(
    profile.ordinaryReceipt.path === path.join(wp13Root, ordinaryName) &&
      approval.receipts[ordinaryName] === profile.ordinaryReceipt.sha256,
    "E_ORDINARY_RECEIPT_ORIGIN",
  );
  const ordinaryRoot = directory(
    `/tmp/opencode/wp13-consumer-${request.run}-${ordinary.key}`,
  );
  demand(
    ordinaryRoot !== root && !fs.existsSync(path.join(ordinaryRoot, ".git")),
    "E_ORDINARY_SEPARATE_ROOT",
  );
  const owner = json(ordinaryRoot, "wp13-owner.json");
  demand(
    owner.protocol === "wp13-current-archives-v1" &&
      owner.run === request.run &&
      owner.key === ordinary.key,
    "E_ORDINARY_OWNER",
  );
  const recipe = object(request.consumers[ordinary.key]).package;
  validateConsumerManifest(recipe);
  const ordinaryDependencies = {
    ...recipe.dependencies,
    ...recipe.devDependencies,
  };
  demand(
    ordinaryDependencies["react-aria-components"] === "1.22.1" &&
      ordinaryDependencies["@tableweave/react"] ===
        `file:${path.join(wp13Root, json(wp13Root, "generation.json").archives.react.file)}` &&
      ordinaryDependencies["@tableweave/heroui"] ===
        `file:${path.join(wp13Root, json(wp13Root, "generation.json").archives.heroui.file)}`,
    "E_ORDINARY_RECIPE_ARCHIVE_VERSION",
  );
  demand(
    read(ordinaryRoot, "package.json").toString("utf8") ===
      `${JSON.stringify(recipe, null, 2)}\n`,
    "E_ORDINARY_PACKAGE_RECIPE",
  );
  const wantedLock = object(approval.consumerLocks[ordinary.key]);
  demand(
    wantedLock.status === "main-reviewed-standalone-lock" &&
      wantedLock.profile === "ordinary" &&
      wantedLock.herouiArchive === archive &&
      wantedLock.reactArchive === input.reactArchive,
    "E_ORDINARY_LOCK_PAIR",
  );
  demand(
    hash(read(ordinaryRoot, "package.json")) === wantedLock.packageSHA256 &&
      hash(read(ordinaryRoot, "pnpm-lock.yaml")) === wantedLock.lockSHA256 &&
      equivalent(record(ordinaryRoot, "pnpm-lock.yaml"), ordinary.lock),
    "E_ORDINARY_FROZEN_LOCK",
  );
  validateProfileConfig(
    "ordinary",
    read(ordinaryRoot, "pnpm-workspace.yaml").toString("utf8"),
    read(ordinaryRoot, ".npmrc").toString("utf8"),
    path.join(wp13Root, "store", ordinary.key),
  );
  demand(
    currentConfig["store-dir"] !== path.join(wp13Root, "store", ordinary.key),
    "E_RAC_SEPARATE_STORE",
  );
  demand(
    hash(read(ordinaryRoot, ".npmrc")) === wantedLock.npmrcSHA256 &&
      hash(read(ordinaryRoot, "pnpm-workspace.yaml")) ===
        wantedLock.workspaceSHA256,
    "E_ORDINARY_CONFIG_BINDING",
  );
  const ordinaryRac = localRac(ordinaryRoot),
    beforePaths = RAC_FILES.map((file) =>
      path.relative(ordinaryRoot, path.join(ordinaryRac, file.path)),
    ),
    afterPaths = RAC_FILES.map((file) =>
      path.relative(root, path.join(currentRac, file.path)),
    );
  requireRuntimeMaps(profile, beforePaths, afterPaths);
  requireOrdinaryRuntimeMap(ordinary, beforePaths);
  const ordinaryControls = Object.fromEntries(
    [
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      ".npmrc",
      "wp13-owner.json",
    ].map((file) => [file, record(ordinaryRoot, file)]),
  );
  const beforeIdentities = beforePaths.map((file) => {
    const s = fs.statSync(path.join(ordinaryRoot, file));
    return {
      dev: s.dev,
      ino: s.ino,
      nlink: s.nlink,
      mtimeMs: s.mtimeMs,
      ctimeMs: s.ctimeMs,
    };
  });
  function baseline() {
    selected(profile.ordinaryReceipt);
    verifyMap(ordinaryRoot, ordinaryControls);
    const all = inventory(ordinaryRoot);
    demand(
      equivalent(all.files, ordinary.inputs) &&
        equivalent(all.links, ordinary.links),
      "E_ORDINARY_BASELINE_CHANGED",
    );
    verifyMap(ordinaryRoot, profile.before);
    for (let index = 0; index < RAC_FILES.length; index++) {
      const expected = ordinary.inputs[beforePaths[index]],
        s = fs.statSync(path.join(ordinaryRoot, beforePaths[index]));
      demand(
        equivalent(
          {
            dev: s.dev,
            ino: s.ino,
            nlink: s.nlink,
            mtimeMs: s.mtimeMs,
            ctimeMs: s.ctimeMs,
          },
          beforeIdentities[index],
        ),
        "E_ORDINARY_IDENTITY_CHANGED",
      );
      demand(
        expected &&
          equivalent(record(ordinaryRoot, beforePaths[index]), expected) &&
          expected.sha256 === RAC_FILES[index].beforeSha256,
        "E_ORDINARY_BEFORE_BYTES",
      );
    }
  }
  baseline();
  function current() {
    selected(input.profileReceipt);
    validateProfileConfig(
      input.profile,
      read(root, "pnpm-workspace.yaml").toString("utf8"),
      read(root, ".npmrc").toString("utf8"),
    );
    demand(
      localRac(root) === currentRac && localRac(ordinaryRoot) === ordinaryRac,
      "E_RAC_ROOT_CHANGED",
    );
    verifyMap(root, profile.assets);
    verifyMap(root, profile.after);
    for (const name of RAC_ASSETS)
      demand(
        read(root, `${RAC_PREFIX}${name}`).equals(packaged.bytes[name]),
        "E_INSTALLED_RAC_ASSET_FROM_ARCHIVE",
      );
    for (let index = 0; index < RAC_FILES.length; index++) {
      demand(
        record(root, afterPaths[index]).sha256 === RAC_FILES[index].afterSha256,
        "E_RAC_AFTER_BYTES",
      );
      requireIndependentFiles(
        fs.statSync(path.join(ordinaryRoot, beforePaths[index])),
        fs.statSync(path.join(root, afterPaths[index])),
      );
    }
  }
  current();
  baseline();
  return () => {
    baseline();
    current();
    baseline();
  };
}
export function selectCandidate(selectionPath, phase) {
  demand(path.isAbsolute(selectionPath), "E_ABSOLUTE_SELECTION");
  const selectionRoot = directory(path.dirname(selectionPath)),
    selectionBytes = read(selectionRoot, path.basename(selectionPath)),
    selection = object(JSON.parse(selectionBytes.toString("utf8")));
  demand(
    selection.status === "main-reviewed-wp14-final-selection" &&
      selection.owner === "main" &&
      typeof selection.reviewer === "string" &&
      selection.reviewer.length > 0 &&
      selection.phases.includes(phase),
    "E_HOLD_MAIN_SELECTION",
  );
  const input = selected(selection.materialization),
    root = directory(input.root);
  demand(
    input.status === "main-reviewed-wp14-local-materialization" &&
      input.owner === "main" &&
      ["ordinary", "rac-runtime"].includes(input.profile),
    "E_HOLD_MATERIALIZATION_PROFILE",
  );
  demand(
    path.dirname(root) === "/tmp/opencode" &&
      path.basename(root).startsWith("wp14-consumer-") &&
      !fs.existsSync(path.join(root, "wp13-owner.json")) &&
      !fs.existsSync(path.join(root, ".git")),
    "E_NOT_SEPARATE_WP14_CONSUMER",
  );
  for (
    let cursor = path.dirname(root);
    cursor !== path.dirname(cursor);
    cursor = path.dirname(cursor)
  )
    for (const marker of [
      ".git",
      "node_modules",
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
      "package.json",
    ])
      demand(!fs.existsSync(path.join(cursor, marker)), "E_ANCESTOR_PROJECT");
  verifyMap(root, input.files);
  for (const file of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    "wp14-owner.json",
  ])
    demand(Object.hasOwn(input.files, file), "E_MATERIALIZATION_CONFIG");
  demand(json(root, "wp14-owner.json").run === selection.run, "E_OWNER_RUN");
  demand(/^[a-z0-9][a-z0-9-]{2,63}$/.test(selection.run), "E_RUN_ID");
  const wp13Root = directory(input.wp13Root),
    generation = selected(input.generation),
    inspection = selected(input.publicInspection),
    archivesInspected = selected(input.archiveInspection);
  demand(
    input.generation.path === path.join(wp13Root, "generation.json") &&
      input.publicInspection.path ===
        path.join(wp13Root, "public-inspection.json") &&
      input.archiveInspection.path ===
        path.join(wp13Root, "archive-inspection.json"),
    "E_WP13_RECEIPT_NAMES",
  );
  demand(
    generation.status === "emitted-and-packed-unapproved" &&
      inspection.status === "static-package-inspection-only" &&
      archivesInspected.status === "inspected-not-runtime-approved" &&
      generation.candidate === input.candidate &&
      inspection.candidate === input.candidate &&
      archivesInspected.candidate === input.candidate,
    "E_WP13_RECEIPTS",
  );
  for (const [file, field] of [
    ["producer-inputs.json", "inputsSHA256"],
    ["producer-checkout.json", "checkoutSHA256"],
    ["toolchain-inputs.json", "toolchainSHA256"],
  ])
    demand(
      hash(read(wp13Root, file)) === generation[field],
      "E_WP13_PREDECESSOR",
    );
  const checkout = json(wp13Root, "producer-checkout.json");
  demand(
    checkout.status === "main-reviewed-fresh-detached-real-checkout" &&
      checkout.revision === generation.revision &&
      input.sourceRevision === generation.revision &&
      /^wp13-candidate-[a-z0-9-]+$/.test(input.candidate),
    "E_CURRENT_CANDIDATE_SOURCE",
  );
  for (const file of Object.keys(generation.output))
    demand(/^packages\/(react|heroui)\/dist\//.test(file), "E_EMITTED_PATH");
  verifyMap(checkout.root, json(wp13Root, "producer-inputs.json"));
  verifyMap(checkout.root, generation.output);
  const request = json(wp13Root, "request.json"),
    approval = selected(input.wp13Approval);
  const wp13Owner = json(wp13Root, "owner.json");
  demand(
    path.dirname(wp13Root) === "/tmp/opencode" &&
      path.basename(wp13Root) === `wp13-run-${request.run}` &&
      wp13Owner.owner === "main" &&
      wp13Owner.run === request.run &&
      wp13Owner.protocol === "wp13-current-archives-v1" &&
      request.protocol === wp13Owner.protocol &&
      typeof input.dirtyState === "string" &&
      input.dirtyState.length > 0,
    "E_WP13_RUN_SOURCE_IDENTITY",
  );
  demand(
    input.wp13Approval.path === path.join(wp13Root, "main-approval.json") &&
      approval.status === "main-reviewed-final-selection" &&
      approval.requestSHA256 === hash(read(wp13Root, "request.json")) &&
      request.candidate === input.candidate &&
      request.selectedRevision === generation.revision &&
      approval.receipts["generation.json"] === input.generation.sha256 &&
      approval.receipts["public-inspection.json"] ===
        input.publicInspection.sha256 &&
      approval.receipts["archive-inspection.json"] ===
        input.archiveInspection.sha256,
    "E_WP13_MAIN_REVIEW",
  );
  demand(
    inspection.observations["react:."].graph.names["dist/index.js"].includes(
      "useDataTable",
    ) &&
      inspection.observations["heroui:."].graph.names["dist/index.js"].includes(
        "DataTable",
      ),
    "E_PUBLIC_FACADE_INSPECTION",
  );
  const archivePair = {};
  let inspectedRac = null;
  for (const name of ["react", "heroui"]) {
    const archive = object(generation.archives[name]);
    relative(archive.file);
    demand(
      archive.file.startsWith(`archives/${name}/`) &&
        archive.file.endsWith(".tgz"),
      "E_ARCHIVE_ORIGIN",
    );
    const bytes = read(wp13Root, archive.file);
    demand(
      hash(bytes) === archive.sha256 && bytes.length === archive.size,
      "E_ARCHIVE_BYTES",
    );
    const parsed = packageArchive(bytes, `@tableweave/${name}`),
      members = Object.fromEntries(
        [...parsed.members]
          .filter(([, value]) => value.type === "file")
          .map(([file, value]) => [
            file,
            {
              mode: value.mode,
              size: value.bytes.length,
              sha256: hash(value.bytes),
            },
          ]),
      );
    demand(
      equivalent(members, generation.members[name]) &&
        equivalent(members, archivesInspected.archives[name].members) &&
        archivesInspected.archives[name].sha256 === archive.sha256,
      "E_ARCHIVE_MEMBER_LINK",
    );
    const packageRoot = fs.realpathSync(
      path.join(root, `node_modules/@tableweave/${name}`),
    );
    demand(packageRoot.startsWith(`${root}/node_modules/`), "E_PACKAGE_ESCAPE");
    for (const [file, expected] of Object.entries(members)) {
      const actual = record(packageRoot, file.slice(8));
      demand(
        actual.sha256 === expected.sha256 && actual.size === expected.size,
        "E_INSTALLED_PACKAGE_BYTES",
      );
    }
    for (const value of Object.values(parsed.manifest.exports))
      if (typeof value === "object")
        for (const target of Object.values(value)) {
          demand(
            typeof target === "string" && target.startsWith("./dist/"),
            "E_EXPORT_TARGET",
          );
          read(packageRoot, target.slice(2));
        }
    archivePair[name] = archive.sha256;
    if (name === "heroui") inspectedRac = packagedRac(parsed.members);
  }
  const installed = selected(input.installed),
    actual = inventory(root);
  demand(
    installed.status === "main-reviewed-wp14-complete-installed-map" &&
      installed.root === root &&
      installed.profile === input.profile &&
      equivalent(installed.archives, archivePair) &&
      equivalent(actual.files, installed.inputs) &&
      equivalent(actual.links, installed.links),
    "E_COMPLETE_LOCAL_INSTALL",
  );
  const pkg = json(root, "package.json"),
    dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  validateConsumerManifest(pkg);
  demand(
    !pkg.scripts &&
      pkg.private === true &&
      pkg.type === "module" &&
      pkg.packageManager === "pnpm@10.13.1",
    "E_FROZEN_MANIFEST",
  );
  const pins = {
    react: "19.3.1",
    "react-dom": "19.3.1",
    "@tanstack/react-table": "9.3.1",
    "@heroui/react": "3.2.8",
    "@heroui/styles": "3.2.8",
    "react-aria-components": "1.22.1",
    vite: "7.3.8",
    "@vitejs/plugin-react": "5.2.0",
    "@tailwindcss/vite": "4.3.5",
    tailwindcss: "4.3.5",
    "@playwright/test": "1.65.1",
    typescript: "6.0.3",
  };
  for (const [name, version] of Object.entries(pins)) {
    demand(dependencies[name] === version, "E_TOOL_PEER_PIN");
    const file = fs.realpathSync(
      path.join(root, `node_modules/${name}/package.json`),
    );
    demand(
      file.startsWith(`${root}/node_modules/`) &&
        json(path.dirname(file), "package.json").version === version,
      "E_LOCAL_TOOL_PEER_VERSION",
    );
  }
  demand(
    dependencies["@tableweave/react"] ===
      `file:${path.join(wp13Root, generation.archives.react.file)}` &&
      dependencies["@tableweave/heroui"] ===
        `file:${path.join(wp13Root, generation.archives.heroui.file)}`,
    "E_MANIFEST_ARCHIVE_PAIR",
  );
  const recheckProfile = verifyProfile(
    root,
    { ...input, reactArchive: archivePair.react },
    wp13Root,
    request,
    approval,
    archivePair.heroui,
    inspectedRac,
  );
  demand(process.version === "v24.22.0", "E_NODE_VERSION");
  for (const file of [
    "bin/node",
    "bin/pnpm",
    "node_modules/pnpm/package.json",
    "node_modules/pnpm/bin/pnpm.cjs",
  ])
    demand(Object.hasOwn(input.toolFiles, file), "E_TOOL_IMPLEMENTATION_PIN");
  verifyMap(input.toolsRoot, input.toolFiles);
  demand(
    fs.realpathSync(process.execPath) ===
      path.join(input.toolsRoot, "bin/node"),
    "E_OWNED_NODE",
  );
  demand(
    json(input.toolsRoot, "node_modules/pnpm/package.json").version ===
      "10.13.1",
    "E_PNPM_PIN",
  );
  return {
    selection,
    input,
    root,
    installedFiles: installed.inputs,
    selectionPath,
    selectionSHA256: hash(selectionBytes),
    archivePair,
    identity: hash(
      JSON.stringify({
        candidate: input.candidate,
        archives: archivePair,
        installed: input.installed.sha256,
        profile: input.profile,
        lock: input.files["pnpm-lock.yaml"].sha256,
      }),
    ),
    revalidate() {
      demand(
        hash(read(selectionRoot, path.basename(selectionPath))) ===
          hash(selectionBytes),
        "E_SELECTION_CHANGED",
      );
      verifyMap(root, input.files);
      recheckProfile();
      for (const reference of [
        selection.materialization,
        input.generation,
        input.publicInspection,
        input.archiveInspection,
        input.wp13Approval,
        input.installed,
        selection.runner,
        selection.paintReview,
        selection.buildSelection,
      ].filter(Boolean))
        selected(reference);
      if (input.profileReceipt) {
        const profile = selected(input.profileReceipt);
        selected(profile.ordinaryReceipt);
      }
      if (selection.runner) {
        const hardware = selected(selection.runner);
        selected(hardware.reservation);
      }
      verifyMap(input.toolsRoot, input.toolFiles);
      verifyMap(checkout.root, generation.output);
      for (const archive of Object.values(generation.archives))
        demand(
          hash(read(wp13Root, archive.file)) === archive.sha256,
          "E_ARCHIVE_CHANGED",
        );
      const current = inventory(root);
      demand(
        equivalent(current.files, installed.inputs) &&
          equivalent(current.links, installed.links),
        "E_INSTALLED_CHANGED",
      );
    },
  };
}
export function runner(ctx) {
  const spec = selected(ctx.selection.runner);
  demand(
    spec.status === "main-reviewed-dedicated-runner-attestation" &&
      spec.run === ctx.selection.run &&
      typeof spec.reviewer === "string" &&
      spec.reviewer.length > 0 &&
      spec.os === "ubuntu-24.04-x64" &&
      spec.vcpus === 4 &&
      spec.ramBytes === 8589934592 &&
      spec.viewport.width === 1440 &&
      spec.viewport.height === 900 &&
      /^[a-f0-9]{64}$/.test(spec.imageSHA256),
    "E_HOLD_RUNNER_ATTESTATION",
  );
  const reservation = selected(spec.reservation);
  demand(
    reservation.status === "main-reviewed-exclusive-runner-reservation" &&
      reservation.run === ctx.selection.run &&
      reservation.cpuAffinity === spec.cpuAffinity &&
      reservation.imageSHA256 === spec.imageSHA256,
    "E_HOLD_DEDICATED_CAPACITY",
  );
  const executable = fs.realpathSync(
    path.join(ctx.root, relative(spec.browser.executable)),
  );
  demand(
    executable.startsWith(`${ctx.root}/node_modules/`) &&
      hash(fs.readFileSync(executable)) === spec.browser.sha256 &&
      fs.lstatSync(executable).isFile(),
    "E_LOCAL_BROWSER",
  );
  const osRelease = fs.readFileSync("/etc/os-release", "utf8"),
    affinity = fs
      .readFileSync("/proc/self/status", "utf8")
      .match(/^Cpus_allowed_list:\s*(.+)$/m)?.[1];
  const observed = {
    platform: os.platform(),
    arch: os.arch(),
    cpuModels: [...new Set(os.cpus().map((cpu) => cpu.model))],
    affinity,
    cpuQuota: fs.readFileSync("/sys/fs/cgroup/cpu.max", "utf8").trim(),
    memoryLimit: fs.readFileSync("/sys/fs/cgroup/memory.max", "utf8").trim(),
    totalMemory: os.totalmem(),
    load: os.loadavg(),
    osReleaseSHA256: hash(osRelease),
  };
  const cpus = new Set();
  for (const item of String(affinity).split(",")) {
    demand(/^\d+(?:-\d+)?$/.test(item), "E_AFFINITY_SHAPE");
    const [first, last] = item.split("-").map(Number);
    demand(
      (last ?? first) >= first && (last ?? first) - first <= 3,
      "E_FOUR_CPUS",
    );
    for (let index = first; index <= (last ?? first); index++) cpus.add(index);
  }
  demand(cpus.size === 4, "E_FOUR_CPUS");
  const processNames = [];
  for (const entry of fs.readdirSync("/proc"))
    if (/^\d+$/.test(entry)) {
      try {
        processNames.push(
          fs.readFileSync(`/proc/${entry}/comm`, "utf8").trim(),
        );
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ESRCH") throw error;
      }
    }
  demand(
    Array.isArray(spec.allowedProcesses) &&
      processNames.every((name) => spec.allowedProcesses.includes(name)),
    "E_UNSELECTED_COMPETING_PROCESS",
  );
  observed.processNames = processNames.sort();
  demand(
    observed.platform === "linux" &&
      observed.arch === "x64" &&
      /^ID=ubuntu$/m.test(osRelease) &&
      /^VERSION_ID="24.04"$/m.test(osRelease) &&
      observed.affinity === spec.cpuAffinity &&
      observed.cpuModels.length === 1 &&
      observed.cpuModels[0] === spec.cpuModel &&
      observed.cpuQuota === spec.cpuQuota &&
      observed.memoryLimit === String(spec.ramBytes) &&
      observed.osReleaseSHA256 === spec.osReleaseSHA256,
    "E_HOLD_RUNNER_OBSERVATION_MISMATCH",
  );
  demand(
    spec.extensions === "none" &&
      spec.competingJobs === "none" &&
      spec.browser.flags.includes("--disable-extensions") &&
      spec.browser.flags.every((flag) =>
        [
          "--disable-extensions",
          "--no-first-run",
          "--disable-background-networking",
        ].includes(flag),
      ),
    "E_RUNNER_FLAGS",
  );
  const env = safeEnvironment(ctx);
  const version = spawnSync(executable, ["--version"], {
    env,
    shell: false,
    encoding: "utf8",
    timeout: 10000,
  });
  demand(
    version.status === 0 && version.stdout.trim() === spec.browser.version,
    "E_OBSERVED_BROWSER_VERSION",
  );
  return {
    spec,
    executable,
    observed,
    identity: ctx.selection.runner.sha256,
    env,
  };
}
export function safeEnvironment(ctx) {
  const home = directory(ctx.input.home);
  demand(
    home.startsWith(`${ctx.root}/`) &&
      read(home, "user.npmrc").length === 0 &&
      read(home, "global.npmrc").length === 0,
    "E_OWNED_EMPTY_HOME",
  );
  return {
    PATH: `${ctx.input.toolsRoot}/bin`,
    HOME: home,
    LANG: "C.UTF-8",
    TZ: "UTC",
    CI: "1",
    NODE_ENV: "production",
    DO_NOT_TRACK: "1",
    NPM_CONFIG_USERCONFIG: path.join(home, "user.npmrc"),
    NPM_CONFIG_GLOBALCONFIG: path.join(home, "global.npmrc"),
  };
}
