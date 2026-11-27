import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { declared, packageRoot, sourcePaths } from "../harness/resolve.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// esbuild is Vite's actual declared dependency, not an undeclared root tool.
const viteRequire = createRequire(declared("vite", "root"));
const { build, version } = viteRequire("esbuild");
const output = resolve(here, ".artifacts/ssr.mjs");
mkdirSync(dirname(output), { recursive: true });
const result = await build({
  entryPoints: [resolve(here, "ssr.tsx")],
  outfile: output,
  bundle: true,
  platform: "node",
  format: "esm",
  jsx: "automatic",
  metafile: true,
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);',
  },
  alias: {
    ...sourcePaths,
    react: packageRoot("react"),
    "react-dom": packageRoot("react-dom"),
    "@heroui/react/button": declared("@heroui/react/button"),
    "@heroui/react/button-group": declared("@heroui/react/button-group"),
  },
});
writeFileSync(
  resolve(here, ".artifacts/ssr-metafile.json"),
  JSON.stringify(result.metafile, null, 2),
);
assert.ok(
  !Object.keys(result.metafile.inputs).some(
    (name) => name.includes(".repo/") || name.endsWith(".css"),
  ),
);
assert.equal("window" in globalThis, false);
assert.equal("document" in globalThis, false);
const { renderSelection, auditPrivacyRender } = await import(
  pathToFileURL(output)
);
const normal = renderSelection(false);
const selected = renderSelection(true);
assert.match(normal, /Normal tools/);
assert.doesNotMatch(normal, /Review selected/);
assert.match(selected, /1 selected/);
assert.match(selected, /Review selected/);
assert.doesNotMatch(selected, /Normal tools/);
assert.doesNotMatch(selected, /role="toolbar"/);
const privacy = ["access", "context", "definition"].map((kind) =>
  auditPrivacyRender(kind),
);
writeFileSync(
  resolve(here, ".artifacts/privacy-ssr-audit.json"),
  JSON.stringify(privacy, null, 2),
);
for (const audit of privacy) {
  assert.equal(audit.requestedQuery, null);
  assert.deepEqual(audit.selectedIds, []);
  assert.deepEqual({ ...audit.acceptedSelection }, { a: true });
  assert.equal(audit.queryUnchanged, true);
  assert.equal(
    audit.html,
    "",
    `${audit.kind}: masked first render must not emit private content`,
  );
  assert.equal(audit.normalRenders, 0);
  assert.equal(audit.actionMetadataReads, 0);
  assert.equal(audit.selectionMessageCalls, 0);
}
console.log(
  `Source SSR/import without window/document: both modes passed (existing esbuild ${version}; not a packed import)`,
);
