import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, readdir, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { sourceTypePaths } from "../../controls/harness/resolve.mjs";
import { own, root } from "./guard.mjs";

const run = process.env.PAGER_TYPES_RUN;
assert.ok(
  run && /^[a-z][a-z0-9-]*$/.test(run),
  "Choose unique PAGER_TYPES_RUN",
);
const output = join(own, ".artifacts", run);
await mkdir(output);
const vendor = createRequire(join(root, "packages/react/package.json"));
const paths = sourceTypePaths();
for (const name of [
  "@tanstack/react-table",
  "@tanstack/table-core",
  "@tanstack/table-core/reactivity",
  "@tanstack/table-core/store-reactivity-bindings",
])
  paths[name] = [
    (await realpath(vendor.resolve(name))).replace(/\.js$/, ".d.ts"),
  ];
const table = createRequire(vendor.resolve("@tanstack/react-table"));
paths["@tanstack/react-store"] = [
  (await realpath(table.resolve("@tanstack/react-store"))).replace(
    /\.c?js$/,
    ".d.ts",
  ),
];
const files = [];
async function sources(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".artifacts") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await sources(path);
    else if (/\.tsx?$/.test(entry.name)) files.push(path);
  }
}
await sources(join(root, "packages/heroui/src"));
await sources(own);
const config = join(output, "tsconfig.json");
await writeFile(
  config,
  JSON.stringify(
    {
      extends: join(root, "tsconfig.base.json"),
      compilerOptions: {
        noEmit: true,
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "Bundler",
        lib: ["ES2022", "ES2023.Intl", "DOM", "DOM.Iterable"],
        types: ["node"],
        typeRoots: [join(root, "node_modules/@types")],
        paths,
      },
      files,
    },
    null,
    2,
  ),
);
const result = spawnSync(
  process.execPath,
  [
    join(root, "node_modules/typescript/bin/tsc"),
    "-p",
    config,
    "--pretty",
    "false",
  ],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_DISABLE_COMPILE_CACHE: "1" },
  },
);
await writeFile(join(output, "ts6.log"), result.stdout + result.stderr, {
  flag: "wx",
});
await writeFile(
  join(output, "result.json"),
  JSON.stringify(
    {
      version: createRequire(join(root, "package.json"))(
        "typescript/package.json",
      ).version,
      exitCode: result.status,
      rootFiles: files.length,
      strict: true,
      skipLibCheck: false,
      noEmit: true,
    },
    null,
    2,
  ),
  { flag: "wx" },
);
assert.equal(result.status, 0, result.stdout + result.stderr);
console.log(
  `TS6 strict single noEmit program: whole HeroUI source + all own authored TypeScript, ${files.length} root files; no suites or negatives executed`,
);
