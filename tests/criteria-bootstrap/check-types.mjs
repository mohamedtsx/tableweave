import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { hash, inputs, own, root } from "./guard.mjs";

const label = process.argv[2];
assert(/^[a-z][a-z0-9-]*$/.test(label));
const output = join(own, ".artifacts", label);
await mkdir(output, { recursive: false });
const requireRoot = createRequire(join(root, "package.json"));
const template = await readFile(join(own, "types.ts"), "utf8");
const directives = [...template.matchAll(/\/\/ @ts-expect-error[^\n]*/g)];
assert.equal(directives.length, 23);
const results = [];
const light = process.argv[3] === "--light";
if (light) assert.deepEqual(await inputs(), JSON.parse(await readFile(join(own, ".artifacts/protected-before.json"), "utf8")));
for (const compiler of light ? ["typescript"] : ["typescript", "typescript-5-9"]) {
  const ts = requireRoot(compiler);
  const paths = {};
  for (const specifier of ["@tanstack/react-table", "@tanstack/table-core", "@tanstack/table-core/reactivity", "@tanstack/table-core/store-reactivity-bindings", "@internationalized/date", "valibot", "react"]) {
    const resolved = ts.resolveModuleName(specifier, join(root, "packages/react/src/tanstack/definition.ts"), { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, target: ts.ScriptTarget.ES2022 }, ts.sys).resolvedModule;
    assert(resolved, specifier);
    paths[specifier] = [resolved.resolvedFileName];
  }
  const store = ts.resolveModuleName("@tanstack/react-store", paths["@tanstack/react-table"][0], { module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext }, ts.sys).resolvedModule;
  assert(store);
  paths["@tanstack/react-store"] = [store.resolvedFileName];
  const emitted = join(output, `emitted-${compiler}`);
  const options = {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true, exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true,
    noUnusedLocals: true, noUnusedParameters: true, noImplicitOverride: true,
    noFallthroughCasesInSwitch: true, verbatimModuleSyntax: true, isolatedModules: true,
    skipLibCheck: false, types: ["node"], typeRoots: [join(root, "node_modules/@types")],
    lib: ["lib.es2022.d.ts", "lib.es2023.intl.d.ts", "lib.dom.d.ts"], paths,
  };
  function diagnostics(program) {
    return ts.getPreEmitDiagnostics(program).map((d) => ({ code: d.code, file: d.file?.fileName, line: d.file && d.start !== undefined ? d.file.getLineAndCharacterOfPosition(d.start).line + 1 : 0, message: ts.flattenDiagnosticMessageText(d.messageText, " ") }));
  }
  const sourceFiles = ["owner.ts", "fixtures.ts", "bootstrap.test.ts", "negative-control.test.ts", ...(light ? ["types.ts"] : [])].map((p) => join(own, p));
  const ownProgram = ts.createProgram({ rootNames: sourceFiles, options: { ...options, noEmit: true } });
  const ownErrors = diagnostics(ownProgram);
  await writeFile(join(output, `${compiler}-own-errors.json`), JSON.stringify(ownErrors, null, 2));
  if (light) {
    const protectedInputs = await inputs();
    const ownInputs = Object.fromEntries(await Promise.all(sourceFiles.map(async (p) => [p.slice(root.length + 1), hash(await readFile(p))])));
    await writeFile(join(output, "light-result.json"), JSON.stringify({ provisional: true, compiler: ts.version, ownErrors, protectedInputs: Object.keys(protectedInputs).length, protectedAggregate: hash(JSON.stringify(protectedInputs)), ownInputs, ownInputAggregate: hash(JSON.stringify(ownInputs)), scopeUnchanged: true, directivesAuthored: directives.length, negativeRemovalProof: "DEFERRED", sourceAndPrivateEmittedDualCompilerMatrix: "DEFERRED" }, null, 2));
    console.log(`Light TS${ts.version} source-only check: ${ownErrors.length} errors; protected ${Object.keys(protectedInputs).length} unchanged. Full verification DEFERRED.`);
  }
  assert.deepEqual(ownErrors, [], `${compiler}: strict own source/tests`);
  if (light) continue;
  const emitProgram = ts.createProgram({ rootNames: [join(own, "owner.ts"), join(own, "fixtures.ts")], options: { ...options, rootDir: root, outDir: emitted, declaration: true, noEmitOnError: true } });
  assert.deepEqual(diagnostics(emitProgram), []);
  assert.equal(emitProgram.emit().emitSkipped, false);
  const sourceGraph = emitProgram.getSourceFiles().filter((f) => f.fileName.startsWith(join(root, "packages/react/src/"))).map((f) => f.fileName.slice(root.length + 1));
  assert(sourceGraph.includes("packages/react/src/controller/store.ts"));
  assert(sourceGraph.includes("packages/react/src/controller/criteria-publication.ts"));
  assert(sourceGraph.includes("packages/react/src/tanstack/definition.ts"));
  assert(!sourceGraph.some((p) => /resource\/(adapter|view)|\/hooks\/|tanstack\/hook/.test(p)));
  await writeFile(join(output, `${compiler}-resolutions.json`), JSON.stringify({ version: ts.version, paths, sourceGraph }, null, 2));
  for (const mode of ["source", "emitted"]) {
    const folder = join(output, `${compiler}-${mode}`);
    await mkdir(folder);
    const target = mode === "source" ? root : emitted;
    const text = template.replaceAll("../../packages/react/src/", `${target}/packages/react/src/`).replaceAll('"./owner.js"', JSON.stringify(join(target, "tests/criteria-bootstrap/owner.js"))).replaceAll('"./fixtures.js"', JSON.stringify(join(target, "tests/criteria-bootstrap/fixtures.js")));
    const file = join(folder, "consumer.ts");
    await writeFile(file, text);
    const positive = ts.createProgram({ rootNames: [file], options: { ...options, noEmit: true } });
    const errors = diagnostics(positive);
    await writeFile(join(output, `${compiler}-${mode}-positive.json`), JSON.stringify(errors, null, 2));
    assert.deepEqual(errors, [], `${compiler}/${mode} positive + expect-error baseline`);
    // One all-directives-removed compile, with a semantic error on EVERY intended
    // next line and no unrelated/missing-module errors. No 92-program rerun loop.
    const stripped = text.replace(/\/\/ @ts-expect-error[^\n]*/g, (s) => " ".repeat(s.length));
    await writeFile(file, stripped);
    const negative = ts.createProgram({ rootNames: [file], options: { ...options, noEmit: true } });
    const negativeErrors = diagnostics(negative);
    const intended = [...text.matchAll(/\/\/ @ts-expect-error[^\n]*/g)].map((m) => text.slice(0, m.index).split("\n").length + 1);
    await writeFile(join(output, `${compiler}-${mode}-negatives.json`), JSON.stringify({ intended, errors: negativeErrors }, null, 2));
    for (const error of negativeErrors) {
      assert.equal(error.file, file);
      assert(intended.includes(error.line), JSON.stringify(error));
      assert([2322, 2339, 2341, 2345, 2353, 2540, 2554, 2673].includes(error.code), JSON.stringify(error));
    }
    for (const line of intended) assert(negativeErrors.some((d) => d.line === line), `${compiler}/${mode}: negative line ${line} must fail`);
    await writeFile(file, text);
    const result = { compiler: ts.version, mode, positive: true, meaningfulNegativeLines: intended.length, semanticErrors: negativeErrors.length, inputSha256: hash(text) };
    results.push(result);
    console.log(JSON.stringify(result));
  }
}
await writeFile(join(output, "results.json"), JSON.stringify(results, null, 2));
