import { StrictMode, Suspense, useState } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { createDataTableRendererCell } from "../../../packages/heroui/src/table/renderer-commit.js";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import {
  claimReorderUI,
  observeReorderUI,
} from "../../../packages/react/src/reordering-controller/index.js";
import { fixture } from "../admission/fixtures.js";

it("speculative renderer construction is inert and never owns an admission UI claim", () => {
  const f = fixture();
  const lease = f.admission.mount();
  const wait = new Promise<never>(() => {});
  function Candidate(): never {
    const model = useDataTable(f.D, f.options());
    useState(() => createDataTableRendererCell(model));
    throw wait;
  }
  try {
    renderToString(
      <StrictMode>
        <Suspense fallback="waiting">
          <Candidate />
        </Suspense>
      </StrictMode>,
    );
    expect(f.counts.metadata).toBe(0);
    const binding = claimReorderUI(f.D, f.admission, lease, {});
    expect(observeReorderUI(binding).joined).toBe(false);
  } finally {
    f.dispose();
  }
});
