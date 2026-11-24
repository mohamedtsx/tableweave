import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  writeFile,
} from "node:fs/promises";
import { isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { rootDigests } from "../controls/filter-composition/roots.mjs";
import { forbiddenImports, inspectGraph } from "./boundaries.mjs";
import { checkConsumerDeclarations } from "./consumer-declarations.mjs";
import { checkPackedControlsProfile } from "./packed-controls-profile.mjs";
import { checkPackedFilterTools } from "./packed-filter-tools.mjs";
import { packedPublicGeneration } from "./packed-focus-handoff.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
// This is the same captured record used by the profiled focus child, not an env SHA.
const producerBefore = rootDigests();
const publicBefore = Object.fromEntries(
  Object.entries(producerBefore).filter(([path]) =>
    /^packages\/(?:react|heroui)\/dist\//.test(path),
  ),
);
assert.equal(
  Object.keys(publicBefore).length,
  packedPublicGeneration.outputCount,
);
assert.equal(
  createHash("sha256")
    .update(`${JSON.stringify(publicBefore, null, 2)}\n`)
    .digest("hex"),
  packedPublicGeneration.outputSha256,
  "Actual output differs from the registered current generation",
);
const artifacts = join(root, ".artifacts");
await mkdir(artifacts, { recursive: true });
const run = await mkdtemp(join(artifacts, "packed-"));
function command(executable, args, cwd = root) {
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, CI: "1", DO_NOT_TRACK: "1" },
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${executable} ${args.join(" ")} failed`);
}
const reports = [];
const archives = {};
const archiveDigests = {};
const archiveOutputs = {};
for (const name of ["react", "heroui"]) {
  const target = join(run, name);
  await mkdir(target);
  command(
    "pnpm",
    ["pack", "--pack-destination", target],
    join(root, "packages", name),
  );
  const archive = join(
    target,
    (await readdir(target)).find((file) => file.endsWith(".tgz")),
  );
  archives[name] = archive;
  const listing = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
  assert.equal(listing.status, 0);
  const files = listing.stdout.trim().split("\n");
  const compatibilityFiles =
    name === "heroui"
      ? [
          "runtime.patch",
          "profile.json",
          "verify.mjs",
          "README.md",
          "NOTICE-RAC",
          "LICENSE-APACHE-2.0",
        ].map((file) => `package/compat/rac-table-clone/${file}`)
      : [];
  const emitted =
    name === "react"
      ? [
          "index.js",
          "index.d.ts",
          "contracts/index.js",
          "contracts/index.d.ts",
          "filters/index.js",
          "filters/index.d.ts",
          ...[
            "contracts/types",
            "contracts/errors",
            "contracts/json",
            "contracts/context",
            "contracts/schema",
            "contracts/query",
            "contracts/identity",
            "definition/schema-types",
            "filters/dates",
            "filters/registry",
            "filters/plan",
            "filters/evaluate",
            "filters/translate",
            "filters/inverse",
            "filters/editor-types",
            "filters/editor-fields",
            "filters/editor-draft",
            "filters/options-source",
            "controller/types",
            "controller/validation",
            "controller/reducer",
            "controller/store",
            "hooks/state",
            "tanstack/types",
            "tanstack/features",
            "tanstack/definition",
            "tanstack/adapter",
            "tanstack/boundary",
            "tanstack/hook",
            "tanstack/index",
            "resource/types",
            "resource/view",
            "resource/adapter",
            "resource/hook",
            "resource/index",
            "presentation/types",
            "presentation/index",
            "presentation/binding",
            "presentation/project",
            "presentation/masked",
            "presentation/authority",
          ].flatMap((name) => [`${name}.js`, `${name}.d.ts`]),
        ]
      : [
          "index.js",
          "index.d.ts",
          "sortable/index.js",
          "sortable/index.d.ts",
          "styles.css",
          "filters/filters.css",
          "date/date-editor.css",
          "toolbar/filter-tools.css",
          "columns/controls.css",
          "pagination/styles.css",
          ...[
            "table/group-column",
            "table/collection-projection",
            "table/header-navigation",
            "table/controlled-collection",
            "table/native-collection",
            "filters/filter-builder",
            "filters/types",
            "filters/messages",
            "filters/option-owners",
            "filters/value-editors",
            "filters/date-value",
            "date/date-types",
            "date/date-wire",
            "date/date-picker",
            "date/date-instant",
            "date/date-segments",
            "date/date-operand-editor",
            "toolbar/filter-shared",
            "toolbar/filter-search",
            "toolbar/filter-tabs",
            "toolbar/filter-date",
            "table/collection-messages",
            "selection/types",
            "selection/index",
            "selection/action",
            "selection/selection-toolbar",
            "columns/types",
            "columns/index",
            "columns/model",
            "columns/column-chooser",
            "sorting/types",
            "sorting/index",
            "sorting/model",
            "sorting/sorting",
            "pagination/types",
            "pagination/index",
            "pagination/model",
            "pagination/messages",
            "pagination/Pagination",
            "pagination/usePaginationCorrection",
            "pagination/correction-capture",
          ].flatMap((name) => [`${name}.js`, `${name}.d.ts`]),
        ];
  assert.deepEqual(
    [...files].sort(),
    [
      "package/package.json",
      "package/README.md",
      ...compatibilityFiles,
      ...emitted.map((file) => `package/dist/${file}`),
    ].sort(),
    "Unexpected or missing reviewed output",
  );
  assert(
    files.every(
      (file) =>
        file === "package/package.json" ||
        file === "package/README.md" ||
        compatibilityFiles.includes(file) ||
        /^package\/dist\/(?:[a-z-]+\/)*[A-Za-z.-]+\.(?:js|ts|css)$/.test(file),
    ),
    `Unexpected tarball contents: ${files}`,
  );
  command("tar", ["-xzf", archive, "-C", target]);
  const pkg = join(target, "package");
  for (const file of emitted)
    archiveOutputs[`packages/${name}/dist/${file}`] = createHash("sha256")
      .update(await readFile(join(pkg, "dist", file)))
      .digest("hex");
  const manifest = JSON.parse(
    await readFile(join(pkg, "package.json"), "utf8"),
  );
  assert.equal(manifest.private, true);
  assert.equal(manifest.type, "module");
  for (const entry of Object.values(manifest.exports)) {
    for (const path of typeof entry === "string"
      ? [entry]
      : [entry.import, entry.types]) {
      assert(path.startsWith("./dist/"));
      await readFile(join(pkg, path));
    }
  }
  if (name === "heroui")
    assert.equal(
      manifest.peerDependencies["@tableweave/react"],
      "0.0.0-wp01.0",
    );
  const graph = await inspectGraph(
    join(pkg, "dist/index.js"),
    join(pkg, "dist"),
  );
  assert.equal(graph.directives.get(join(pkg, "dist/index.js")), true);
  assert(
    !graph.files.some((file) => file.includes("/sortable/")),
    "Default entry pulled optional sortable",
  );
  assert.deepEqual(
    forbiddenImports(
      graph,
      name === "react"
        ? ["@heroui/react", "@heroui/styles", "@dnd-kit/react"]
        : ["@dnd-kit/react"],
    ),
    [],
  );
  const publicTypes = await inspectGraph(
    join(pkg, "dist/index.d.ts"),
    join(pkg, "dist"),
  );
  assert.deepEqual(
    forbiddenImports(publicTypes, [
      "@heroui/react",
      "@heroui/styles",
      "react-aria",
      "react-aria-components",
      ...(name === "heroui" ? ["@internationalized/date"] : []),
    ]),
    [],
    "Public declarations leaked vendor types requiring workspace-only repairs",
  );
  archiveDigests[name] = createHash("sha256")
    .update(await readFile(archive))
    .digest("hex");
  reports.push({
    package: manifest.name,
    archive,
    sha256: archiveDigests[name],
    files,
  });
}

assert.deepEqual(
  Object.fromEntries(
    Object.entries(archiveOutputs).sort(([a], [b]) => a.localeCompare(b)),
  ),
  publicBefore,
  "Actual archive outputs differ from the frozen registered build",
);

const vendor = JSON.parse(
  await readFile(join(root, "apps/storybook/package.json"), "utf8"),
).dependencies;
const tooling = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
).devDependencies;
const storyTooling = JSON.parse(
  await readFile(join(root, "apps/storybook/package.json"), "utf8"),
).devDependencies;
for (const kind of ["headless", "styled"]) {
  const dir = join(run, `consumer-${kind}`);
  await mkdir(dir);
  const dependencies = {
    "@tableweave/react": `file:${archives.react}`,
    "@tanstack/react-table": vendor["@tanstack/react-table"],
    react: vendor.react,
    "react-dom": vendor["react-dom"],
  };
  if (kind === "styled") {
    for (const [name, version] of Object.entries(vendor)) {
      if (!name.startsWith("@tableweave/")) dependencies[name] = version;
    }
    dependencies["@tableweave/heroui"] = `file:${archives.heroui}`;
  }
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify(
      {
        name: `wp01-${kind}-consumer`,
        private: true,
        type: "module",
        dependencies,
        devDependencies: {
          "@types/react": tooling["@types/react"],
          "@types/react-dom": tooling["@types/react-dom"],
          ...(kind === "styled" &&
          (process.argv.includes("--filter-tools-browser") ||
            process.argv.includes("--controls-browser"))
            ? {
                vite: tooling.vite,
                "@playwright/test": tooling["@playwright/test"],
                "@axe-core/playwright": tooling["@axe-core/playwright"],
                "@types/node": tooling["@types/node"],
                "@tailwindcss/vite": storyTooling["@tailwindcss/vite"],
              }
            : {}),
        },
      },
      null,
      2,
    ),
  );
  await writeFile(join(dir, "pnpm-workspace.yaml"), "packages: []\n");
  await writeFile(
    join(dir, ".npmrc"),
    "auto-install-peers=false\nstrict-peer-dependencies=true\n",
  );
  command(
    "pnpm",
    [
      "install",
      "--ignore-workspace",
      "--ignore-scripts",
      "--no-frozen-lockfile",
    ],
    dir,
  );
  command(
    "pnpm",
    ["install", "--ignore-workspace", "--ignore-scripts", "--frozen-lockfile"],
    dir,
  );
  const installed = await realpath(join(dir, "node_modules/@tableweave/react"));
  assert(
    installed.startsWith(dir),
    "Consumer linked to workspace instead of packed artifact",
  );
  if (kind === "headless") {
    const packages = await readdir(join(dir, "node_modules/.pnpm"));
    assert(
      !packages.some((name) => /heroui|react-aria|tailwind|dnd-kit/.test(name)),
      "Headless install pulled UI dependencies",
    );
  }
  await cp(join(root, "tests/consumers/headless.ts"), join(dir, "headless.ts"));
  await cp(join(root, "tests/consumers/native.ts"), join(dir, "native.ts"));
  await cp(join(root, "tests/consumers/resource.ts"), join(dir, "resource.ts"));
  await cp(
    join(root, "tests/consumers/filter-tools.ts"),
    join(dir, "filter-tools.ts"),
  );
  if (kind === "styled") {
    await cp(join(root, "tests/consumers/styled.ts"), join(dir, "styled.ts"));
    await cp(
      join(root, "tests/consumers/styled-tools.ts"),
      join(dir, "styled-tools.ts"),
    );
    await cp(
      join(root, "tests/consumers/controls.ts"),
      join(dir, "controls.ts"),
    );
  }
  await cp(join(root, "tests/consumers/runtime.mjs"), join(dir, "runtime.mjs"));
  await cp(
    join(root, "tests/consumers/native-runtime.mjs"),
    join(dir, "native-runtime.mjs"),
  );
  await cp(
    join(root, "tests/consumers/resource-runtime.mjs"),
    join(dir, "resource-runtime.mjs"),
  );
  await writeFile(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        exactOptionalPropertyTypes: true,
        noUncheckedIndexedAccess: true,
        noUncheckedSideEffectImports: true,
        noEmit: true,
        module: "NodeNext",
        moduleResolution: "NodeNext",
        target: "ES2022",
        types: [],
        lib: ["ES2022"],
        skipLibCheck: false,
      },
      include: ["*.ts"],
    }),
  );
  for (const compiler of ["typescript", "typescript-5-9"]) {
    command(
      process.execPath,
      [join(root, "node_modules", compiler, "bin/tsc"), "-p", "tsconfig.json"],
      dir,
    );
    reports.push({
      consumer: kind,
      ...(await checkConsumerDeclarations(root, dir, compiler)),
    });
  }
  command(
    process.execPath,
    ["runtime.mjs", ...(kind === "styled" ? ["--styled"] : [])],
    dir,
  );
  command(process.execPath, ["native-runtime.mjs"], dir);
  command(process.execPath, ["resource-runtime.mjs"], dir);
  const entries =
    kind === "styled"
      ? [
          "@tableweave/react",
          "@tableweave/heroui",
          "@tableweave/heroui/sortable",
        ]
      : [
          "@tableweave/react",
          "@tableweave/react/contracts",
          "@tableweave/react/filters",
        ];
  await writeFile(
    join(dir, "entry.js"),
    `${entries.map((entry, index) => `import * as entry${index} from ${JSON.stringify(entry)};`).join("\n")}\nexport const entries = [${entries.map((_, index) => `entry${index}`).join(",")}];\n${kind === "styled" ? 'import "@tableweave/heroui/styles.css";' : ""}`,
  );
  const modules = new Set();
  await build({
    root: dir,
    configFile: false,
    logLevel: "warn",
    plugins: [
      {
        name: "record-foundation-imports",
        moduleParsed(info) {
          modules.add(info.id);
        },
      },
    ],
    build: {
      outDir: "bundle",
      lib: {
        entry: join(dir, "entry.js"),
        formats: ["es"],
        fileName: "consumer",
      },
    },
  });
  assert(modules.size >= entries.length + 1, "Bundle graph was not inspected");
  const consumerRoot = `${await realpath(dir)}${sep}`;
  for (const file of modules) {
    if (!isAbsolute(file)) continue;
    const resolvedModule = await realpath(file.split("?")[0]);
    assert(
      resolvedModule.startsWith(consumerRoot),
      `Bundle borrowed a runtime module outside its install: ${resolvedModule}`,
    );
  }
  assert(![...modules].some((file) => /@dnd-kit|dnd-kit\+/.test(file)));
  if (kind === "headless")
    assert(
      ![...modules].some((file) => /@heroui|react-aria|tailwindcss/.test(file)),
    );
  if (kind === "styled") {
    const css = (await readdir(join(dir, "bundle"))).find((file) =>
      file.endsWith(".css"),
    );
    assert(css, "Side-effectful CSS was dropped");
    const content = await readFile(join(dir, "bundle", css), "utf8");
    for (const selector of [
      "@layer tableweave",
      ".tw-native-collection",
      ".tw-pagination",
      ".tw-column-chooser",
      ".tw-sorting",
      "table-column-group",
      "checkbox-control",
    ])
      assert(content.includes(selector), `Packed CSS omitted ${selector}`);
  }
  reports.push({
    consumer: kind,
    declarations: ["6.0.3", "5.9.3"],
    runtime: "passed",
    runtimeModuleIsolation: "consumer-install-only",
    bundleModules: [...modules],
  });
  if (kind === "styled" && process.argv.includes("--filter-tools-browser"))
    reports.push({
      consumer: kind,
      filterTools: await checkPackedFilterTools(root, dir),
    });
  if (kind === "styled" && process.argv.includes("--controls-browser"))
    reports.push({
      consumer: kind,
      controlsProfile: await checkPackedControlsProfile(
        root,
        run,
        dir,
        archives,
      ),
    });
}
assert.deepEqual(
  rootDigests(),
  producerBefore,
  "Source/public bytes changed since the parent captured them before packing",
);
for (const [name, archive] of Object.entries(archives))
  assert.equal(
    createHash("sha256")
      .update(await readFile(archive))
      .digest("hex"),
    archiveDigests[name],
    `Actual ${name} archive changed during consumer verification`,
  );
reports.push({
  boundary: "registered-public-generation",
  generation: packedPublicGeneration.generation,
  outputCount: packedPublicGeneration.outputCount,
  outputSha256: packedPublicGeneration.outputSha256,
  sourcePublicCount: Object.keys(producerBefore).length,
  sourcePublicSha256: createHash("sha256")
    .update(`${JSON.stringify(producerBefore, null, 2)}\n`)
    .digest("hex"),
});
await writeFile(join(run, "report.json"), JSON.stringify(reports, null, 2), {
  flag: "wx",
});
console.log(
  `Packed foundation checks passed. Evidence: ${resolve(run, "report.json")}`,
);
