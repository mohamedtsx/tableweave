import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { declared, root } from "./resolve.mjs";

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
for (const scope of ["selection", "columns"])
  run([resolve(root, `tests/controls/${scope}/check-types.mjs`)]);
for (const config of [
  "core/tsconfig.json",
  "core/controller-regressions.tsconfig.json",
  "collection/tsconfig.json",
  "pagination/tsconfig.json",
]) {
  for (const compiler of ["typescript", "typescript-5-9"]) {
    run([
      declared(`${compiler}/bin/tsc`, "root"),
      "-p",
      `tests/controls/${config}`,
    ]);
    console.log(`${compiler}: ${config} passed`);
  }
}
run([
  declared("typescript/bin/tsc", "root"),
  "-p",
  "tests/controls/pagination/declarations.tsconfig.json",
]);
console.log(
  "typescript: pagination own declaration emission passed (not shared package build)",
);
for (const compiler of ["typescript", "typescript-5-9"]) {
  run([
    declared(`${compiler}/bin/tsc`, "root"),
    "-p",
    "tests/controls/pagination/public.tsconfig.json",
  ]);
  console.log(
    `${compiler}: pagination own emitted declarations NodeNext passed (not tarball)`,
  );
}
console.log(
  "21 strict compiler invocations passed; no shared dist emission or installs",
);
