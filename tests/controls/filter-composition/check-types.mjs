import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { evidenceDirectory } from "./generation.mjs";
import {
  appRequire,
  confined,
  own,
  publicEntry,
  rootRequire,
  workspace,
} from "./roots.mjs";

const source = process.argv.includes("--source");
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
const story = createRequire(confined(appRequire.resolve("storybook/test")));
const vendorExpect = createRequire(
  confined(story.resolve("@vitest/expect/package.json")),
);
const chai = join(
  dirname(confined(vendorExpect.resolve("@types/chai/package.json"))),
  "index.d.ts",
);
mkdirSync(evidenceDirectory, { recursive: true });
const config = join(
  evidenceDirectory,
  `tsconfig.${source ? "source" : "public"}.json`,
);
writeFileSync(
  config,
  JSON.stringify(
    {
      extends: join(own, "tsconfig.public.json"),
      files: [chai],
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
  const output = spawnSync(
    process.execPath,
    [cli, "-p", config, "--listFiles"],
    { encoding: "utf8" },
  );
  writeFileSync(
    join(evidenceDirectory, `${source ? "source" : "public"}-${compiler}.log`),
    `${output.stdout}${output.stderr}`,
  );
  if (output.status !== 0) {
    process.stderr.write(`${output.stdout}${output.stderr}`);
    process.exit(output.status ?? 1);
  }
  for (const line of output.stdout
    .split("\n")
    .filter((line) => line.startsWith("/"))) {
    confined(line);
    if (!source && /\/packages\/(?:react|heroui)\/src\//.test(line))
      throw new Error("Public declaration check escaped to library source");
  }
  console.log(
    `${compiler}: strict/full-library ${source ? "SOURCE ONLY" : "EMITTED declarations"} passed`,
  );
}
