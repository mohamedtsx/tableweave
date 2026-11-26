import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import type { FilterSearchProps } from "../../packages/heroui/src/toolbar/filter-search.js";
import { FilterSearch } from "../../packages/heroui/src/toolbar/filter-search.js";
import type { FilterTabsProps } from "../../packages/heroui/src/toolbar/filter-tabs.js";
import { FilterTabs } from "../../packages/heroui/src/toolbar/filter-tabs.js";
import type { S } from "./fixtures.js";
import { fixture } from "./fixtures.js";

it("truly omitted raw Search/Tabs keep their existing SSR/coherent-host route", () => {
  const f = fixture();
  expect(
    renderToString(
      <FilterSearch controller={f.app.C} expectedContext={f.context} />,
    ),
  ).toContain("Search records");
  expect(
    renderToString(
      <FilterTabs
        controller={f.app.C}
        expectedContext={f.context}
        tabs={{ all: { label: "All" }, active: { label: "Active" } }}
        neutralTab={{ label: "Any" }}
      >
        <span>Legacy results</span>
      </FilterTabs>,
    ),
  ).toContain("Legacy results");
});
it("supplied criteria SSR/prelayout is neutral without private candidate messages or children", () => {
  const f = fixture();
  let reads = 0;
  const bad = () => {
    reads++;
    throw new Error("Private candidate must not be read");
  };
  const input = Object.defineProperties(
    { criteria: f.target },
    Object.fromEntries(
      ["controller", "messages", "tabs", "children", "onMutation"].map(
        (key) => [key, { get: bad }],
      ),
    ),
  );
  // Forward the opaque object as one value: React itself must not spread/copy
  // getter props before the component's own discriminant can run.
  function Search() {
    return FilterSearch(input as FilterSearchProps<S>);
  }
  function Tab() {
    return FilterTabs(input as FilterTabsProps<S>);
  }
  expect(renderToString(<Search />)).toContain("Filtering is unavailable.");
  expect(renderToString(<Tab />)).toContain("Filtering is unavailable.");
  expect(reads).toBe(0);
});
it("own undefined/accessor/inherited criteria deny without invoking any private getter", () => {
  const f = fixture();
  let reads = 0;
  const bad = () => {
    reads++;
    throw new Error("Unexpected getter");
  };
  for (const input of [
    Object.defineProperties(
      { criteria: undefined },
      { messages: { get: bad }, controller: { get: bad } },
    ),
    Object.defineProperties(
      {},
      {
        criteria: { get: bad },
        messages: { get: bad },
        controller: { get: bad },
      },
    ),
    Object.setPrototypeOf(
      Object.defineProperties(
        {},
        { messages: { get: bad }, controller: { get: bad } },
      ),
      { criteria: f.target },
    ),
  ]) {
    function Forward() {
      return FilterSearch(input as FilterSearchProps<S>);
    }
    expect(renderToString(<Forward />)).toContain("Filtering is unavailable.");
  }
  expect(reads).toBe(0);
});

it("candidate result components are not invoked by supplied-criteria server rendering", () => {
  const f = fixture();
  let childRenders = 0;
  function PrivateResults() {
    childRenders++;
    return <span>Synthetic result form</span>;
  }
  renderToString(<FilterTabs {...f.tabs({ children: <PrivateResults /> })} />);
  expect(childRenders).toBe(0);
});
