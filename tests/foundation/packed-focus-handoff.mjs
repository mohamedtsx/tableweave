import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  realpath,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { checkConsumerDeclarations } from "./consumer-declarations.mjs";

const PUBLIC_SHA256 =
  "de82ce232f3021a754b1e30df780eac27cd358604766cde4110cc922bf25f095";
const TOOLBAR_SOURCE_SHA256 =
  "4ce900626de4479db7d1d69a7c51db64fca4fbd41ede957280189d82ca347144";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sorted = (entries) =>
  Object.fromEntries(
    Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)),
  );
const within = (parent, child) => child.startsWith(`${parent}${sep}`);

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

/** Hash regular files and link targets; never follow links to copy vendor data. */
async function tree(root, { omit = [], localLinks = false } = {}) {
  const entries = {};
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const name = path.slice(root.length + 1);
      if (omit.includes(name)) continue;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push([name, path]);
      else if (entry.isSymbolicLink()) {
        if (localLinks)
          assert(
            within(root, await realpath(path)),
            `External install link: ${path}`,
          );
        entries[name] = { link: await readlink(path) };
      } else assert.fail(`Unexpected protected filesystem entry: ${path}`);
    }
  }
  await walk(root);
  for (let start = 0; start < files.length; start += 32)
    await Promise.all(
      files.slice(start, start + 32).map(async ([name, path]) => {
        entries[name] = sha256(await readFile(path));
      }),
    );
  return sorted(entries);
}

async function regular(base, relative) {
  const path = join(base, relative);
  assert(
    (await lstat(path)).isFile(),
    `Only regular owned inputs: ${relative}`,
  );
  assert.equal(
    await realpath(path),
    path,
    `Symlinked input refused: ${relative}`,
  );
  return readFile(path);
}

/** A fixed source allowlist, not a general workspace/source staging mechanism. */
function auditImports(relative, bytes, allowed) {
  const text = bytes.toString("utf8");
  assert(
    !/packages\/(?:react|heroui)\/(?:src|dist)|\.repo\//.test(text),
    `Source/public-export bypass in ${relative}`,
  );
  assert(
    !/\b(?:require|import)\s*\(/.test(text),
    "No dynamic dependency staging",
  );
  const bare = new Set([
    "@tableweave/heroui",
    "@tableweave/heroui/styles.css",
    "@tableweave/react",
    "@tableweave/react/contracts",
    "@tableweave/react/filters",
    "@heroui/styles/css",
    "react",
    "react-dom/client",
    "react-aria-components/I18nProvider",
    "@playwright/test",
    "tailwindcss",
  ]);
  for (const match of text.matchAll(
    /\b(?:from\s+|import\s*)["']([^"']+)["']/g,
  )) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) {
      assert(bare.has(specifier), `Unapproved source dependency: ${specifier}`);
      continue;
    }
    const target = resolve("/staged", dirname(relative), specifier);
    const candidates = [
      target,
      target.replace(/\.js$/, ".ts"),
      target.replace(/\.js$/, ".tsx"),
    ];
    assert(
      candidates.some((candidate) => allowed.has(candidate)),
      `Relative import escapes exact staged inputs: ${relative} -> ${specifier}`,
    );
  }
}

/** Additional genuine-production proof; never installs or repairs a consumer. */
export async function checkPackedFocusHandoff(root, consumer) {
  root = await realpath(root);
  consumer = await realpath(consumer);
  assert(
    within(join(root, ".artifacts"), consumer),
    "Use an actual artifact consumer",
  );
  const application = "apps/storybook/src/controls";
  const fixture = "tests/controls/focus-handoff";
  const copied = [
    `${application}/FilterControlsComposition.tsx`,
    `${application}/FilterControlsComposition.css`,
    ...[
      "probe-fixture.tsx",
      "fixture.css",
      "probe.html",
      "env.d.ts",
      "types.ts",
      "probes.spec.ts",
    ].map((file) => `${fixture}/${file}`),
  ];
  const permitted = new Set(copied.map((file) => resolve("/staged", file)));
  const output = join(consumer, ".artifacts/focus-handoff-production");
  assert(
    !(await exists(output)),
    "Preserve any prior own production output; use a fresh consumer/run allocation",
  );
  const evidence = await mkdtemp(join(root, ".artifacts/focus-handoff-"));
  const runDirectory = join(consumer, ".artifacts", basename(evidence));
  await mkdir(runDirectory, { recursive: false });
  const reportPath = join(evidence, "report.json");
  const browserReport = join(runDirectory, "playwright.json");
  const priorReport = join(dirname(consumer), "report.json");
  const priorReportSha256 = (await exists(priorReport))
    ? sha256(await readFile(priorReport))
    : null;
  const consumerManifest = JSON.parse(await regular(consumer, "package.json"));
  const archives = {};
  for (const name of ["@tableweave/react", "@tableweave/heroui"]) {
    const specifier = consumerManifest.dependencies?.[name];
    assert(
      typeof specifier === "string" &&
        specifier.startsWith("file:") &&
        specifier.endsWith(".tgz"),
      "Actual installed archives are required",
    );
    const archive = await realpath(resolve(consumer, specifier.slice(5)));
    assert(within(join(root, ".artifacts"), archive));
    archives[archive] = sha256(await readFile(archive));
  }
  const sourceBefore = {};
  const publicBefore = {};
  for (const name of ["react", "heroui"]) {
    for (const [file, hash] of Object.entries(
      await tree(join(root, "packages", name, "src")),
    ))
      sourceBefore[`packages/${name}/src/${file}`] = hash;
    for (const [file, hash] of Object.entries(
      await tree(join(root, "packages", name, "dist")),
    ))
      publicBefore[`packages/${name}/dist/${file}`] = hash;
  }
  assert.equal(
    sourceBefore["packages/heroui/src/selection/selection-toolbar.tsx"],
    TOOLBAR_SOURCE_SHA256,
  );
  assert.equal(Object.keys(publicBefore).length, 180);
  assert.equal(
    sha256(`${JSON.stringify(sorted(publicBefore), null, 2)}\n`),
    PUBLIC_SHA256,
  );
  const vendorBefore = await tree(join(consumer, "node_modules"), {
    localLinks: true,
  });
  const priorConsumer = await tree(consumer, {
    omit: ["node_modules", `.artifacts/${basename(evidence)}`],
  });
  const inputDigests = {};
  const preexisting = [];
  const commands = [];
  let commandIndex = 0;
  const environment = { ...process.env, CI: "1", DO_NOT_TRACK: "1" };
  // Playwright's environment FILE has higher priority than reporter outputFile.
  for (const key of [
    "PLAYWRIGHT_JSON_OUTPUT_FILE",
    "PLAYWRIGHT_JSON_OUTPUT_DIR",
    "PLAYWRIGHT_JSON_OUTPUT_NAME",
  ])
    delete environment[key];
  environment.PLAYWRIGHT_JSON_OUTPUT_FILE = browserReport;
  environment.PLAYWRIGHT_JSON_OUTPUT_DIR = dirname(browserReport);
  environment.PLAYWRIGHT_JSON_OUTPUT_NAME = browserReport;
  async function run(executable, args) {
    const result = spawnSync(executable, args, {
      cwd: consumer,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      env: environment,
    });
    const log = join(evidence, `${++commandIndex}-command.log`);
    await writeFile(log, `${result.stdout ?? ""}${result.stderr ?? ""}`, {
      flag: "wx",
    });
    commands.push({ executable, args, status: result.status, log });
    if (result.error) throw result.error;
    assert.equal(
      result.status,
      0,
      `Packed focus command failed; inspect ${log}`,
    );
  }
  const request = createRequire(join(consumer, "package.json"));
  async function installed(specifier) {
    const path = await realpath(request.resolve(specifier));
    assert(
      within(join(consumer, "node_modules"), path),
      `Borrowed consumer tool/module: ${specifier}`,
    );
    return path;
  }
  const profileCli = join(
    consumer,
    "patches/tableweave-rac-table-clone/verify.mjs",
  );
  assert((await lstat(profileCli)).isFile());
  assert.equal(await realpath(profileCli), profileCli);
  let result;
  try {
    await run(process.execPath, [profileCli, consumer]);
    const inputs = new Map();
    for (const relative of copied) {
      const bytes = await regular(root, relative);
      auditImports(relative, bytes, permitted);
      const destination = join(consumer, relative);
      if (await exists(destination)) {
        assert.deepEqual(
          await regular(consumer, relative),
          bytes,
          `Existing staged input differs; do not overwrite: ${relative}`,
        );
        preexisting.push(relative);
      }
      inputs.set(relative, bytes);
    }
    for (const [relative, bytes] of inputs) {
      inputDigests[relative] = sha256(bytes);
      const destination = join(consumer, relative);
      if (!preexisting.includes(relative)) {
        await mkdir(dirname(destination), { recursive: true });
        assert.equal(
          await realpath(dirname(destination)),
          dirname(destination),
        );
        await writeFile(destination, bytes, { flag: "wx" });
      }
    }
    const configuration = join(runDirectory, "tsconfig.json");
    await writeFile(
      configuration,
      JSON.stringify(
        {
          compilerOptions: {
            noEmit: true,
            strict: true,
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
            noImplicitOverride: true,
            noFallthroughCasesInSwitch: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noUncheckedSideEffectImports: true,
            verbatimModuleSyntax: true,
            isolatedModules: true,
            forceConsistentCasingInFileNames: true,
            skipLibCheck: false,
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            lib: ["ES2022", "ES2023.Intl", "DOM", "DOM.Iterable"],
            types: ["react", "react-dom"],
            typeRoots: [join(consumer, "node_modules/@types")],
          },
          include: [
            join(consumer, application, "FilterControlsComposition.tsx"),
            ...["probe-fixture.tsx", "types.ts", "env.d.ts"].map((file) =>
              join(consumer, fixture, file),
            ),
          ],
        },
        null,
        2,
      ),
      { flag: "wx" },
    );
    const declarationsIsolation = [];
    for (const compiler of ["typescript", "typescript-5-9"]) {
      const cli = join(root, "node_modules", compiler, "bin/tsc");
      await run(process.execPath, [cli, "-p", configuration]);
      declarationsIsolation.push(
        await checkConsumerDeclarations(
          root,
          consumer,
          compiler,
          configuration,
        ),
      );
    }
    const graph = join(runDirectory, "modules.json");
    const viteConfig = join(runDirectory, "vite.config.mjs");
    await writeFile(
      viteConfig,
      `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "node:fs";
const modules = new Set();
export default defineConfig({
  root: ${JSON.stringify(join(consumer, fixture))},
  cacheDir: ${JSON.stringify(join(runDirectory, "vite-cache"))},
  esbuild: { jsx: "automatic" },
  plugins: [tailwindcss(), {
    name: "actual-packed-focus-modules", apply: "build",
    moduleParsed(info) { modules.add(info.id); },
    closeBundle() { writeFileSync(${JSON.stringify(graph)}, JSON.stringify([...modules].sort())); },
  }],
  build: {
    outDir: ${JSON.stringify(output)}, emptyOutDir: false,
    rollupOptions: { input: ${JSON.stringify(join(consumer, fixture, "probe.html"))} },
  },
});\n`,
      { flag: "wx" },
    );
    const viteCli = await realpath(
      join(dirname(await installed("vite/package.json")), "bin/vite.js"),
    );
    assert(within(join(consumer, "node_modules"), viteCli));
    await run(process.execPath, [
      viteCli,
      "build",
      "--config",
      viteConfig,
      "--configLoader",
      "native",
    ]);
    assert(
      (await lstat(join(output, "probe.html"))).isFile(),
      "Production must serve the real probe.html entry",
    );
    const css = [];
    let styles = "";
    for (const file of await readdir(join(output, "assets"))) {
      if (!file.endsWith(".css")) continue;
      const bytes = await readFile(join(output, "assets", file));
      styles += bytes.toString();
      css.push({ name: file, bytes: bytes.length, sha256: sha256(bytes) });
    }
    assert(css.length, "Production dropped actual component CSS");
    for (const selector of [".tw-filter-builder", ".tw-native-collection"])
      assert(
        styles.includes(selector),
        `Actual stylesheet missing ${selector}`,
      );
    const modules = JSON.parse(await readFile(graph, "utf8"));
    assert(Array.isArray(modules) && modules.length > 0);
    for (const id of modules) {
      assert(typeof id === "string");
      assert(
        !/@dnd-kit|dnd-kit\+|packages\/(?:react|heroui)\/(?:src|dist)/.test(id),
        `Forbidden graph input: ${id}`,
      );
      const physical = id.replace(/^\0/, "").split("?")[0];
      if (isAbsolute(physical))
        assert(
          within(consumer, await realpath(physical)),
          `Runtime graph escaped consumer: ${id}`,
        );
    }
    const styled = await realpath(
      join(consumer, "node_modules/@tableweave/heroui"),
    );
    const headless = await realpath(
      join(consumer, "node_modules/@tableweave/react"),
    );
    for (const path of [styled, headless])
      assert(within(join(consumer, "node_modules"), path));
    for (const [name, path] of [
      ["heroui", styled],
      ["react", headless],
    ]) {
      const expected = Object.fromEntries(
        Object.entries(publicBefore)
          .filter(([file]) => file.startsWith(`packages/${name}/dist/`))
          .map(([file, hash]) => [
            file.slice(`packages/${name}/dist/`.length),
            hash,
          ]),
      );
      assert.deepEqual(
        await tree(join(path, "dist")),
        sorted(expected),
        `Installed ${name} output must match the actual frozen build`,
      );
    }
    for (const component of ["filters", "selection", "table"])
      assert(
        modules.some((id) => id.startsWith(`${styled}/dist/${component}/`)),
        `Real installed component missing: ${component}`,
      );
    for (const file of [
      "tanstack/hook.js",
      "tanstack/definition.js",
      "presentation/authority.js",
      "presentation/project.js",
      "controller/store.js",
    ])
      assert(
        modules.includes(`${headless}/dist/${file}`),
        `Real installed headless producer missing: ${file}`,
      );
    const playwrightConfig = join(runDirectory, "playwright.config.mjs");
    const preview = [
      process.execPath,
      viteCli,
      "preview",
      "--config",
      viteConfig,
      "--configLoader",
      "native",
      "--host",
      "127.0.0.1",
      "--port",
      "6509",
      "--strictPort",
    ]
      .map((part) => JSON.stringify(part))
      .join(" ");
    await writeFile(
      playwrightConfig,
      `import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ${JSON.stringify(join(consumer, fixture))}, testMatch: "probes.spec.ts",
  workers: 1, fullyParallel: false, forbidOnly: true, retries: 0, repeatEach: 1,
  timeout: 30_000, expect: { timeout: 5_000 },
  outputDir: ${JSON.stringify(join(runDirectory, "browser"))},
  reporter: [["line"], ["json", { outputFile: ${JSON.stringify(browserReport)} }]],
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:6509", trace: "retain-on-failure" },
  webServer: { command: ${JSON.stringify(preview)}, cwd: ${JSON.stringify(consumer)},
    url: "http://127.0.0.1:6509/probe.html", reuseExistingServer: false, timeout: 30_000 },
});\n`,
      { flag: "wx" },
    );
    await run(process.execPath, [
      await installed("@playwright/test/cli"),
      "test",
      "--config",
      playwrightConfig,
    ]);
    const browser = JSON.parse(await readFile(browserReport, "utf8"));
    assert.equal(
      browser.stats.expected,
      10,
      "Review changes to the exact ten-case focus inventory",
    );
    for (const key of ["unexpected", "skipped", "flaky"])
      assert.equal(browser.stats[key], 0);
    assert.deepEqual(browser.errors ?? [], []);
    const cases = [];
    function collect(suite) {
      for (const spec of suite.specs ?? [])
        for (const test of spec.tests ?? []) {
          assert.equal(test.status, "expected");
          assert.equal(
            test.results.length,
            1,
            "No retry/repetition evidence substitution",
          );
          assert.equal(test.results[0].status, "passed");
          cases.push(spec.title);
        }
      for (const child of suite.suites ?? []) collect(child);
    }
    for (const suite of browser.suites) collect(suite);
    assert.equal(cases.length, 10);
    result = {
      browser: "actual-profiled-tarball-production-chromium",
      reportPath,
      evidence,
      consumerArtifacts: runDirectory,
      output,
      browserReport,
      copied,
      preexisting,
      inputDigests,
      archives,
      declarationsIsolation,
      tests: browser.stats,
      cases,
      css,
      modules,
      installed: { styled, headless },
      profile: "explicit-app-owned-RAC1.22.1-table-clone-v1",
      limits:
        "No raw CJS/vendor-layout/SSR/general traversal or full AC-16/25 acceptance",
    };
  } finally {
    // Read-only extracted CLI before AND after all new work, even on failure.
    await run(process.execPath, [profileCli, consumer]);
    for (const [file, hash] of Object.entries(inputDigests)) {
      assert.equal(
        sha256(await regular(root, file)),
        hash,
        `Root input drift: ${file}`,
      );
      assert.equal(
        sha256(await regular(consumer, file)),
        hash,
        `Staged input drift: ${file}`,
      );
    }
    assert.deepEqual(
      await tree(join(consumer, "node_modules"), { localLinks: true }),
      vendorBefore,
      "Consumer packages/vendor bytes changed",
    );
    const afterConsumer = await tree(consumer, {
      omit: [
        "node_modules",
        `.artifacts/${basename(evidence)}`,
        ".artifacts/focus-handoff-production",
      ],
    });
    for (const [file, hash] of Object.entries(priorConsumer))
      assert.deepEqual(
        afterConsumer[file],
        hash,
        `Existing consumer/report input changed: ${file}`,
      );
    for (const file of Object.keys(afterConsumer))
      assert(
        Object.hasOwn(priorConsumer, file) || copied.includes(file),
        `Unallocated consumer write: ${file}`,
      );
    for (const name of ["react", "heroui"])
      for (const [directory, before] of [
        ["src", sourceBefore],
        ["dist", publicBefore],
      ]) {
        const prefix = `packages/${name}/${directory}/`;
        const expected = Object.fromEntries(
          Object.entries(before)
            .filter(([file]) => file.startsWith(prefix))
            .map(([file, hash]) => [file.slice(prefix.length), hash]),
        );
        assert.deepEqual(
          await tree(join(root, "packages", name, directory)),
          sorted(expected),
          `Root ${name}/${directory} changed`,
        );
      }
    for (const [file, hash] of Object.entries(archives))
      assert.equal(
        sha256(await readFile(file)),
        hash,
        `Archive changed: ${file}`,
      );
    assert.equal(await exists(priorReport), priorReportSha256 !== null);
    if (priorReportSha256 !== null)
      assert.equal(
        sha256(await readFile(priorReport)),
        priorReportSha256,
        "Historical packed report changed",
      );
    await writeFile(
      join(evidence, "commands.json"),
      JSON.stringify(commands, null, 2),
      { flag: "wx" },
    );
    await writeFile(
      join(evidence, "vendor-before-after.json"),
      JSON.stringify(vendorBefore),
      { flag: "wx" },
    );
    await writeFile(
      join(evidence, "prior-consumer-inputs.json"),
      JSON.stringify(priorConsumer),
      { flag: "wx" },
    );
  }
  const guards = {
    sourceBefore,
    publicBefore: sorted(publicBefore),
    publicSha256: PUBLIC_SHA256,
    toolbarSourceSha256: TOOLBAR_SOURCE_SHA256,
    vendorEntries: Object.keys(vendorBefore).length,
    vendorSha256: sha256(JSON.stringify(vendorBefore)),
    priorConsumerEntries: Object.keys(priorConsumer).length,
    priorReport,
    priorReportSha256,
    commands,
    sourceInputBytesUnchanged: true,
    existingStagedBytesUnchanged: true,
    packageVendorBytesUnchanged: true,
    profileCliBeforeAfterPassed: true,
  };
  await writeFile(reportPath, JSON.stringify({ ...result, guards }, null, 2), {
    flag: "wx",
  });
  return { ...result, guards };
}
