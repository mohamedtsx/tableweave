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

/** Copy an application, never library/vendor code, into the genuine consumer. */
export async function checkPackedControls(root, consumer) {
  const copied = [
    ...[
      "model.ts",
      "messages.ts",
      "ControlsExample.tsx",
      "controls-example.css",
    ].map((file) => `apps/storybook/src/controls/${file}`),
    ...[
      "fixture.tsx",
      "fixture.css",
      "index.html",
      "env.d.ts",
      "types.ts",
      "integration.spec.ts",
    ].map((file) => `tests/controls/integration/${file}`),
  ];
  const inputDigests = {};
  const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
  for (const file of copied) {
    const original = join(root, file);
    assert(
      (await lstat(original)).isFile(),
      "Only regular owned fixtures may be staged",
    );
    const text = await readFile(original, "utf8");
    inputDigests[file] = digest(text);
    assert(
      !/packages\/(?:react|heroui)\/(?:src|dist)|\.repo\//.test(text),
      `Control fixture bypasses public exports: ${file}`,
    );
    await mkdir(dirname(join(consumer, file)), { recursive: true });
    await writeFile(join(consumer, file), text);
  }
  const artifacts = join(consumer, ".artifacts");
  await mkdir(artifacts, { recursive: true });
  const output = resolve(artifacts, "controls-production");
  const graph = join(artifacts, "controls-production-modules.json");
  await writeFile(
    join(consumer, "packed-controls-vite.config.ts"),
    `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "node:fs";
const modules = new Set<string>();
export default defineConfig({
  root: ${JSON.stringify(join(consumer, "tests/controls/integration"))},
  cacheDir: ${JSON.stringify(join(artifacts, "controls-vite-cache"))},
  esbuild: { jsx: "automatic" },
  plugins: [tailwindcss(), {
    name: "inspect-genuine-control-archive-imports", apply: "build",
    moduleParsed(info) { modules.add(info.id); },
    closeBundle() { writeFileSync(${JSON.stringify(graph)}, JSON.stringify([...modules])); },
  }],
  build: { outDir: ${JSON.stringify(output)}, emptyOutDir: true },
});
`,
  );
  const configuration = "tsconfig.packed-controls.json";
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
        "apps/storybook/src/controls/*.ts",
        "apps/storybook/src/controls/*.tsx",
        "tests/controls/integration/fixture.tsx",
        "tests/controls/integration/env.d.ts",
        "tests/controls/integration/types.ts",
      ],
    }),
  );
  await writeFile(
    join(consumer, "packed-controls-playwright.config.ts"),
    `import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/controls/integration", testMatch: "integration.spec.ts",
  workers: 1, fullyParallel: false, forbidOnly: true, retries: 0,
  outputDir: "./.artifacts/packed-control-browser-results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/packed-control-browser.json" }]],
  use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:6487", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm exec vite preview --config packed-controls-vite.config.ts --host 127.0.0.1 --port 6487 --strictPort",
    url: "http://127.0.0.1:6487", reuseExistingServer: false, timeout: 30_000,
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
      `Packed controls command failed: ${args.join(" ")}`,
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
    "packed-controls-vite.config.ts",
  ]);
  const css = [];
  let styles = "";
  for (const name of await readdir(join(output, "assets"))) {
    if (!name.endsWith(".css")) continue;
    const bytes = await readFile(join(output, "assets", name));
    styles += bytes.toString();
    css.push({
      name,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  assert(css.length, "Actual packed control application dropped CSS");
  for (const selector of [
    ".tw-native-collection",
    ".tw-pagination",
    ".tw-sorting",
    ".tw-column-chooser",
    "table-column-group",
  ])
    assert(
      styles.includes(selector),
      `Missing packed control CSS: ${selector}`,
    );
  const modules = JSON.parse(await readFile(graph, "utf8"));
  const local = `${await realpath(consumer)}${sep}`;
  for (const file of modules) {
    if (!isAbsolute(file)) continue;
    const resolved = await realpath(file.split("?")[0]);
    assert(
      resolved.startsWith(local),
      `Control bundle escaped consumer: ${resolved}`,
    );
  }
  const installed = await realpath(
    join(consumer, "node_modules/@tableweave/heroui"),
  );
  assert(installed.startsWith(`${local}node_modules${sep}`));
  for (const component of [
    "selection",
    "sorting",
    "columns",
    "pagination",
    "table",
  ])
    assert(
      modules.some((file) =>
        file.startsWith(`${installed}/dist/${component}/`),
      ),
      `Packed component not used: ${component}`,
    );
  assert(
    !modules.some((file) =>
      /@dnd-kit|dnd-kit\+|packages\/(?:react|heroui)\/(?:src|dist)/.test(file),
    ),
  );
  run("pnpm", [
    "exec",
    "playwright",
    "test",
    "--config",
    "packed-controls-playwright.config.ts",
  ]);
  const result = JSON.parse(
    await readFile(join(artifacts, "packed-control-browser.json"), "utf8"),
  );
  assert.equal(
    result.stats.expected,
    38,
    "Packed control case inventory changed; review the staged assertion set",
  );
  assert.equal(result.stats.unexpected, 0);
  assert.equal(result.stats.skipped, 0);
  assert.equal(result.stats.flaky, 0);
  for (const file of copied) {
    assert.equal(
      digest(await readFile(join(root, file))),
      inputDigests[file],
      `Packed control source changed during verification: ${file}`,
    );
    assert.equal(
      digest(await readFile(join(consumer, file))),
      inputDigests[file],
      `Staged control fixture changed during verification: ${file}`,
    );
  }
  return {
    browser: "actual-tarball-production-chromium",
    copied,
    inputDigests,
    declarationsIsolation,
    tests: result.stats,
    css,
    modules,
    installed,
  };
}
