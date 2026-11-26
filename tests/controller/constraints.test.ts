import { describe, expect, it } from "vitest";
import {
  ControllerError,
  createTableController,
  type StateProposal,
  type TableController,
} from "../../packages/react/src/index.js";
import { definition, query, type schema } from "./fixtures.js";

describe("WP-04 synchronous preacceptance constraints", () => {
  it("validates initialization and rejects unsafe callback types safely", () => {
    expect(() =>
      createTableController(definition(), {
        initial: { query: query() },
        now: () => 0,
        validateState() {
          throw new Error("synthetic-private-validation-error");
        },
      }),
    ).toThrow(new ControllerError("state.invalid"));
    for (const validateState of [null, false, 1, "not-a-function"]) {
      expect(() =>
        createTableController(definition(), {
          initial: { query: query() },
          now: () => 0,
          validateState: validateState as never,
        }),
      ).toThrow(new ControllerError("state.ownership"));
    }
  });

  for (const controlled of [[], ["query"]] as const) {
    it(`rejects candidates before ${controlled.length ? "proposal publication" : "commit"}`, () => {
      let requests = 0;
      let notifications = 0;
      const controller = createTableController(definition(), {
        initial: { query: query() },
        now: () => 0,
        controlled,
        onRequest: () => {
          requests++;
        },
        validateState(state) {
          if (state.query.sorting.length) throw new Error("disallowed");
        },
      });
      controller.subscribe(() => {
        notifications++;
      });
      const before = controller.getSnapshot();
      expect(() =>
        controller.dispatch({
          type: "sorting.change",
          update: [{ id: "amount", desc: false }],
        }),
      ).toThrow(new ControllerError("state.invalid"));
      expect(controller.getSnapshot()).toBe(before);
      expect(controller.getSnapshot().revision).toBe(0);
      expect(requests).toBe(0);
      expect(notifications).toBe(0);
    });
  }

  it("preserves earlier pending intent when a newer candidate fails", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    let requests = 0;
    const controller = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
      controlled: ["query"],
      onRequest(value) {
        proposal = value;
        requests++;
      },
      validateState(state) {
        if (state.query.search === "forbidden") throw new Error("disallowed");
      },
    });
    controller.dispatch({
      type: "pagination.change",
      update: { pageIndex: 4, pageSize: 25 },
    });
    const valid = proposal;
    expect(valid).toBeDefined();
    expect(() =>
      controller.dispatch({ type: "search.commit", search: "forbidden" }),
    ).toThrow(ControllerError);
    expect(requests).toBe(1);
    expect(controller.getSnapshot().revision).toBe(0);
    if (!valid) throw new Error("Missing synthetic proposal");
    controller.accept(valid);
    expect(controller.getSnapshot().query.pagination.pageIndex).toBe(4);
  });

  it("revalidates the final selection override without consuming a valid proposal", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    let commits = 0;
    const controller = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
      controlled: ["query", "selection"],
      onRequest: (value) => {
        proposal = value;
      },
      onCommit: () => {
        commits++;
      },
      validateState(state) {
        if (state.selection.forbidden) throw new Error("disallowed");
      },
    });
    const before = controller.getSnapshot();
    controller.dispatch({ type: "builder.clear" });
    if (!proposal) throw new Error("Missing synthetic proposal");
    const valid = proposal;
    expect(() =>
      controller.accept(valid, { selection: { forbidden: true } }),
    ).toThrow(ControllerError);
    expect(controller.getSnapshot()).toBe(before);
    expect(commits).toBe(0);
    controller.accept(valid);
    expect(commits).toBe(1);
  });

  it("revalidates acceptance under the existing reentrancy guard", () => {
    let proposal: StateProposal<typeof schema> | undefined;
    let blocked = false;
    let controller: TableController<typeof schema> | undefined;
    let validations = 0;
    controller = createTableController(definition(), {
      initial: { query: query() },
      now: () => 0,
      controlled: ["query"],
      onRequest: (value) => {
        proposal = value;
      },
      validateState() {
        validations++;
        if (controller)
          expect(() =>
            controller?.dispatch({ type: "selection.cancel" }),
          ).toThrow(new ControllerError("state.reentrant"));
        if (blocked) throw new Error("disallowed");
      },
    });
    controller.dispatch({
      type: "sorting.change",
      update: [{ id: "amount", desc: false }],
    });
    if (!proposal) throw new Error("Missing synthetic proposal");
    const valid = proposal;
    const before = controller.getSnapshot();
    blocked = true;
    expect(() => controller?.accept(valid)).toThrow(ControllerError);
    expect(controller.getSnapshot()).toBe(before);
    blocked = false;
    controller.accept(valid);
    expect(controller.getSnapshot().revision).toBe(1);
    expect(validations).toBe(4);
  });

  it("rejects and safely observes asynchronous or nonvoid validation", async () => {
    for (const validateState of [
      () => false,
      () => Promise.reject(new Error("synthetic-private-async-error")),
    ]) {
      expect(() =>
        createTableController(definition(), {
          initial: { query: query() },
          now: () => 0,
          validateState,
        }),
      ).toThrow(new ControllerError("state.invalid"));
    }
    await Promise.resolve();
  });
});
