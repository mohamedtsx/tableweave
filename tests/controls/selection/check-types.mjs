import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { declared, sourceTypePaths } from "../harness/resolve.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const output = resolve(here, ".artifacts");
mkdirSync(output, { recursive: true });
const template = JSON.parse(
  readFileSync(resolve(here, "tsconfig.json"), "utf8"),
);
const options = template.compilerOptions;
options.paths = {
  ...sourceTypePaths(),
  "selection-producer": [
    resolve(root, "packages/heroui/src/selection/index.ts"),
  ],
};
const source = {
  ...template,
  extends: resolve(root, "tsconfig.base.json"),
  include: template.include.map((path) => resolve(here, path)),
  compilerOptions: options,
};
const sourcePath = resolve(output, "tsconfig.source.json");
writeFileSync(sourcePath, JSON.stringify(source, null, 2));
for (const compiler of ["typescript", "typescript-5-9"]) {
  const result = spawnSync(
    process.execPath,
    [declared(`${compiler}/bin/tsc`, "root"), "-p", sourcePath],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`${compiler}: strict source and positive/negative types passed`);
}
const emitted = {
  ...source,
  include: [resolve(root, "packages/heroui/src/selection/index.ts")],
  compilerOptions: {
    ...options,
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    outDir: resolve(output, "declarations"),
    rootDir: root,
  },
};
const emitPath = resolve(output, "tsconfig.emit.json");
writeFileSync(emitPath, JSON.stringify(emitted, null, 2));
const result = spawnSync(
  process.execPath,
  [declared("typescript/bin/tsc", "root"), "-p", emitPath],
  { cwd: root, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const selection = resolve(output, "declarations/packages/heroui/src/selection");
for (const name of ["index", "types", "selection-toolbar"]) {
  const declaration = readFileSync(resolve(selection, `${name}.d.ts`), "utf8");
  if (
    /from ["'](?!react["']|@tableweave\/react(?:\/contracts)?["']|\.\/)[^"']+["']/.test(
      declaration,
    )
  )
    throw new Error(`Foreign public declaration import: ${name}`);
}
const publicConfig = {
  extends: resolve(root, "tsconfig.base.json"),
  compilerOptions: {
    ...options,
    module: "NodeNext",
    moduleResolution: "NodeNext",
    paths: {
      "@tableweave/react": options.paths["@tableweave/react"],
      "@tableweave/react/contracts":
        options.paths["@tableweave/react/contracts"],
      "selection-producer": [resolve(selection, "index.d.ts")],
    },
  },
  files: [resolve(here, "public-types.ts")],
};
const publicPath = resolve(output, "tsconfig.public.json");
writeFileSync(publicPath, JSON.stringify(publicConfig, null, 2));
for (const compiler of ["typescript", "typescript-5-9"]) {
  const result = spawnSync(
    process.execPath,
    [declared(`${compiler}/bin/tsc`, "root"), "-p", publicPath],
    { cwd: root, stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(
    `${compiler}: own emitted declarations strict NodeNext passed (not packed/public root)`,
  );
}
