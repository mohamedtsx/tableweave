import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  consumerNpmrc,
  consumerWorkspace,
  requireConsumerTarget,
} from "../../wp11-consumer-boundary/boundary.mjs";

// AUTHORING ONLY NOW. This copies fixture inputs; it does not install, execute
// Next, emit libraries, apply patches or pretend directories are real tarballs.
if (process.env.WP11_NEXT_FINAL !== "1")
  throw Error("Final user-selected phase only");
const root = fileURLToPath(new URL("../../../../", import.meta.url));
const [directory, reactArchive, styledArchive, mode = "ordinary"] =
  process.argv.slice(2);
if (
  !directory ||
  !path.isAbsolute(directory) ||
  !reactArchive ||
  !path.isAbsolute(reactArchive) ||
  !styledArchive ||
  !path.isAbsolute(styledArchive) ||
  !["ordinary", "rsc-negative"].includes(mode)
)
  throw Error(
    "Absolute fresh consumer directory, two actual archives and ordinary/rsc-negative mode required",
  );
// This guards writes, not an installation or a successful ordinary consumer.
const destination = await requireConsumerTarget(directory, "prepare");
const archive = (file) => {
  const actual = fs.realpathSync(file);
  if (!actual.endsWith(".tgz") || !fs.statSync(actual).isFile())
    throw Error("Actual package archive required");
  return {
    file: actual,
    sha256: createHash("sha256").update(fs.readFileSync(actual)).digest("hex"),
  };
};
const archives = {
  react: archive(reactArchive),
  heroui: archive(styledArchive),
};
const app = path.join(root, "apps/example-next"),
  fixture = path.dirname(fileURLToPath(import.meta.url));
fs.mkdirSync(destination);
fs.writeFileSync(
  path.join(destination, "pnpm-workspace.yaml"),
  consumerWorkspace,
  {
    flag: "wx",
  },
);
fs.writeFileSync(path.join(destination, ".npmrc"), consumerNpmrc, {
  flag: "wx",
});
for (const name of ["postcss.config.mjs", "next-env.d.ts", "styles.d.ts"])
  fs.copyFileSync(path.join(app, name), path.join(destination, name));
function copy(directory, relative = "") {
  for (const entry of fs.readdirSync(path.join(app, directory, relative), {
    withFileTypes: true,
  })) {
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) copy(directory, next);
    else if (entry.isFile()) {
      const output = path.join(destination, directory, next);
      fs.mkdirSync(path.dirname(output), { recursive: true });
      const input = fs.readFileSync(path.join(app, directory, next), "utf8");
      // Relocate ONLY example-relative imports/scans inside the declaring app.
      // Package bare imports are untouched and use genuine archive exports.
      fs.writeFileSync(
        output,
        input.replaceAll("../../examples/shared", "../shared"),
      );
    }
  }
}
copy("app");
copy("lib");
fs.mkdirSync(path.join(destination, "shared"));
for (const name of [
  "records.ts",
  "schemas.ts",
  "definitions.ts",
  "owner.ts",
  "resource.ts",
  "options.ts",
  "reordering.ts",
])
  fs.copyFileSync(
    path.join(root, "apps/examples/shared", name),
    path.join(destination, "shared", name),
  );
fs.copyFileSync(
  path.join(fixture, "next.config.mjs"),
  path.join(destination, "next.config.mjs"),
);
fs.copyFileSync(
  path.join(root, "tsconfig.base.json"),
  path.join(destination, "tsconfig.base.json"),
);
const config = JSON.parse(fs.readFileSync(path.join(app, "tsconfig.json")));
config.extends = "./tsconfig.base.json";
fs.writeFileSync(
  path.join(destination, "tsconfig.json"),
  `${JSON.stringify(config, null, 2)}\n`,
);
const manifest = JSON.parse(fs.readFileSync(path.join(app, "package.json")));
manifest.dependencies["@tableweave/react"] = `file:${archives.react.file}`;
manifest.dependencies["@tableweave/heroui"] = `file:${archives.heroui.file}`;
manifest.packageManager = "pnpm@10.13.1";
fs.writeFileSync(
  path.join(destination, "package.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
if (mode === "rsc-negative") {
  const page = fs
    .readFileSync(
      path.join(fixture, "../negative/NonSerializablePage.tsx"),
      "utf8",
    )
    .replace(
      "../../../../apps/example-next/app/ClientDataTableBoundary.js",
      "../ClientDataTableBoundary.js",
    )
    .replace(
      "../../../../apps/example-next/lib/server-contract.js",
      "../../lib/server-contract.js",
    );
  fs.mkdirSync(path.join(destination, "app/non-serializable"));
  fs.writeFileSync(
    path.join(destination, "app/non-serializable/page.tsx"),
    page,
  );
}
fs.writeFileSync(
  path.join(destination, "fixture-provenance.json"),
  `${JSON.stringify({ mode, archives, profile: "ordinary-unpatched", aliases: false, relocated: "example-relative imports and CSS scan only; shared plain source copied unchanged", install: "UNRUN", build: "UNRUN" }, null, 2)}\n`,
);
console.log(
  `Prepared ${mode} consumer only; no installation/framework execution. Main must review archives, strict lock, source confinement and results separately.`,
);
