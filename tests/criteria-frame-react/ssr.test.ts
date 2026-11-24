import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { useCriteriaFrame } from "../../packages/react/src/presentation/criteria-frame-react.js";
import { fixture } from "./fixtures.js";

test("SSR remains neutral and does not inspect candidate configuration or create native work", () => {
  const f = fixture();
  let reads = 0;
  const input = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  function View() {
    const value = useCriteriaFrame(f.frames, input as never);
    return createElement(
      "output",
      null,
      value === null ? "neutral" : "private",
    );
  }
  expect(renderToString(createElement(View))).toBe("<output>neutral</output>");
  expect(reads).toBe(0);
  expect(f.frames.getSnapshot().phase).toBe("empty");
  expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
});
