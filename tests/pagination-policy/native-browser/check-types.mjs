import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { sourceTypePaths } from "../../controls/harness/resolve.mjs";
import { own, root } from "./guard.mjs";

const run = process.env.NATIVE_TYPES_RUN;
assert.ok(
  run && /^[a-z][a-z0-9-]*$/.test(run),
  "Set new NATIVE_TYPES_RUN generation",
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
const config = join(output, "fixture.tsconfig.json");
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
        types: ["node"],
        typeRoots: [join(root, "node_modules/@types")],
        lib: ["ES2022", "ES2023.Intl", "DOM", "DOM.Iterable"],
        paths,
      },
      files: [
        "env.d.ts",
        "fixture.tsx",
        "native.spec.ts",
        "playwright.config.ts",
      ].map((name) => join(own, name)),
    },
    null,
    2,
  ),
);
for (const compiler of ["typescript", "typescript-5-9"]) {
  const result = spawnSync(
    process.execPath,
    [
      join(root, "node_modules", compiler, "bin/tsc"),
      "-p",
      config,
      "--pretty",
      "false",
    ],
    { cwd: root, encoding: "utf8" },
  );
  await writeFile(
    join(output, `${compiler}.log`),
    result.stdout + result.stderr,
    { flag: "wx" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  console.log(
    `${compiler}: strict source fixture + browser/config and genuine production imports pass; skipLibCheck=false`,
  );
}
