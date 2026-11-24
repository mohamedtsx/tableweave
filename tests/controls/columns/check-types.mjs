import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { declared, sourceTypePaths } from "../harness/resolve.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const output = resolve(here, ".artifacts");
mkdirSync(output, { recursive: true });
const paths = {
  ...sourceTypePaths(),
  "columns-producer": [resolve(root, "packages/heroui/src/columns/index.ts")],
  "sorting-producer": [resolve(root, "packages/heroui/src/sorting/index.ts")],
};
const options = {
  module: "ESNext",
  moduleResolution: "Bundler",
  noEmit: true,
  jsx: "react-jsx",
  lib: ["ES2022", "DOM", "DOM.Iterable"],
  types: ["node", "vite/client"],
  paths,
};
const source = {
  extends: resolve(root, "tsconfig.base.json"),
  compilerOptions: options,
  include: [
    resolve(here, "*.ts"),
    resolve(here, "*.tsx"),
    resolve(root, "packages/heroui/src/columns/**/*.ts*"),
    resolve(root, "packages/heroui/src/sorting/**/*.ts*"),
  ],
};
const run = (config, name, compilers = ["typescript", "typescript-5-9"]) => {
  const path = resolve(output, `tsconfig.${name}.json`);
  writeFileSync(path, JSON.stringify(config, null, 2));
  for (const compiler of compilers) {
    const result = spawnSync(
      process.execPath,
      [declared(`${compiler}/bin/tsc`, "root"), "-p", path],
      { cwd: root, stdio: "inherit" },
    );
    if (result.status !== 0) process.exit(result.status ?? 1);
    console.log(`${compiler}: ${name} passed (strict, skipLibCheck:false)`);
  }
};
run(source, "source");
run(
  {
    ...source,
    include: [
      resolve(root, "packages/heroui/src/columns/index.ts"),
      resolve(root, "packages/heroui/src/sorting/index.ts"),
    ],
    compilerOptions: {
      ...options,
      noEmit: false,
      declaration: true,
      emitDeclarationOnly: true,
      rootDir: root,
      outDir: resolve(output, "declarations"),
    },
  },
  "emit",
  ["typescript"],
);
for (const group of ["columns", "sorting"])
  for (const name of [
    "index",
    "types",
    group === "columns" ? "column-chooser" : "sorting",
  ])
    if (
      /from ["'](?!react["']|@tableweave\/react(?:\/contracts)?["']|\.\/|\.\.\/columns\/)[^"']+["']/.test(
        readFileSync(
          resolve(
            output,
            `declarations/packages/heroui/src/${group}/${name}.d.ts`,
          ),
          "utf8",
        ),
      )
    )
      throw new Error(`Foreign public declaration import: ${group}/${name}`);
run(
  {
    extends: resolve(root, "tsconfig.base.json"),
    compilerOptions: {
      ...options,
      module: "NodeNext",
      moduleResolution: "NodeNext",
      paths: {
        "@tableweave/react": paths["@tableweave/react"],
        "@tableweave/react/contracts": paths["@tableweave/react/contracts"],
        "columns-producer": [
          resolve(
            output,
            "declarations/packages/heroui/src/columns/index.d.ts",
          ),
        ],
        "sorting-producer": [
          resolve(
            output,
            "declarations/packages/heroui/src/sorting/index.d.ts",
          ),
        ],
      },
    },
    files: [resolve(here, "public-types.ts")],
  },
  "own-declarations",
);
