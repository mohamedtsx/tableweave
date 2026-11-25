import { StrictMode, Suspense, useState } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import { fixture } from "./fixtures.js";
import { createReorderController } from "../../../packages/react/src/reordering-controller/index.js";
import type { ReorderControllerResult } from "../../../packages/react/src/reordering-controller/types.js";
import type { Item, S } from "./fixtures.js";

it("real initial model remains neutral and no constructor/source claim occurs in SSR", () => {
  const f = fixture();
  function Screen() {
    const model = useDataTable(f.D, f.options());
    return <output>{model.phase}</output>;
  }
  try {
    const html = renderToString(
      <StrictMode>
        <Suspense fallback="waiting">
          <Screen />
        </Suspense>
      </StrictMode>,
    );
    expect(html).toContain("uncommitted");
    expect(f.counts.metadata).toBe(0);
    expect(f.admission.getSnapshot().phase).toBe("unmounted");
  } finally {
    f.dispose();
  }
});

it("abandoned/suspended real controller construction creates no admission/source claim", () => {
  const f = fixture();
  const created: ReorderControllerResult<S, Item>[] = [];
  let reads = 0;
  const never = new Promise<never>(() => {});
  function Candidate(): never {
    useState(() => {
      const setup = createReorderController(f.D, {
        controller: f.settings.controller,
        instanceId: "synthetic-abandoned",
        readCurrent() {
          reads++;
          return f.metadata();
        },
      });
      created.push(setup);
      return setup;
    });
    throw never;
  }
  try {
    renderToString(
      <StrictMode>
        <Suspense fallback="abandoned">
          <Candidate />
        </Suspense>
      </StrictMode>,
    );
    expect(reads).toBe(0);
    for (const setup of created)
      expect(setup.admission.getSnapshot().phase).toBe("unmounted");
  } finally {
    for (const setup of created) {
      setup.admission.dispose();
      setup.controller.dispose();
    }
    f.dispose();
  }
});
