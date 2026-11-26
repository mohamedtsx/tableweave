import type { CriteriaToolTarget } from "../../packages/heroui/src/filters/criteria-commit.js";
import type { FilterSearchProps } from "../../packages/heroui/src/toolbar/filter-search.js";
import type { FilterToolProps } from "../../packages/heroui/src/toolbar/filter-shared.js";
import type { FilterTabsProps } from "../../packages/heroui/src/toolbar/filter-tabs.js";
import type { fixture, S } from "./fixtures.js";

type Assert<Condition extends true> = Condition;
export type TargetIsActual = Assert<
  NonNullable<FilterToolProps<S>["criteria"]> extends CriteriaToolTarget<S>
    ? true
    : false
>;
export function positive(f: ReturnType<typeof fixture>) {
  const raw: FilterSearchProps<S> = {
    controller: f.app.C,
    expectedContext: f.context,
  };
  const adopted: FilterSearchProps<S> = f.search({ criteria: { ...f.target } });
  const tabs: FilterTabsProps<S> = f.tabs({
    criteria: new Proxy(f.target, {}),
  });
  return { raw, adopted, tabs };
}
