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
  if (input.profile === "ordinary")
    demand(
      read(root, "pnpm-workspace.yaml").toString("utf8") === "packages: []\n",
      "E_ORDINARY_PROFILE",
    );
  else {
    const profile = selected(input.profileReceipt);
    demand(
      profile.status === "main-reviewed-wp14-explicit-rac-profile" &&
        profile.root === root &&
        profile.archive === archivePair.heroui,
      "E_EXPLICIT_PROFILE",
    );
    verifyMap(root, profile.assets);
    verifyMap(root, profile.after);
    const ordinary = selected(profile.ordinaryReceipt);
    demand(
      ordinary.status === "installed-not-runtime-approved" &&
        ordinary.profile === "ordinary" &&
        ordinary.candidate === input.candidate &&
        Object.keys(profile.before).length > 0,
      "E_ORDINARY_BEFORE_LINK",
    );
    for (const [file, before] of Object.entries(profile.before))
      demand(
        ordinary.inputs[file]?.sha256 === before.sha256,
        "E_PROFILE_BEFORE",
      );
  }
  demand(
    read(root, ".npmrc").toString("utf8").includes("ignore-scripts=true") &&
      !read(root, ".npmrc")
        .toString("utf8")
        .includes("strict-peer-dependencies=false"),
    "E_CONFIG_PROFILE",
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
