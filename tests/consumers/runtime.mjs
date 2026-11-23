import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const blocked = [
  "react",
  "react-dom",
  "@heroui/react",
  "@heroui/styles",
  "react-aria",
  "react-aria-components",
  "tailwindcss",
  "@dnd-kit/react",
];
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (
      blocked.some(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      )
    ) {
      throw new Error(`Forbidden runtime import: ${specifier}`);
    }
    return nextResolve(specifier, context);
  },
});
for (const entry of [
  "@tableweave/react/contracts",
  "@tableweave/react/filters",
]) {
  assert.deepEqual(Object.keys(await import(entry)), []);
}
hook.deregister();
assert.deepEqual(Object.keys(await import("@tableweave/react")), []);
await assert.rejects(import("@tableweave/react/src/contracts/index.js"), {
  code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
});
if (process.argv.includes("--styled")) {
  for (const entry of ["@tableweave/heroui", "@tableweave/heroui/sortable"]) {
    assert.deepEqual(Object.keys(await import(entry)), []);
  }
  await assert.rejects(import("@tableweave/heroui/dist/sortable/index.js"), {
    code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
  });
}
