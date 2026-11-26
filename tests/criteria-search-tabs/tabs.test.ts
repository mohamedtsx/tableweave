import { createElement } from "react";
import { expect, it } from "vitest";
import { createCriteriaToolbarStore } from "../../packages/heroui/src/toolbar/criteria-tool-host.js";
import {
  createCriteriaTabsLocal,
  selectCriteriaTab,
} from "../../packages/heroui/src/toolbar/filter-tabs.js";
import type { S } from "./fixtures.js";
import { fixture, required } from "./fixtures.js";

it("commits one opaque subtree and captured scalar counts; stale A cannot select through B", () => {
  const f = fixture(),
    store = createCriteriaToolbarStore("tabs", createCriteriaTabsLocal<S>),
    stop = store.mount();
  const children = createElement("section", null, "Synthetic result subtree");
  store.commit({ ...f.tabs(), children });
  const a = required(store.read());
  expect(a.ports.children).toBe(children);
  expect(a.ports.tabs.all.count?.value).toBe(1);
  expect(f.observed).toHaveLength(0);
  store.commit(
    f.tabs({
      tabs: {
        all: { label: "All" },
        active: { label: "Active", disabled: true },
      },
    }),
  );
  const b = required(store.read());
  selectCriteriaTab(store, a.actor, "all", "#neutral");
  selectCriteriaTab(store, b.actor, "active", "#neutral");
  expect(f.observed).toHaveLength(0);
  selectCriteriaTab(store, b.actor, "all", "#neutral");
  expect(required(f.pendingUI).transition.state.query.tabId).toBe("all");
  f.rejectUI();
  stop();
});
it("candidate presentations/children getters are not read before commit; getters deny, never invoke", () => {
  const f = fixture(),
    store = createCriteriaToolbarStore("tabs", createCriteriaTabsLocal<S>),
    stop = store.mount();
  let getterCalls = 0;
  const input = Object.defineProperty(f.tabs(), "children", {
    get() {
      getterCalls++;
      throw new Error("Private candidate child");
    },
  });
  expect(store.read()).toBeNull();
  expect(getterCalls).toBe(0);
  store.commit(input);
  expect(store.read()).toBeNull();
  expect(getterCalls).toBe(0);
  const count = Object.defineProperty({ description: "Synthetic" }, "value", {
    get() {
      getterCalls++;
      return 1;
    },
  });
  store.commit({
    ...f.tabs(),
    tabs: { all: { label: "All", count }, active: { label: "Active" } },
  });
  expect(store.read()).toBeNull();
  expect(getterCalls).toBe(0);
  stop();
});
