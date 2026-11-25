import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";

// Actual installed imports only, FINAL. No mock store, permitting publication or
// UI/SSR assertion is manufactured by this minimal import/contract lane.
const matrix = JSON.parse(
  readFileSync(new URL("./matrix.json", import.meta.url)),
);
const forbidden = [
  "react",
  "react-dom",
  ...matrix.headlessForbidden,
  "node:fs",
  "node:http",
  "node:https",
  "node:net",
  "node:child_process",
];
const hook = registerHooks({
  resolve(specifier, context, next) {
    assert(
      !forbidden.some(
        (name) => specifier === name || specifier.startsWith(`${name}/`),
      ),
      "plain entry imported a forbidden runtime",
    );
    return next(specifier, context);
  },
});
try {
  const contracts = await import("@tableweave/react/contracts");
  const schema = contracts.defineQuerySchema({
    id: "actual-packed",
    version: 1,
    fields: { amount: { type: "number", owner: "builder" } },
  });
  const query = contracts.createQuery(schema, {
    locale: "en-US",
    timeZone: "UTC",
  });
  assert.equal(contracts.parseQuery(schema, query).success, true);
  for (const entry of ["filters", "criteria", "reordering"])
    assert(Object.keys(await import(`@tableweave/react/${entry}`)).length > 0);
} finally {
  hook.deregister();
}
const root = await import("@tableweave/react");
for (const name of matrix.packages.react.runtimeRequired["."])
  assert(Object.hasOwn(root, name), `missing ${name}`);
const helper = await import("@tableweave/react/reordering-controller");
assert.deepEqual(Object.keys(helper).sort(), [...matrix.helper.runtime].sort());
for (const name of matrix.helper.runtime)
  assert(!Object.hasOwn(root, name), "helper leaked into default root exports");
await assert.rejects(import("@tableweave/react/src/contracts/index.js"), {
  code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
});
const owner = JSON.parse(
  readFileSync(new URL("./wp13-owner.json", import.meta.url)),
);
if (/^(styled|vite-styled|next)-/.test(owner.key)) {
  const styled = await import("@tableweave/heroui");
  for (const name of matrix.packages.heroui.runtimeRequired["."])
    assert(Object.hasOwn(styled, name), `missing ${name}`);
  assert.deepEqual(
    Object.keys(await import("@tableweave/heroui/sortable")),
    [],
  );
}
console.log(
  "Actual archive imports and plain query only; NOT browser/SSR/Strict acceptance.",
);
