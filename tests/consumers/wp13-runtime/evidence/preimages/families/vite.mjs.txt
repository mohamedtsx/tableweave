import fs from "node:fs";
import path from "node:path";
import {
  demand,
  familyInput,
  familyConfig,
  familyManifest,
  record,
  tree,
  json,
  verifyMap,
} from "../lib/receipts.mjs";
import { installed, usesStyled, nativeInputs } from "../lib/installer.mjs";
import { execute } from "../lib/generation.mjs";
import { wholeAppTypes } from "../lib/types.mjs";

export function stage(ctx) {
  const styled = usesStyled(ctx.family),
    files = {};
  familyManifest(ctx, "apps/storybook/package.json", [
    "vite",
    "@vitejs/plugin-react",
    ...(styled ? ["@tailwindcss/vite"] : []),
  ]);
  files["tsconfig.base.json"] = familyInput(ctx, "tsconfig.base.json");
  files["tsconfig.json"] =
    `${JSON.stringify({ extends: "./tsconfig.base.json", compilerOptions: { noEmit: true, incremental: false, jsx: "react-jsx", module: "ESNext", moduleResolution: "Bundler", lib: ["ESNext", "DOM", "DOM.Iterable"], types: ["node", "react", "react-dom", "vite/client"] }, include: ["vite/**/*.tsx", "shared/**/*.ts", "shared/**/*.tsx", "recipes/**/*.tsx"] }, null, 2)}\n`;
  for (const file of styled
    ? ["index.html", "main.tsx", "styles.css"]
    : ["headless.html", "headless.tsx"])
    files[`vite/${file}`] = familyInput(ctx, `apps/examples/vite/${file}`);
  for (const file of [
    "definitions.ts",
    "records.ts",
    "schemas.ts",
    "owner.ts",
    "options.ts",
    "resource.ts",
    "reordering.ts",
    ...(styled ? ["details.tsx"] : []),
  ])
    files[`shared/${file}`] = familyInput(ctx, `apps/examples/shared/${file}`);
  if (styled)
    for (const file of [
      "custom-cells.tsx",
      "custom-filter.tsx",
      "locale-recovery.tsx",
      "row-bulk-actions.tsx",
    ])
      files[`recipes/${file}`] = familyInput(
        ctx,
        `apps/examples/recipes/${file}`,
      );
  files["vite.config.mjs"] = familyConfig(
    ctx,
    `import react from "@vitejs/plugin-react";\n${styled ? 'import tailwind from "@tailwindcss/vite";\n' : ""}import {defineConfig} from "vite";\nexport default defineConfig({root:"./vite",plugins:[react()${styled ? ",tailwind()" : ""}],server:{host:"127.0.0.1",port:6575,strictPort:true},preview:{host:"127.0.0.1",port:6575,strictPort:true},build:{outDir:"../wp13-family-build",emptyOutDir:false,manifest:true,rollupOptions:{input:"vite/${styled ? "index" : "headless"}.html"}}});\n`,
  );
  return files;
}
export function build(ctx) {
  const state = installed(ctx);
  const native = nativeInputs(ctx, state.target);
  demand(
    !fs.existsSync(path.join(state.target, "wp13-family-build")),
    "E_VITE_OUTPUT_NOT_FRESH",
  );
  execute(ctx, "family-build");
  const output = tree(path.join(state.target, "wp13-family-build"));
  const typeInputs = wholeAppTypes(ctx, state.target);
  verifyMap(state.target, state.frozen.files);
  verifyMap(state.target, state.installed.inputs);
  verifyMap(state.target, native);
  demand(
    Object.keys(output).some((file) => file.endsWith(".js")) &&
      (!usesStyled(ctx.family) ||
        Object.keys(output).some((file) => file.endsWith(".css"))),
    "E_EMPTY_VITE_FAMILY_BUILD",
  );
  record(ctx.run, `family-build-${ctx.key}.json`, {
    status: "actual-vite-build-only",
    output,
    typeInputs,
    browser: "UNRUN",
    port: 6575,
    reuseExistingServer: false,
  });
  return { status: "actual-build-only" };
}
export function runtime(ctx) {
  installed(ctx);
  json(ctx.run, `family-build-${ctx.key}.json`);
  throw new Error(
    "E_HOLD_VITE_6575_REAL_DOM_STYLE_FOCUS_BROWSER_RUNNER_AND_NATIVE_AUTHORITY_REQUIRED",
  );
}
