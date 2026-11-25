import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

// Importing this authored suite registers nothing, loads no helpers and reads no
// selection. Only a separately selected direct FINAL entry may register tests.
export async function register(runId) {
  if (process.env.WP13_STORAGE_GUARDS_FINAL !== "1")
    throw Error("E_UNSELECTED_GUARD_TESTS");
  const { test } = await import("node:test");
  const boundary = await import("../wp13/lib/boundary.mjs");
  const storage = await import("../wp13/lib/storage-roots.mjs");
  const { regular, capacity } = await import("../wp13/lib/receipts.mjs");
  boundary.safeId(runId);
  const selectedRoots = storage.storageRoots(runId, "hdd-v1");
  const selected = JSON.parse(
    regular(selectedRoots.namespace, "guard-selection.json"),
  );
  assert.equal(selected.schema, "wp13-storage-guards-v1");
  assert.equal(selected.status, "main-selected-disposable-guard-tests");
  assert.equal(selected.run, runId);
  assert.equal(selected.maximumMutationBytes, 32768);
  const used = new Set();
  function fixture(name) {
    const allocation = selected.cases[name];
    assert.ok(allocation && typeof allocation.run === "string");
    boundary.safeId(allocation.run);
    assert.ok(
      allocation.run.startsWith(`${runId}-`) && !used.has(allocation.run),
    );
    used.add(allocation.run);
    const roots = storage.storageRoots(allocation.run, "hdd-v1");
    const marker = JSON.parse(regular(roots.namespace, "guard-fixture.json"));
    assert.deepEqual(marker, {
      status: "main-owned-disposable-rejection-fixture",
      run: allocation.run,
      scenario: name,
    });
    // Main precreates namespace and all roles at0700, selects exact controls and
    // independently reviews these small mutations. No namespace is auto-created.
    const load = () =>
      boundary.load(
        allocation.run,
        "prepare",
        "headless",
        "ordinary",
        true,
        "hdd-v1",
      );
    return { roots, load, ctx: load() };
  }
  function mutate(root, file, fn) {
    capacity(root);
    const before = regular(root, file),
      value = JSON.parse(before);
    fn(value);
    const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
    assert.ok(bytes.length <= selected.maximumMutationBytes);
    const fd = fs.openSync(
      path.join(root, file),
      fs.constants.O_WRONLY | fs.constants.O_TRUNC | fs.constants.O_NOFOLLOW,
    );
    try {
      fs.writeFileSync(fd, bytes);
    } finally {
      fs.closeSync(fd);
    }
  }
  const args = [
    "--run",
    "guard",
    "--phase",
    "prepare",
    "--family",
    "headless",
    "--profile",
    "ordinary",
  ];
  test("old exact grammar remains SSD and only terminal hdd-v1 selects HDD", () => {
    assert.equal(storage.parseStorageArguments(args), "legacy-ssd");
    assert.equal(
      storage.parseStorageArguments([...args, "--storage", "hdd-v1"]),
      "hdd-v1",
    );
    for (const extra of [
      [],
      ["--help"],
      ["--storage"],
      ["--storage", "ssd"],
      ["--root", "/mnt/data"],
      ["--storage", "hdd-v1", "--storage", "hdd-v1"],
    ]) {
      if (extra.length)
        assert.throws(() => storage.parseStorageArguments([...args, ...extra]));
    }
    assert.throws(() => storage.parseStorageArguments([]));
    assert.throws(() =>
      storage.parseStorageArguments(["--storage", "hdd-v1", ...args]),
    );
    assert.throws(() =>
      storage.parseStorageArguments([
        "--phase",
        "prepare",
        "--run",
        "guard",
        ...args.slice(4),
      ]),
    );
  });
  test("fixed roles and ordinary sibling derive from layout, never cwd/env/root JSON", () => {
    const old = storage.storageRoots("guard");
    assert.equal(old.run, "/tmp/opencode/wp13-run-guard");
    assert.equal(old.producer, "/tmp/opencode/wp13-producer-guard");
    assert.equal(old.tools, "/tmp/opencode/wp13-tools-guard");
    assert.equal(
      old.consumers["headless-ordinary"],
      "/tmp/opencode/wp13-consumer-guard-headless-ordinary",
    );
    const hdd = storage.storageRoots("guard", "hdd-v1");
    assert.equal(
      hdd.namespace,
      "/mnt/data/Projects/tableweave-final-verification-guard",
    );
    for (const role of ["run", "producer", "tools"])
      assert.equal(hdd[role], `${hdd.namespace}/wp13-${role}-guard`);
    assert.equal(Object.keys(hdd.consumers).length, 10);
    assert.equal(
      hdd.consumers["styled-ordinary"],
      `${hdd.namespace}/wp13-consumer-guard-styled-ordinary`,
    );
    for (const id of ["", "UPPER", "../guard", "a/b", "a\\b", "x".repeat(49)])
      assert.throws(() => storage.storageRoots(id, "hdd-v1"));
    assert.throws(() => storage.storageRoots("guard", "/mnt/data"));
  });
  test("legacy external grammar rejects nested/noncanonical/foreign roots before filesystem reads", () => {
    for (const root of [
      "/tmp/opencode/nested/child",
      "/tmp/opencode//alias",
      "/tmp/opencode/../outside",
      "/mnt/data/wp13-run-any",
      "relative",
      "/tmp",
    ]) {
      assert.throws(() => boundary.external(root, true), /E_EXTERNAL_TARGET/);
    }
  });
  test("unknown/copied contexts cannot open HDD roots or select scratch", () => {
    const roots = storage.storageRoots("unknown", "hdd-v1");
    assert.throws(() => boundary.external(roots.run));
    assert.throws(() => boundary.external(`${roots.run}/nested`, true));
    for (const ctx of [
      {},
      { run: roots.run },
      Object.freeze({ runId: "unknown", key: "headless-ordinary" }),
    ]) {
      assert.throws(() => boundary.external(roots.run, false, false, ctx));
      assert.throws(() => storage.scratch(ctx, true));
      assert.throws(() => boundary.consumerPath(ctx));
    }
    const f = fixture("copied-context");
    assert.throws(() => storage.selectedRoots({ ...f.ctx }));
    let reads = 0;
    const accessor = {
      get run() {
        reads += 1;
        return roots.run;
      },
    };
    assert.throws(() => storage.selectedRoots(accessor));
    assert.equal(reads, 0);
    assert.throws(() => {
      f.ctx.run = roots.run;
    });
  });
  test("selected real namespace permits readonly context, not real-checkout certification", () => {
    const f = fixture("readonly-positive");
    boundary.revalidate(f.ctx);
    assert.equal(f.ctx.run, f.roots.run);
    assert.equal(storage.selectedRoots(f.ctx), storage.selectedRoots(f.ctx));
    assert.equal(Object.isFrozen(f.ctx.request), true);
    assert.throws(() =>
      boundary.external(`${f.roots.namespace}/arbitrary`, true, false, f.ctx),
    );
    assert.throws(() => boundary.external(f.roots.run, true, false, f.ctx));
    // This checks load's filesystem lease ONLY. producerInputs, actual Git,
    // archive/compiler/native/profile validity are deliberately not certified.
  });
  for (const [name, field, changed] of [
    ["lease-uid", "uid", (v) => v + 1],
    ["lease-layout", "layout", () => "legacy-ssd"],
    ["lease-revision", "selectedRevision", () => "0".repeat(40)],
    ["lease-tooling", "toolingInputsSHA256", () => "0".repeat(64)],
    ["lease-inputs", "producerInputsSHA256", () => "0".repeat(64)],
    ["lease-toolchain", "toolchainInputsSHA256", () => "0".repeat(64)],
    ["lease-runtime", "toolingRuntimeInputsSHA256", () => "0".repeat(64)],
  ])
    test(`lease ${field} mutation fails old context and fresh load`, () => {
      const f = fixture(name);
      mutate(f.roots.namespace, "storage-lease.json", (v) => {
        v[field] = changed(v[field]);
      });
      assert.throws(() => boundary.revalidate(f.ctx));
      assert.throws(f.load);
    });
  for (const field of ["dev", "ino", "uid"])
    test(`lease parent/namespace/role ${field} is actual physical metadata`, () => {
      const f = fixture(`physical-${field}`);
      mutate(f.roots.namespace, "storage-lease.json", (v) => {
        for (const target of [v.parent, v.namespace, ...Object.values(v.roles)])
          target[field] += 1;
      });
      assert.throws(f.load);
      assert.throws(() => boundary.revalidate(f.ctx));
    });
  test("unsafe numeric identity and arbitrary role paths cannot enter lease", () => {
    const f = fixture("unsafe-identity");
    mutate(f.roots.namespace, "storage-lease.json", (v) => {
      v.namespace.ino = Number.MAX_SAFE_INTEGER + 1;
      v.roots.run = "/tmp/opencode/borrowed";
    });
    assert.throws(f.load);
  });
  test("observed parent/namespace identity replacement is rejected (stat-only unit adversary)", (t) => {
    const f = fixture("parent-stat-swap"),
      original = fs.lstatSync;
    t.mock.method(fs, "lstatSync", (file, ...options) => {
      const stat = original(file, ...options);
      if (file !== f.roots.parent) return stat;
      const changed = Object.create(stat);
      Object.defineProperty(changed, "ino", { value: stat.ino + 1 });
      return changed;
    });
    assert.throws(() => boundary.revalidate(f.ctx));
  });
  test("byte-identical control file replacement is not adopted", () => {
    const f = fixture("control-same-bytes"),
      bytes = regular(f.roots.run, "request.json");
    capacity(f.roots.run);
    fs.renameSync(
      path.join(f.roots.run, "request.json"),
      path.join(f.roots.run, "preserved-request.json"),
    );
    fs.writeFileSync(path.join(f.roots.run, "request.json"), bytes, {
      flag: "wx",
      mode: 0o600,
    });
    assert.throws(() => boundary.revalidate(f.ctx));
  });
  for (const scenario of [
    "old-ssd-receipt",
    "other-hdd-receipt",
    "missing-receipt-binding",
    "unowned-namespace",
    "namespace-symlink",
    "role-symlink",
    "input-control-hash",
  ]) {
    test(`main-provided rejection-only ${scenario} cannot load`, () => {
      const allocation = selected.cases[scenario];
      assert.ok(
        allocation?.run.startsWith(`${runId}-`) && !used.has(allocation.run),
      );
      boundary.safeId(allocation.run);
      used.add(allocation.run);
      assert.throws(() =>
        boundary.load(
          allocation.run,
          "prepare",
          "headless",
          "ordinary",
          true,
          "hdd-v1",
        ),
      );
    });
  }
  test("old-root prepared owner receipts never confer consumer ownership", () => {
    const f = fixture("old-consumer-receipt");
    // Main supplies a tiny old-root marker and separately hash-selected prepared
    // receipt: no fake archive/install success or application P grant is made.
    assert.throws(() => boundary.ownedConsumer(f.ctx));
  });
  test("ordinary/profile comparison uses separate selected sibling and file inodes", () => {
    const f = fixture("ordinary-independent");
    const ordinary = f.roots.consumers["styled-ordinary"],
      profile = f.roots.consumers["styled-rac-runtime"];
    assert.equal(path.dirname(ordinary), f.roots.namespace);
    assert.equal(path.dirname(profile), f.roots.namespace);
    assert.notEqual(ordinary, profile);
    // Tiny UNIT files precreated by main in these disposable roles, not a real
    // private-profile certificate; actual verifyProfile remains a later gate.
    const a = fs.lstatSync(path.join(ordinary, "guard-unit.txt")),
      b = fs.lstatSync(path.join(profile, "guard-unit.txt"));
    assert.ok(a.dev !== b.dev || a.ino !== b.ino);
    assert.equal(
      regular(ordinary, "guard-unit.txt").toString(),
      "ordinary-before\n",
    );
    assert.equal(
      regular(profile, "guard-unit.txt").toString(),
      "profile-after\n",
    );
  });
  for (const name of ["request.json", "main-approval.json", "owner.json"])
    test(`${name} replacement and cross-layout approval cannot pass`, () => {
      const f = fixture(`control-${name.split(".")[0]}`);
      mutate(f.roots.run, name, (v) => {
        v.storage.layout = "legacy-ssd";
      });
      assert.throws(() => boundary.revalidate(f.ctx));
      assert.throws(f.load);
    });
  test("request candidate/revision and receipt control hashes remain bound", () => {
    const f = fixture("candidate-control");
    mutate(f.roots.run, "request.json", (v) => {
      v.candidate = "wp13-candidate-other";
      v.selectedRevision = "0".repeat(40);
    });
    assert.throws(f.load);
    assert.throws(() => boundary.revalidate(f.ctx));
  });
  for (const role of ["run", "producer", "tools"])
    test(`same-path ${role} inode swap cannot preserve lease`, () => {
      const f = fixture(`role-swap-${role}`);
      capacity(f.roots.namespace);
      fs.renameSync(f.roots[role], `${f.roots.namespace}/preserved-${role}`);
      fs.mkdirSync(f.roots[role], { mode: 0o700 });
      assert.throws(() => boundary.revalidate(f.ctx));
      assert.throws(() => f.ctx.run);
    });
  for (const marker of [
    ".git",
    "package.json",
    "pnpm-workspace.yaml",
    "pnpm-lock.yaml",
    ".npmrc",
    "node_modules",
  ])
    test(`namespace ancestor ${marker} is never waived by lease marker`, () => {
      const f = fixture(
        `ancestor-${marker.replaceAll(".", "").replaceAll("_", "-")}`,
      );
      capacity(f.roots.namespace);
      fs.writeFileSync(
        path.join(f.roots.namespace, marker),
        "rejection-only\n",
        { flag: "wx", mode: 0o600 },
      );
      assert.throws(() => boundary.revalidate(f.ctx));
      assert.throws(f.load);
    });
  for (const kind of ["existing", "dangling", "symlink"])
    test(`consumer fresh target rejects ${kind}`, () => {
      const f = fixture(`target-${kind}`),
        target = boundary.consumerPath(f.ctx);
      capacity(f.roots.namespace);
      if (kind === "existing") fs.mkdirSync(target, { mode: 0o700 });
      else
        fs.symlinkSync(
          kind === "dangling" ? `${f.roots.namespace}/absent` : f.roots.tools,
          target,
          "dir",
        );
      assert.throws(() => boundary.external(target, true, false, f.ctx));
    });
  test("consumer physical identity is pinned before a prepared receipt exists", () => {
    const f = fixture("consumer-inode"),
      target = boundary.consumerPath(f.ctx);
    boundary.external(target, true, false, f.ctx);
    capacity(f.roots.namespace);
    fs.mkdirSync(target, { mode: 0o700 });
    const captured = storage.captureConsumer(f.ctx, target);
    assert.equal(captured.identity.ino, fs.lstatSync(target).ino);
    fs.renameSync(target, `${f.roots.namespace}/preserved-consumer`);
    fs.mkdirSync(target, { mode: 0o700 });
    assert.throws(() => boundary.revalidate(f.ctx));
  });
  test("selected-device capacity and owned temp/cache are isolated and pinned", () => {
    const f = fixture("scratch-positive");
    const s = fs.statfsSync(f.roots.run);
    assert.ok(s.bavail * s.bsize >= 134217728);
    capacity(f.roots.run);
    const env = storage.scratch(f.ctx, true);
    assert.deepEqual(env, {
      TMPDIR: `${f.roots.run}/home/headless-ordinary/.cache/tmp`,
      TMP: `${f.roots.run}/home/headless-ordinary/.cache/tmp`,
      TEMP: `${f.roots.run}/home/headless-ordinary/.cache/tmp`,
      XDG_CACHE_HOME: `${f.roots.run}/home/headless-ordinary/.cache`,
    });
    for (const root of new Set(Object.values(env)))
      assert.equal(fs.lstatSync(root).dev, fs.lstatSync(f.roots.namespace).dev);
    fs.renameSync(env.TMPDIR, `${env.TMPDIR}-preserved`);
    fs.mkdirSync(env.TMPDIR, { mode: 0o700 });
    assert.throws(() => storage.scratch(f.ctx));
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.length !== 4 || process.argv[2] !== "--run")
    throw Error("Explicit main-selected guard run required");
  await register(process.argv[3]);
}
