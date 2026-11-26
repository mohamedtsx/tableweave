import { existsSync, readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
const vendor = createRequire(new URL("packages/heroui/package.json", root));
const externals = new Map(
  [
    "react",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "react-dom",
    "react-dom/server",
    "react-dom/client",
    "@heroui/react/button",
    "@heroui/react/drawer",
    "@heroui/react/popover",
  ].map((name) => [name, pathToFileURL(vendor.resolve(name)).href]),
);
const owned = [
  new URL("packages/", root).href,
  new URL("tests/details/", root).href,
];
registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier === "@tableweave/react" ||
      specifier === "@tableweave/react/contracts"
    ) {
      const path = specifier.endsWith("/contracts")
        ? "contracts/index.ts"
        : "index.ts";
      return {
        url: new URL(`packages/react/src/${path}`, root).href,
        shortCircuit: true,
      };
    }
    if (externals.has(specifier)) {
      return { url: externals.get(specifier), shortCircuit: true };
    }
    if (
      specifier.startsWith(".") &&
      context.parentURL &&
      owned.some((prefix) => context.parentURL.startsWith(prefix))
    ) {
      const url = new URL(specifier, context.parentURL);
      if (url.pathname.endsWith(".js") && !existsSync(url)) {
        for (const extension of [".ts", ".tsx"]) {
          const candidate = new URL(url.href.replace(/\.js$/, extension));
          if (existsSync(candidate))
            return { url: candidate.href, shortCircuit: true };
        }
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (owned.some((prefix) => url.startsWith(prefix)) && /\.tsx?$/.test(url)) {
      const source = ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        fileName: fileURLToPath(url),
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return next(url, context);
  },
});
const entry = await import("./ssr-entry.tsx");
process.stdout.write(entry.renderInitialDetails());
