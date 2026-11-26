import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const own = "tests/consumers/wp13-storage-correction";
const oldOwn = "tests/consumers/wp13-storage";
const raw = `${oldOwn}/preimage-tests__consumers__wp13__README.md`;
const moved = `${raw}.txt`;
const changed = [
  "tests/consumers/wp13/lib/runtime.mjs",
  "tests/consumers/wp13/lib/storage-roots.mjs",
  `${oldOwn}/README.md`,
];
const configs = [
  `${oldOwn}/tsconfig.json`,
  "tests/consumers/wp13/tsconfig.light.json",
];
const oldCode = [
  "tests/consumers/wp13/cli.mjs",
  "tests/consumers/wp13/lib/boundary.mjs",
  "tests/consumers/wp13/lib/installer.mjs",
  "tests/consumers/wp13/lib/generation.mjs",
  "tests/consumers/wp13/lib/storage-roots.mjs",
  "tests/consumers/wp13/protocol.json",
  ...[
    "evidence.mjs",
    "checks.mjs",
    "static.mjs",
    "guards.mjs",
    "schema.ts",
    "tsconfig.json",
  ].map((f) => `${oldOwn}/${f}`),
];
const code = [
  ...oldCode,
  changed[0],
  ...["proof.mjs", "static.mjs", "guards.mjs"].map((f) => `${own}/${f}`),
];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function entry(file) {
  const s = fs.statSync(file);
  return {
    mode: s.mode & 0o777,
    size: s.size,
    sha256: sha(fs.readFileSync(file)),
  };
}
function capacity() {
  const s = fs.statfsSync(".");
  const free = s.bavail * s.bsize;
  if (free < 134217728) throw Error("E_CAPACITY_NO_CLEANUP");
  return free;
}
function inventory(dir = "", out = {}) {
  for (const item of fs.readdirSync(dir || ".", { withFileTypes: true })) {
    const file = dir ? `${dir}/${item.name}` : item.name;
    if (
      [".git", ".repo", "node_modules"].includes(item.name) ||
      file === own ||
      /^\.env(?:\.|$)|\.(?:pem|key)$/.test(item.name)
    )
      continue;
    if (item.isDirectory()) inventory(file, out);
    else if (item.isFile()) out[file] = entry(file);
  }
  return out;
}
function save(root, file, value) {
  capacity();
  fs.writeFileSync(`${root}/${file}`, `${JSON.stringify(value, null, 2)}\n`, {
    flag: "wx",
  });
}
function currentPins() {
  const old = JSON.parse(fs.readFileSync(`${oldOwn}/pins-001/inputs.json`));
  const files = {};
  for (const file of Object.keys(old.files)) files[file] = entry(file);
  files[path.resolve(changed[0])] = entry(changed[0]);
  files[path.resolve(changed[2])] = entry(changed[2]);
  for (const file of code)
    if (fs.existsSync(file)) files[path.resolve(file)] = entry(file);
  // These are also source-check inputs, not merely output artifacts: scope and
  // AST assertions read their exact bytes. Pin them before/after the final check.
  for (const file of [
    `${own}/before-001/before.json`,
    `${own}/before-001/runtime.mjs.preimage.txt`,
    `${own}/before-001/storage-roots.mjs.preimage.txt`,
    `${own}/before-001/README.md.preimage.txt`,
    `${oldOwn}/source155.json`,
    `${oldOwn}/pins-001/inputs.json`,
    `${oldOwn}/seal-001/seal.json`,
    fs.existsSync(moved) ? moved : raw,
  ])
    if (fs.existsSync(file)) files[path.resolve(file)] = entry(file);
  const pin = `${own}/pins-001/inputs.json`;
  if (fs.existsSync(pin))
    for (const file of Object.keys(JSON.parse(fs.readFileSync(pin)).files))
      files[file] = entry(file);
  return files;
}
function scope() {
  const before = JSON.parse(fs.readFileSync(`${own}/before-001/before.json`));
  const now = inventory(),
    delta = [],
    metadata = [];
  for (const file of new Set([
    ...Object.keys(before.files),
    ...Object.keys(now),
  ])) {
    if (JSON.stringify(before.files[file]) === JSON.stringify(now[file]))
      continue;
    if (changed.includes(file) || [raw, moved].includes(file)) delta.push(file);
    else if (/^(?:TASKS|REVIEW|README)\.md$|^docs\//.test(file))
      metadata.push(file);
    else throw Error(`E_SCOPE ${file}`);
  }
  if (fs.existsSync(moved)) {
    if (
      fs.existsSync(raw) ||
      JSON.stringify(entry(moved)) !== JSON.stringify(before.files[raw])
    )
      throw Error("E_RAW_RENAME_BYTES_MODE_OR_OLD_PATH");
  } else if (!fs.existsSync(raw)) throw Error("E_RAW_MISSING");
  const canonical = fs.readFileSync(`${oldOwn}/source155.json`);
  if (
    sha(canonical) !==
    "bdfabdedcb23cb53244e9e9298cc234717a3cc526f0c97c2d46e3dfe6dcf1837"
  )
    throw Error("E_CANONICAL_MAP");
  const source = JSON.parse(canonical);
  for (const [file, expected] of Object.entries(source)) {
    const actual = entry(file);
    if (
      actual.sha256 !== expected.sha256 ||
      (actual.mode & 0o111) !== (parseInt(expected.mode, 8) & 0o111)
    )
      throw Error(`E_CANONICAL ${file}`);
  }
  const pinDrift = [],
    newOwnPinDrift = [];
  for (const [file, expected] of Object.entries(before.pins)) {
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected)) {
      const relative = path.relative(process.cwd(), file);
      if (relative.startsWith(`${own}/`)) newOwnPinDrift.push(file);
      else {
        if (!changed.includes(relative)) throw Error(`E_PIN ${file}`);
        pinDrift.push(file);
      }
    }
  }
  return {
    oldRegularFiles: Object.keys(before.files).length,
    canonical155: Object.keys(source).length,
    delta,
    metadata,
    pinDrift,
    newOwnPinDrift,
    rename: fs.existsSync(moved) ? entry(moved) : "not-yet-renamed",
  };
}
function run(root, name, args) {
  capacity();
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    timeout: 480000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      PATH: path.dirname(process.execPath),
      HOME: "/nonexistent-wp13-storage-correction-source",
      LANG: "C.UTF-8",
    },
  });
  capacity();
  fs.writeFileSync(`${root}/${name}.stdout.log`, result.stdout ?? "", {
    flag: "wx",
  });
  fs.writeFileSync(`${root}/${name}.stderr.log`, result.stderr ?? "", {
    flag: "wx",
  });
  const status = {
    executable: process.execPath,
    args,
    status: result.status,
    signal: result.signal,
    error: result.error ? String(result.error) : null,
  };
  save(root, `${name}.status.json`, status);
  return { ...status, stdout: result.stdout ?? "" };
}
function list(dir, excluded, out = {}) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = `${dir}/${item.name}`;
    if (file === excluded) continue;
    if (item.isDirectory()) list(file, excluded, out);
    else if (item.isFile()) out[file] = entry(file);
    else throw Error(`E_SEAL_LINK ${file}`);
  }
  return out;
}
const [action, label] = process.argv.slice(2);
if (
  ![
    "before",
    "format",
    "light",
    "pins",
    "verify-pins",
    "seal",
    "verify",
    "scope",
  ].includes(action) ||
  !/^[a-z]+-\d{3}$/.test(label ?? "")
)
  throw Error("Explicit correction evidence action/fresh label required");
const root = `${own}/${label}`;
if (action === "verify-pins") {
  const pin = JSON.parse(fs.readFileSync(`${root}/inputs.json`));
  for (const [file, expected] of Object.entries(pin.files))
    if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
      throw Error(`E_CURRENT_PIN ${file}`);
  console.log(
    JSON.stringify({
      inputs: Object.keys(pin.files).length,
      counts: pin.counts,
      sha256: sha(fs.readFileSync(`${root}/inputs.json`)),
      scope: scope(),
    }),
  );
} else if (action === "scope") console.log(JSON.stringify(scope()));
else if (action === "verify") {
  const sealed = JSON.parse(fs.readFileSync(`${root}/seal.json`));
  const files = {
    ...list(own, `${root}/seal.json`),
    ...Object.fromEntries([...changed, moved].map((f) => [f, entry(f)])),
  };
  if (JSON.stringify(files) !== JSON.stringify(sealed.files))
    throw Error("E_SEAL_EXACT_SET_MODES_BYTES");
  console.log(
    JSON.stringify({
      entries: Object.keys(files).length,
      sha256: sha(fs.readFileSync(`${root}/seal.json`)),
      scope: scope(),
    }),
  );
} else {
  const free = capacity();
  if (fs.existsSync(root)) throw Error("Immutable correction label exists");
  const filesBefore = action === "before" ? inventory() : null;
  const pinsBefore = currentPins();
  const scopeBefore = action === "before" ? null : scope();
  fs.mkdirSync(root);
  save(root, "inputs-before.json", {
    capturedAt: new Date().toISOString(),
    files: pinsBefore,
  });
  const results = [];
  if (action === "before") {
    for (const file of changed)
      fs.writeFileSync(
        `${root}/${path.basename(file)}.preimage.txt`,
        fs.readFileSync(file),
        { flag: "wx" },
      );
    const graph = {};
    for (const [index, config] of configs.entries()) {
      const result = run(root, `before-graph-${index}`, [
        "node_modules/typescript/bin/tsc",
        "-p",
        config,
        "--listFilesOnly",
        "--pretty",
        "false",
      ]);
      results.push(result);
      if (result.status !== 0 || result.error)
        throw Error("Before graph failed; raw retained");
      for (const file of result.stdout.trim().split(/\r?\n/)) {
        if (!path.isAbsolute(file)) throw Error("E_GRAPH");
        graph[fs.realpathSync(file)] = entry(file);
      }
    }
    save(root, "before.json", {
      capturedAt: new Date().toISOString(),
      suppliedProducer: "af5ad20 (main supplied; no worker Git)",
      free,
      files: filesBefore,
      pins: { ...pinsBefore, ...graph },
      original184SealSHA256: sha(
        fs.readFileSync(`${oldOwn}/seal-001/seal.json`),
      ),
      rawPreimage: { path: raw, ...entry(raw) },
    });
  }
  if (["format", "light"].includes(action)) {
    if (action === "light") {
      for (const [i, file] of code.filter((f) => f.endsWith(".mjs")).entries())
        results.push(run(root, `syntax-${i}`, ["--check", file]));
      results.push(run(root, "static", [`${own}/static.mjs`]));
      for (const [i, config] of configs.entries())
        results.push(
          run(root, `positive-${i}`, [
            "node_modules/typescript/bin/tsc",
            "-p",
            config,
            "--pretty",
            "false",
          ]),
        );
    }
    results.push(
      run(root, "biome", [
        "node_modules/@biomejs/biome/bin/biome",
        "check",
        ...(action === "format" ? ["--write"] : []),
        "--assist-enabled=false",
        "--formatter-enabled=true",
        "--vcs-enabled=false",
        ...code,
      ]),
    );
  }
  if (action === "pins") {
    const files = currentPins(),
      counts = {};
    for (const [i, config] of configs.entries()) {
      const result = run(root, `graph-${i}`, [
        "node_modules/typescript/bin/tsc",
        "-p",
        config,
        "--listFilesOnly",
        "--pretty",
        "false",
      ]);
      results.push(result);
      if (result.status !== 0 || result.error)
        throw Error("Current graph failed; raw retained");
      const listed = result.stdout.trim().split(/\r?\n/);
      counts[config] = listed.length;
      for (const file of listed) {
        if (!path.isAbsolute(file)) throw Error("E_GRAPH");
        files[fs.realpathSync(file)] = entry(file);
      }
    }
    save(root, "inputs.json", {
      capturedAt: new Date().toISOString(),
      status: "actual-source-graphs-not-MJS-typing-or-runtime",
      counts,
      files,
    });
  }
  const after = currentPins();
  save(root, "inputs-after.json", {
    capturedAt: new Date().toISOString(),
    files: after,
  });
  const changedDuring = Object.keys(pinsBefore).filter(
    (f) => JSON.stringify(pinsBefore[f]) !== JSON.stringify(after[f]),
  );
  const passed =
    results.every((r) => r.status === 0 && !r.error) &&
    (action === "format" || changedDuring.length === 0);
  save(root, "results.json", {
    action,
    status: passed ? "source-only-completed" : "failed-source-check",
    results: results.map(({ stdout: _stdout, ...r }) => r),
    changedDuring,
    scopeBefore,
    scopeAfter: scope(),
  });
  if (action === "seal") {
    const original = JSON.parse(
      fs.readFileSync(`${oldOwn}/seal-001/seal.json`),
    );
    const differences = [];
    for (const [file, expected] of Object.entries(original.files)) {
      if (!fs.existsSync(file))
        differences.push({
          file,
          status: "authorized-path-relocation",
          current: moved,
          expected,
          actual: entry(moved),
        });
      else if (JSON.stringify(entry(file)) !== JSON.stringify(expected))
        differences.push({
          file,
          status: "authorized-body-change",
          expected,
          actual: entry(file),
        });
    }
    save(root, "historical184-disclosure.json", {
      originalProducer: "af5ad20 (main supplied)",
      originalSealSHA256: sha(fs.readFileSync(`${oldOwn}/seal-001/seal.json`)),
      status: "historical-original-file-set-not-current-pass",
      differences,
    });
    save(root, "seal.json", {
      capturedAt: new Date().toISOString(),
      status: "provisional-correction-source-not-review-approval",
      files: {
        ...list(own, `${root}/seal.json`),
        ...Object.fromEntries([...changed, moved].map((f) => [f, entry(f)])),
      },
    });
  }
  console.log(
    JSON.stringify({
      action,
      passed,
      statuses: results.map((r) => r.status),
      scope: scope(),
    }),
  );
  if (!passed) process.exitCode = 1;
}
