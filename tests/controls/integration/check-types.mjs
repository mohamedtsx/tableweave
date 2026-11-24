import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { appRequire, own, publicEntry, rootRequire } from "./public-roots.mjs";

const source = process.argv.includes("--source");
const storyRequire = createRequire(appRequire.resolve("storybook/test"));
const expectRequire = createRequire(
  storyRequire.resolve("@vitest/expect/package.json"),
);
const chaiTypes = join(
  dirname(expectRequire.resolve("@types/chai/package.json")),
  "index.d.ts",
);
const paths = source
  ? undefined
  : {
      "@tableweave/react": [publicEntry("react", ".", "types")],
      "@tableweave/react/contracts": [
        publicEntry("react", "./contracts", "types"),
      ],
      "@tableweave/heroui": [publicEntry("heroui", ".", "types")],
    };
mkdirSync(join(own, ".artifacts"), { recursive: true });
const config = join(
  own,
  `.artifacts/tsconfig.${source ? "source" : "public"}.json`,
);
writeFileSync(
  config,
  JSON.stringify(
    {
      extends: source ? "../tsconfig.source.json" : "../tsconfig.public.json",
      compilerOptions: paths ? { paths } : {},
      // Storybook 9.1.21's actual @vitest/expect requires this global namespace.
      // Resolve its declaring package, never an unrelated Chai version/root alias.
      files: [chaiTypes],
    },
    null,
    2,
  ),
);
for (const compiler of ["typescript", "typescript-5-9"]) {
  const output = spawnSync(
    process.execPath,
    [rootRequire.resolve(`${compiler}/bin/tsc`), "-p", config, "--listFiles"],
    { encoding: "utf8" },
  );
  writeFileSync(
    join(own, `.artifacts/${source ? "source" : "public"}-${compiler}.log`),
    `${output.stdout}${output.stderr}`,
  );
  if (output.status !== 0) {
    const boundary = output.stdout.indexOf("\n/");
    process.stderr.write(
      `${boundary < 0 ? output.stdout : output.stdout.slice(0, boundary)}${output.stderr}`,
    );
    process.exit(output.status ?? 1);
  }
  if (!source && /packages\/(?:react|heroui)\/src\//.test(output.stdout))
    throw new Error(
      "Public declaration check resolved library source instead of emitted exports",
    );
  console.log(
    `${source ? "SOURCE ONLY" : "EMITTED PUBLIC ROOTS"}: ${compiler}, strict/full library check passed`,
  );
}
