import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { checkConsumerDeclarations } from "./consumer-declarations.mjs";

// The test application is copied, not the library. All library imports resolve
// through genuine installed tarballs, with no workspace/source/React aliases.
export async function checkPackedFilterTools(root, consumer) {
  const copied = [];
  async function stage(relative) {
    const source = join(root, relative);
    const destination = join(consumer, relative);
    await mkdir(destination, { recursive: true });
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.name === ".artifacts" || entry.name === "node_modules")
        continue;
      assert(
        !entry.isSymbolicLink(),
        "Packed fixture cannot follow source links",
      );
      const child = join(relative, entry.name);
      if (entry.isDirectory()) await stage(child);
      else if (/\.(?:tsx?|css|html)$/.test(entry.name)) {
        const text = await readFile(join(root, child), "utf8");
        if (!entry.name.includes("config"))
          assert(
            !/packages\/(?:react|heroui)\/(?:src|dist)|\.repo\//.test(text),
            `Packed fixture bypasses public exports: ${child}`,
          );
        await writeFile(join(consumer, child), text);
        copied.push(child);
      }
    }
  }
  await stage("tests/filter-tools/fixtures");
  await stage("tests/filter-tools/browser");
  const fixtureRoot = join(consumer, "tests/filter-tools/browser");
  const html = (await readdir(fixtureRoot)).filter((name) =>
    name.endsWith(".html"),
  );
  assert.equal(html.length, 1, "Review the exact packed fixture HTML entry");
  assert(
    copied.some((file) => file.endsWith(".spec.ts")),
    "No real browser assertions staged",
  );
  // Allow the ordinary application stylesheet path, never a vendor/source alias.
  const stylesheet = "apps/storybook/src/styles.css";
  await mkdir(dirname(join(consumer, stylesheet)), { recursive: true });
  await writeFile(
    join(consumer, stylesheet),
    await readFile(join(root, stylesheet), "utf8"),
  );
  await mkdir(join(consumer, ".artifacts"), { recursive: true });
  const output = resolve(consumer, ".artifacts/filter-tools-browser");
  const graph = join(consumer, ".artifacts/filter-tools-modules.json");
  await writeFile(
    join(consumer, "packed-vite.config.ts"),
    `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "node:fs";
const modules = new Set<string>();
export default defineConfig({
  root: ${JSON.stringify(fixtureRoot)},
  cacheDir: ${JSON.stringify(join(consumer, ".artifacts/vite-cache"))},
  esbuild: { jsx: "automatic" },
  plugins: [tailwindcss(), {
    name: "inspect-actual-packed-filter-imports",
    apply: "build",
    moduleParsed(info) { modules.add(info.id); },
    closeBundle() { writeFileSync(${JSON.stringify(graph)}, JSON.stringify([...modules])); },
  }],
  build: {
    outDir: ${JSON.stringify(output)},
    emptyOutDir: true,
    rollupOptions: { input: ${JSON.stringify(join(fixtureRoot, html[0]))} },
  },
});
`,
  );
  await writeFile(
    join(consumer, "packed-playwright.config.ts"),
    `import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/filter-tools/browser",
  testMatch: "*.spec.ts",
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  outputDir: "./.artifacts/packed-filter-browser-results",
  reporter: [["list"], ["json", { outputFile: "./.artifacts/packed-filter-browser.json" }]],
  use: { baseURL: "http://127.0.0.1:6449", browserName: "chromium", locale: "en-US", viewport: { width: 1440, height: 1000 }, trace: "retain-on-failure" },
  webServer: {
    command: "pnpm exec vite preview --config packed-vite.config.ts --host 127.0.0.1 --port 6449 --strictPort",
    url: ${JSON.stringify(`http://127.0.0.1:6449/${html[0]}`)},
    reuseExistingServer: false,
    timeout: 60_000,
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
      `Packed filter browser command failed: ${executable} ${args.join(" ")}`,
    );
  }
  const command = (args) => run("pnpm", args);
  const clientConfiguration = "tsconfig.filter-tools.json";
  await writeFile(
    join(consumer, clientConfiguration),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true,
        noUncheckedSideEffectImports: true,
        skipLibCheck: false,
        noEmit: true,
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        types: ["vite/client", "node"],
      },
      include: [
        "tests/filter-tools/fixtures/**/*.ts",
        "tests/filter-tools/fixtures/**/*.tsx",
        "tests/filter-tools/browser/**/*.ts",
        "tests/filter-tools/browser/**/*.tsx",
      ],
      exclude: ["**/*.spec.ts", "**/*config.ts"],
    }),
  );
  const declarationsIsolation = [];
  for (const compiler of ["typescript", "typescript-5-9"]) {
    run(process.execPath, [
      join(root, "node_modules", compiler, "bin/tsc"),
      "-p",
      clientConfiguration,
    ]);
    declarationsIsolation.push(
      await checkConsumerDeclarations(
        root,
        consumer,
        compiler,
        clientConfiguration,
      ),
    );
  }
  command(["exec", "vite", "build", "--config", "packed-vite.config.ts"]);
  const css = [];
  let stylesheetText = "";
  for (const name of await readdir(join(output, "assets"))) {
    if (!name.endsWith(".css")) continue;
    const bytes = await readFile(join(output, "assets", name));
    stylesheetText += bytes.toString();
    css.push({
      name,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  assert(css.length > 0, "Actual packed application dropped its stylesheets");
  for (const selector of [
    ".tw-filter-builder",
    ".tw-filter-rule",
    ".tw-filter-search",
    ".tw-date-editor",
  ])
    assert(
      stylesheetText.includes(selector),
      `Missing owned packed CSS: ${selector}`,
    );
  const modules = JSON.parse(await readFile(graph, "utf8"));
  const local = `${await realpath(consumer)}${sep}`;
  for (const file of modules) {
    if (!isAbsolute(file)) continue; // Rollup's own virtual modules are not files.
    const resolved = await realpath(file.split("?")[0]);
    assert(
      resolved.startsWith(local),
      `Packed browser borrowed a runtime module outside its install: ${resolved}`,
    );
  }
  const installed = await realpath(
    join(consumer, "node_modules/@tableweave/heroui"),
  );
  assert(
    installed.startsWith(`${await realpath(consumer)}${sep}node_modules${sep}`),
  );
  assert(modules.some((file) => file.startsWith(`${installed}/dist/filters/`)));
  assert(modules.some((file) => file.startsWith(`${installed}/dist/toolbar/`)));
  assert(
    !modules.some((file) =>
      /@dnd-kit|dnd-kit\+|packages\/(?:react|heroui)\/(?:src|dist)/.test(file),
    ),
  );
  command([
    "exec",
    "playwright",
    "test",
    "--config",
    "packed-playwright.config.ts",
  ]);
  const result = JSON.parse(
    await readFile(
      join(consumer, ".artifacts/packed-filter-browser.json"),
      "utf8",
    ),
  );
  assert(
    result.stats.expected >= 43,
    "Packed fixture lost reviewed browser cases",
  );
  assert.equal(result.stats.unexpected, 0);
  assert.equal(result.stats.skipped, 0);
  assert.equal(result.stats.flaky, 0);
  return {
    browser: "actual-tarball-production-chromium",
    copied,
    declarationsIsolation,
    tests: result.stats,
    css,
    modules,
    installed,
  };
}
