import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { declared, packageRoot } from "../../controls/harness/resolve.mjs";
import { hash, own, root } from "./guard.mjs";

const rootRequire = createRequire(join(root, "package.json"));
const test = createRequire(rootRequire.resolve("@playwright/test"));
const playwright = createRequire(test.resolve("playwright"));
const browserFile = join(
  playwright.resolve("playwright-core/package.json"),
  "../browsers.json",
);
const browser = JSON.parse(await readFile(browserFile, "utf8")).browsers.filter(
  (item) => ["chromium", "chromium-headless-shell"].includes(item.name),
);
const versions = { node: process.version };
for (const [name, issuer] of [
  ["@playwright/test", "root"],
  ["vite", "root"],
  ["typescript", "root"],
  ["typescript-5-9", "root"],
  ["@biomejs/biome", "root"],
  ["react", "heroui"],
  ["@heroui/react", "heroui"],
  ["@heroui/styles", "heroui"],
  ["react-aria-components", "heroui"],
  ["@tanstack/react-table", "react"],
  ["@tanstack/table-core", "react"],
  ["@tailwindcss/vite", "storybook"],
  ["tailwindcss", "heroui"],
])
  versions[name] = JSON.parse(
    await readFile(join(packageRoot(name, issuer), "package.json"), "utf8"),
  ).version;
assert.equal(versions["@playwright/test"], "1.65.1");
assert.ok(declared("@heroui/styles/css").endsWith(".css"));
const checks = {};
for (const compiler of ["typescript", "typescript-5-9"]) {
  const log = await readFile(
    join(own, ".artifacts/types-authored", `${compiler}.log`),
    "utf8",
  );
  assert.equal(log, "");
  checks[compiler] = {
    strictSourceCompile: "passed",
    skipLibCheck: false,
    diagnosticsLog: log,
  };
}
checks.documentation = JSON.parse(
  await readFile(join(own, ".artifacts/docs.json"), "utf8"),
);
const before = JSON.parse(
  await readFile(join(own, ".artifacts/protected-before.json"), "utf8"),
);
const after = JSON.parse(
  await readFile(join(own, ".artifacts/protected-after.json"), "utf8"),
);
assert.deepEqual(after, before);
checks.protected = {
  identical: true,
  sources: Object.keys(after.source105).length,
  existingInputs: Object.keys(after.inputs).length,
  installedAssets: Object.keys(after.installed).length,
};
for (const [label, args] of [
  ["biome", [declared("@biomejs/biome/bin/biome", "root"), "check", own]],
]) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    encoding: "utf8",
  });
  checks[label] = {
    exitCode: result.status,
    output: result.stdout + result.stderr,
  };
  assert.equal(result.status, 0, checks[label].output);
}
const report = JSON.parse(
  await readFile(join(own, ".artifacts/browser-second/results.json"), "utf8"),
);
const files = {};
async function walk(directory) {
  for (const entry of await readdir(join(own, directory), {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);
    if (path === ".artifacts/vite-cache") continue;
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile())
      files[path] = hash(await readFile(join(own, path)));
  }
}
await walk("");
const ordered = Object.fromEntries(
  Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1)),
);
const authored = Object.fromEntries(
  Object.entries(ordered).filter(([path]) => !path.startsWith(".artifacts/")),
);
const handoff = {
  status: "provisional-authoring; fresh final browser phase deferred by user",
  suppliedHEAD: "0288904 (user supplied; no Git command run)",
  source105: "497a1e37cd60c4080243847760e23526b8fe7cb033627ead9c7042d3ca0b0790",
  versions,
  installedBrowserDescriptors: browser,
  viewport: { width: 1280, height: 800 },
  historicalRun: {
    generation: "browser-second",
    stats: report.stats,
    tests: 14,
  },
  currentAuthoredBrowserTests: 14,
  freshBrowserAfterCorrections: "NOT RUN",
  checks,
  newTestAggregate: hash(`${JSON.stringify(authored, null, 2)}\n`),
  authored,
  artifacts: ordered,
  exclusions: [".artifacts/vite-cache", ".artifacts/handoff.json (self)"],
};
await writeFile(
  join(own, ".artifacts/handoff.json"),
  `${JSON.stringify(handoff, null, 2)}\n`,
  { flag: "wx" },
);
console.log(
  JSON.stringify(
    {
      versions,
      browser,
      historicalStats: report.stats,
      newTestAggregate: handoff.newTestAggregate,
    },
    null,
    2,
  ),
);
