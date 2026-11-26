import { describe, expect, it } from "vitest";
import {
  captureActions,
  selectionActionContext,
} from "../../../packages/heroui/src/selection/action.js";
import type { SelectionAction } from "../../../packages/heroui/src/selection/types.js";
import {
  createControlsAuthority,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import {
  context,
  fixture,
  type RecordRow,
  records,
  type schema,
} from "../core/fixtures.js";

describe("SelectionToolbar event payload and descriptor boundary", () => {
  it("captures each used presentation fact once and never reads native rows into actions", () => {
    const f = fixture();
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    const facts = projectControls(f.definition, f.client());
    const reads = new Map<PropertyKey, number>();
    const observed = new Proxy(facts, {
      get(target, key) {
        reads.set(key, (reads.get(key) ?? 0) + 1);
        return Reflect.get(target, key);
      },
    });
    selectionActionContext(observed);
    expect([...reads.values()].every((count) => count === 1)).toBe(true);
    expect(reads.has("rows")).toBe(false);
  });
  it("captures getters exactly once before validation, including callback", () => {
    const reads: Record<string, number> = {};
    const called: unknown[] = [];
    const values = {
      id: "review",
      label: "Review",
      onAction: (value: unknown) => {
        called.push(value);
      },
      isDisabled: false,
      isPending: false,
      variant: "secondary",
    };
    const descriptor = Object.fromEntries(
      Object.keys(values).map((key) => [key, undefined]),
    );
    for (const key of Object.keys(values))
      Object.defineProperty(descriptor, key, {
        enumerable: true,
        get: () => {
          reads[key] = (reads[key] ?? 0) + 1;
          if (reads[key] !== 1) throw new Error("Repeated getter");
          return values[key as keyof typeof values];
        },
      });
    const captured = captureActions([
      descriptor as unknown as SelectionAction<typeof schema, RecordRow>,
    ]);
    expect(reads).toEqual(
      Object.fromEntries(Object.keys(values).map((key) => [key, 1])),
    );
    expect(captured[0]?.onAction).toBe(values.onAction);
    expect(Object.isFrozen(captured[0])).toBe(true);
    expect(called).toEqual([]);
  });
  it("rejects duplicate/empty IDs, missing callbacks and invalid metadata without invoking them", () => {
    const good = { id: "a", label: "Review", onAction: () => {} };
    for (const list of [
      [good, good],
      [{ ...good, id: " " }],
      [{ ...good, label: "" }],
      [{ ...good, onAction: null }],
      [{ ...good, isPending: "yes" }],
      [{ ...good, variant: "primary" }],
    ]) {
      expect(() =>
        captureActions(
          list as unknown as SelectionAction<typeof schema, RecordRow>[],
        ),
      ).toThrow(TypeError);
    }
  });
  it("includes off-page IDs separately from fresh loaded records; never freezes app records", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "selection.change",
      update: { a: true, c: true, missing: true },
    });
    f.begin();
    f.succeed();
    const facts = projectControls(f.definition, f.server());
    const payload = selectionActionContext(facts);
    expect(payload.selectedCount).toBe(3);
    expect(payload.selectedIds).toEqual(["a", "c", "missing"]);
    expect(payload.loadedSelected.map((entry) => entry.id)).toEqual(["a"]);
    expect(payload.missingSelectedIds).toEqual(["c", "missing"]);
    expect(payload.loadedSelected[0]?.record).toBe(records[0]);
    expect(Object.isFrozen(records[0])).toBe(false);
    expect(Object.isFrozen(payload.loadedSelected[0])).toBe(true);
    expect(payload.displayed).toBe(facts.displayed);
  });
  it.each(["single", "multiple"] as const)(
    "uses accepted %s selection, not a proposed controlled change",
    (mode) => {
      const f = fixture(mode, {
        controlled: ["selection"],
        onRequest: () => {},
      });
      const result = f.controller.dispatch({
        type: "selection.change",
        update: { missing: true },
      });
      expect(() =>
        selectionActionContext(projectControls(f.definition, f.client())),
      ).toThrow();
      if (result.status !== "proposed") throw new Error("Expected proposal");
      f.controller.accept(result.proposal);
      const payload = selectionActionContext(
        projectControls(f.definition, f.client()),
      );
      expect(payload.selectedIds).toEqual(["missing"]);
      expect(payload.loadedSelected).toEqual([]);
      expect(payload.missingSelectedIds).toEqual(["missing"]);
    },
  );
  it("fresh event read supplies changed same-ID records and current missing subset", () => {
    const f = fixture();
    f.controller.dispatch({
      type: "selection.change",
      update: { a: true, c: true },
    });
    const input = f.client();
    const authority = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      mode: "client",
      readCommitted: f.readCommitted,
    });
    const changed = { id: "a", amount: 999, eligible: true };
    f.client([changed]);
    const payload = selectionActionContext(authority.read());
    expect(payload.loadedSelected[0]?.record).toBe(changed);
    expect(payload.missingSelectedIds).toEqual(["c"]);
    expect(Object.isFrozen(changed)).toBe(false);
  });
  it("preserves stale/pending provenance, but suppresses old-scope/access/definition actions", () => {
    const f = fixture();
    f.controller.dispatch({ type: "selection.change", update: { a: true } });
    f.begin();
    f.succeed();
    const input = f.server();
    const authority = createControlsAuthority({
      definition: f.definition,
      controller: f.controller,
      queryIdentity: input.native.state.queryIdentity,
      context,
      mode: "server",
      resource: f.resource,
      readCommitted: f.readCommitted,
    });
    const request = f.begin("query", "refresh");
    f.server();
    const busy = selectionActionContext(authority.read());
    expect(busy.busy).toBe(true);
    expect(busy.stale).toBe(true);
    expect(busy.displayed?.request?.requestKey).toBe("opaque-request");
    f.resource.fail(request, "offline");
    f.server();
    const stale = selectionActionContext(authority.read());
    expect(stale.busy).toBe(false);
    expect(stale.stale).toBe(true);
    f.resource.setContext({ ...context, scopeKey: "two" });
    expect(() => selectionActionContext(authority.read())).toThrow();
    expect(() => authority.cancelSelection()).toThrow();
    f.resource.setContext({ ...context, access: false });
    expect(() => selectionActionContext(authority.read())).toThrow();
  });
});
