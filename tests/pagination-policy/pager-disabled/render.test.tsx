import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pagination } from "../../../packages/heroui/src/pagination/Pagination.js";
import type { PaginationProps } from "../../../packages/heroui/src/pagination/types.js";
import { usePaginationCorrection } from "../../../packages/heroui/src/pagination/usePaginationCorrection.js";
import {
  actor,
  type Item,
  poison,
  poisonedProps,
  type Schema,
  withFlag,
} from "./actors.js";

// Calling the component in a stable wrapper tests its own prop boundary, rather
// than asking React.createElement/spread to evaluate hostile getters beforehand.
function RawPager({ input }: { input: PaginationProps<Schema, Item> }) {
  return Pagination(input);
}
describe("disabled pager raw/source render boundary (authored, not executed)", () => {
  it("false schema never reads even the presentation reference or any optional prop getter", () => {
    const f = actor(false),
      audit: string[] = [];
    const state = f.controller.getSnapshot();
    expect(
      renderToString(<RawPager input={poisonedProps(f.schema, audit)} />),
    ).toBe("");
    expect(audit).toEqual([]);
    expect(f.controller.getSnapshot()).toBe(state);
    expect(f.commands).toEqual([]);
  });
  it("false schema does not inspect stale clamp-looking presentation, authority or correction context during render", () => {
    const f = actor(false),
      audit: string[] = [];
    const facts = poison<
      Parameters<typeof usePaginationCorrection<Schema, Item>>[1]
    >(audit, "facts");
    const authority = poison<typeof f.authority>(audit, "authority");
    const context = poison<typeof f.context>(audit, "context");
    function Disabled() {
      usePaginationCorrection(f.controller, facts, authority, context);
      return (
        <Pagination
          schema={f.schema}
          presentation={facts}
          authority={authority}
          formatNumber={() => {
            audit.push("formatter");
            throw new Error("Must not format");
          }}
        />
      );
    }
    expect(renderToString(<Disabled />)).toBe("");
    expect(audit).toEqual([]);
    expect(f.commands).toEqual([]);
  });
  for (const value of [false, undefined, null, 0, "true"]) {
    it(`enabled schema denies explicit invalid/false own fact ${String(value)} before formatter/default locale`, () => {
      const f = actor(true, 0),
        audit: string[] = [];
      const facts = withFlag(f.facts(), { value, enumerable: true });
      Object.defineProperty(facts, "displayed", {
        get() {
          audit.push("displayed");
          throw new Error("Must not read default locale");
        },
      });
      const props = {
        schema: f.schema,
        presentation: facts,
        authority: f.authority,
        formatNumber: () => {
          audit.push("formatter");
          throw new Error("Must not format");
        },
      };
      expect(renderToString(<RawPager input={props} />)).toBe("");
      expect(audit).toEqual([]);
    });
  }
  it("own flag accessor is rejected without invoking it or any other optional prop getter", () => {
    const f = actor(true, 0),
      audit: string[] = [];
    const facts = withFlag(f.facts(), {
      get() {
        audit.push("flag.get");
        throw new Error("Must not get flag");
      },
    });
    const input = new Proxy(
      { schema: f.schema, presentation: facts },
      {
        get(target, key) {
          if (key === "schema") return target.schema;
          if (key === "presentation") return target.presentation;
          audit.push(`props.${String(key)}`);
          throw new Error("Must not read optional props");
        },
      },
    ) as PaginationProps<Schema, Item>;
    expect(renderToString(<RawPager input={input} />)).toBe("");
    expect(audit).toEqual([]);
  });
  it("throwing flag descriptor trap fails closed without formatter access", () => {
    const f = actor(true, 0),
      audit: string[] = [];
    const facts = new Proxy(f.facts(), {
      getOwnPropertyDescriptor() {
        audit.push("descriptor");
        throw new Error("Synthetic descriptor denial");
      },
    });
    expect(
      renderToString(
        <Pagination
          schema={f.schema}
          presentation={facts}
          authority={f.authority}
          formatNumber={() => {
            audit.push("formatter");
            return "bad";
          }}
        />,
      ),
    ).toBe("");
    expect(audit).toEqual(["descriptor"]);
  });
  it("legacy absent metadata preserves genuine enabled facts and user formatter", () => {
    const f = actor(true, 0),
      calls: [number, string][] = [];
    const facts = f.facts();
    expect(Object.hasOwn(facts, "paginationEnabled")).toBe(false);
    const html = renderToString(
      <Pagination
        schema={f.schema}
        presentation={facts}
        authority={f.authority}
        locale="en-US"
        formatNumber={(value, locale) => {
          calls.push([value, locale]);
          return `n${value}`;
        }}
      />,
    );
    expect(html).toContain("n1–n2 of n3 records");
    expect(calls.length).toBeGreaterThan(0);
    expect(calls.every(([, locale]) => locale === "en-US")).toBe(true);
    expect(f.commands).toEqual([]);
  });
});
