import fs from "node:fs";
import path from "node:path";
import {
  demand,
  regular,
  digest,
  write,
  record,
  object,
  verifyMap,
  fileRecord,
} from "./receipts.mjs";
import { installed, usesStyled } from "./installer.mjs";
import { execute } from "./generation.mjs";

export function validateLedger(ledger) {
  object(ledger);
  demand(
    ledger.status === "authored-unverified" &&
      Array.isArray(ledger.cases) &&
      ledger.cases.length > 0,
    "E_EMPTY_OR_UNREVIEWED_LEDGER",
  );
  const ids = new Set();
  for (const item of ledger.cases) {
    object(item);
    demand(
      typeof item.id === "string" &&
        /^[a-z][a-z0-9-]*$/.test(item.id) &&
        !ids.has(item.id),
      "E_DIAGNOSTIC_ID",
    );
    ids.add(item.id);
    demand(
      ["headless.ts", "styled.tsx", "reordering-controller.ts"].includes(
        item.fixture,
      ) &&
        typeof item.code === "string" &&
        item.code.length > 0 &&
        !/@ts-|\bany\b|as unknown as/.test(item.code),
      "E_DIAGNOSTIC_CODE",
    );
    demand(
      ["semantic", "private-path"].includes(item.kind),
      "E_DIAGNOSTIC_KIND",
    );
    demand(
      item.kind !== "private-path" ||
        item.code ===
          'import { createQuery as privateQuery } from "@tableweave/react/src/contracts/index.js"; export { privateQuery };',
      "E_PRIVATE_NEGATIVE_PATH",
    );
    demand(
      Array.isArray(item.diagnostics) &&
        item.diagnostics.length > 0 &&
        item.diagnostics.every(
          (d) =>
            (item.kind === "private-path"
              ? d.code === 2307
              : [2322, 2339, 2345, 2305, 2741].includes(d.code)) &&
            Number.isInteger(d.line) &&
            d.line > 0 &&
            Number.isInteger(d.column) &&
            d.column > 0,
        ),
      "E_DIAGNOSTIC_EXPECTATION",
    );
  }
  return ledger;
}
export function diagnostics(text, target) {
  const result = [];
  for (const match of text.matchAll(
    /^(.+?)\((\d+),(\d+)\): error TS(\d+): /gm,
  )) {
    const file = path.resolve(target, match[1]);
    demand(file.startsWith(`${target}/`), "E_EXTERNAL_DIAGNOSTIC");
    result.push({
      file: path.relative(target, file),
      line: Number(match[2]),
      column: Number(match[3]),
      code: Number(match[4]),
    });
  }
  demand(
    text.split(/\r?\n/).filter((line) => /error TS\d+:/.test(line)).length ===
      result.length,
    "E_UNPARSED_DIAGNOSTIC",
  );
  return result.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      a.code - b.code,
  );
}
function configuration(files) {
  return `${JSON.stringify({ compilerOptions: { strict: true, exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true, noUncheckedSideEffectImports: true, skipLibCheck: false, noEmit: true, incremental: false, module: "NodeNext", moduleResolution: "NodeNext", jsx: "react-jsx", target: "ES2022", lib: ["ESNext", "DOM", "DOM.Iterable"], types: ["node", "react", "react-dom"] }, files }, null, 2)}\n`;
}
export function checkTypes(ctx) {
  const state = installed(ctx),
    ledgerBytes = regular(
      ctx.producer,
      "tests/consumers/wp13/fixtures/diagnostics.json",
    ),
    ledger = validateLedger(JSON.parse(ledgerBytes.toString("utf8")));
  demand(
    ctx.approval.diagnosticLedgerSHA256 === digest(ledgerBytes) &&
      ctx.approval.diagnosticsStatus ===
        "main-reviewed-authored-expectations-not-executed",
    "E_DIAGNOSTIC_REVIEW_REQUIRED",
  );
  const cases = ledger.cases.filter(
    (item) => item.fixture !== "styled.tsx" || usesStyled(ctx.family),
  );
  demand(cases.length > 0, "E_EMPTY_FAMILY_NEGATIVES");
  const positives = [
    "headless.ts",
    "reordering-controller.ts",
    ...(usesStyled(ctx.family) ? ["styled.tsx"] : []),
  ];
  write(state.target, "tsconfig.positive.json", configuration(positives));
  const expectedFiles = [],
    removedFiles = [],
    expected = [];
  for (const item of cases) {
    const base = regular(state.target, item.fixture).toString("utf8"),
      file = `negative-${item.id}${item.fixture.endsWith("tsx") ? ".tsx" : ".ts"}`,
      marked = `expected-${file}`;
    demand(
      !base.includes("@ts-expect-error") && !base.includes("@ts-ignore"),
      "E_POSITIVE_SUPPRESSION",
    );
    write(
      state.target,
      marked,
      `${base}\n// @ts-expect-error ${item.id}\n${item.code}\n`,
    );
    write(state.target, file, `${base}\n${item.code}\n`);
    expectedFiles.push(marked);
    removedFiles.push(file);
    for (const d of item.diagnostics)
      expected.push({
        file,
        line: base.split("\n").length + d.line,
        column: d.column,
        code: d.code,
      });
  }
  expected.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.column - b.column ||
      a.code - b.code,
  );
  write(state.target, "tsconfig.expected.json", configuration(expectedFiles));
  write(state.target, "tsconfig.removed.json", configuration(removedFiles));
  const generatedInputs = Object.fromEntries(
    [
      "tsconfig.positive.json",
      "tsconfig.expected.json",
      "tsconfig.removed.json",
      ...expectedFiles,
      ...removedFiles,
    ].map((file) => [file, fileRecord(state.target, file)]),
  );
  const observations = {};
  for (const compiler of ["typescript", "typescript-5-9"]) {
    const beforeList = execute(ctx, "compiler", {
      compiler,
      stage: "positive",
      list: true,
    });
    const beforePaths = beforeList.stdout.trim().split(/\r?\n/),
      beforeInputs = {};
    demand(beforePaths.length > positives.length, "E_EMPTY_TYPE_FILE_REPORT");
    for (const file of beforePaths) {
      demand(path.isAbsolute(file), "E_TYPE_FILE_PATH");
      const actual = fs.realpathSync(file);
      demand(
        actual.startsWith(`${state.target}/`),
        "E_ROOT_COMPILER_OR_DECLARATION_BORROW",
      );
      const relative = path.relative(state.target, actual);
      beforeInputs[relative] = fileRecord(state.target, relative);
    }
    execute(ctx, "compiler", { compiler, stage: "positive" });
    execute(ctx, "compiler", { compiler, stage: "expected" });
    const result = execute(ctx, "compiler", {
      compiler,
      stage: "removed",
      allowFailure: true,
    });
    demand(
      result.status !== 0 && result.status !== null && !result.error,
      "E_NEGATIVE_NOT_DIAGNOSTIC_FAILURE",
    );
    const actual = diagnostics(
      `${result.stdout}${result.stderr}`,
      state.target,
    );
    demand(
      actual.length > 0 && JSON.stringify(actual) === JSON.stringify(expected),
      "E_NEGATIVE_DIAGNOSTIC_MISMATCH",
    );
    execute(ctx, "compiler", { compiler, stage: "after" });
    const listed = execute(ctx, "compiler", {
      compiler,
      stage: "after",
      list: true,
    });
    const paths = listed.stdout.trim().split(/\r?\n/);
    demand(
      paths.length > positives.length &&
        paths.every((file) => path.isAbsolute(file)),
      "E_EMPTY_TYPE_FILE_REPORT",
    );
    const inputs = {};
    for (const file of paths) {
      const actual = fs.realpathSync(file);
      demand(
        actual.startsWith(`${state.target}/`),
        "E_ROOT_COMPILER_OR_DECLARATION_BORROW",
      );
      const relative = path.relative(state.target, actual);
      inputs[relative] = fileRecord(state.target, relative);
    }
    verifyMap(state.target, state.installed.inputs);
    verifyMap(state.target, beforeInputs);
    observations[compiler] = {
      actualDiagnostics: actual,
      beforeInputs,
      inputs,
    };
  }
  record(ctx.run, `types-${ctx.key}.json`, {
    candidate: ctx.request.candidate,
    status: "actual-dual-compiler-results",
    ledgerSHA256: digest(ledgerBytes),
    generatedInputs,
    observations,
  });
  return { status: "strict-types-only", negativeCases: cases.length };
}
export function wholeAppTypes(ctx, target) {
  const results = {};
  for (const compiler of ["typescript", "typescript-5-9"]) {
    const list = execute(ctx, "family-types", { compiler, list: true }),
      paths = list.stdout.trim().split(/\r?\n/),
      inputs = {};
    demand(
      paths.length > 1 && paths.every((file) => path.isAbsolute(file)),
      "E_EMPTY_FAMILY_TYPE_REPORT",
    );
    for (const file of paths) {
      const actual = fs.realpathSync(file);
      demand(actual.startsWith(`${target}/`), "E_FAMILY_ROOT_HOISTED_TYPES");
      const relative = path.relative(target, actual);
      inputs[relative] = fileRecord(target, relative);
    }
    execute(ctx, "family-types", { compiler });
    verifyMap(target, inputs);
    results[compiler] = inputs;
  }
  return results;
}
