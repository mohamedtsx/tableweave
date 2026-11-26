import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { descriptor, fixture, run, snapshot } from "./fixtures.mjs";

const success = "Tableweave RAC clone candidate profile verified.\n";
function rejected(f, code, args, env) {
  const before = snapshot(f.temp);
  const result = run(f, args, env);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.equal(
    result.stderr,
    `Tableweave RAC clone candidate profile verification failed: ${code}.\n`,
  );
  assert.ok(!result.stderr.includes(f.temp));
  assert.deepEqual(
    snapshot(f.temp),
    before,
    "verifier must not mutate fixtures",
  );
}
function caseTest(name, callback) {
  test(name, (t) => {
    const f = fixture();
    t.after(f.cleanup);
    callback(f);
  });
}
caseTest(
  "coherent JSON/runtime test double verifies read-only without executing sentinel vendor code",
  (f) => {
    const before = snapshot(f.temp);
    const result = run(f);
    assert.equal(result.status, 0);
    assert.equal(result.stdout, success);
    assert.equal(result.stderr, "");
    assert.deepEqual(snapshot(f.temp), before);
  },
);
caseTest("no root argument is rejected safely", (f) =>
  rejected(f, "E_ARGUMENT", []),
);
caseTest("extra arguments are rejected safely", (f) =>
  rejected(f, "E_ARGUMENT", [f.project, "enabled"]),
);
caseTest("nonexistent project is rejected safely", (f) =>
  rejected(f, "E_LAYOUT", [join(f.temp, "missing")]),
);
for (const name of [
  "runtime.patch",
  "README.md",
  "NOTICE-RAC",
  "LICENSE-APACHE-2.0",
  "verify.mjs",
]) {
  caseTest(`corrupt companion asset: ${name}`, (f) => {
    const path = join(f.assets, name);
    writeFileSync(
      path,
      `${readFileSync(path, "utf8")}\n// changed fixture bytes\n`,
    );
    rejected(f, "E_ASSET");
  });
}
caseTest("missing patch asset", (f) => {
  rmSync(join(f.assets, "runtime.patch"));
  rejected(f, "E_ASSET");
});
caseTest("missing descriptor", (f) => {
  rmSync(join(f.assets, "profile.json"));
  rejected(f, "E_DESCRIPTOR");
});
caseTest("invalid descriptor JSON", (f) => {
  writeFileSync(join(f.assets, "profile.json"), "{private synthetic error");
  rejected(f, "E_DESCRIPTOR");
});
for (const [name, mutate] of [
  [
    "enabled escape hatch",
    (d) => {
      d.enabled = true;
    },
  ],
  [
    "wrong schema",
    (d) => {
      d.schemaVersion = 2;
    },
  ],
  [
    "wrong package pin",
    (d) => {
      d.upstream.version = "1.22.2";
    },
  ],
  [
    "wrong registry integrity",
    (d) => {
      d.upstream.integrity = "sha512-wrong";
    },
  ],
  [
    "path escape",
    (d) => {
      d.files[0].path = "../private";
    },
  ],
  [
    "wrong source hash",
    (d) => {
      d.files[0].beforeSha256 = "0".repeat(64);
    },
  ],
  [
    "malformed output hash",
    (d) => {
      d.files[0].afterSha256 = true;
    },
  ],
  [
    "wrong output hash",
    (d) => {
      d.files[0].afterSha256 = "0".repeat(64);
    },
  ],
  [
    "extra runtime target",
    (d) => {
      d.files.push(d.files[0]);
    },
  ],
  [
    "format mismatch",
    (d) => {
      d.files[1].format = "commonjs";
    },
  ],
  [
    "extra asset path",
    (d) => {
      d.assets["../private"] = "0".repeat(64);
    },
  ],
])
  caseTest(`descriptor rejects ${name}`, (f) => {
    descriptor(f, mutate);
    rejected(f, name === "wrong output hash" ? "E_VENDOR" : "E_DESCRIPTOR");
  });
caseTest(
  "JSON prototype-looking properties are data, not an options/callback port",
  (f) => {
    const path = join(f.assets, "profile.json");
    writeFileSync(
      path,
      readFileSync(path, "utf8").replace("{", '{"__proto__":{"enabled":true},'),
    );
    rejected(f, "E_DESCRIPTOR");
  },
);
caseTest("unpatched test-double bytes fail", (f) => {
  writeFileSync(
    join(f.vendor, "dist/private/Table.mjs"),
    "// synthetic unpatched bytes\n",
  );
  rejected(f, "E_VENDOR");
});
caseTest(
  "mixed runtime formats fail even though package version matches",
  (f) => {
    cpSync(
      join(f.vendor, "dist/private/Table.js"),
      join(f.vendor, "dist/private/Table.mjs"),
    );
    rejected(f, "E_VENDOR");
  },
);
caseTest("missing runtime file", (f) => {
  rmSync(join(f.vendor, "dist/private/Table.cjs"));
  rejected(f, "E_VENDOR");
});
caseTest("wrong vendor version", (f) => {
  writeFileSync(
    join(f.vendor, "package.json"),
    JSON.stringify({ name: "react-aria-components", version: "1.22.2" }),
  );
  rejected(f, "E_VENDOR");
});
caseTest("wrong vendor name", (f) => {
  writeFileSync(
    join(f.vendor, "package.json"),
    JSON.stringify({ name: "vendor-alias", version: "1.22.1" }),
  );
  rejected(f, "E_VENDOR");
});
caseTest(
  "unrelated declaration modifications do not pretend the whole package is unpatched",
  (f) => {
    mkdirSync(join(f.vendor, "dist/types"), { recursive: true });
    writeFileSync(
      join(f.vendor, "dist/types/fixture.d.ts"),
      "// unrelated declaration fixture\n",
    );
    assert.equal(run(f).status, 0);
  },
);
for (const spec of [undefined, "^1.22.1", "npm:react-aria-components@1.22.1"]) {
  caseTest(
    `manifest must declare its own exact dependency: ${spec ?? "absent"}`,
    (f) => {
      writeFileSync(
        join(f.project, "package.json"),
        JSON.stringify({
          dependencies: spec ? { "react-aria-components": spec } : {},
        }),
      );
      rejected(f, "E_LAYOUT");
    },
  );
}
caseTest(
  "parent/global fallback cannot replace missing local node_modules",
  (f) => {
    renameSync(join(f.project, "node_modules"), join(f.temp, "node_modules"));
    rejected(f, "E_LAYOUT", undefined, {
      NODE_PATH: join(f.temp, "node_modules"),
    });
  },
);
caseTest("borrowed node_modules symlink is rejected", (f) => {
  const borrowed = join(f.temp, "borrowed-modules");
  renameSync(join(f.project, "node_modules"), borrowed);
  symlinkSync(borrowed, join(f.project, "node_modules"), "dir");
  rejected(f, "E_LAYOUT");
});
caseTest("vendor package outside consumer is rejected", (f) => {
  const outside = join(f.temp, "outside-vendor");
  renameSync(f.vendor, outside);
  rmSync(join(f.project, "node_modules/react-aria-components"));
  symlinkSync(
    outside,
    join(f.project, "node_modules/react-aria-components"),
    "dir",
  );
  rejected(f, "E_LAYOUT");
});
caseTest("runtime symlink escape is rejected even with matching bytes", (f) => {
  const source = join(f.vendor, "dist/private/Table.mjs"),
    outside = join(f.project, "escaped-runtime");
  cpSync(source, outside);
  rmSync(source);
  symlinkSync(outside, source);
  rejected(f, "E_VENDOR");
});
caseTest("asset symlink escape is rejected even with matching bytes", (f) => {
  const source = join(f.assets, "runtime.patch"),
    outside = join(f.temp, "escaped-patch");
  cpSync(source, outside);
  rmSync(source);
  symlinkSync(outside, source);
  rejected(f, "E_ASSET");
});
caseTest("descriptor symlink escape is rejected", (f) => {
  const source = join(f.assets, "profile.json"),
    outside = join(f.temp, "escaped-profile");
  cpSync(source, outside);
  rmSync(source);
  symlinkSync(outside, source);
  rejected(f, "E_DESCRIPTOR");
});
caseTest("project manifest symlink escape is rejected", (f) => {
  const source = join(f.project, "package.json"),
    outside = join(f.temp, "escaped-manifest");
  cpSync(source, outside);
  rmSync(source);
  symlinkSync(outside, source);
  rejected(f, "E_LAYOUT");
});
caseTest("package metadata export cannot alias another manifest", (f) => {
  writeFileSync(
    join(f.vendor, "alias.json"),
    JSON.stringify({ name: "react-aria-components", version: "1.22.1" }),
  );
  writeFileSync(
    join(f.vendor, "package.json"),
    JSON.stringify({
      name: "react-aria-components",
      version: "1.22.1",
      exports: { "./package.json": "./alias.json" },
    }),
  );
  rejected(f, "E_LAYOUT");
});
caseTest(
  "ordinary npm-shaped package is outside this deliberately narrow pnpm layout",
  (f) => {
    rmSync(join(f.project, "node_modules/react-aria-components"));
    renameSync(f.vendor, join(f.project, "node_modules/react-aria-components"));
    rejected(f, "E_LAYOUT");
  },
);
