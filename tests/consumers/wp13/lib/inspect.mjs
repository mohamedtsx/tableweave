import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { fileURLToPath } from "node:url";
import {
  demand,
  regular,
  object,
  json,
  record,
  tree,
  verifyMap,
} from "./receipts.mjs";
import { extractPair } from "./archive.mjs";
import { installed, usesStyled, nativeInputs } from "./installer.mjs";
import { execute } from "./generation.mjs";
import { local } from "./boundary.mjs";

export function inspectGraph(root, entry, plain = false) {
  const pending = [entry],
    files = new Set(),
    externals = new Set(),
    directives = {},
    names = {},
    typeNames = {};
  while (pending.length) {
    const file = pending.pop();
    if (files.has(file)) continue;
    demand(
      typeof file === "string" &&
        !file.startsWith("../") &&
        !path.isAbsolute(file),
      "E_GRAPH_ESCAPE",
    );
    const text = regular(root, file).toString("utf8");
    files.add(file);
    const source = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
    );
    demand(source.parseDiagnostics.length === 0, "E_GRAPH_SYNTAX");
    directives[file] = false;
    for (const node of source.statements) {
      if (
        !ts.isExpressionStatement(node) ||
        !ts.isStringLiteral(node.expression)
      )
        break;
      if (node.expression.text === "use client") directives[file] = true;
    }
    names[file] = [];
    typeNames[file] = [];
    function visit(node) {
      if (plain && ts.isIdentifier(node))
        demand(
          ![
            "window",
            "document",
            "navigator",
            "localStorage",
            "sessionStorage",
            "fetch",
            "XMLHttpRequest",
            "WebSocket",
          ].includes(node.text),
          "E_PLAIN_BROWSER_REFERENCE",
        );
      let specifier;
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier
      )
        specifier = node.moduleSpecifier.text;
      if (
        ts.isExportDeclaration(node) &&
        node.exportClause &&
        ts.isNamedExports(node.exportClause)
      )
        for (const item of node.exportClause.elements)
          (node.isTypeOnly || item.isTypeOnly
            ? typeNames[file]
            : names[file]
          ).push(item.name.text);
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
        specifier = node.argument.literal.text;
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        demand(
          node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]),
          "E_UNINSPECTABLE_IMPORT",
        );
        specifier = node.arguments[0].text;
      }
      if (specifier) {
        if (specifier.startsWith(".")) {
          const next = path.posix.normalize(
            path.posix.join(
              path.posix.dirname(file),
              file.endsWith(".d.ts")
                ? specifier.replace(/\.js$/, ".d.ts")
                : specifier,
            ),
          );
          demand(
            !next.startsWith("../") && !path.isAbsolute(next),
            "E_GRAPH_ESCAPE",
          );
          pending.push(next);
        } else externals.add(specifier);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  if (plain)
    demand(
      Object.values(directives).every((value) => !value),
      "E_PLAIN_CLIENT_DIRECTIVE",
    );
  return {
    files: [...files],
    externals: [...externals].sort(),
    directives,
    names,
    typeNames,
  };
}
const forbidden = (names, prefixes) =>
  names.some((name) =>
    prefixes.some((prefix) => name === prefix || name.startsWith(`${prefix}/`)),
  );
export function inspect(ctx) {
  const matrix = json(ctx.producer, "tests/consumers/wp13/matrix.json"),
    archives = extractPair(ctx),
    observations = {};
  for (const key of ["react", "heroui"]) {
    const spec = object(matrix.packages[key]),
      manifest = archives[key].manifest,
      root = path.join(ctx.run, "extracted", key);
    demand(
      JSON.stringify(Object.keys(manifest.exports).sort()) ===
        JSON.stringify(Object.keys(spec.exports).sort()),
      "E_EXPORT_SET",
    );
    demand(
      JSON.stringify(manifest.sideEffects) === JSON.stringify(spec.sideEffects),
      "E_STYLE_SIDE_EFFECTS",
    );
    for (const [subpath, expected] of Object.entries(spec.exports)) {
      demand(
        JSON.stringify(manifest.exports[subpath]) === JSON.stringify(expected),
        "E_EXPORT_TARGET",
      );
      if (typeof expected === "string") continue;
      const plain = spec.plain.includes(subpath),
        graph = inspectGraph(root, expected.import.slice(2), plain),
        declarations = inspectGraph(root, expected.types.slice(2));
      for (const name of spec.runtimeRequired[subpath] ?? [])
        demand(
          graph.names[expected.import.slice(2)].includes(name),
          "E_CURRENT_RUNTIME_EXPORT",
        );
      if (subpath === "./reordering-controller")
        demand(
          JSON.stringify([...graph.names[expected.import.slice(2)]].sort()) ===
            JSON.stringify([...matrix.helper.runtime].sort()),
          "E_HELPER_EXACT_RUNTIME_MAP",
        );
      demand(
        !forbidden(
          graph.externals,
          key === "react"
            ? matrix.headlessForbidden
            : matrix.defaultStyledForbidden,
        ),
        "E_PUBLIC_RUNTIME_BOUNDARY",
      );
      if (plain)
        demand(
          graph.externals.every((name) =>
            ["@internationalized/date", "valibot"].includes(name),
          ) &&
            !graph.files.some((file) =>
              file.includes("reordering-controller/"),
            ),
          "E_PLAIN_IMPORT_BOUNDARY",
        );
      else
        demand(
          graph.directives[expected.import.slice(2)] === true,
          "E_PUBLIC_CLIENT_DIRECTIVE",
        );
      demand(
        !graph.files.some((file) => file.includes("sortable/")) ||
          subpath === "./sortable",
        "E_DEFAULT_SORTABLE",
      );
      demand(
        !forbidden(declarations.externals, [
          "@heroui/react",
          "@heroui/styles",
          "react-aria",
          "react-aria-components",
        ]),
        "E_PUBLIC_DECLARATION_VENDOR_LEAK",
      );
      if (subpath === "./reordering-controller")
        demand(
          JSON.stringify(
            [...declarations.typeNames[expected.types.slice(2)]].sort(),
          ) === JSON.stringify([...matrix.helper.types].sort()),
          "E_HELPER_EXACT_TYPE_MAP",
        );
      observations[`${key}:${subpath}`] = { graph, declarations };
    }
  }
  record(ctx.run, "public-inspection.json", {
    candidate: ctx.request.candidate,
    status: "static-package-inspection-only",
    observations,
  });
  return {
    status: "inspected-not-browser-proof",
    entries: Object.keys(observations).length,
  };
}
export function bundle(ctx) {
  const state = installed(ctx);
  const native = nativeInputs(ctx, state.target);
  const before = state.installed.inputs;
  demand(
    !fs.existsSync(path.join(state.target, "wp13-bundle")) &&
      !fs.existsSync(path.join(state.target, "wp13-bundle-observations.json")),
    "E_BUNDLE_OUTPUT_NOT_FRESH",
  );
  const resolution = execute(ctx, "resolve-exports");
  const values = object(JSON.parse(resolution.stdout));
  const expected = [
    "@tableweave/react",
    "@tableweave/react/contracts",
    "@tableweave/react/filters",
    "@tableweave/react/criteria",
    "@tableweave/react/reordering",
    "@tableweave/react/reordering-controller",
    ...(usesStyled(ctx.family)
      ? [
          "@tableweave/heroui",
          "@tableweave/heroui/sortable",
          "@tableweave/heroui/styles.css",
        ]
      : []),
  ];
  demand(Object.keys(values).length === expected.length, "E_RESOLUTION_COUNT");
  for (const specifier of expected) {
    demand(
      typeof values[specifier] === "string" &&
        values[specifier].startsWith("file:"),
      "E_EXPORT_RESOLUTION",
    );
    const file = fileURLToPath(values[specifier]);
    demand(
      file === local(state.target, path.relative(state.target, file)),
      "E_EXPORT_LOCALITY",
    );
  }
  execute(ctx, "plain-import");
  execute(ctx, "bundle");
  const observations = json(state.target, "wp13-bundle-observations.json");
  demand(
    Array.isArray(observations.modules) && observations.modules.length > 0,
    "E_EMPTY_BUNDLE_OBSERVATIONS",
  );
  for (const file of observations.modules) {
    if (file.startsWith("\0")) continue;
    demand(
      path.isAbsolute(file) &&
        fs.realpathSync(file.split("?")[0]).startsWith(`${state.target}/`),
      "E_BUNDLE_BORROWED_MODULE",
    );
    demand(!/dnd-kit|\/sortable\//.test(file), "E_DEFAULT_OPTIONAL_MODULE");
    if (!usesStyled(ctx.family))
      demand(
        !/heroui|react-aria|tailwindcss/.test(file),
        "E_HEADLESS_BUNDLE_UI",
      );
  }
  const output = tree(path.join(state.target, "wp13-bundle")),
    css = Object.keys(output).filter((file) => file.endsWith(".css"));
  if (usesStyled(ctx.family)) {
    demand(
      css.length > 0 &&
        observations.modules.some((file) => file.includes("/dist/styles.css")),
      "E_STYLES_DROPPED",
    );
    const text = css
      .map((file) =>
        regular(path.join(state.target, "wp13-bundle"), file).toString("utf8"),
      )
      .join("\n");
    for (const sentinel of [
      "tableweave",
      "tw-native-collection",
      "tw-pagination",
    ])
      demand(text.includes(sentinel), "E_STYLES_CONTENT");
  }
  verifyMap(state.target, before);
  verifyMap(state.target, native);
  record(ctx.run, `bundle-${ctx.key}.json`, {
    status: "imports-and-bundle-only-not-browser",
    candidate: ctx.request.candidate,
    resolution: values,
    observations,
    output,
  });
  return { status: "minimal-runtime-and-bundle-only" };
}
