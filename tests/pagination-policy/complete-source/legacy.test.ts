import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { fixture, records, required } from "./fixtures.js";
import { own } from "./scope.mjs";

// Executed only in the final phase: first against immutable8 source preimages,
// then against the candidate. No before-failure or golden pass is claimed now.
test("literal old paged/control fields and native option/action ordering match the exact preimage", () => {
  const results: unknown[] = [];
  for (const mode of ["client", "known", "unknown"] as const)
    for (const empty of [false, true])
      for (const owner of [1, 2]) {
        const f = fixture(true),
          data = empty ? [] : records.slice(0, 3),
          events: string[] = [];
        const stop = f.resource.subscribe(() =>
          events.push(f.resource.getSnapshot().kind),
        );
        let requestKeys: PropertyKey[] | null = null;
        if (mode !== "client") {
          const a = required(f.begin());
          requestKeys = Reflect.ownKeys(a.request);
          f.succeed(
            a.request,
            data,
            mode === "known"
              ? { kind: "known", total: data.length }
              : { kind: "unknown", hasNextPage: !empty },
          );
        }
        const input = mode === "client" ? f.client(data) : f.remote(),
          facts = f.project(input),
          displayed = facts.displayed;
        const table = input.native.visibleColumns[0]?.table;
        const observed = {
          mode,
          empty,
          owner,
          requestKeys,
          rows: facts.rows.map((row) => row.id),
          selectedIds: facts.selectedIds,
          loaded: facts.loadedSelected.map((item) => item.id),
          missing: facts.missingSelectedIds,
          eligible: facts.eligiblePageIds,
          pageSelection: facts.pageSelection,
          displayed: displayed && {
            mode: displayed.mode,
            query: displayed.query,
            queryIdentity: displayed.queryIdentity,
            evaluatedAt: displayed.evaluatedAt,
            pagination: displayed.pagination,
            pageInfo: displayed.pageInfo,
            pageCount: displayed.pageCount,
            recordCount: displayed.recordCount,
            range: displayed.range,
            request: displayed.request,
            receivedAt: displayed.receivedAt,
          },
          busy: facts.busy,
          stale: facts.stale,
          obsolete: facts.obsolete,
          resourceObsolete: facts.resourceObsolete,
          blockedReason: facts.blockedReason,
          canSelect: facts.canSelect,
          canNavigate: facts.canNavigate,
          canPreviousPage: facts.canPreviousPage,
          canNextPage: facts.canNextPage,
          canReorder: facts.canReorder,
          canRetry: facts.canRetry,
          canCancelSelection: facts.canCancelSelection,
          manual: [
            table?.options.manualFiltering,
            table?.options.manualSorting,
            table?.options.manualPagination,
          ],
          rowCount: table?.options.rowCount ?? null,
          pageCount: table?.options.pageCount ?? null,
          events,
        };
        const authority = f.authority(input);
        authority.cancelSelection();
        stop();
        results.push({
          ...observed,
          afterCancel: Object.keys(f.controller.getSnapshot().selection),
        });
      }
  const path = join(own, ".artifacts", "legacy-preimage.json");
  if (process.env.U4_PREIMAGE === "1")
    writeFileSync(path, `${JSON.stringify(results, null, 2)}\n`, {
      flag: "wx",
    });
  expect(results).toEqual(JSON.parse(readFileSync(path, "utf8")));
});
