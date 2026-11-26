import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { fixture } from "./fixtures.js";
import { Host } from "./host.js";

it("SSR/abandoned renders have null readiness and never inspect private candidate props", () => {
  const f = fixture(),
    target = f.commit(),
    read = vi.fn(() => {
      throw new Error("SSR private read");
    });
  const opaqueProps = new Proxy(
    {},
    { getOwnPropertyDescriptor: read, get: read },
  );
  expect(
    renderToString(
      <Host controller={f.app.C} target={target} opaqueProps={opaqueProps} />,
    ),
  ).toBe("");
  expect(read).not.toHaveBeenCalled();
  expect(f.app.P.getSnapshot().phase).toBe("settled");
  expect(f.app.C.getSnapshot().selection).toEqual({ one: true });
});
