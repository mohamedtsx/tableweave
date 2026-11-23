import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
  createResourceAdapter,
  useTableweaveResource,
} from "../../packages/react/dist/resource/index.js";
import type { Row } from "./fixtures.js";
import { context, input, success } from "./fixtures.js";

it("server renders stable empty snapshots without adopting client rows or running lifecycle effects", () => {
  let invalidations = 0;
  const adapter = createResourceAdapter<Row>(context, {
    onInvalidate() {
      invalidations++;
    },
  });
  const request = adapter.begin(input());
  if (!request) throw new Error("Missing token");
  adapter.succeed(request, success(["client-only-synthetic"]));
  const before = adapter.getSnapshot();
  function Read() {
    const view = useTableweaveResource(adapter, context);
    return createElement(
      "output",
      null,
      `${view.kind}:${view.snapshot?.records.length ?? 0}`,
    );
  }
  expect(renderToString(createElement(Read))).toBe("<output>idle:0</output>");
  expect(renderToString(createElement(Read))).toBe("<output>idle:0</output>");
  expect(adapter.getSnapshot()).toBe(before);
  expect(invalidations).toBe(0);
});
