// FINAL PHASE ONLY. This file is syntax/format checked, NOT invoked in Stage B.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const [mode, directory, reactArchive, styledArchive] = process.argv.slice(2);
assert(
  ["prepare", "install-and-typecheck"].includes(mode),
  "Explicit final-phase mode required",
);
assert(
  directory && isAbsolute(directory),
  "Supply a NEW actual outside-workspace directory",
);
assert(
  reactArchive &&
    styledArchive &&
    [reactArchive, styledArchive].every(isAbsolute),
  "Main must supply both ACTUAL reviewed archives",
);
const archives = await Promise.all(
  [reactArchive, styledArchive].map(async (path) => ({
    path: await realpath(path),
    sha256: createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
  })),
);
const location = resolve(directory);
const checkout = await realpath(root);
const outside = (path) => path !== checkout && !path.startsWith(`${checkout}/`);
assert(
  outside(location) && outside(await realpath(dirname(location))),
  "No lexical or symlink path back into the workspace",
);
if (mode !== "prepare") assert(outside(await realpath(location)));
if (mode === "prepare") {
  await mkdir(location);
  const headless = JSON.parse(
    await readFile(resolve(root, "packages/react/package.json"), "utf8"),
  );
  const styled = JSON.parse(
    await readFile(resolve(root, "packages/heroui/package.json"), "utf8"),
  );
  const foundation = JSON.parse(
    await readFile(resolve(root, "package.json"), "utf8"),
  );
  const dependencies = {
    ...headless.peerDependencies,
    ...styled.peerDependencies,
    "@tableweave/react": `file:${archives[0].path}`,
    "@tableweave/heroui": `file:${archives[1].path}`,
  };
  await writeFile(
    resolve(location, "package.json"),
    `${JSON.stringify({ name: "wp11-ordinary-archive-consumer", private: true, type: "module", packageManager: foundation.packageManager, dependencies, devDependencies: { typescript: foundation.devDependencies.typescript, "@types/react": foundation.devDependencies["@types/react"], "@types/react-dom": foundation.devDependencies["@types/react-dom"] } }, null, 2)}\n`,
    { flag: "wx" },
  );
  await writeFile(
    resolve(location, "consumer.tsx"),
    await readFile(new URL("./consumer.tsx", import.meta.url)),
    { flag: "wx" },
  );
  await writeFile(
    resolve(location, "assets.d.ts"),
    'declare module "*.css";\n',
    { flag: "wx" },
  );
  await writeFile(
    resolve(location, "tsconfig.json"),
    `${JSON.stringify({ compilerOptions: { noEmit: true, strict: true, exactOptionalPropertyTypes: true, skipLibCheck: false, jsx: "react-jsx", target: "ES2022", module: "ESNext", moduleResolution: "Bundler", lib: ["ES2022", "ES2023", "ES2023.Intl", "DOM", "DOM.Iterable"] }, include: ["consumer.tsx", "assets.d.ts"] }, null, 2)}\n`,
    { flag: "wx" },
  );
  await writeFile(
    resolve(location, "archive-inputs.json"),
    `${JSON.stringify(archives, null, 2)}\n`,
    { flag: "wx" },
  );
  console.log(
    "Prepared ONLY; no install/build/runtime claim. Clean ordinary profile, no clone repair/patch/adapter enabled.",
  );
} else {
  assert.deepEqual(
    archives,
    JSON.parse(
      await readFile(resolve(location, "archive-inputs.json"), "utf8"),
    ),
  );
  for (const [name, args] of [
    ["install", ["install", "--ignore-scripts"]],
    ["typecheck", ["exec", "tsc", "-p", "tsconfig.json", "--pretty", "false"]],
  ]) {
    const result = spawnSync("pnpm", args, { cwd: location, encoding: "utf8" });
    await writeFile(
      resolve(location, `${name}.log`),
      `${result.stdout ?? ""}${result.stderr ?? ""}`,
      { flag: "wx" },
    );
    await writeFile(
      resolve(location, `${name}.result.json`),
      `${JSON.stringify({ args, status: result.status }, null, 2)}\n`,
      { flag: "wx" },
    );
    assert.equal(result.status, 0, `${name}: raw failure preserved`);
  }
  console.log(
    "Archive declarations only. NOT ordinary runtime/grouped/SSR/drag/browser proof; no private clone profile was applied.",
  );
}
