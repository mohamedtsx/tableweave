import { describe, expect, it, vi } from "vitest";
import { createQuery } from "../../../packages/react/src/contracts/index.js";
import { createTableController } from "../../../packages/react/src/controller/store.js";
import type {
  ControllerOptions,
  StateProposal,
  TableCommand,
  TableController,
} from "../../../packages/react/src/controller/types.js";
import { ControllerError } from "../../../packages/react/src/controller/validation.js";
import { schema } from "./fixtures.js";

function controller(options: Partial<ControllerOptions<typeof schema>> = {}) {
  return createTableController(
    { schema, selection: true, columns: [{ id: "amount" }] },
    {
      initial: {
        query: createQuery(schema, { locale: "en-US", timeZone: "UTC" }),
      },
      now: () => 0,
      ...options,
    },
  );
}
const change: TableCommand<typeof schema> = Object.freeze({
  type: "pagination.change",
  update: { pageIndex: 1, pageSize: 2 },
});
const noop: TableCommand<typeof schema> = Object.freeze({
  type: "selection.cancel",
});
function proposed(c: TableController<typeof schema>, command = change) {
  const result = c.dispatch(command);
  if (result.status !== "proposed")
    throw new Error("Missing synthetic proposal");
  return result.proposal;
}

describe("pure synchronous coordinator command constraints", () => {
  it("does not call the command guard during initialization or change state-validation timing", () => {
    const commands = vi.fn();
    const states = vi.fn();
    const c = controller({
      validateCommand: commands,
      validateState: states,
      controlled: ["query"],
      onRequest: () => {},
    });
    expect(commands).toHaveBeenCalledTimes(0);
    expect(states).toHaveBeenCalledTimes(1);
    expect(c.dispatch(noop).status).toBe("noop");
    expect(commands).toHaveBeenCalledTimes(1);
    expect(states).toHaveBeenCalledTimes(1);
    const pending = proposed(c);
    expect(commands).toHaveBeenCalledTimes(2);
    expect(states).toHaveBeenCalledTimes(2);
    c.accept(pending);
    expect(commands).toHaveBeenCalledTimes(3);
    expect(states).toHaveBeenCalledTimes(3);
    expect(commands.mock.calls.map((args) => args[0])).toEqual([
      noop,
      change,
      change,
    ]);
    const rejecting = vi.fn(() => {
      throw new Error("synthetic-private-guard");
    });
    expect(() => controller({ validateCommand: rejecting })).not.toThrow();
    expect(rejecting).not.toHaveBeenCalled();
  });

  for (const value of [null, false, 1, "invalid", {}, []])
    it(`rejects ${JSON.stringify(value)} callback ownership at construction`, () => {
      expect(() => controller({ validateCommand: value as never })).toThrow(
        new ControllerError("state.ownership"),
      );
    });

  for (const controlled of [[], ["query"]] as const)
    it(`rejects before reduction/clock/publication (${controlled.length ? "controlled" : "uncontrolled"})`, () => {
      const now = vi.fn(() => 0);
      const states = vi.fn();
      const requests = vi.fn();
      const commits = vi.fn();
      const queries = vi.fn();
      const updates = vi.fn(() => ({ pageIndex: 1, pageSize: 2 }));
      const c = controller({
        controlled,
        now,
        validateState: states,
        onRequest: requests,
        onCommit: commits,
        onQueryChange: queries,
        validateCommand() {
          throw new Error("synthetic-private-command-input");
        },
      });
      const notify = vi.fn();
      c.subscribe(notify);
      const before = c.getSnapshot();
      expect(() =>
        c.dispatch({ type: "pagination.change", update: updates }),
      ).toThrow(new ControllerError("state.invalid"));
      expect(c.getSnapshot()).toBe(before);
      expect(before.revision).toBe(0);
      expect(updates).not.toHaveBeenCalled();
      expect(now).toHaveBeenCalledTimes(1);
      expect(states).toHaveBeenCalledTimes(1);
      expect(requests).not.toHaveBeenCalled();
      expect(commits).not.toHaveBeenCalled();
      expect(queries).not.toHaveBeenCalled();
      expect(notify).not.toHaveBeenCalled();
    });

  it("checks no-ops and preserves a pending proposal/sequence after rejection", () => {
    let deny = false;
    const requests = vi.fn();
    const notify = vi.fn();
    const c = controller({
      controlled: ["query"],
      onRequest: requests,
      validateCommand() {
        if (deny) throw new Error("denied");
      },
    });
    c.subscribe(notify);
    const before = c.getSnapshot();
    const pending = proposed(c);
    deny = true;
    expect(() => c.dispatch(noop)).toThrow(
      new ControllerError("state.invalid"),
    );
    expect(() => c.dispatch(change)).toThrow(
      new ControllerError("state.invalid"),
    );
    expect(c.getSnapshot()).toBe(before);
    expect(requests).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
    deny = false;
    c.accept(pending);
    expect(notify).toHaveBeenCalledTimes(1);
    const next = proposed(c, {
      type: "pagination.change",
      update: { pageIndex: 2, pageSize: 2 },
    });
    expect(next.id).toBe(pending.id + 1);
  });

  it("rechecks the original command before final override/state validation without consuming pending intent", () => {
    let deny = false;
    const seen: TableCommand<typeof schema>[] = [];
    const states = vi.fn();
    const requests = vi.fn();
    const commits = vi.fn();
    const queries = vi.fn();
    const c = controller({
      controlled: ["query", "selection"],
      onRequest: requests,
      onCommit: commits,
      onQueryChange: queries,
      validateState: states,
      validateCommand(command) {
        seen.push(command);
        if (deny) throw new Error("synthetic-private-acceptance");
      },
    });
    const notify = vi.fn();
    c.subscribe(notify);
    const pending = proposed(c);
    const before = c.getSnapshot();
    const inspected = vi.fn(() => ({ a: true }));
    const override = {
      get selection() {
        return inspected();
      },
    };
    deny = true;
    expect(() => c.accept(pending, override)).toThrow(
      new ControllerError("state.invalid"),
    );
    expect(seen).toEqual([change, change]);
    expect(seen[1]).toBe(seen[0]);
    expect(seen[1]).not.toBe(change);
    expect(inspected).not.toHaveBeenCalled();
    expect(states).toHaveBeenCalledTimes(2);
    expect(c.getSnapshot()).toBe(before);
    expect(commits).not.toHaveBeenCalled();
    expect(queries).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
    expect(requests).toHaveBeenCalledTimes(1);
    deny = false;
    c.accept(pending, override);
    expect(c.getSnapshot().selection).toEqual({ a: true });
    expect(c.getSnapshot().revision).toBe(1);
    expect(states).toHaveBeenCalledTimes(3);
    expect(commits).toHaveBeenCalledTimes(1);
    expect(queries).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it("validates final acceptance even when the override makes the transition a no-op", () => {
    const guard = vi.fn();
    const states = vi.fn();
    const c = controller({
      controlled: ["selection"],
      onRequest: () => {},
      validateCommand: guard,
      validateState: states,
    });
    const before = c.getSnapshot();
    const pending = proposed(c, {
      type: "selection.change",
      update: { a: true },
    });
    expect(c.accept(pending, { selection: {} }).status).toBe("noop");
    expect(c.getSnapshot()).toBe(before);
    expect(guard).toHaveBeenCalledTimes(2);
    expect(states).toHaveBeenCalledTimes(3);
  });

  it("uses the same reentrancy boundary during dispatch and final acceptance", () => {
    let c: TableController<typeof schema> | undefined;
    let pending: StateProposal<typeof schema> | undefined;
    const failures: string[] = [];
    c = controller({
      controlled: ["query"],
      onRequest: () => {},
      validateCommand() {
        if (!c) throw new Error("Guard called during construction");
        for (const action of [
          () => c?.dispatch(noop),
          () => c?.dispose(),
          ...(pending
            ? [
                () => c?.accept(pending as StateProposal<typeof schema>),
                () => c?.reject(pending as StateProposal<typeof schema>),
              ]
            : []),
        ]) {
          try {
            action();
          } catch (error) {
            expect(error).toEqual(new ControllerError("state.reentrant"));
            failures.push("blocked");
          }
        }
      },
    });
    pending = proposed(c);
    c.accept(pending);
    expect(failures).toHaveLength(6);
    expect(c.isDisposed()).toBe(false);
    expect(c.getSnapshot().revision).toBe(1);
  });

  it("propagated reentrancy rejection preserves the pending proposal", () => {
    let c: TableController<typeof schema> | undefined;
    let reenter = false;
    c = controller({
      controlled: ["query"],
      onRequest: () => {},
      validateCommand() {
        if (reenter) c?.dispose();
      },
    });
    const pending = proposed(c);
    const before = c.getSnapshot();
    reenter = true;
    expect(() => c?.accept(pending)).toThrow(
      new ControllerError("state.reentrant"),
    );
    expect(c.getSnapshot()).toBe(before);
    expect(c.isDisposed()).toBe(false);
    reenter = false;
    c.accept(pending);
    expect(c.getSnapshot().revision).toBe(1);
  });

  it("keeps rejection reachable without invoking a currently denying command guard", () => {
    let deny = false;
    const guard = vi.fn(() => {
      if (deny) throw new Error("denied");
    });
    const c = controller({
      controlled: ["query"],
      onRequest: () => {},
      validateCommand: guard,
    });
    const pending = proposed(c);
    const before = c.getSnapshot();
    deny = true;
    c.reject(pending);
    expect(c.getSnapshot()).toBe(before);
    expect(guard).toHaveBeenCalledTimes(1);
    expect(() => c.accept(pending)).toThrow(new ControllerError("state.stale"));
    expect(guard).toHaveBeenCalledTimes(1);
  });

  it("captures nested array constants while retaining undefined and function updaters", () => {
    const seen: TableCommand<typeof schema>[] = [];
    const c = controller({
      controlled: ["query"],
      onRequest() {},
      validateCommand(command) {
        seen.push(command);
      },
    });
    const update = [{ id: "amount" as const, desc: false }];
    const pending = proposed(c, { type: "sorting.change", update });
    const first = update[0];
    if (!first) throw new Error("Missing sort");
    first.desc = true;
    update.push({ id: "amount", desc: true });
    c.accept(pending);
    expect(seen[0]).toBe(seen[1]);
    expect(seen[0]).toEqual({
      type: "sorting.change",
      update: [{ id: "amount", desc: false }],
    });
    expect(c.getSnapshot().query.sorting).toEqual([
      { id: "amount", desc: false },
    ]);
    expect(Object.isFrozen(update)).toBe(false);
    expect(Object.isFrozen(update[0])).toBe(false);
    const updater = vi.fn((previous: Readonly<Record<string, boolean>>) => ({
      ...previous,
      a: true,
    }));
    c.dispatch({ type: "selection.change", update: updater });
    const captured = seen[2];
    expect(captured?.type === "selection.change" && captured.update).toBe(
      updater,
    );
    expect(updater).toHaveBeenCalledTimes(1);
    expect(Object.isFrozen(updater)).toBe(false);
    c.dispatch({ type: "selection.cancel", extra: undefined } as TableCommand<
      typeof schema
    >);
    expect(Object.hasOwn(seen[3] as object, "extra")).toBe(true);
  });

  it("rejects cyclic/accessor/prototype command data before callbacks without freezing caller objects", () => {
    const guard = vi.fn();
    const c = controller({
      controlled: ["query"],
      onRequest() {},
      validateCommand: guard,
    });
    const pending = proposed(c);
    const before = c.getSnapshot();
    let reads = 0;
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    const malformed = [
      {
        type: "selection.change",
        update: {
          get a() {
            reads++;
            return true;
          },
        },
      },
      { type: "selection.change", update: cyclic },
      { type: "selection.change", update: new Date(0) },
      Object.assign(Object.create({ type: "selection.cancel" }), {
        update: {},
      }),
      {
        type: "selection.change",
        update: Object.assign({ a: true }, { [Symbol("hidden")]: true }),
      },
    ];
    for (const command of malformed)
      expect(() => c.dispatch(command as TableCommand<typeof schema>)).toThrow(
        new ControllerError("state.invalid"),
      );
    expect(reads).toBe(0);
    expect(guard).toHaveBeenCalledTimes(1);
    expect(c.getSnapshot()).toBe(before);
    expect(Object.isFrozen(cyclic)).toBe(false);
    c.accept(pending);
    expect(c.getSnapshot().revision).toBe(1);
  });

  it("frozen command envelopes cannot be changed by guards and null-prototype stable IDs survive capture", () => {
    const c = controller({
      validateCommand(command) {
        expect(Object.isFrozen(command)).toBe(true);
        expect(Reflect.set(command, "type", "selection.cancel")).toBe(false);
        if (
          command.type === "selection.change" &&
          typeof command.update !== "function"
        )
          expect(Object.isFrozen(command.update)).toBe(true);
      },
    });
    const update = Object.assign(
      Object.create(null) as Record<string, boolean>,
      { a: true },
    );
    Object.defineProperty(update, "__proto__", {
      value: true,
      enumerable: true,
      writable: true,
    });
    c.dispatch({ type: "selection.change", update });
    expect(Object.keys(c.getSnapshot().selection)).toEqual(["__proto__", "a"]);
    expect(Object.isFrozen(update)).toBe(false);
  });

  const unsafe: readonly [string, () => unknown][] = [
    ["null", () => null],
    ["false", () => false],
    ["number", () => 1],
    ["string", () => "private"],
    ["object", () => ({ private: true })],
    ["function", () => () => {}],
    ["fulfilled promise", () => Promise.resolve()],
    [
      "rejected promise",
      () => Promise.reject(new Error("synthetic-private-async-command")),
    ],
    [
      "rejected thenable",
      () => ({
        // biome-ignore lint/suspicious/noThenProperty: deliberately exercise rejected thenable observation.
        then(_resolve: unknown, reject: (error: Error) => void) {
          reject(new Error("synthetic-private-thenable"));
        },
      }),
    ],
  ];
  for (const [name, outcome] of unsafe)
    it(`rejects and observes ${name} at dispatch and acceptance, preserving prior pending intent`, async () => {
      let invalid = false;
      const states = vi.fn();
      const requests = vi.fn();
      const notify = vi.fn();
      const c = controller({
        controlled: ["query"],
        onRequest: requests,
        validateState: states,
        validateCommand: () => (invalid ? outcome() : undefined),
      });
      c.subscribe(notify);
      const pending = proposed(c);
      const before = c.getSnapshot();
      invalid = true;
      expect(() => c.dispatch(noop)).toThrow(
        new ControllerError("state.invalid"),
      );
      expect(() => c.accept(pending)).toThrow(
        new ControllerError("state.invalid"),
      );
      expect(c.getSnapshot()).toBe(before);
      expect(states).toHaveBeenCalledTimes(2);
      expect(requests).toHaveBeenCalledTimes(1);
      expect(notify).not.toHaveBeenCalled();
      await Promise.resolve();
      await Promise.resolve();
      invalid = false;
      c.accept(pending);
      expect(c.getSnapshot().revision).toBe(1);
      expect(notify).toHaveBeenCalledTimes(1);
    });
});
