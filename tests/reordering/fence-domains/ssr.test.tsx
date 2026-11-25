import { StrictMode, Suspense, useState } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import { createDataTableRendererCell } from "../../../packages/heroui/src/table/renderer-commit.js";
import {
  claimReorderUI,
  observeReorderUI,
  releaseReorderUI,
} from "../../../packages/react/src/reordering-controller/index.js";
import { fixture } from "../admission/fixtures.js";
it("speculation reads no app metadata and owns no UI/application replay lease", () => {
  const f = fixture(),
    lease = f.admission.mount(),
    wait = new Promise<never>(() => {});
  function Candidate(): never {
    const model = useDataTable(f.D, f.options());
    useState(() => createDataTableRendererCell(model));
    throw wait;
  }
  try {
    renderToString(
      <StrictMode>
        <Suspense fallback="wait">
          <Candidate />
        </Suspense>
      </StrictMode>,
    );
    expect(f.counts.metadata).toBe(0);
    const binding = claimReorderUI(f.D, f.admission, lease, {});
    const before = observeReorderUI(binding);
    expect(observeReorderUI(binding)).toBe(before);
    expect(f.counts.metadata).toBe(0);
    releaseReorderUI(binding);
  } finally {
    f.dispose();
  }
});
