import fs from "node:fs";
import path from "node:path";
import {
  demand,
  familyInput,
  familyConfig,
  familyManifest,
  object,
  record,
  regular,
  tree,
  json,
  fileRecord,
  verifyMap,
} from "../lib/receipts.mjs";
import { installed, nativeInputs } from "../lib/installer.mjs";
import { execute } from "../lib/generation.mjs";
import { wholeAppTypes } from "../lib/types.mjs";

const source = [
  "router.tsx",
  "start.ts",
  "register.d.ts",
  "routes/__root.tsx",
  "routes/index.tsx",
  "routes/away.tsx",
  "application/types.ts",
  "application/codec.ts",
  "application/query-options.ts",
  "application/bootstrap-session.ts",
  "application/table-source.ts",
  "application/functions.ts",
  "application/transport.ts",
  "application/reader.server.ts",
  "table/HeadlessTable.tsx",
  "table/TablePage.tsx",
];
export function stage(ctx) {
  familyManifest(ctx, "apps/example-start-facade/package.json");
  const files = {};
  for (const file of source)
    files[`src/${file}`] = familyInput(
      ctx,
      `apps/example-start-facade/src/${file}`,
    )
      .toString("utf8")
      .replaceAll("../../../examples/shared", "../../shared");
  for (const file of ["definitions.ts", "records.ts", "schemas.ts"])
    files[`shared/${file}`] = familyInput(ctx, `apps/examples/shared/${file}`);
  const config = JSON.parse(
    familyInput(ctx, "apps/example-start-facade/tsconfig.json").toString(
      "utf8",
    ),
  );
  config.extends = "./tsconfig.base.json";
  files["tsconfig.json"] = `${JSON.stringify(config, null, 2)}\n`;
  files["tsconfig.base.json"] = familyInput(ctx, "tsconfig.base.json");
  files["vite.config.ts"] = familyConfig(
    ctx,
    'import { tanstackStart } from "@tanstack/react-start/plugin/vite";\nimport react from "@vitejs/plugin-react";\nimport { defineConfig } from "vite";\nexport default defineConfig({plugins:[tanstackStart(),react()],server:{host:"127.0.0.1",port:6575,strictPort:true},preview:{host:"127.0.0.1",port:6575,strictPort:true},build:{emptyOutDir:false}});\n',
  );
  return files;
}
export function build(ctx) {
  const state = installed(ctx);
  const native = nativeInputs(ctx, state.target);
  demand(
    !fs.existsSync(path.join(state.target, "src/routeTree.gen.ts")),
    "E_HANDCRAFTED_OR_REUSED_ROUTE_TREE",
  );
  const roots = object(ctx.approval.familyOutputRoots).start;
  demand(
    Array.isArray(roots) &&
      roots.length > 0 &&
      new Set(roots).size === roots.length &&
      roots.every((root) => ["dist", ".output"].includes(root)),
    "E_HOLD_START_OUTPUT_RECIPE_SELECTION",
  );
  for (const root of [...roots, ".tanstack"])
    demand(
      !fs.existsSync(path.join(state.target, root)),
      "E_START_OUTPUT_NOT_FRESH",
    );
  execute(ctx, "family-build");
  demand(
    regular(state.target, "src/routeTree.gen.ts").length > 0,
    "E_NO_REAL_ROUTE_GENERATION",
  );
  const output = {};
  for (const root of roots)
    Object.assign(
      output,
      Object.fromEntries(
        Object.entries(tree(path.join(state.target, root))).map(
          ([file, value]) => [`${root}/${file}`, value],
        ),
      ),
    );
  demand(
    Object.keys(output).some((file) => file.endsWith(".js")),
    "E_EMPTY_START_BUILD",
  );
  const typeInputs = wholeAppTypes(ctx, state.target);
  verifyMap(state.target, state.frozen.files);
  verifyMap(state.target, state.installed.inputs);
  verifyMap(state.target, native);
  record(ctx.run, `family-build-${ctx.key}.json`, {
    status: "actual-start-generation-build-and-whole-app-types-only",
    output,
    typeInputs,
    generatedInputs: {
      "src/routeTree.gen.ts": fileRecord(state.target, "src/routeTree.gen.ts"),
    },
    generation: "actual-vite-start-plugin",
    domains: ["transactions", "inventory"],
    bootstrap: ["alpha", "beta"],
    source:
      "corrected parent closes snapshot before child observers; pending partitions/canary debt retained",
    SSR: "UNRUN",
    port: 6575,
    reuseExistingServer: false,
  });
  return { status: "actual-build-and-generated-types-only" };
}
export function runtime(ctx) {
  installed(ctx);
  json(ctx.run, `family-build-${ctx.key}.json`);
  throw new Error(
    "E_HOLD_START_6575_CONCURRENT_REQUEST_STREAM_HYDRATION_BROWSER_RUNNER_AND_NATIVE_AUTHORITY_REQUIRED",
  );
}
