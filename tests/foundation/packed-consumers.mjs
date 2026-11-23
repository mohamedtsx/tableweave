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
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { forbiddenImports, inspectGraph } from "./boundaries.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
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
  const emitted =
    name === "react"
      ? [
          "index.js",
          "index.d.ts",
          "contracts/index.js",
          "contracts/index.d.ts",
          "filters/index.js",
          "filters/index.d.ts",
        ]
      : [
          "index.js",
          "index.d.ts",
          "sortable/index.js",
          "sortable/index.d.ts",
          "styles.css",
        ];
  assert.deepEqual(
    [...files].sort(),
    [
      "package/package.json",
      "package/README.md",
      ...emitted.map((file) => `package/dist/${file}`),
    ].sort(),
    "Unexpected or missing foundation output",
  );
  assert(
    files.every(
      (file) =>
        file === "package/package.json" ||
        file === "package/README.md" ||
        /^package\/dist\/(?:[a-z-]+\/)*[a-z.-]+\.(?:js|ts|css)$/.test(file),
    ),
    `Unexpected tarball contents: ${files}`,
  );
  command("tar", ["-xzf", archive, "-C", target]);
  const pkg = join(target, "package");
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
  reports.push({
    package: manifest.name,
    archive,
    sha256: createHash("sha256")
      .update(await readFile(archive))
      .digest("hex"),
    files,
  });
}

const vendor = JSON.parse(
  await readFile(join(root, "apps/storybook/package.json"), "utf8"),
).dependencies;
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
  if (kind === "styled")
    await cp(join(root, "tests/consumers/styled.ts"), join(dir, "styled.ts"));
  await cp(join(root, "tests/consumers/runtime.mjs"), join(dir, "runtime.mjs"));
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
  }
  command(
    process.execPath,
    ["runtime.mjs", ...(kind === "styled" ? ["--styled"] : [])],
    dir,
  );
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
    assert(
      (await readFile(join(dir, "bundle", css), "utf8")).includes(
        "@layer tableweave",
      ),
    );
  }
  reports.push({
    consumer: kind,
    declarations: ["6.0.3", "5.9.3"],
    runtime: "passed",
    bundleModules: [...modules],
  });
}
await writeFile(join(run, "report.json"), JSON.stringify(reports, null, 2));
console.log(
  `Packed foundation checks passed. Evidence: ${resolve(run, "report.json")}`,
);
