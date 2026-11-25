import { useDataTable } from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { createCriteriaBuilderStore } from "../../packages/heroui/src/filters/criteria-builder-host.js";
import {
  createCriteriaFacadeSource,
  getCriteriaFacadeInput,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import { createTableRendererCell } from "../../packages/heroui/src/table/renderer-commit.js";
import { BuilderBridge } from "./bridge.js";
import { fixture } from "./fixtures.js";

it("genuine initial model/source renders neutral Builder SSR and unready pins adoption", () => {
  const f = fixture();
  const store = createCriteriaBuilderStore<typeof f.schema>(),
    stop = store.mount();
  let input: unknown;
  function View() {
    const model = useDataTable(f.D, f.input());
    const cell = createTableRendererCell(model);
    const source = createCriteriaFacadeSource(cell, "builder");
    input = getCriteriaFacadeInput(source);
    return <BuilderBridge cell={cell} source={source} />;
  }
  try {
    const html = renderToString(<View />);
    expect(html).toContain("Filter controls are unavailable.");
    expect(html).not.toContain("tw-filter-rule");
    store.commit(input);
    expect(store.mode()).toBe("adopted");
    store.commit({});
    expect(store.mode()).toBe("adopted");
    expect(store.read()).toBeNull();
  } finally {
    stop();
    f.dispose();
  }
});
