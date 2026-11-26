// FINAL UNRUN. UNIT_SYNTHETIC rejection/deferred handles, no native/frame/measurement grants.
import assert from "node:assert/strict";
import { it } from "node:test";
import { readFileSync } from "node:fs";
import {
  packagedRac,
  RAC_FILES,
  requireIndependentFiles,
  requireOrdinaryRuntimeMap,
  requireRuntimeMaps,
  validateProfileConfig,
  validateConsumerManifest,
  validateRacDescriptor,
} from "../wp14/candidate.mjs";
import {
  boundedOwnedWait,
  closeOwnedContext,
  closeOwnedServer,
  finishOwnedTrace,
  retainPrimary,
  runOwnedCleanup,
} from "../wp14/driver.mjs";
function descriptor() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../packages/heroui/compat/rac-table-clone/profile.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function status(value: unknown): unknown {
  assert.ok(value && typeof value === "object" && "status" in value);
  return value.status;
}
function unitNpmrc() {
  return "registry=https://registry.npmjs.org/\nsave-exact=true\nstrict-peer-dependencies=true\nauto-install-peers=false\nengine-strict=true\npackage-manager-strict=true\nignore-scripts=true\nignore-pnpmfile=true\nshared-workspace-lockfile=false\nnode-linker=isolated\npackage-import-method=copy\nstore-dir=/tmp/opencode/UNIT_SYNTHETIC_store\n";
}
it("rejects canonical descriptor wrong id/version/upstream/runtime sets and canonical hashes", () => {
  for (const mutate of [
    (value: ReturnType<typeof descriptor>) => {
      value.id = "wrong";
    },
    (value: ReturnType<typeof descriptor>) => {
      value.schemaVersion = 2;
    },
    (value: ReturnType<typeof descriptor>) => {
      value.upstream.version = "1.22.0";
    },
    (value: ReturnType<typeof descriptor>) => {
      value.files = value.files.slice(0, 1);
    },
    (value: ReturnType<typeof descriptor>) => {
      value.files[0].path = "dist/arbitrary.js";
    },
    (value: ReturnType<typeof descriptor>) => {
      value.files[0].beforeSha256 = "f".repeat(64);
    },
    (value: ReturnType<typeof descriptor>) => {
      value.files[0].afterSha256 = "f".repeat(64);
    },
    (value: ReturnType<typeof descriptor>) => {
      value.assets["verify.mjs"] = "f".repeat(64);
    },
  ]) {
    const value = descriptor();
    mutate(value);
    assert.throws(() => validateRacDescriptor(value));
  }
});
it("rejects missing/synthetic packaged assets; never produces a positive archive/profile certificate", () => {
  assert.throws(() => packagedRac(new Map()));
  const members = new Map([
    [
      "package/compat/rac-table-clone/profile.json",
      { type: "file", bytes: Buffer.from(JSON.stringify(descriptor())) },
    ],
  ]);
  assert.throws(() => packagedRac(members));
  for (const name of [
    "runtime.patch",
    "verify.mjs",
    "README.md",
    "NOTICE-RAC",
    "LICENSE-APACHE-2.0",
  ])
    members.set(`package/compat/rac-table-clone/${name}`, {
      type: "file",
      bytes: Buffer.from("UNIT_SYNTHETIC_NOT_A_VENDOR_ASSET"),
    });
  assert.throws(() => packagedRac(members));
});
it("rejects partial/loose before/after/asset maps and wrong runtime hashes", () => {
  const before = RAC_FILES.map(
      (file) => `node_modules/UNIT_ordinary/${file.path}`,
    ),
    after = RAC_FILES.map((file) => `node_modules/UNIT_private/${file.path}`);
  assert.throws(() =>
    requireRuntimeMaps({ assets: {}, before: {}, after: {} }, before, after),
  );
  assert.throws(() =>
    requireRuntimeMaps(
      {
        assets: { arbitrary: {} },
        before: { arbitrary: {} },
        after: { arbitrary: {} },
      },
      before,
      after,
    ),
  );
  const assets = Object.fromEntries(
    [
      "profile.json",
      "runtime.patch",
      "verify.mjs",
      "README.md",
      "NOTICE-RAC",
      "LICENSE-APACHE-2.0",
    ].map((name) => [`patches/tableweave-rac-table-clone/${name}`, {}]),
  );
  const bad = {
    assets,
    before: Object.fromEntries(
      RAC_FILES.map((file, index) => [
        before[index],
        { sha256: file.beforeSha256 },
      ]),
    ),
    after: Object.fromEntries(
      RAC_FILES.map((file, index) => [
        after[index],
        { sha256: file.afterSha256 },
      ]),
    ),
  };
  const first = after[0];
  const firstCanonical = RAC_FILES[0];
  if (!first || !firstCanonical) throw new Error("UNIT_SYNTHETIC_PATH");
  bad.after[first] = { sha256: "f".repeat(64) };
  assert.throws(() => requireRuntimeMaps(bad, before, after));
  bad.after[first] = { sha256: firstCanonical.afterSha256 };
  const beforeFirst = before[0];
  if (!beforeFirst) throw new Error("UNIT_SYNTHETIC_PATH");
  bad.before[beforeFirst] = { sha256: "f".repeat(64) };
  assert.throws(() => requireRuntimeMaps(bad, before, after));
  bad.before[beforeFirst] = { sha256: firstCanonical.beforeSha256 };
  for (const map of ["before", "after", "assets"] as const) {
    const partial = {
      ...bad,
      [map]: Object.fromEntries(Object.entries(bad[map]).slice(1)),
    };
    assert.throws(() => requireRuntimeMaps(partial, before, after));
  }
  assert.throws(() =>
    requireOrdinaryRuntimeMap(
      { inputs: { arbitrary: { sha256: "f".repeat(64) } } },
      before,
    ),
  );
  assert.throws(() => requireOrdinaryRuntimeMap({ inputs: {} }, before));
});
it("rejects shared inodes/hardlinks rather than interpreting a reviewed map as copy independence", () => {
  assert.throws(() =>
    requireIndependentFiles(
      { dev: 1, ino: 2, nlink: 1 },
      { dev: 1, ino: 2, nlink: 1 },
    ),
  );
  assert.throws(() =>
    requireIndependentFiles(
      { dev: 1, ino: 2, nlink: 2 },
      { dev: 1, ino: 3, nlink: 1 },
    ),
  );
});
it("rejects extra workspace registrations, SDK stack, unknown/duplicate/override npmrc flags", () => {
  const manifest = {
    private: true,
    type: "module",
    packageManager: "pnpm@10.13.1",
    dependencies: {},
  };
  for (const override of [
    {
      pnpm: {
        patchedDependencies: {
          "react-aria-components@1.22.1":
            "UNIT_SYNTHETIC_ROOT_DECLARATION.patch",
        },
      },
    },
    { overrides: {} },
    { workspaces: [] },
    { scripts: {} },
  ])
    assert.throws(() => validateConsumerManifest({ ...manifest, ...override }));
  assert.throws(() =>
    validateConsumerManifest({
      ...manifest,
      dependencies: { "react-aria-components": "1.22.0" },
      devDependencies: { "react-aria-components": "1.22.1" },
    }),
  );
  const ordinary = "packages: []\n",
    rac = `${ordinary}patchedDependencies:\n  'react-aria-components@1.22.1': patches/tableweave-rac-table-clone/runtime.patch\n`;
  assert.throws(() => validateProfileConfig("ordinary", rac, unitNpmrc()));
  assert.throws(() =>
    validateProfileConfig(
      "rac-runtime",
      `${rac}packageExtensions: {}\n`,
      unitNpmrc(),
    ),
  );
  assert.throws(() =>
    validateProfileConfig("rac-runtime", ordinary, unitNpmrc()),
  );
  for (const config of [
    `${unitNpmrc()}ignore-scripts=false\n`,
    `${unitNpmrc()}strict-peer-dependencies=false\n`,
    `${unitNpmrc()}unknown=true\n`,
    unitNpmrc().replace(
      "package-import-method=copy",
      "package-import-method=hardlink",
    ),
  ])
    assert.throws(() => validateProfileConfig("ordinary", ordinary, config));
});
it("timeout remains immutable failure after deferred UNIT_SYNTHETIC task resolves late", async () => {
  let release: () => void = () => assert.fail("not initialized");
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const result = await boundedOwnedWait("UNIT_SYNTHETIC_late", () => held, 1);
  assert.equal(status(result), "timeout");
  assert.equal(Object.isFrozen(result), true);
  release();
  await held;
  await Promise.resolve();
  assert.equal(status(result), "timeout");
});
it("independent cleanup steps all attempted, multiple errors/deadline debts retained with original primary", async () => {
  const calls: string[] = [],
    primary = new Error("UNIT_SYNTHETIC_PRIMARY");
  const result = await runOwnedCleanup(
    [
      {
        label: "source",
        action: () => {
          calls.push("source");
          throw new Error("UNIT_SYNTHETIC_SOURCE");
        },
      },
      {
        label: "trace",
        action: () => {
          calls.push("trace");
          return new Promise<void>(() => {});
        },
      },
      {
        label: "context",
        action: () => {
          calls.push("context");
          throw new Error("UNIT_SYNTHETIC_CONTEXT");
        },
      },
    ],
    1,
  );
  assert.deepEqual(calls, ["source", "trace", "context"]);
  assert.equal(result.debts.length, 3);
  assert.equal(
    retainPrimary(primary, new Error("UNIT_SYNTHETIC_CLEANUP")),
    primary,
  );
});
it("trace completion never signals but detach is still attempted; no fake paint or completion", async () => {
  const calls: string[] = [];
  const result = await finishOwnedTrace(
    {
      send: async () => {
        calls.push("end");
      },
      detach: async () => {
        calls.push("detach");
      },
    },
    new Promise<void>(() => {}),
    1,
  );
  assert.deepEqual(calls, ["end", "detach"]);
  assert.equal(result.debts.length, 1);
  const rejected = await finishOwnedTrace(
    {
      send: async () => {
        throw new Error("E_UNIT_SYNTHETIC_END");
      },
      detach: async () => {
        calls.push("detach-after-rejection");
      },
    },
    new Promise<void>(() => {}),
    1,
  );
  assert.equal(rejected.debts.length, 2);
  assert.equal(calls.at(-1), "detach-after-rejection");
});
it("context timeout uses only its owned browser fallback; late success cannot clear debt", async () => {
  let release: () => void = () => assert.fail("not initialized");
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let fallback = false;
  const result = await closeOwnedContext(
    { close: () => held },
    {
      close: async () => {
        fallback = true;
      },
    },
    1,
  );
  assert.equal(fallback, true);
  assert.equal(result.debts.length, 1);
  release();
  await held;
  assert.equal(result.debts.length, 1);
});
it("owned HTTP callback never returns: idle/all-connections fallback attempted, unresolved debt not erased", async () => {
  const calls: string[] = [];
  const result = await closeOwnedServer(
    {
      close: () => {
        calls.push("close");
      },
      closeIdleConnections: () => {
        calls.push("idle");
      },
      closeAllConnections: () => {
        calls.push("all");
      },
    },
    1,
  );
  assert.deepEqual(calls, ["close", "idle", "all"]);
  assert.equal(result.debts.length, 2);
});
