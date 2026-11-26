import { describe, expect, it } from "vitest";
import {
  captureOptions,
  captureTarget,
  dataLeaves,
  isAvailable,
  setVisible,
} from "../../../packages/heroui/src/columns/model.js";
import { changeSort } from "../../../packages/heroui/src/sorting/model.js";
import {
  createControlsAuthority,
  createNativeController,
} from "../../../packages/react/src/index.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import { context, fixture, records } from "./fixtures.js";

describe("exact owner provenance precedes column-control permission", () => {
  for (const action of ["sort", "columns"] as const) {
    it(`genuine A authority cannot mutate identical-schema/query B target: ${action}`, () => {
      const a = fixture();
      const b = fixture();
      expect(a.controller.getSnapshot().query).toEqual(
        b.controller.getSnapshot().query,
      );
      const target = captureTarget({ ...b, authority: a.authority });
      const beforeA = a.controller.getSnapshot();
      const beforeB = b.controller.getSnapshot();
      const results: string[] = [];
      if (action === "sort")
        changeSort(
          target,
          { onResult: (value) => results.push(value) },
          "name",
          "ascending",
        );
      else
        setVisible(
          target,
          { onResult: (value) => results.push(value) },
          "name",
          false,
        );
      expect(a.controller.getSnapshot()).toBe(beforeA);
      expect(b.controller.getSnapshot()).toBe(beforeB);
      expect(results).toEqual(["unavailable"]);
      expect(a.notices() + b.notices()).toBe(0);
    });
  }
  it("checks exact definition as well as controller", () => {
    const a = fixture();
    const b = fixture();
    const target = captureTarget({ ...a, definition: b.definition });
    const before = a.controller.getSnapshot();
    changeSort(target, {}, "name", "ascending");
    setVisible(target, {}, "name", false);
    expect(a.controller.getSnapshot()).toBe(before);
  });
  it("same exact definition with a different genuine controller still fails owner proof", () => {
    const f = fixture();
    const controller = createNativeController(f.definition, {
      initial: { query: f.controller.getSnapshot().query },
      now: () => 0,
    });
    const boundary = createNativeBoundary(f.definition, controller);
    const frame = boundary.prepare(
      { mode: "client", records },
      controller.getSnapshot(),
    );
    boundary.commit(frame);
    const target = captureTarget({ ...f, view: boundary.getView(frame) });
    changeSort(target, {}, "name", "ascending");
    setVisible(target, {}, "name", false);
    expect(controller.getSnapshot().revision).toBe(0);
    expect(f.notices()).toBe(0);
  });
  for (const wrapped of ["copy", "inherited", "proxy"] as const)
    it(`rejects ${wrapped} authorities`, () => {
      const a = fixture();
      const authority =
        wrapped === "copy"
          ? { ...a.authority }
          : wrapped === "inherited"
            ? (Object.create(a.authority) as typeof a.authority)
            : new Proxy(a.authority, {});
      const target = captureTarget({ ...a, authority });
      changeSort(target, {}, "name", "ascending");
      setVisible(target, {}, "name", false);
      expect(a.notices()).toBe(0);
    });
});

describe("sorting accepted owner", () => {
  it("uses latest sorting before an old additive callback, preserving hidden primary priority", () => {
    const f = fixture();
    const target = captureTarget(f);
    f.controller.dispatch({
      type: "sorting.change",
      update: [{ id: "name", desc: true }],
    });
    f.controller.dispatch({
      type: "columns.visibility",
      update: { name: false },
    });
    changeSort(target, {}, "amount", "add-ascending");
    expect(f.controller.getSnapshot().query.sorting).toEqual([
      { id: "name", desc: true },
      { id: "amount", desc: false },
    ]);
    changeSort(target, {}, "amount", "add-descending");
    expect(f.controller.getSnapshot().query.sorting[0]).toEqual({
      id: "name",
      desc: true,
    });
    changeSort(target, {}, "name", "remove");
    expect(f.controller.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: true },
    ]);
  });
  it("explicit single direction replaces, resetting page but preserving selection and other criteria", () => {
    const f = fixture();
    const target = captureTarget(f);
    f.controller.dispatch({
      type: "builder.commit",
      rule: { id: "rule", field: "amount", operator: "number.gt", value: 0 },
    });
    f.controller.dispatch({
      type: "pagination.change",
      update: { pageIndex: 2, pageSize: 10 },
    });
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    const query = f.controller.getSnapshot().query;
    changeSort(target, {}, "name", "descending");
    const state = f.controller.getSnapshot();
    expect(state.query.pagination.pageIndex).toBe(0);
    expect(state.query.builder).toEqual(query.builder);
    expect(state.selection).toEqual({ a: true });
    changeSort(target, {}, "amount", "ascending");
    expect(f.controller.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: false },
    ]);
  });
  it("single default and nonconfigured fields cannot acquire additive/sort capability", () => {
    const f = fixture({ multi: false });
    const target = captureTarget(f);
    changeSort(target, {}, "name", "add-ascending");
    for (const id of ["fixed", "note", "utility", "group", "missing"])
      changeSort(target, {}, id, "ascending");
    expect(f.notices()).toBe(0);
    changeSort(target, {}, "name", "ascending");
    expect(f.controller.getSnapshot().query.sorting).toEqual([
      { id: "name", desc: false },
    ]);
  });
});

describe("visibility accepted owner", () => {
  it("complete ordered public leaves include hidden, never utilities/groups/carrier", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "columns.order",
      update: ["utility", "note", "name", "amount", "fixed"],
    });
    f.controller.dispatch({
      type: "columns.visibility",
      update: { amount: false },
    });
    const leaves = dataLeaves(captureTarget({ ...f, view: f.render() }), {
      amount: "Value",
    });
    expect(leaves.map((leaf) => leaf.id)).toEqual([
      "note",
      "name",
      "amount",
      "fixed",
    ]);
    expect(leaves[2]?.label).toBe("Value");
  });
  it("preserves same-turn external visibility changes, full order, query, sorting and selection", () => {
    const f = fixture();
    const target = captureTarget(f);
    f.controller.dispatch({
      type: "columns.order",
      update: ["utility", "note", "name", "amount", "fixed"],
    });
    f.controller.dispatch({
      type: "sorting.change",
      update: [{ id: "name", desc: true }],
    });
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    f.controller.dispatch({
      type: "columns.visibility",
      update: { amount: false },
    });
    const before = f.controller.getSnapshot();
    setVisible(target, {}, "name", false);
    const after = f.controller.getSnapshot();
    expect(after.columns.visibility).toEqual({ amount: false, name: false });
    expect(after.columns.order).toEqual(before.columns.order);
    expect(after.query).toBe(before.query);
    expect(after.selection).toBe(before.selection);
    setVisible(target, {}, "name", true);
    expect(f.controller.getSnapshot().columns.visibility).toEqual({
      amount: false,
    });
  });
  it("required and final visible data fields cannot hide; preferred row header may hide", () => {
    const f = fixture();
    const target = captureTarget(f);
    setVisible(target, {}, "fixed", false);
    expect(f.notices()).toBe(0);
    for (const id of ["name", "amount", "note"])
      setVisible(target, {}, id, false);
    expect(f.controller.getSnapshot().columns.visibility).toEqual({
      name: false,
      amount: false,
      note: false,
    });
    const g = fixture({ required: false });
    const last = captureTarget(g);
    for (const id of ["name", "amount", "note", "fixed"])
      setVisible(last, {}, id, false);
    expect(g.controller.getSnapshot().columns.visibility.fixed).not.toBe(false);
  });
});

for (const kind of ["sort", "columns"] as const) {
  it(`${kind}: permission is checked again inside the functional updater`, () => {
    const f = fixture();
    const input = f.readCommitted();
    let reads = 0;
    const authority = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      mode: "client",
      context,
      readCommitted() {
        reads++;
        return reads === 1
          ? input
          : { ...input, expected: { ...context, access: false } };
      },
    });
    const target = captureTarget({ ...f, authority });
    if (kind === "sort") changeSort(target, {}, "name", "ascending");
    else setVisible(target, {}, "name", false);
    expect(reads).toBe(2);
    expect(f.notices()).toBe(0);
  });
  it(`${kind}: controlled proposal/rejection sends no subscription, delayed acceptance is not optimistic`, () => {
    const f = fixture({ controlled: true });
    const target = captureTarget(f);
    const results: string[] = [];
    const options = {
      onResult: (value: string) => {
        results.push(value);
      },
    };
    const command = () =>
      kind === "sort"
        ? changeSort(target, options, "name", "ascending")
        : setVisible(target, options, "name", false);
    const before = f.controller.getSnapshot();
    command();
    expect(f.controller.getSnapshot()).toBe(before);
    expect(f.notices()).toBe(0);
    expect(results).toEqual(["submitted"]);
    f.reject();
    expect(f.notices()).toBe(0);
    command();
    f.accept();
    expect(f.notices()).toBe(1);
    expect(f.controller.getSnapshot()).not.toBe(before);
  });
  for (const denial of ["scope", "access", "controller", "disposed"] as const) {
    it(`${kind}: old callbacks deny changed ${denial} without touching another table`, () => {
      const f = fixture();
      const other = fixture();
      const target = captureTarget(f);
      const input = f.readCommitted();
      if (denial === "scope" || denial === "access") {
        const next =
          denial === "scope"
            ? { ...context, scopeKey: "two" }
            : { ...context, access: false };
        f.setCommitted({
          ...input,
          expected: next,
          source: { mode: "client", context: next, records: [] },
        });
      }
      if (denial === "controller")
        f.setCommitted({ ...input, native: other.view });
      if (denial === "disposed") f.controller.dispose();
      if (kind === "sort") changeSort(target, {}, "name", "ascending");
      else setVisible(target, {}, "name", false);
      expect(f.notices() + other.notices()).toBe(0);
    });
  }
  it(`${kind}: explicit disabled option suppresses command; observer failures are isolated`, async () => {
    const f = fixture();
    const target = captureTarget(f);
    const mutate = (options: Parameters<typeof setVisible>[1]) =>
      kind === "sort"
        ? changeSort(target, options, "name", "ascending")
        : setVisible(target, options, "name", false);
    mutate({ isDisabled: true });
    expect(f.notices()).toBe(0);
    mutate({
      onResult: () => {
        throw new Error("observer");
      },
    });
    mutate({ onResult: () => Promise.reject(new Error("observer")) });
    await Promise.resolve();
    expect(f.notices()).toBe(1);
  });
}
it("captures options metadata/accessors once before validation", () => {
  let disabledReads = 0;
  let callbackReads = 0;
  let labelReads = 0;
  const options = captureOptions({
    get isDisabled() {
      disabledReads++;
      return disabledReads > 1;
    },
    get onResult() {
      callbackReads++;
      return () => {};
    },
    labels: {
      get name() {
        labelReads++;
        return labelReads === 1 ? "Name" : "Changed";
      },
    },
  });
  expect(options.isDisabled).toBe(false);
  expect(options.labels?.name).toBe("Name");
  expect([disabledReads, callbackReads, labelReads]).toEqual([1, 1, 1]);
});

it("captures target identity and render ports only once", () => {
  const f = fixture();
  let definitions = 0;
  let views = 0;
  let authorities = 0;
  const target = captureTarget({
    get definition() {
      definitions++;
      return f.definition;
    },
    get view() {
      views++;
      return f.view;
    },
    get authority() {
      authorities++;
      return f.authority;
    },
    presentation: f.presentation,
  });
  changeSort(target, {}, "name", "ascending");
  expect([definitions, views, authorities]).toEqual([1, 1, 1]);
  expect(f.notices()).toBe(1);
});

it("render availability uses render facts/provenance, not the commit-phase event port", () => {
  const f = fixture();
  let reads = 0;
  const authority = createControlsAuthority({
    definition: f.definition,
    controller: f.controller,
    queryIdentity: f.view.state.queryIdentity,
    mode: "client",
    context,
    readCommitted() {
      reads++;
      throw new Error("No commit yet");
    },
  });
  const target = captureTarget({ ...f, authority });
  expect(isAvailable(target)).toBe(true);
  expect(reads).toBe(0);
  changeSort(target, {}, "name", "ascending");
  expect(reads).toBe(1);
  expect(f.notices()).toBe(0);
});
