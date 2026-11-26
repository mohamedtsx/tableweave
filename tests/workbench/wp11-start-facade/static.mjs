import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const base = "apps/example-start-facade/";
const names = [
  "bootstrap-session.ts",
  "codec.ts",
  "functions.ts",
  "query-options.ts",
  "reader.server.ts",
  "table-source.ts",
  "transport.ts",
  "types.ts",
];
assert.deepEqual(
  (await readdir(resolve(root, `${base}src/application`))).sort(),
  names,
);
async function files(directory) {
  const result = [];
  for (const entry of await readdir(resolve(root, directory), {
    withFileTypes: true,
  })) {
    if (entry.name === "node_modules") continue;
    const path = `${directory}${entry.name}`;
    if (entry.isDirectory()) result.push(...(await files(`${path}/`)));
    else result.push(path);
  }
  return result;
}
const code = (await files(base)).filter((path) => /\.(ts|tsx)$/.test(path));
for (const path of code) {
  const text = await readFile(resolve(root, path), "utf8"),
    file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  assert.equal(file.parseDiagnostics.length, 0, path);
  assert(
    !/as unknown as|\bas any\b|@ts-ignore|@ts-expect-error|@heroui|@tableweave\/heroui|tailwind|\.css["']|storybook|TSS_ROUTES_MANIFEST|\.repo|localStorage|sessionStorage|\.admission\.begin\(/.test(
      text,
    ),
    path,
  );
  for (const node of file.statements)
    if (ts.isImportDeclaration(node)) {
      const name = node.moduleSpecifier.text;
      assert(
        !name.includes("/example-start/") &&
          !name.includes("packages/") &&
          !name.includes("tests/"),
        `${path}: private/old import ${name}`,
      );
      if (name.startsWith("@tableweave/"))
        assert(
          [
            "@tableweave/react",
            "@tableweave/react/contracts",
            "@tableweave/react/filters",
          ].includes(name),
          name,
        );
    }
}
await assert.rejects(access(resolve(root, `${base}src/routeTree.gen.ts`)), {
  code: "ENOENT",
});
const configPath = resolve(root, `${base}tsconfig.source-light.json`),
  raw = ts.readConfigFile(configPath, ts.sys.readFile),
  config = ts.parseJsonConfigFileContent(
    raw.config,
    ts.sys,
    dirname(configPath),
  );
assert.equal(config.options.noEmit, true);
assert.equal(config.options.skipLibCheck, false);
assert.equal(config.options.strict, true);
assert.equal(config.options.exactOptionalPropertyTypes, true);
assert(config.raw.exclude.includes("src/register.d.ts"));
assert(config.raw.exclude.includes("src/router.tsx"));
const runtime = JSON.parse(
  await readFile(resolve(root, `${base}tsconfig.json`), "utf8"),
);
assert.equal(runtime.compilerOptions.paths, undefined);
const vite = await readFile(resolve(root, `${base}vite.config.ts`), "utf8");
assert(
  vite.includes("tanstackStart()") &&
    vite.includes("6573") &&
    !vite.includes("enableRouteGeneration"),
);
const router = await readFile(resolve(root, `${base}src/router.tsx`), "utf8");
assert.equal(
  (router.match(/setupRouterSsrQueryIntegration\(/g) ?? []).length,
  1,
);
assert(
  !router.includes("QueryClientProvider") && !router.includes("hydrateRoot("),
);
assert(
  router.indexOf("ssr.onCleanup") <
    router.indexOf("setupRouterSsrQueryIntegration({"),
);
assert(
  router.includes("await sdkHydrate?.(data)") &&
    router.indexOf("await sdkHydrate?.(data)") <
      router.indexOf("session.adoptHydration()"),
);
assert(
  router.includes("deserializeData: session.deserializeData") &&
    router.includes("onBeforeNavigate") &&
    router.includes("pagehide"),
);
const source = await readFile(
  resolve(root, `${base}src/application/table-source.ts`),
  "utf8",
);
assert(!/removeQueries|queryClient|cachePrefix/.test(source));
assert(
  source.includes("createCriteriaPublication") &&
    source.includes("getControlsRequestBinding") &&
    source.includes("pending !== request"),
);
const session = await readFile(
  resolve(root, `${base}src/application/bootstrap-session.ts`),
  "utf8",
);
assert(
  session.includes("queryClient.query(") === false &&
    session.includes("client.query("),
);
assert(
  session.includes('phase = "retiring"') && session.includes("lease = null"),
);
const page = await readFile(
  resolve(root, `${base}src/table/TablePage.tsx`),
  "utf8",
);
assert.equal((page.match(/<HeadlessTable/g) ?? []).length, 2);
assert(!/source\.retire|resource\.connect|source\.activate/.test(page));
const middleware = await readFile(resolve(root, `${base}src/start.ts`), "utf8");
assert(!middleware.includes("session.dispose"));
console.log(
  JSON.stringify(
    {
      status:
        "Static/source syntax and ownership receipts, NOT generated routing/SSR/browser proof",
      appCodeFiles: code,
      domains: ["transactions", "inventory"],
      uiTablesAuthored: 2,
      generatedAssembly: "excluded and absent",
      runtimeResolution: "bare package emitted exports; no source aliases",
    },
    null,
    2,
  ),
);
