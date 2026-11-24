import { readFile } from "node:fs/promises";
import ts from "typescript";
import { expect, test } from "vitest";
import {
  type CriteriaToolTarget,
  createCriteriaCommitCell as current,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import type { FilterSearchPorts } from "../../packages/heroui/src/filters/criteria-ports.js";
import { fixture, type S } from "../criteria-commit/fixtures.js";
import { createCriteriaCommitCell as original } from "./.artifacts/original-criteria-commit.js";

test("F3 original exported declarations/signatures are preserved, new private adapter excluded", async () => {
  const printer = ts.createPrinter({ removeComments: true });
  function declarations(text: string) {
    const source = ts.createSourceFile(
      "cell.tsx",
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    return Object.fromEntries(
      source.statements.flatMap((node) => {
        if (
          !ts.canHaveModifiers(node) ||
          !ts
            .getModifiers(node)
            ?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
        )
          return [];
        if (
          !ts.isTypeAliasDeclaration(node) &&
          !ts.isInterfaceDeclaration(node) &&
          !ts.isClassDeclaration(node) &&
          !ts.isFunctionDeclaration(node)
        )
          return [];
        const name = node.name?.text;
        if (!name || name === "createCriteriaToolAdapter") return [];
        const value = ts.isFunctionDeclaration(node)
          ? ts.factory.updateFunctionDeclaration(
              node,
              node.modifiers,
              node.asteriskToken,
              node.name,
              node.typeParameters,
              node.parameters,
              node.type,
              undefined,
            )
          : node;
        return [
          [name, printer.printNode(ts.EmitHint.Unspecified, value, source)],
        ];
      }),
    );
  }
  const before = await readFile(
    new URL("./.artifacts/original-criteria-commit.tsx", import.meta.url),
    "utf8",
  );
  const after = await readFile(
    new URL(
      "../../packages/heroui/src/filters/criteria-commit.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  expect(declarations(after)).toEqual(declarations(before));
});
function transcript<A extends object, L extends object>(
  cell: {
    connect(): L;
    getSnapshot(): { actor: A | null; version: object };
    commit(lease: L, target: CriteriaToolTarget<S>, props: unknown): A;
    require(actor: A): { ports: FilterSearchPorts<S> };
    disconnect(lease: L): void;
  },
  f: ReturnType<typeof fixture>,
) {
  const keys = Object.keys(cell),
    lease = cell.connect(),
    target = f.commit();
  let calls = 0;
  const a = cell.commit(
    lease,
    target,
    f.search({
      onMutation() {
        calls++;
      },
    }),
  );
  const saved = cell.require(a).ports.onMutation;
  saved?.({ status: "noop" });
  const b = cell.commit(lease, target, f.search());
  let oldDenied = false;
  try {
    cell.require(a);
  } catch {
    oldDenied = true;
  }
  let savedDenied = false;
  try {
    saved?.({ status: "noop" });
  } catch {
    savedDenied = true;
  }
  const actorCurrent = cell.getSnapshot().actor === b;
  cell.disconnect(lease);
  return {
    keys,
    snapshotKeys: Object.keys(cell.getSnapshot()),
    calls,
    oldDenied,
    savedDenied,
    actorCurrent,
    disconnected: cell.getSnapshot().actor === null,
  };
}
test("actual raw-tool preimage transcript/own keys and callback retirement match", () => {
  const before = fixture(),
    after = fixture();
  expect(transcript(current("search", after.app.C), after)).toEqual(
    transcript(original("search", before.app.C), before),
  );
});
