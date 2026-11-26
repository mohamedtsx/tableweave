import { useDataTable } from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
  CriteriaFacadeToolbar,
  createCriteriaFacadeSource,
  criteriaFacadeState,
  getCriteriaFacadeInput,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import { fixture } from "./fixtures.js";

it("actual initial P2 model/source produces adopted-unready SSR, never legacy private props", () => {
  const f = fixture();
  let same = false,
    kind: string | null = null;
  function Screen() {
    const model = useDataTable(f.D, f.options()),
      cell = createTableRendererCell(model),
      source = createCriteriaFacadeSource(cell, "search");
    same = createCriteriaFacadeSource(cell, "search") === source;
    kind = criteriaFacadeState(getCriteriaFacadeInput(source));
    return <CriteriaFacadeToolbar source={source} />;
  }
  try {
    const html = renderToString(<Screen />);
    expect(same).toBe(true);
    expect(kind).toBe("unready");
    expect(html).toContain("Filtering is unavailable.");
    expect(html).not.toContain("input");
  } finally {
    f.dispose();
  }
});
