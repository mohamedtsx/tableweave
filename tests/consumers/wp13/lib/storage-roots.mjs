import fs from "node:fs";
import path from "node:path";
import {
  demand,
  directory,
  regular,
  object,
  digest,
  present,
  capacity,
  receipt,
} from "./receipts.mjs";

// Internal filesystem lease, not a public library capability or an OS sandbox.
const tokens = new WeakMap();
const contexts = new WeakMap();
const families = [
  "headless",
  "styled",
  "vite-headless",
  "vite-styled",
  "next",
  "start",
];
const profiles = ["ordinary", "rac-runtime", "start-sdk-declarations"];
const markers = [
  ".git",
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  ".npmrc",
  "node_modules",
];
const inputFiles = {
  producerInputsSHA256: "producer-inputs.json",
  toolingInputsSHA256: "tooling-inputs.json",
  toolingRuntimeInputsSHA256: "tooling-runtime-inputs.json",
  toolchainInputsSHA256: "toolchain-inputs.json",
};
function id(value) {
  demand(
    typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,47}$/.test(value),
    "E_RUN_ID",
  );
  return value;
}
function freeze(value) {
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
}
function equal(a, b) {
  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  )
    return a === b;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => equal(value, b[index]))
    );
  object(a);
  object(b);
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && equal(a[key], b[key]))
  );
}
function identity(stat) {
  const value = { dev: stat.dev, ino: stat.ino, uid: stat.uid };
  for (const item of Object.values(value))
    demand(Number.isSafeInteger(item) && item >= 0, "E_STORAGE_STAT_INTEGER");
  return value;
}
function expectedIdentity(value) {
  object(value);
  demand(
    equal(Object.fromEntries(Object.keys(value).map((key) => [key, 0])), {
      dev: 0,
      ino: 0,
      uid: 0,
    }),
    "E_STORAGE_IDENTITY_FIELDS",
  );
  for (const item of Object.values(value))
    demand(Number.isSafeInteger(item) && item >= 0, "E_STORAGE_STAT_INTEGER");
}
function physical(root, expected, privateRoot = false) {
  directory(root);
  expectedIdentity(expected);
  const stat = fs.lstatSync(root);
  demand(equal(identity(stat), expected), "E_STORAGE_PHYSICAL_REPLACEMENT");
  if (privateRoot)
    demand(
      stat.uid === process.geteuid() && (stat.mode & 0o777) === 0o700,
      "E_STORAGE_PRIVATE_OWNER",
    );
  return identity(stat);
}
export function storageRoots(runId, layout = "legacy-ssd") {
  id(runId);
  demand(["legacy-ssd", "hdd-v1"].includes(layout), "E_STORAGE_SELECTOR");
  const parent = layout === "hdd-v1" ? "/mnt/data/Projects" : "/tmp/opencode";
  const namespace =
    layout === "hdd-v1"
      ? `${parent}/tableweave-final-verification-${runId}`
      : parent;
  const consumers = {};
  for (const family of families)
    for (const profile of profiles) {
      if (
        profile === "rac-runtime" &&
        !["styled", "vite-styled", "next"].includes(family)
      )
        continue;
      if (profile === "start-sdk-declarations" && family !== "start") continue;
      consumers[`${family}-${profile}`] =
        `${namespace}/wp13-consumer-${runId}-${family}-${profile}`;
    }
  return freeze({
    parent,
    namespace,
    run: `${namespace}/wp13-run-${runId}`,
    producer: `${namespace}/wp13-producer-${runId}`,
    tools: `${namespace}/wp13-tools-${runId}`,
    consumers,
  });
}
export function parseStorageArguments(args) {
  demand(
    Array.isArray(args) &&
      (args.length === 8 || args.length === 10) &&
      args[0] === "--run" &&
      args[2] === "--phase" &&
      args[4] === "--family" &&
      args[6] === "--profile" &&
      (args.length === 8 || (args[8] === "--storage" && args[9] === "hdd-v1")),
    "E_EXPLICIT_ARGUMENTS_NO_DEFAULT_OR_HELP",
  );
  return args.length === 8 ? "legacy-ssd" : "hdd-v1";
}
function ancestors(roots) {
  let cursor = "/";
  for (const part of ["", ...roots.namespace.slice(1).split("/")]) {
    if (part) cursor = path.join(cursor, part);
    directory(cursor);
    for (const marker of markers)
      demand(!present(path.join(cursor, marker)), "E_ANCESTOR_PROJECT_CONFIG");
    const s = fs.lstatSync(cursor);
    demand(
      (s.uid === 0 || s.uid === process.geteuid()) && (s.mode & 0o022) === 0,
      "E_STORAGE_ANCESTOR_OWNER",
    );
  }
}
function capture(root, name) {
  const before = fs.lstatSync(path.join(root, name));
  demand(
    before.isFile() &&
      !before.isSymbolicLink() &&
      before.uid === process.geteuid() &&
      (before.mode & 0o777) === 0o600 &&
      before.nlink === 1,
    "E_STORAGE_CONTROL_OWNER",
  );
  demand(
    Number.isSafeInteger(before.size) &&
      before.size >= 0 &&
      Number.isFinite(before.mtimeMs) &&
      Number.isFinite(before.ctimeMs),
    "E_STORAGE_STAT_INTEGER",
  );
  const bytes = regular(root, name);
  const after = fs.lstatSync(path.join(root, name));
  demand(
    equal(identity(before), identity(after)) &&
      before.size === after.size &&
      before.mtimeMs === after.mtimeMs &&
      before.ctimeMs === after.ctimeMs,
    "E_STORAGE_CONTROL_REPLACEMENT",
  );
  return {
    bytes,
    stamp: {
      ...identity(before),
      sha256: digest(bytes),
      size: bytes.length,
      mtimeMs: before.mtimeMs,
      ctimeMs: before.ctimeMs,
    },
  };
}
function check(state) {
  if (state.layout !== "hdd-v1") return;
  const { roots, lease } = state;
  ancestors(roots);
  physical(roots.parent, lease.parent);
  physical(roots.namespace, lease.namespace, true);
  for (const role of ["run", "producer", "tools"])
    physical(roots[role], lease.roles[role], true);
  for (const [name, expected] of Object.entries(state.controls)) {
    const root = name === "storage-lease.json" ? roots.namespace : roots.run;
    demand(
      equal(capture(root, name).stamp, expected),
      "E_STORAGE_CONTROL_REPLACEMENT",
    );
  }
  for (const [root, expected] of state.consumers)
    physical(root, expected, true);
  for (const [root, expected] of state.scratch) physical(root, expected, true);
}
export function openStorage(runId, layout) {
  const roots = storageRoots(runId, layout);
  const state = {
    runId,
    layout,
    roots,
    controls: {},
    controlValues: {},
    consumers: new Map(),
    scratch: new Map(),
    lease: null,
    leaseSHA256: null,
  };
  if (layout === "hdd-v1") {
    ancestors(roots);
    const control = capture(roots.namespace, "storage-lease.json");
    const lease = object(JSON.parse(control.bytes.toString("utf8")));
    demand(
      lease.schema === "wp13-storage-lease-v1" &&
        lease.status === "main-owned-new-namespace" &&
        lease.layout === layout &&
        lease.run === runId &&
        lease.candidate === `wp13-candidate-${runId}` &&
        lease.uid === process.geteuid() &&
        Number.isSafeInteger(lease.uid) &&
        /^[0-9a-f]{40}$/.test(lease.selectedRevision) &&
        equal(lease.roots, roots),
      "E_STORAGE_LEASE",
    );
    for (const field of Object.keys(inputFiles))
      demand(
        typeof lease[field] === "string" && /^[0-9a-f]{64}$/.test(lease[field]),
        "E_STORAGE_INPUT_HASH",
      );
    object(lease.roles);
    demand(
      Object.keys(lease.roles).sort().join(",") === "producer,run,tools",
      "E_STORAGE_ROLE_SET",
    );
    state.lease = freeze(lease);
    state.leaseSHA256 = digest(control.bytes);
    state.controls["storage-lease.json"] = control.stamp;
    check(state);
    demand(
      lease.namespace.dev === lease.parent.dev &&
        ["run", "producer", "tools"].every(
          (role) => lease.roles[role].dev === lease.namespace.dev,
        ),
      "E_STORAGE_DEVICE",
    );
  }
  const token = Object.freeze({});
  tokens.set(token, state);
  return token;
}
export function storageControl(token, name) {
  const state = tokens.get(token);
  demand(
    state &&
      state.layout === "hdd-v1" &&
      [
        "owner.json",
        "request.json",
        "main-approval.json",
        ...Object.values(inputFiles),
      ].includes(name),
    "E_STORAGE_CONTEXT",
  );
  check(state);
  if (Object.hasOwn(state.controlValues, name))
    return Buffer.from(state.controlValues[name], "utf8");
  const control = capture(state.roots.run, name);
  state.controls[name] = freeze(control.stamp);
  state.controlValues[name] = control.bytes.toString("utf8");
  return control.bytes;
}
export function bindStorage(token, data) {
  const state = tokens.get(token);
  demand(state && !state.bound, "E_STORAGE_CONTEXT");
  object(data);
  demand(
    data.runId === state.runId &&
      typeof data.family === "string" &&
      typeof data.profile === "string" &&
      data.key === `${data.family}-${data.profile}` &&
      Object.hasOwn(state.roots.consumers, data.key),
    "E_STORAGE_CONTEXT_KEY",
  );
  demand(
    data.run === state.roots.run &&
      data.producer === state.roots.producer &&
      data.tools === state.roots.tools,
    "E_STORAGE_ROOT_BINDING",
  );
  if (state.layout === "hdd-v1") {
    const binding = {
      layout: state.layout,
      leaseSHA256: state.leaseSHA256,
      roots: state.roots,
    };
    for (const [field, name] of [
      ["owner", "owner.json"],
      ["request", "request.json"],
      ["approval", "main-approval.json"],
    ]) {
      demand(
        Object.hasOwn(state.controlValues, name) &&
          equal(data[field], JSON.parse(state.controlValues[name])),
        "E_STORAGE_CAPTURED_CONTROL",
      );
    }
    for (const value of [data.request, data.approval, data.owner])
      demand(equal(value.storage, binding), "E_STORAGE_APPROVAL_BINDING");
    demand(
      data.request.selectedRevision === state.lease.selectedRevision &&
        data.request.candidate === state.lease.candidate,
      "E_STORAGE_CANDIDATE_BINDING",
    );
    for (const [field, name] of Object.entries(inputFiles)) {
      const bytes = storageControl(token, name);
      demand(
        digest(bytes) === state.lease[field] &&
          data.approval.receipts[name] === state.lease[field],
        "E_STORAGE_SELECTED_INPUT",
      );
    }
    const approved = object(data.approval.receipts);
    const bindings = object(data.approval.storageReceiptBindings);
    demand(
      Object.keys(approved).length === Object.keys(bindings).length,
      "E_STORAGE_RECEIPT_SET",
    );
    for (const [name, hash] of Object.entries(approved)) {
      demand(
        /^[a-z][a-z0-9-]*\.json$/.test(name) && /^[0-9a-f]{64}$/.test(hash),
        "E_STORAGE_RECEIPT_NAME",
      );
      demand(
        equal(bindings[name], { leaseSHA256: state.leaseSHA256, sha256: hash }),
        "E_STORAGE_RECEIPT_BINDING",
      );
      const control = capture(state.roots.run, name);
      demand(digest(control.bytes) === hash, "E_STORAGE_RECEIPT_HASH");
      rejectForeignRoots(
        JSON.parse(control.bytes.toString("utf8")),
        state.roots.namespace,
      );
      if (Object.hasOwn(state.controls, name))
        demand(
          equal(state.controls[name], control.stamp),
          "E_STORAGE_CONTROL_REPLACEMENT",
        );
      else state.controls[name] = freeze(control.stamp);
    }
  } else {
    for (const value of [data.request, data.approval, data.owner])
      demand(!Object.hasOwn(value, "storage"), "E_LEGACY_STORAGE_CONFLICT");
  }
  const ctx = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      ["run", "producer", "tools"].includes(key) &&
      state.layout === "hdd-v1"
    ) {
      Object.defineProperty(ctx, key, {
        enumerable: true,
        get() {
          check(state);
          return state.roots[key];
        },
      });
    } else
      Object.defineProperty(ctx, key, {
        enumerable: true,
        value: freeze(value),
      });
  }
  state.bound = true;
  contexts.set(ctx, state);
  check(state);
  return Object.freeze(ctx);
}
function rejectForeignRoots(value, namespace) {
  if (typeof value === "string") {
    demand(
      !value.includes("/tmp/opencode/wp13-") &&
        [
          ...value.matchAll(
            /\/mnt\/data\/Projects\/tableweave-final-verification-[a-z0-9-]+/g,
          ),
        ].every(([root]) => root === namespace),
      "E_STORAGE_FOREIGN_RECEIPT_ROOT",
    );
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      rejectForeignRoots(key, namespace);
      rejectForeignRoots(item, namespace);
    }
  }
}
function context(ctx) {
  const state = contexts.get(ctx);
  demand(state, "E_STORAGE_CONTEXT");
  check(state);
  return state;
}
export function storageLayout(ctx) {
  return context(ctx).layout;
}
export function selectedRoots(ctx) {
  return context(ctx).roots;
}
export function storageRevalidate(ctx) {
  context(ctx);
}
export function storageExternal(ctx, location, fresh, producer) {
  const state = context(ctx);
  demand(state.layout === "hdd-v1", "E_STORAGE_CONTEXT");
  const roots = state.roots;
  const isProducer = location === roots.producer;
  demand(
    location === roots.run ||
      location === roots.tools ||
      isProducer ||
      Object.values(roots.consumers).includes(location),
    "E_EXTERNAL_TARGET",
  );
  demand(!producer || isProducer, "E_STORAGE_ROLE");
  if (fresh) {
    demand(
      Object.values(roots.consumers).includes(location) && !present(location),
      "E_TARGET_EXISTS",
    );
  } else {
    directory(location);
    if (!isProducer)
      demand(!present(path.join(location, ".git")), "E_WORKTREE_TARGET");
    if (Object.values(roots.consumers).includes(location))
      consumerStorage(ctx, location);
  }
  return location;
}
export function storageProvenance(ctx) {
  const state = context(ctx);
  if (state.layout !== "hdd-v1") return {};
  return {
    storage: {
      layout: state.layout,
      leaseSHA256: state.leaseSHA256,
      roots: state.roots,
      parent: state.lease.parent,
      namespace: state.lease.namespace,
      roles: state.lease.roles,
    },
  };
}
export function captureConsumer(ctx, root) {
  const state = context(ctx);
  demand(
    state.layout === "hdd-v1" &&
      root === state.roots.consumers[ctx.key] &&
      !state.consumers.has(root),
    "E_STORAGE_CONSUMER_CAPTURE",
  );
  const stat = fs.lstatSync(root),
    value = identity(stat);
  physical(root, value, true);
  demand(value.dev === state.lease.namespace.dev, "E_STORAGE_DEVICE");
  state.consumers.set(root, freeze(value));
  return {
    layout: state.layout,
    leaseSHA256: state.leaseSHA256,
    root,
    identity: value,
  };
}
export function consumerStorage(ctx, root, supplied) {
  const state = context(ctx);
  if (state.layout !== "hdd-v1") return;
  const key = Object.keys(state.roots.consumers).find(
    (key) => state.roots.consumers[key] === root,
  );
  demand(key, "E_STORAGE_CONSUMER_ROOT");
  const prepared = receipt(ctx, `consumer-prepared-${key}.json`);
  const binding = object(prepared.storage);
  const family = families.find((family) => key.startsWith(`${family}-`));
  demand(
    binding.layout === state.layout &&
      binding.leaseSHA256 === state.leaseSHA256 &&
      binding.root === root &&
      prepared.candidate === ctx.request.candidate &&
      prepared.key === key &&
      prepared.profile === key.slice(family.length + 1) &&
      (!supplied || equal(supplied, binding)),
    "E_STORAGE_CONSUMER_RECEIPT",
  );
  physical(root, binding.identity, true);
  demand(
    binding.identity.dev === state.lease.namespace.dev,
    "E_STORAGE_DEVICE",
  );
  if (state.consumers.has(root))
    demand(
      equal(state.consumers.get(root), binding.identity),
      "E_STORAGE_PHYSICAL_REPLACEMENT",
    );
  const marker = object(
    JSON.parse(capture(root, "wp13-owner.json").bytes.toString("utf8")),
  );
  demand(
    marker.protocol === "wp13-current-archives-v1" &&
      marker.run === ctx.runId &&
      marker.key === key &&
      equal(marker.storage, binding),
    "E_STORAGE_CONSUMER_RECEIPT",
  );
  physical(root, binding.identity, true);
  if (!state.consumers.has(root))
    state.consumers.set(root, freeze(binding.identity));
}
export function scratch(ctx, create = false) {
  const state = context(ctx);
  if (state.layout !== "hdd-v1") return {};
  const home = `home/${ctx.key}`;
  const names = ["home", `${home}`, `${home}/.cache`, `${home}/.cache/tmp`];
  for (const name of names) {
    check(state);
    const root = path.join(state.roots.run, name);
    if (create && !present(root)) {
      capacity(state.roots.run);
      // Fixed parents precede children. Never grant arbitrary scratch parents.
      directory(path.dirname(root));
      fs.mkdirSync(root, { mode: 0o700 });
    }
    directory(root);
    const stat = fs.lstatSync(root);
    demand(
      stat.uid === state.lease.uid &&
        (stat.mode & 0o077) === 0 &&
        stat.dev === state.lease.namespace.dev,
      "E_STORAGE_SCRATCH_OWNER",
    );
    if (!state.scratch.has(root))
      state.scratch.set(root, freeze(identity(stat)));
  }
  const cache = path.join(state.roots.run, home, ".cache");
  return {
    TMPDIR: `${cache}/tmp`,
    TMP: `${cache}/tmp`,
    TEMP: `${cache}/tmp`,
    XDG_CACHE_HOME: cache,
  };
}
