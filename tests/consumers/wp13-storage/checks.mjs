import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { scope } from "./evidence.mjs";

const own = "tests/consumers/wp13-storage";
const [action, label] = process.argv.slice(2);
if (
  ![
    "format",
    "light",
    "pins",
    "seal",
    "verify",
    "verify-pins",
    "history",
  ].includes(action) ||
  !/^[a-z]+-\d{3}$/.test(label ?? "")
)
  throw Error("Explicit owned evidence action and fresh label required");
const root = `${own}/${label}`;
const modules = [
  "cli.mjs",
  "lib/boundary.mjs",
  "lib/installer.mjs",
  "lib/generation.mjs",
  "lib/storage-roots.mjs",
].map((p) => `tests/consumers/wp13/${p}`);
const code = [
  ...modules,
  "tests/consumers/wp13/protocol.json",
  ...[
    "evidence.mjs",
    "checks.mjs",
    "static.mjs",
    "guards.mjs",
    "schema.ts",
    "tsconfig.json",
  ].map((p) => `${own}/${p}`),
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function entry(file) {
  const s = fs.statSync(file);
  return {
    mode: s.mode & 0o777,
    size: s.size,
    sha256: hash(fs.readFileSync(file)),
  };
}
function capacity() {
  const s = fs.statfsSync(".");
  if (s.bavail * s.bsize < 134217728) throw Error("E_CAPACITY_NO_CLEANUP");
}
function save(file, value) {
  capacity();
  fs.writeFileSync(`${root}/${file}`, `${JSON.stringify(value, null, 2)}\n`, {
    flag: "wx",
  });
}
function run(name, args, executable = process.execPath) {
  capacity();
  const result = spawnSync(executable, args, {
    encoding: "utf8",
    env: {
      PATH: path.dirname(process.execPath),
      HOME: "/nonexistent-wp13-storage-source",
      LANG: "C.UTF-8",
    },
    timeout: 480000,
    maxBuffer: 16 * 1024 * 1024,
  });
  capacity();
  fs.writeFileSync(`${root}/${name}.stdout.log`, result.stdout ?? "", {
    flag: "wx",
  });
  fs.writeFileSync(`${root}/${name}.stderr.log`, result.stderr ?? "", {
    flag: "wx",
  });
  const status = {
    executable,
    args,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
  };
  save(`${name}.status.json`, status);
  return { ...status, stdout: result.stdout ?? "" };
}
function list(dir, result = {}) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${item.name}`;
    if (file === `${root}/seal.json`) continue;
    if (item.isDirectory()) list(file, result);
    else if (item.isFile()) result[file] = entry(file);
    else throw Error(`E_SEAL_LINK ${file}`);
  }
  return result;
}
function compilerSnapshot() {
  const files = {};
  for (const file of [
    process.execPath,
    "node_modules/typescript/package.json",
    "node_modules/typescript/bin/tsc",
    "node_modules/typescript/lib/tsc.js",
    "node_modules/typescript/lib/_tsc.js",
    "node_modules/typescript/lib/typescript.js",
    "node_modules/@types/node/package.json",
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".npmrc",
    "tsconfig.base.json",
    "biome.json",
    "tests/consumers/wp13/tsconfig.light.json",
    `${own}/tsconfig.json`,
  ])
    files[fs.realpathSync(file)] = entry(file);
  const old = JSON.parse(fs.readFileSync(`${own}/before.json`));
  for (const file of Object.keys(old.pins)) files[file] = entry(file);
  const pin = `${own}/pins-001/inputs.json`;
  if (fs.existsSync(pin)) {
    for (const file of Object.keys(JSON.parse(fs.readFileSync(pin)).files))
      files[file] = entry(file);
  }
  for (const file of code) files[fs.realpathSync(file)] = entry(file);
  return files;
}
if (action === "verify-pins") {
  const pin = JSON.parse(fs.readFileSync(`${root}/inputs.json`));
  for (const [file, expected] of Object.entries(pin.files)) {
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
      throw Error(`E_PIN ${file}`);
  }
  console.log(
    JSON.stringify({
      inputs: Object.keys(pin.files).length,
      counts: pin.counts,
      pinSHA256: hash(fs.readFileSync(`${root}/inputs.json`)),
    }),
  );
} else if (action === "verify") {
  const sealed = JSON.parse(fs.readFileSync(`${root}/seal.json`));
  const current = {
    ...list(own),
    ...Object.fromEntries(
      [
        ...modules,
        "tests/consumers/wp13/protocol.json",
        "tests/consumers/wp13/README.md",
      ].map((file) => [file, entry(file)]),
    ),
  };
  if (JSON.stringify(current) !== JSON.stringify(sealed.files))
    throw Error("E_SEAL_SET_OR_BYTES");
  console.log(
    JSON.stringify({
      files: Object.keys(current).length,
      sealSHA256: hash(fs.readFileSync(`${root}/seal.json`)),
      scope: scope(),
    }),
  );
} else {
  capacity();
  if (fs.existsSync(root)) throw Error("Immutable evidence label exists");
  const before = compilerSnapshot(),
    scopeBefore = scope();
  fs.mkdirSync(root);
  save("source-inputs-before.json", {
    capturedAt: new Date().toISOString(),
    files: before,
  });
  const results = [];
  if (action === "history") {
    const original = JSON.parse(fs.readFileSync(`${own}/before.json`));
    const observations = [];
    for (const file of [
      "tests/consumers/wp13/evidence/source-seal-001/seal.json",
      "tests/consumers/wp13-runtime/evidence/seal-001/seal.json",
      "tests/consumers/wp13/evidence/positive-inputs-001/inputs.json",
      "tests/consumers/wp13-runtime/evidence/inputs-002/pin.json",
    ]) {
      const raw = fs.readFileSync(file),
        map = JSON.parse(raw).files;
      const beforeDrift = [],
        currentDrift = [],
        unavailableBefore = [];
      for (const [input, expected] of Object.entries(map)) {
        const absolute = path.resolve(input),
          relative = path.relative(process.cwd(), absolute);
        const prior = original.files[relative] ?? original.pins[absolute];
        if (!prior) unavailableBefore.push(input);
        else if (JSON.stringify(prior) !== JSON.stringify(expected))
          beforeDrift.push(input);
        if (JSON.stringify(entry(input)) !== JSON.stringify(expected))
          currentDrift.push(input);
      }
      observations.push({
        file,
        originalMapSHA256: hash(raw),
        entries: Object.keys(map).length,
        beforeDrift,
        currentDrift,
        unavailableBefore,
        status: "historical-map-not-resigned-not-a-current-pass",
      });
    }
    save("historical-disclosure.json", {
      capturedAt: new Date().toISOString(),
      observations,
    });
  }
  if (action === "format")
    results.push(
      run("biome", [
        "node_modules/@biomejs/biome/bin/biome",
        "check",
        "--write",
        "--assist-enabled=false",
        "--formatter-enabled=true",
        "--vcs-enabled=false",
        ...code,
      ]),
    );
  if (action === "light") {
    for (const [index, file] of [
      ...modules,
      ...code.filter((f) => f.startsWith(own) && f.endsWith(".mjs")),
    ].entries())
      results.push(run(`syntax-${index}`, ["--check", file]));
    results.push(run("AST", [`${own}/static.mjs`]));
    results.push(
      run("schema-positive", [
        "node_modules/typescript/bin/tsc",
        "-p",
        `${own}/tsconfig.json`,
        "--pretty",
        "false",
      ]),
    );
    results.push(
      run("public-positive", [
        "node_modules/typescript/bin/tsc",
        "-p",
        "tests/consumers/wp13/tsconfig.light.json",
        "--pretty",
        "false",
      ]),
    );
    results.push(
      run("biome", [
        "node_modules/@biomejs/biome/bin/biome",
        "check",
        "--assist-enabled=false",
        "--formatter-enabled=true",
        "--vcs-enabled=false",
        ...code,
      ]),
    );
  }
  if (action === "pins") {
    const files = compilerSnapshot();
    const counts = {};
    for (const [name, config] of [
      ["schema", `${own}/tsconfig.json`],
      ["public", "tests/consumers/wp13/tsconfig.light.json"],
    ]) {
      const result = run(`${name}-list-files`, [
        "node_modules/typescript/bin/tsc",
        "-p",
        config,
        "--listFilesOnly",
        "--pretty",
        "false",
      ]);
      results.push(result);
      if (result.status !== 0 || result.error)
        throw Error("Source graph listing failed; raw status preserved");
      const listed = result.stdout.trim().split(/\r?\n/);
      if (listed.length < 2 || !listed.every((file) => path.isAbsolute(file)))
        throw Error("Missing actual compiler graph");
      counts[name] = listed.length;
      for (const file of listed) files[fs.realpathSync(file)] = entry(file);
    }
    for (const file of [...code, "tests/consumers/wp13/README.md"])
      files[fs.realpathSync(file)] = entry(file);
    save("inputs.json", {
      capturedAt: new Date().toISOString(),
      status: "source-input-graph-only-MJS-unchecked",
      counts,
      files,
    });
  }
  const after = compilerSnapshot();
  save("source-inputs-after.json", {
    capturedAt: new Date().toISOString(),
    files: after,
  });
  const changedInputs = Object.keys(before).filter(
    (file) => JSON.stringify(before[file]) !== JSON.stringify(after[file]),
  );
  const passed =
    results.every((r) => r.status === 0 && !r.error) &&
    (action === "format" || changedInputs.length === 0);
  save("results.json", {
    action,
    status: passed ? "source-only-passed" : "failed-source-checks",
    results: results.map(({ stdout: _stdout, ...status }) => status),
    scopeBefore,
    scopeAfter: scope(),
    noRuntime: true,
    changedInputs,
  });
  if (action === "seal") {
    const files = {
      ...list(own),
      ...Object.fromEntries(
        [
          ...modules,
          "tests/consumers/wp13/protocol.json",
          "tests/consumers/wp13/README.md",
        ].map((file) => [file, entry(file)]),
      ),
    };
    save("seal.json", {
      capturedAt: new Date().toISOString(),
      status: "provisional-bounded-source-not-approval",
      files,
    });
  }
  console.log(
    JSON.stringify({
      action,
      passed,
      results: results.map((r) => r.status),
      scope: scope(),
    }),
  );
  if (!passed) process.exitCode = 1;
}
