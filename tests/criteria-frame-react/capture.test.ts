import { expect, test } from "vitest";
import { createQuery } from "../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../packages/react/src/contracts/schema.js";
import {
  captureCriteriaReactInput,
  createCriteriaFrames,
  getCriteriaFramesOwner,
} from "../../packages/react/src/presentation/criteria-frame.js";
import { defineNativeTable } from "../../packages/react/src/tanstack/definition.js";
import { ApplicationOwner } from "../criteria-bootstrap/owner.js";
import { fixture, records, required, sourceInput } from "./fixtures.js";

test("capture needs a genuine owner before touching candidate, and own booleans reject before native callbacks", () => {
  const f = fixture();
  f.settle();
  let reads = 0;
  const poison = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  expect(getCriteriaFramesOwner(poison as never)).toBeNull();
  expect(() =>
    captureCriteriaReactInput(poison as never, poison as never, null),
  ).toThrow();
  expect(reads).toBe(0);
  for (const manualOrder of [undefined, null, "yes", 1])
    expect(() =>
      captureCriteriaReactInput(
        f.frames,
        { ...f.input(), manualOrder } as never,
        null,
      ),
    ).toThrow();
  expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
});
test("consumed semantic keys ignore container reallocation, track genuine selection/column/clock snapshots", () => {
  const f = fixture();
  let time = 10;
  const app = ApplicationOwner.create({
    native: f.definition,
    context: f.context,
    now: () => time,
    initial: {
      query: createQuery(f.schema, { locale: "en-US", timeZone: "UTC" }),
    },
  });
  const pending = app.prepareInitial();
  if (pending.status !== "pending") throw 0;
  const current = required(pending.snapshot.pending);
  const criteria = app.P.issue({
    controller: app.C,
    definition: app.CD,
    context: current.expected,
    epoch: current.epoch,
  });
  const frames = createCriteriaFrames({
    nativeDefinition: f.definition,
    controller: app.C,
    publication: app.P,
    criteria,
  });
  expect(app.completeInitial(pending.ticket).status).toBe("settled");
  const input = {
    criteria,
    expected: f.context,
    source: { mode: "client" as const, context: f.context, records },
    nativeInput: { mode: "client" as const, records },
  };
  const a = captureCriteriaReactInput(frames, input, null);
  const b = captureCriteriaReactInput(
    frames,
    {
      ...input,
      expected: { ...f.context },
      source: { ...input.source },
      nativeInput: { ...input.nativeInput },
    },
    a,
  );
  expect(b.key).toEqual(a.key);
  const selected = app.propose({
    type: "selection.change",
    update: { r1: true },
  });
  if (selected.status === "proposed") app.acceptPending();
  const c = captureCriteriaReactInput(frames, input, b);
  expect(c.key).not.toEqual(b.key);
  const columns = app.propose({
    type: "columns.visibility",
    update: { title: false },
  });
  if (columns.status === "proposed") app.acceptPending();
  const d = captureCriteriaReactInput(frames, input, c);
  expect(d.key).not.toEqual(c.key);
  time = 20;
  const tick = app.propose({ type: "clock.tick" });
  if (tick.status === "proposed") app.acceptPending();
  // This schema has no relative criterion: a tick is an actual controller no-op.
  expect(captureCriteriaReactInput(frames, input, d).key).toEqual(d.key);
});
test("a genuine accepted relative-clock tick changes the commit key without a clock mirror", () => {
  const schema = defineQuerySchema({
    id: "criteria-react-clock",
    version: 1,
    fields: { day: { type: "date", owner: "builder" } },
  });
  interface Record {
    id: string;
    day: string;
  }
  const definition = defineNativeTable<typeof schema, Record>({
    schema,
    getRowId: (row) => row.id,
    columns: [{ id: "day", accessorKey: "day" }],
  });
  let now = Date.parse("2026-01-15T12:00:00Z");
  const context = {
    definitionKey: "criteria-react-clock",
    scopeKey: "synthetic",
    access: true,
  };
  const app = ApplicationOwner.create({
    native: definition,
    context,
    now: () => now,
    initial: {
      query: createQuery(schema, {
        locale: "en-US",
        timeZone: "UTC",
        builder: {
          join: "and",
          rules: [
            {
              id: "today",
              field: "day",
              operator: "date.on",
              value: { kind: "relative", preset: "today" },
            },
          ],
        },
      }),
    },
  });
  const pending = app.prepareInitial();
  if (pending.status !== "pending") throw 0;
  const current = required(pending.snapshot.pending);
  const criteria = app.P.issue({
    controller: app.C,
    definition: app.CD,
    context: current.expected,
    epoch: current.epoch,
  });
  const frames = createCriteriaFrames({
    nativeDefinition: definition,
    controller: app.C,
    publication: app.P,
    criteria,
  });
  expect(app.completeInitial(pending.ticket).status).toBe("settled");
  const data: readonly Record[] = [{ id: "a", day: "2026-01-15" }];
  const input = {
    criteria,
    expected: context,
    source: { mode: "client" as const, context, records: data },
    nativeInput: { mode: "client" as const, records: data },
  };
  const before = captureCriteriaReactInput(frames, input, null);
  now += 86_400_000;
  const tick = app.propose({ type: "clock.tick" });
  if (tick.status === "proposed") app.acceptPending();
  const after = captureCriteriaReactInput(frames, input, before);
  expect(after.key).not.toEqual(before.key);
  expect(app.C.getSnapshot().evaluatedAt).toBe(now);
});
test("missing nativeInput remains explicitly source-only; unsupported metadata modes deny without model work", () => {
  for (const enabled of [true, false]) {
    const f = fixture(enabled);
    f.settle();
    const mode = enabled ? "server" : "server-complete";
    const capture = captureCriteriaReactInput(
      f.frames,
      sourceInput(f, mode),
      null,
    );
    expect(capture.native).toBeNull();
    expect(() =>
      f.frames.commitSource(
        sourceInput(f, enabled ? "server-complete" : "server"),
      ),
    ).toThrow();
    expect(Object.values(f.counts).every((n) => n === 0)).toBe(true);
  }
});
