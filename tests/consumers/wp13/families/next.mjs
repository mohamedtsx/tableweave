import fs from "node:fs";
import path from "node:path";
import {
  demand,
  familyInput,
  familyConfig,
  familyManifest,
  record,
  tree,
  regular,
  fileRecord,
  verifyMap,
} from "../lib/receipts.mjs";
import { installed, nativeInputs } from "../lib/installer.mjs";
import { execute } from "../lib/generation.mjs";
import { runFamily } from "../lib/runtime.mjs";

const app = [
  "postcss.config.mjs",
  "next-env.d.ts",
  "styles.d.ts",
  "app/layout.tsx",
  "app/page.tsx",
  "app/ClientDataTableBoundary.tsx",
  "app/globals.css",
  "app/headless/route.ts",
  "lib/payload.ts",
  "lib/server-contract.ts",
  "lib/client-owner.ts",
];
const shared = [
  "records.ts",
  "schemas.ts",
  "definitions.ts",
  "owner.ts",
  "resource.ts",
  "options.ts",
  "reordering.ts",
];
export function stage(ctx) {
  familyManifest(ctx, "apps/example-next/package.json");
  const files = {};
  for (const file of app)
    files[file] = familyInput(ctx, `apps/example-next/${file}`)
      .toString("utf8")
      .replaceAll("../../examples/shared", "../shared");
  for (const file of shared)
    files[`shared/${file}`] = familyInput(ctx, `apps/examples/shared/${file}`);
  const config = JSON.parse(
    familyInput(ctx, "apps/example-next/tsconfig.json").toString("utf8"),
  );
  config.extends = "./tsconfig.base.json";
  // Do not include unrelated WP13 probe/config scripts in Next's app program.
  config.include = config.include.flatMap((file) =>
    file === "*.mjs" ? ["next.config.mjs", "postcss.config.mjs"] : [file],
  );
  files["tsconfig.base.json"] = familyInput(ctx, "tsconfig.base.json");
  files["tsconfig.json"] = `${JSON.stringify(config, null, 2)}\n`;
  files["next.config.mjs"] = familyConfig(
    ctx,
    'import { dirname } from "node:path";\nimport { fileURLToPath } from "node:url";\nexport default { turbopack: { root: dirname(fileURLToPath(import.meta.url)) } };\n',
  );
  if (ctx.request.nextCase === "rsc-negative")
    files["app/wp13-nonserializable/page.tsx"] =
      'import Client from "../ClientDataTableBoundary.js";\nimport { buildInitialPayload } from "../../lib/server-contract.js";\nexport const dynamic = "force-dynamic";\nexport default function Page(){ const props={initial:buildInitialPayload("primary"),onUnexpectedAction:()=>undefined}; return <Client {...props}/>; }\n';
  else demand(ctx.request.nextCase === "ordinary", "E_NEXT_CASE_SELECTION");
  return files;
}
export function build(ctx) {
  const state = installed(ctx);
  const native = nativeInputs(ctx, state.target);
  demand(
    !fs.existsSync(path.join(state.target, ".next")),
    "E_NEXT_OUTPUT_NOT_FRESH",
  );
  execute(ctx, "family-build");
  const output = {};
  for (const directory of [".next"])
    Object.assign(
      output,
      Object.fromEntries(
        Object.entries(tree(path.join(state.target, directory))).map(
          ([file, value]) => [`${directory}/${file}`, value],
        ),
      ),
    );
  demand(
    Object.keys(output).some((file) => file.endsWith(".js")),
    "E_EMPTY_NEXT_BUILD",
  );
  const env = regular(state.target, "next-env.d.ts").toString("utf8");
  demand(
    env.includes("next/image-types/global") && !env.includes("packages/"),
    "E_NEXT_GENERATED_REFERENCES",
  );
  verifyMap(state.target, state.frozen.files);
  verifyMap(state.target, state.installed.inputs);
  verifyMap(state.target, native);
  record(ctx.run, `family-build-${ctx.key}.json`, {
    candidate: ctx.request.candidate,
    key: ctx.key,
    profile: ctx.profile,
    outputRoots: [".next"],
    status: "real-next-build-only-not-hydration",
    output,
    generatedInputs: {
      "next-env.d.ts": fileRecord(state.target, "next-env.d.ts"),
    },
    nextCase: ctx.request.nextCase,
    neutralSSR: "UNRUN",
    callbackOverRSC:
      "Requires actual /wp13-nonserializable HTTP/Flight framework rejection; not a TypeScript negative",
    port: 6575,
    reuseExistingServer: false,
  });
  return { status: "actual-build-only" };
}
export function runtime(ctx) {
  return runFamily(ctx);
}
