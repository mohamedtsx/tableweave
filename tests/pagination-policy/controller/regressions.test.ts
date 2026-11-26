import { expect, test } from "vitest";
import { ContractError } from "../../../packages/react/src/contracts/errors.js";
import { canonicalJson } from "../../../packages/react/src/contracts/json.js";
import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import { reduceTableState } from "../../../packages/react/src/controller/reducer.js";
import {
  createTableController,
  replaceTableDefinition,
} from "../../../packages/react/src/controller/store.js";
import type { TableCommand } from "../../../packages/react/src/controller/types.js";
import { ControllerError } from "../../../packages/react/src/controller/validation.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import type { Command } from "./fixtures.js";
import { commandFor, fixture, NOW, schemaFor } from "./fixtures.js";

function stateError(action: () => unknown, code: string) {
  let caught = false;
  try {
    action();
  } catch (error) {
    caught = true;
    expect(error).toBeInstanceOf(ControllerError);
    if (error instanceof ControllerError) {
      expect(error.code).toBe(code);
      expect(error.message).toBe("Invalid Tableweave state transition.");
    }
  }
  expect(caught).toBe(true);
}
function contractError(action: () => unknown, code: string) {
  let caught = false;
  try {
    action();
  } catch (error) {
    caught = true;
    expect(error).toBeInstanceOf(ContractError);
    if (error instanceof ContractError)
      expect(error.issues.map((issue) => issue.code)).toEqual([code]);
  }
  expect(caught).toBe(true);
}
for (const shape of [
  "type-getter",
  "payload-getter",
  "hidden",
  "cycle",
] as const)
  test(`complete immutable capture keeps ${shape} priority over capability`, () => {
    const f = fixture(false);
    let getters = 0;
    const raw: Record<string, unknown> = {
      type: "pagination.change",
      update: { pageIndex: 0, pageSize: 10 },
    };
    if (shape.endsWith("getter"))
      Object.defineProperty(raw, shape === "type-getter" ? "type" : "update", {
        enumerable: true,
        get() {
          getters++;
          throw new Error("synthetic getter");
        },
      });
    if (shape === "hidden") Object.defineProperty(raw, "hidden", { value: 1 });
    if (shape === "cycle") raw.extra = raw;
    const before = f.store.getSnapshot();
    stateError(
      () => f.store.dispatch(raw as unknown as Command),
      "state.invalid",
    );
    expect(getters).toBe(0);
    expect(f.log).toEqual([]);
    expect(f.store.getSnapshot()).toBe(before);
  });
test("disposed and reentrant mutations reject before original command reflection", () => {
  let reflected = 0;
  const poison = new Proxy(
    {},
    {
      getPrototypeOf() {
        reflected++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reflected++;
        throw 0;
      },
    },
  );
  const disposed = fixture(false);
  disposed.store.dispose();
  stateError(
    () => disposed.store.dispatch(poison as Command),
    "state.disposed",
  );
  let nested = 0;
  const f = fixture(false, false, {
    validateCommand() {
      nested++;
      stateError(() => f.store.dispatch(poison as Command), "state.reentrant");
    },
  });
  expect(f.store.dispatch({ type: "selection.cancel" }).status).toBe(
    "committed",
  );
  expect(nested).toBe(1);
  expect(reflected).toBe(0);
});
test("supported proxy capture stores immutable data once; no original-property read is added", () => {
  const f = fixture(false);
  let getters = 0;
  const descriptors: Record<string, number> = {};
  const command = new Proxy(
    {
      type: "pagination.change",
      update: (previous: {
        readonly pageIndex: number;
        readonly pageSize: number;
      }) => previous,
    },
    {
      get() {
        getters++;
        throw 0;
      },
      getOwnPropertyDescriptor(target, key) {
        const name = String(key);
        descriptors[name] = (descriptors[name] ?? 0) + 1;
        return Reflect.getOwnPropertyDescriptor(target, key);
      },
    },
  );
  // Reflect traps may execute under the existing capture contract; no universal proxy ban.
  stateError(() => f.store.dispatch(command as Command), "state.capability");
  expect(getters).toBe(0);
  expect(descriptors).toEqual({ type: 1, update: 1 });
  expect(f.log).toEqual([]);
});
for (const kind of ["change", "clamp"] as const)
  test(`pure reducer ${kind} denies before payload/updater or stale/noop handling`, () => {
    const f = fixture(false),
      old = f.store.getSnapshot();
    let reads = 0;
    const command = Object.defineProperty(
      { type: kind === "change" ? "pagination.change" : "pagination.clamp" },
      kind === "change" ? "update" : "queryIdentity",
      {
        get() {
          reads++;
          throw 0;
        },
      },
    );
    stateError(
      () =>
        reduceTableState(f.store.getDefinition(), old, command as Command, {
          now: NOW,
        }),
      "state.capability",
    );
    expect(reads).toBe(0);
    stateError(
      () =>
        reduceTableState(
          f.store.getDefinition(),
          { ...old, revision: -1 },
          command as Command,
          { now: NOW },
        ),
      "state.invalid",
    );
    stateError(
      () =>
        reduceTableState(
          f.store.getDefinition(),
          { ...old, definitionIdentity: "wrong" },
          command as Command,
          { now: NOW },
        ),
      "state.definition",
    );
    expect(reads).toBe(0);
  });
for (const finish of ["accept", "reject"] as const)
  test(`denied pagination preserves exact pending query receipt for ${finish}`, () => {
    const f = fixture(false, true);
    const r = f.store.dispatch({ type: "search.commit", search: "candidate" });
    if (r.status !== "proposed")
      throw new Error("Expected real query proposal");
    const old = f.store.getSnapshot();
    f.reset();
    for (const action of [
      "same",
      "previous",
      "clamp-zero",
      "clamp-stale",
    ] as const)
      stateError(
        () => f.store.dispatch(commandFor(f, action)),
        "state.capability",
      );
    expect(Object.values(f.counts)).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(f.store.getSnapshot()).toBe(old);
    if (finish === "accept") {
      expect(f.store.accept(r.proposal).status).toBe("committed");
      expect(f.store.getSnapshot().query.search).toBe("candidate");
      expect(f.counts.subscriber).toBe(1);
    } else {
      f.store.reject(r.proposal);
      expect(f.store.getSnapshot()).toBe(old);
      expect(f.log).toEqual([]);
    }
    stateError(() => f.store.accept(r.proposal), "state.stale");
  });
test("accept validates exact current receipt first, then retained captured original intent", () => {
  const seen: Command[] = [];
  const f = fixture(false, true, {
    validateCommand(command) {
      seen.push(command);
    },
  });
  const original = { type: "search.commit" as const, search: "retained" };
  const result = f.store.dispatch(original);
  if (result.status !== "proposed") throw new Error("Expected real proposal");
  Reflect.set(original, "type", "pagination.change");
  Reflect.set(original, "search", "not captured");
  let reads = 0;
  const forged = new Proxy(result.proposal, {
    get() {
      reads++;
      throw 0;
    },
  });
  stateError(() => f.store.accept(forged), "state.stale");
  expect(reads).toBe(0);
  expect(seen).toHaveLength(1);
  expect(f.store.accept(result.proposal).status).toBe("committed");
  expect(seen[0]).toBe(seen[1]);
  expect(Object.isFrozen(seen[0])).toBe(true);
  expect(seen[1]?.type).toBe("search.commit");
  expect(f.store.getSnapshot().query.search).toBe("retained");
});
for (const policy of [undefined, true] as const)
  test(`enabled=${policy} private command rejection precedes clock/updater and preserves acceptance retry`, () => {
    let reject = true;
    let validators = 0;
    const f = fixture(policy, true, {
      validateCommand() {
        validators++;
        if (reject) throw 0;
      },
    });
    stateError(
      () => f.store.dispatch(commandFor(f, "previous")),
      "state.invalid",
    );
    expect(f.counts.clock).toBe(0);
    expect(f.counts.updater).toBe(0);
    reject = false;
    const proposal = f.store.dispatch(commandFor(f, "index"));
    if (proposal.status !== "proposed") throw new Error("Expected proposal");
    const old = f.store.getSnapshot();
    reject = true;
    stateError(() => f.store.accept(proposal.proposal), "state.invalid");
    expect(f.store.getSnapshot()).toBe(old);
    reject = false;
    expect(f.store.accept(proposal.proposal).status).toBe("committed");
    expect(validators).toBe(4);
  });
for (const controlled of [false, true])
  test(`false guard wins over throwing private command validator/clock, controlled=${controlled}`, () => {
    let calls = 0;
    let clock = 0;
    let constructed = false;
    const f = fixture(false, controlled, {
      now() {
        clock++;
        if (constructed) throw new Error("app clock");
        return NOW;
      },
      validateCommand() {
        calls++;
        throw new Error("app validator");
      },
    });
    constructed = true;
    clock = 0;
    stateError(
      () => f.store.dispatch(commandFor(f, "previous")),
      "state.capability",
    );
    expect(calls).toBe(0);
    expect(clock).toBe(0);
    expect(f.log).toEqual([]);
  });
for (const page of [
  { pageIndex: 1, pageSize: 10 },
  { pageIndex: 0, pageSize: 25 },
])
  for (const functional of [false, true])
    for (const changed of ["filter", "sorting"] as const)
      test(`query.replace validates original dormant pair ${JSON.stringify(page)}, function=${functional}, change=${changed}`, () => {
        const f = fixture(false);
        const before = f.store.getSnapshot();
        const input = {
          ...before.query,
          ...(changed === "filter"
            ? { search: "different" }
            : { sorting: [{ id: "amount" as const, desc: true }] }),
          pagination: page,
        };
        const bytes = canonicalJson(input);
        let calls = 0;
        contractError(
          () =>
            f.store.dispatch({
              type: "query.replace",
              update: functional
                ? (previous) => {
                    calls++;
                    expect(previous).toBe(before.query);
                    return input;
                  }
                : input,
            }),
          "query.invalid",
        );
        expect(calls).toBe(functional ? 1 : 0);
        expect(f.counts.command).toBe(1);
        expect(f.counts.clock).toBe(1);
        expect(f.counts.state).toBe(0);
        expect(f.counts.request).toBe(0);
        expect(f.counts.subscriber).toBe(0);
        expect(f.store.getSnapshot()).toBe(before);
        expect(canonicalJson(input)).toBe(bytes);
        expect(Object.isFrozen(input)).toBe(false);
        contractError(
          () =>
            reduceTableState(
              f.store.getDefinition(),
              before,
              { type: "query.replace", update: input },
              { now: NOW },
            ),
          "query.invalid",
        );
      });
for (const functional of [false, true])
  test(`canonical atomic query.replace remains usable, function=${functional}`, () => {
    const f = fixture(false, true);
    const old = f.store.getSnapshot();
    let calls = 0;
    const input = {
      ...old.query,
      search: "atomic",
      sorting: [{ id: "amount" as const, desc: true }],
    };
    const result = f.store.dispatch({
      type: "query.replace",
      update: functional
        ? () => {
            calls++;
            return input;
          }
        : input,
    });
    if (result.status !== "proposed")
      throw new Error("Expected real controlled atomic proposal");
    expect(f.store.getSnapshot()).toBe(old);
    expect(calls).toBe(functional ? 1 : 0);
    expect(f.store.accept(result.proposal).status).toBe("committed");
    expect(calls).toBe(functional ? 1 : 0);
    expect(f.store.getSnapshot().query.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
    expect(f.store.getSnapshot().query.search).toBe("atomic");
    expect(f.store.getSnapshot().selection).toEqual({});
    expect(f.store.getSnapshot().revision).toBe(1);
  });
for (const valid of [false, true])
  for (const functional of [false, true])
    test(`custom normalization follows original candidate policy valid=${valid}, function=${functional}`, () => {
      const counts = {
        validate: 0,
        normalize: 0,
        command: 0,
        clock: 0,
        state: 0,
        updater: 0,
      };
      const operator = defineOperator({
        id: "custom.round",
        labelKey: "synthetic.round",
        cardinality: "one",
        types: ["number"],
        validate(value: unknown): value is number {
          counts.validate++;
          return typeof value === "number" && Number.isFinite(value);
        },
        normalize(value: number) {
          counts.normalize++;
          return Math.round(value);
        },
      });
      const registry = createOperatorRegistry([operator]);
      const schema = defineQuerySchema(
        {
          id: "u1-custom",
          version: 1,
          fields: {
            amount: {
              type: "number",
              owner: "builder",
              operators: ["custom.round"],
            },
          },
          pagination: { enabled: false },
        },
        registry,
      );
      const store = createTableController(
        { schema },
        {
          initial: {
            query: createQuery(
              schema,
              { locale: "en-US", timeZone: "UTC" },
              { registry },
            ),
          },
          registry,
          now() {
            counts.clock++;
            return NOW;
          },
          validateCommand() {
            counts.command++;
          },
          validateState() {
            counts.state++;
          },
        },
      );
      for (const key of Object.keys(counts) as (keyof typeof counts)[])
        counts[key] = 0;
      const before = store.getSnapshot();
      const input = {
        ...before.query,
        builder: {
          join: "and" as const,
          rules: [
            {
              id: "r1",
              field: "amount" as const,
              operator: "custom.round" as const,
              value: 7.4,
            },
          ],
        },
        pagination: { pageIndex: valid ? 0 : 1, pageSize: 10 },
      };
      const command: TableCommand<typeof schema> = {
        type: "query.replace",
        update: functional
          ? () => {
              counts.updater++;
              return input;
            }
          : input,
      };
      if (valid) {
        expect(store.dispatch(command).status).toBe("committed");
        expect(counts.validate).toBeGreaterThan(0);
        expect(counts.normalize).toBeGreaterThan(0);
        expect(store.getSnapshot().query.builder.rules[0]?.value).toBe(7);
      } else {
        contractError(() => store.dispatch(command), "query.invalid");
        expect(counts.validate).toBe(0);
        expect(counts.normalize).toBe(0);
        expect(counts.state).toBe(0);
        expect(store.getSnapshot()).toBe(before);
      }
      expect(counts.command).toBe(1);
      expect(counts.clock).toBe(1);
      expect(counts.updater).toBe(functional ? 1 : 0);
      expect(input.builder.rules[0]?.value).toBe(7.4);
    });
test("disabled unrelated selection/sorting stay available and explicit relative tick keeps old boundary semantics", () => {
  let now = NOW;
  const schema = schemaFor(false);
  const f = fixture(false, false, {
    now: () => now,
    initial: {
      query: createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
        date: {
          operator: "date.on",
          value: { kind: "relative", preset: "today" },
        },
      }),
      selection: { row: true },
    },
  });
  const first = f.store.getSnapshot();
  now++;
  expect(f.store.dispatch({ type: "clock.tick" }).status).toBe("noop");
  expect(f.store.getSnapshot()).toBe(first);
  stateError(() => f.store.dispatch(commandFor(f, "same")), "state.capability");
  expect(f.store.getSnapshot()).toBe(first);
  now += 86_400_000;
  expect(f.store.dispatch({ type: "clock.tick" }).status).toBe("committed");
  expect(f.store.getSnapshot().filterIdentity).not.toBe(first.filterIdentity);
  expect(f.store.getSnapshot().selection).toEqual({});
  expect(f.store.getSnapshot().query.pagination).toEqual({
    pageIndex: 0,
    pageSize: 10,
  });
  expect(
    f.store.dispatch({ type: "selection.change", update: { fresh: true } })
      .status,
  ).toBe("committed");
  expect(
    f.store.dispatch({
      type: "sorting.change",
      update: [{ id: "amount", desc: true }],
    }).status,
  ).toBe("committed");
  expect(f.store.getSnapshot().selection).toEqual({ fresh: true });
});
test("relative controlled acceptance remains stale across day boundary after a denied paging call", () => {
  let now = NOW,
    clock = 0;
  const schema = schemaFor(false);
  const f = fixture(false, true, {
    now() {
      clock++;
      return now;
    },
    initial: {
      query: createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
        date: {
          operator: "date.on",
          value: { kind: "relative", preset: "today" },
        },
      }),
    },
  });
  const proposed = f.store.dispatch({
    type: "sorting.change",
    update: [{ id: "amount", desc: true }],
  });
  if (proposed.status !== "proposed") throw new Error("Expected proposal");
  const old = f.store.getSnapshot(),
    oldClock = clock;
  now += 86_400_000;
  stateError(
    () => f.store.dispatch(commandFor(f, "previous")),
    "state.capability",
  );
  expect(clock).toBe(oldClock);
  stateError(() => f.store.accept(proposed.proposal), "state.stale");
  expect(f.store.getSnapshot()).toBe(old);
});
test("definition policy/version swaps preserve exact old lifetime on failed initialization", () => {
  const f = fixture(true);
  const old = f.store.getSnapshot();
  const sameVersion = schemaFor(false);
  stateError(
    () =>
      replaceTableDefinition(
        f.store,
        { ...f.store.getDefinition(), schema: sameVersion },
        {
          initial: {
            query: createQuery(sameVersion, {
              locale: "en-US",
              timeZone: "UTC",
            }),
          },
          now: () => NOW,
        },
      ),
    "state.definition",
  );
  expect(f.store.isDisposed()).toBe(false);
  expect(f.store.getSnapshot()).toBe(old);
  const next = schemaFor(false, 2),
    canonical = createQuery(next, { locale: "en-US", timeZone: "UTC" });
  contractError(
    () =>
      replaceTableDefinition(
        f.store,
        { ...f.store.getDefinition(), schema: next },
        {
          initial: {
            query: { ...canonical, pagination: { pageIndex: 1, pageSize: 10 } },
          },
          now: () => NOW,
        },
      ),
    "query.invalid",
  );
  expect(f.store.isDisposed()).toBe(false);
  expect(f.store.getSnapshot()).toBe(old);
  const replacement = replaceTableDefinition(
    f.store,
    { ...f.store.getDefinition(), schema: next },
    { initial: { query: canonical }, now: () => NOW },
  );
  expect(f.store.isDisposed()).toBe(true);
  expect(replacement.getSnapshot().query.schemaVersion).toBe(2);
  stateError(
    () =>
      replacement.dispatch({
        type: "pagination.clamp",
        pageCount: 0,
        queryIdentity: replacement.getSnapshot().queryIdentity,
      }),
    "state.capability",
  );
  stateError(() => f.store.dispatch(commandFor(f, "same")), "state.disposed");
});
