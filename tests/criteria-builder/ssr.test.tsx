import { expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { FilterBuilder } from "../../packages/heroui/src/filters/filter-builder.js";
import { fixture } from "./fixtures.js";

it("server render cannot publish a criteria configuration or traverse private candidate ports", () => {
  const f = fixture();
  let reads = 0;
  const input = new Proxy(f.props(), { getOwnPropertyDescriptor(target, key) { if (key !== "criteria") reads++; return Reflect.getOwnPropertyDescriptor(target, key); } });
  function Forward() { return FilterBuilder(input); }
  const before = f.app.C.getSnapshot();
  const html = renderToString(<Forward />);
  expect(reads).toBe(0);
  expect(html).not.toContain("12:34:56.789");
  expect(f.app.C.getSnapshot()).toBe(before);
});
