import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { checkConsumerDeclarations } from "./consumer-declarations.mjs";

/** Additive real-tool composition in the explicit, already-verified profile lane. */
export async function checkPackedFilterControls(root, consumer) {
  const application = "apps/storybook/src/controls";
  const fixture = "tests/controls/filter-composition";
  const copied = [
    `${application}/FilterControlsComposition.tsx`,
    `${application}/FilterControlsComposition.css`,
    ...[
      "fixture.tsx",
      "fixture.css",
      "index.html",
      "env.d.ts",
      "types.ts",
      "composition.spec.ts",
    ].map((file) => `${fixture}/${file}`),
  ];
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const inputDigests = {};
  for (const file of copied) {
    assert(
      (await lstat(join(root, file))).isFile(),
      "Stage regular owned application files only",
    );
    const bytes = await readFile(join(root, file));
    assert(
      !/packages\/(?:react|heroui)\/(?:src|dist)|\.repo\//.test(
        bytes.toString(),
      ),
      `Composition bypasses public package exports: ${file}`,
    );
    inputDigests[file] = digest(bytes);
    await mkdir(dirname(join(consumer, file)), { recursive: true });
    await writeFile(join(consumer, file), bytes);
  }
  const artifacts = join(consumer, ".artifacts");
  await mkdir(artifacts, { recursive: true });
  const output = resolve(artifacts, "filter-controls-production");
  const graph = join(artifacts, "filter-controls-modules.json");
  await writeFile(
    join(consumer, "packed-filter-controls-vite.config.ts"),
    `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "node:fs";
const modules = new Set<string>();
export default defineConfig({
  root: ${JSON.stringify(join(consumer, fixture))},
  cacheDir: ${JSON.stringify(join(artifacts, "filter-controls-vite-cache"))},
  esbuild: { jsx: "automatic" },
  plugins: [tailwindcss(), {
    name: "inspect-genuine-filter-controls-imports", apply: "build",
    moduleParsed(info) { modules.add(info.id); },
    closeBundle() { writeFileSync(${JSON.stringify(graph)}, JSON.stringify([...modules])); },
  }],
  build: { outDir: ${JSON.stringify(output)}, emptyOutDir: true },
});
`,
  );
  const configuration = "tsconfig.packed-filter-controls.json";
  await writeFile(
    join(consumer, configuration),
    JSON.stringify({
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
        typeRoots: ["./node_modules/@types"],
      },
      include: [
        `${application}/FilterControlsComposition.tsx`,
        `${fixture}/fixture.tsx`,
        `${fixture}/env.d.ts`,
        `${fixture}/types.ts`,
      ],
    }),
  );
  await writeFile(
    join(consumer, "packed-filter-controls-playwright.config.ts"),
    `import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/controls/filter-composition", testMatch: "composition.spec.ts",
  workers: 1, fullyParallel: false, forbidOnly: true, retries: 0,
  outputDir: "./.artifacts/packed-filter-controls-results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/packed-filter-controls.json" }]],
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:6501", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm exec vite preview --config packed-filter-controls-vite.config.ts --host 127.0.0.1 --port 6501 --strictPort",
    url: "http://127.0.0.1:6501", reuseExistingServer: false, timeout: 30_000,
  },
});
`,
  );
  function run(executable, args) {
    const result = spawnSync(executable, args, {
      cwd: consumer,
      stdio: "inherit",
      env: { ...process.env, CI: "1", DO_NOT_TRACK: "1" },
    });
    if (result.error) throw result.error;
    assert.equal(
      result.status,
      0,
      `Packed filter/control command failed: ${args.join(" ")}`,
    );
  }
  const declarationsIsolation = [];
  for (const compiler of ["typescript", "typescript-5-9"]) {
    run(process.execPath, [
      join(root, "node_modules", compiler, "bin/tsc"),
      "-p",
      configuration,
    ]);
    declarationsIsolation.push(
      await checkConsumerDeclarations(root, consumer, compiler, configuration),
    );
  }
  run("pnpm", [
    "exec",
    "vite",
    "build",
    "--config",
    "packed-filter-controls-vite.config.ts",
  ]);
  const css = [];
  let styles = "";
  for (const file of await readdir(join(output, "assets"))) {
    if (!file.endsWith(".css")) continue;
    const bytes = await readFile(join(output, "assets", file));
    styles += bytes.toString();
    css.push({ name: file, bytes: bytes.length, sha256: digest(bytes) });
  }
  assert(css.length, "Production filter/control application dropped CSS");
  for (const selector of [
    ".tw-filter-builder",
    ".tw-date-editor",
    ".tw-native-collection",
    ".tw-pagination",
    ".tw-sorting",
    ".tw-column-chooser",
  ])
    assert(
      styles.includes(selector),
      `Missing real composed stylesheet: ${selector}`,
    );
  const modules = JSON.parse(await readFile(graph, "utf8"));
  const local = `${await realpath(consumer)}${sep}`;
  for (const id of modules) {
    if (!isAbsolute(id)) continue;
    assert(
      (await realpath(id.split("?")[0])).startsWith(local),
      `Composition bundle escaped its installed consumer: ${id}`,
    );
  }
  const installed = await realpath(
    join(consumer, "node_modules/@tableweave/heroui"),
  );
  assert(installed.startsWith(`${local}node_modules${sep}`));
  for (const component of [
    "filters",
    "date",
    "toolbar",
    "selection",
    "sorting",
    "columns",
    "pagination",
    "table",
  ])
    assert(
      modules.some((id) => id.startsWith(`${installed}/dist/${component}/`)),
      `Real installed composition component was not used: ${component}`,
    );
  assert(
    !modules.some((id) =>
      /@dnd-kit|dnd-kit\+|packages\/(?:react|heroui)\/(?:src|dist)/.test(id),
    ),
  );
  run("pnpm", [
    "exec",
    "playwright",
    "test",
    "--config",
    "packed-filter-controls-playwright.config.ts",
  ]);
  const result = JSON.parse(
    await readFile(join(artifacts, "packed-filter-controls.json"), "utf8"),
  );
  assert.equal(
    result.stats.expected,
    19,
    "Review changes to the real composition inventory",
  );
  for (const key of ["unexpected", "skipped", "flaky"])
    assert.equal(result.stats[key], 0);
  for (const file of copied) {
    assert.equal(
      digest(await readFile(join(root, file))),
      inputDigests[file],
      `Composition source changed during verification: ${file}`,
    );
    assert.equal(
      digest(await readFile(join(consumer, file))),
      inputDigests[file],
      `Staged composition changed during verification: ${file}`,
    );
  }
  return {
    browser: "actual-profiled-tarball-production-chromium",
    copied,
    inputDigests,
    declarationsIsolation,
    tests: result.stats,
    css,
    modules,
    installed,
  };
}
