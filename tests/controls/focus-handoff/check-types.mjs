import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertCapturedGeneration,
  assertCorrectedSource,
  confined,
  generationDirectory,
  own,
  publicEntry,
  rootRequire,
  workspace,
} from "./roots.mjs";

const source = process.argv.includes("--source");
if (source) assertCorrectedSource();
else assertCapturedGeneration();
const entry = (name, subpath = ".") =>
  source
    ? confined(
        join(
          workspace,
          "packages",
          name,
          "src",
          subpath === "." ? "index.ts" : `${subpath.slice(2)}/index.ts`,
        ),
      )
    : publicEntry(name, subpath, "types");
const directory = generationDirectory();
mkdirSync(directory, { recursive: true });
const config = join(directory, `tsconfig.${source ? "source" : "public"}.json`);
writeFileSync(
  config,
  JSON.stringify(
    {
      extends: join(own, "tsconfig.json"),
      compilerOptions: {
        paths: {
          "@tableweave/react": [entry("react")],
          "@tableweave/react/contracts": [entry("react", "./contracts")],
          "@tableweave/react/filters": [entry("react", "./filters")],
          "@tableweave/heroui": [entry("heroui")],
        },
      },
    },
    null,
    2,
  ),
);
for (const compiler of ["typescript", "typescript-5-9"]) {
  const cli = confined(rootRequire.resolve(`${compiler}/bin/tsc`));
  const result = spawnSync(
    process.execPath,
    [cli, "-p", config, "--listFiles"],
    { encoding: "utf8" },
  );
  writeFileSync(
    join(directory, `${source ? "source" : "public"}-${compiler}.log`),
    `${result.stdout}${result.stderr}`,
  );
  if (result.status !== 0) {
    process.stderr.write(`${result.stdout}${result.stderr}`);
    process.exit(result.status ?? 1);
  }
  for (const path of result.stdout
    .split("\n")
    .filter((line) => line.startsWith("/"))) {
    confined(path);
    if (!source && /\/packages\/(?:react|heroui)\/src\//.test(path))
      throw new Error("Emitted declaration fixture escaped to library source");
  }
  console.log(
    `${compiler}: strict/full-library ${source ? "SOURCE ONLY" : "EMITTED PUBLIC"} focus-handoff check passed`,
  );
}
