import { expect, it } from "vitest";
import {
  createQuery,
  defineQuerySchema,
} from "../../../packages/react/src/contracts/index.js";
import type { QueryFor } from "../../../packages/react/src/contracts/types.js";
import {
  beginControlsRequest,
  getControlsRequestBinding,
  projectControls,
} from "../../../packages/react/src/presentation/index.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { createNativeBoundary } from "../../../packages/react/src/tanstack/boundary.js";
import {
  createNativeController,
  defineNativeTable,
} from "../../../packages/react/src/tanstack/index.js";
import { context } from "./fixtures.js";

it("keeps accepted relative-boundary provenance even when the symbolic wire query is unchanged", () => {
  let now = Date.parse("2026-01-01T12:00:00Z");
  const firstTime = now;
  const schema = defineQuerySchema({
    id: "controls-relative",
    version: 1,
    fields: {
      day: { type: "date", owner: "builder", relativePresets: ["today"] },
    },
  });
  const definition = defineNativeTable({
    schema,
    selection: true,
    getRowId: (record: { id: string; day: string }) => record.id,
    columns: [{ id: "day", accessorKey: "day" }],
  });
  const query = createQuery(schema, {
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
  });
  const controller = createNativeController(definition, {
    initial: { query },
    now: () => now,
  });
  const resource = createResourceAdapter<
    { id: string; day: string },
    QueryFor<typeof schema>
  >(context);
  const started = beginControlsRequest(definition, controller, resource, {
    ...context,
    queryKey: "opaque",
    requestKey: "request",
  });
  if (!started) throw new Error("Missing request");
  const { request, binding } = started;
  resource.succeed(request, {
    source: "fresh",
    records: [{ id: "first", day: "2026-01-01" }],
    page: { kind: "known", total: 1 },
    emptyKind: "unknown",
    receivedAt: "2026-01-01T12:00:00Z",
  });
  const oldQuery = controller.getSnapshot().query;
  now = Date.parse("2026-01-02T12:00:00Z");
  controller.dispatch({ type: "clock.tick" });
  expect(controller.getSnapshot().query).toBe(oldQuery);
  expect(resource.getSnapshot().canSelect).toBe(true);
  const boundary = createNativeBoundary(definition, controller);
  const view = resource.getSnapshot();
  if (!view.snapshot) throw new Error("Missing snapshot");
  const frame = boundary.prepare(
    {
      mode: "server",
      records: view.snapshot.records,
      pageInfo: view.snapshot.page,
    },
    controller.getSnapshot(),
  );
  boundary.commit(frame);
  const facts = projectControls(definition, {
    native: boundary.getView(frame),
    expected: context,
    source: {
      mode: "server",
      resource,
      view,
      bindings: { request: binding, snapshot: binding },
    },
  });
  expect(facts.obsolete).toBe(true);
  expect(facts.canSelect).toBe(false);
  expect(facts.displayed?.evaluatedAt).toBe(firstTime);
  expect(facts.displayed?.query).toEqual(oldQuery);
});

it("never binds an old never-registered relative token, even when begin observers advance the clock again", () => {
  let now = Date.parse("2026-01-01T12:00:00Z");
  const schema = defineQuerySchema({
    id: "relative-atomic-observer",
    version: 1,
    fields: {
      day: { type: "date", owner: "builder", relativePresets: ["today"] },
    },
  });
  const definition = defineNativeTable({
    schema,
    selection: true,
    getRowId: (record: { id: string; day: string }) => record.id,
    columns: [{ id: "day", accessorKey: "day" }],
  });
  const query = createQuery(schema, {
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
  });
  const controller = createNativeController(definition, {
    initial: { query },
    now: () => now,
  });
  const resource = createResourceAdapter<
    { id: string; day: string },
    QueryFor<typeof schema>
  >(context);
  const raw = resource.begin({
    ...context,
    queryKey: "opaque",
    requestKey: "opaque",
    query: controller.getSnapshot().query,
  });
  if (!raw) throw new Error("Missing raw request");
  now = Date.parse("2026-01-02T12:00:00Z");
  controller.dispatch({ type: "clock.tick" });
  expect(resource.getSnapshot().request).toBe(raw);
  expect(
    getControlsRequestBinding(definition, controller, resource, raw),
  ).toBeNull();
  const before = controller.getSnapshot();
  const unsubscribe = resource.subscribe(() => {
    now = Date.parse("2026-01-03T12:00:00Z");
    controller.dispatch({ type: "clock.tick" });
  });
  const started = beginControlsRequest(definition, controller, resource, {
    ...context,
    queryKey: "opaque",
    requestKey: "opaque",
  });
  unsubscribe();
  if (!started) throw new Error("Missing request");
  expect(started.binding.queryIdentity).toBe(before.queryIdentity);
  expect(started.binding.evaluatedAt).toBe(before.evaluatedAt);
  expect(started.binding.queryIdentity).not.toBe(
    controller.getSnapshot().queryIdentity,
  );
  expect(
    getControlsRequestBinding(definition, controller, resource, raw),
  ).toBeNull();
  resource.succeed(started.request, {
    source: "fresh",
    records: [{ id: "second", day: "2026-01-02" }],
    page: { kind: "known", total: 1 },
    emptyKind: "unknown",
    receivedAt: "2026-01-03T12:00:00Z",
  });
  const view = resource.getSnapshot();
  if (!view.snapshot) throw new Error("Missing snapshot");
  const boundary = createNativeBoundary(definition, controller);
  const frame = boundary.prepare(
    {
      mode: "server",
      records: view.snapshot.records,
      pageInfo: view.snapshot.page,
    },
    controller.getSnapshot(),
  );
  boundary.commit(frame);
  const facts = projectControls(definition, {
    native: boundary.getView(frame),
    expected: context,
    source: {
      mode: "server",
      resource,
      view,
      bindings: { request: started.binding, snapshot: started.binding },
    },
  });
  expect(facts.obsolete).toBe(true);
  expect(facts.canSelect).toBe(false);
  expect(facts.displayed?.evaluatedAt).toBe(before.evaluatedAt);
});
