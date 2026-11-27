import { createControlsAuthority, projectControls } from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Pagination,
  usePaginationCorrection,
} from "../../../packages/heroui/src/pagination/index.js";
import { paginationTargets } from "../../../packages/heroui/src/pagination/model.js";
import { context, fixture } from "../core/fixtures.js";

describe("pagination source server rendering and bounded model", () => {
  it("bounds huge known totals without allocating a total-sized array", () => {
    expect(paginationTargets(0, 1_000_000_000)).toEqual([0, 1, 2, 3, 4]);
    expect(paginationTargets(500, 1_000_000_000)).toEqual([
      498, 499, 500, 501, 502,
    ]);
    expect(paginationTargets(999, 1000)).toEqual([995, 996, 997, 998, 999]);
    expect(paginationTargets(0, 0)).toEqual([]);
  });
  it("SSR uses actual current server snapshot and never runs correction/start/retry during render", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "pagination.change",
      update: (previous) => ({ ...previous, pageIndex: 4 }),
    });
    f.begin();
    f.succeed([], { kind: "known", total: 3 });
    const input = f.server();
    const facts = projectControls(f.definition, input);
    const authority = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: f.controller.getSnapshot().queryIdentity,
      context,
      mode: "server",
      resource: f.resource,
      readCommitted: f.readCommitted,
    });
    const state = f.controller.getSnapshot();
    const resource = f.resource.getSnapshot();
    function ServerFixture() {
      usePaginationCorrection(f.controller, facts, authority, {
        definition: f.definition,
        context,
        epoch: 0,
        readCurrent: () => ({ context, epoch: 0 }),
      });
      return (
        <Pagination
          schema={f.definition.controllerDefinition.schema}
          presentation={facts}
          authority={authority}
        />
      );
    }
    const html = renderToString(<ServerFixture />);
    expect(html).toContain("3 records in total.");
    expect(html).toContain("Displayed page 5 is outside the current 2 pages.");
    expect(html).not.toContain("Page 1 of 0");
    expect(f.controller.getSnapshot()).toBe(state);
    expect(f.resource.getSnapshot()).toBe(resource);
    expect(f.resource.getSnapshot().request?.generation).toBe(1);
  });
});
