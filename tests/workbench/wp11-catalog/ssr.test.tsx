import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { MinimalWorkbench } from "../../../apps/storybook/src/workbench/Workbench.js";

it("server rendering does not turn the app publication into a DOM display grant", () => {
  const html = renderToString(<MinimalWorkbench />);
  expect(html).toContain("Synthetic transactions");
  expect(html).not.toContain("Transfer note 01");
  expect(html).not.toContain('role="rowheader"');
  expect(html).not.toContain("View details tx-001");
});
