import assert from "node:assert/strict";
import test from "node:test";
import type { ReactNode } from "react";
import type {
  JsonValue,
  RuleFor,
} from "../../packages/react/src/contracts/types.js";
import { normalizeOperand } from "../../packages/react/src/filters/registry.js";
import type {
  FilterFieldPresentation,
  FilterOptionPort,
} from "../../packages/heroui/src/filters/types.js";
import {
  captureFilterBuilderPorts,
  captureFilterDatePorts,
  captureFilterSearchPorts,
  captureFilterTabsPorts,
  CriteriaPortsError,
} from "../../packages/heroui/src/filters/criteria-ports.js";
import { registry, schema, source, unitGate, type S } from "./fixtures.js";

const rule: RuleFor<S> = {
  id: "r",
  field: "first",
  operator: "number.eq",
  value: 1,
};
const mutation = { status: "noop" } as const;

test("denied initial gate touches no opaque private props or schema", () => {
  const gate = unitGate();
  gate.revoke();
  let reads = 0;
  const opaque = new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        reads++;
        throw new Error("Private descriptor");
      },
      getPrototypeOf() {
        reads++;
        throw new Error("Private prototype");
      },
    },
  );
  assert.throws(
    () => captureFilterSearchPorts(opaque, gate.check),
    CriteriaPortsError,
  );
  assert.throws(
    () => captureFilterBuilderPorts(opaque as S, opaque as never, gate.check),
    CriteriaPortsError,
  );
  assert.equal(reads, 0);
});

test("single descriptor capture and owned aliases; unknown props/symbols are untouched", () => {
  const gate = unitGate();
  const reads = new Map<PropertyKey, number>();
  let prototypeReads = 0;
  const data = { label: "Synthetic field", formatValue: () => "value" };
  const presentation = new Proxy(data, {
    getPrototypeOf(target) {
      prototypeReads++;
      return Reflect.getPrototypeOf(target);
    },
    getOwnPropertyDescriptor(target, key) {
      reads.set(key, (reads.get(key) ?? 0) + 1);
      return Reflect.getOwnPropertyDescriptor(target, key);
    },
  });
  const props = {
    evaluationMode: "server" as const,
    fields: { first: presentation, second: presentation },
  };
  Object.defineProperty(props, "controller", {
    get() {
      throw new Error("Must not read controller");
    },
  });
  Object.defineProperty(data, "renderValue", {
    get() {
      throw new Error("No such existing port");
    },
  });
  Object.defineProperty(data, "formatOperand", {
    get() {
      throw new Error("No such existing port");
    },
  });
  Object.defineProperty(props, Symbol("unconsumed"), {
    get() {
      throw new Error("Unknown symbol");
    },
  });
  const captured = captureFilterBuilderPorts(schema, props, gate.check);
  assert.equal(captured.fields.first, captured.fields.second);
  assert.equal(reads.get("label"), 1);
  assert.equal(reads.get("formatValue"), 1);
  assert.equal(prototypeReads, 1);
  assert.equal(reads.has("renderValue"), false);
  assert.equal(reads.has("formatOperand"), false);
  assert(Object.isFrozen(captured.fields.first));
  assert(!Object.isFrozen(data));
  data.label = "Changed after capture";
  assert.equal(captured.fields.first?.label, "Synthetic field");
});

test("getters and inherited supplied callbacks deny without invocation", () => {
  const gate = unitGate();
  let getter = 0;
  const messages = Object.defineProperty({}, "label", {
    get() {
      getter++;
      return "Forbidden";
    },
  });
  assert.throws(
    () => captureFilterSearchPorts({ messages }, gate.check),
    CriteriaPortsError,
  );
  const inherited = Object.create({
    onMutation() {
      throw new Error("Inherited callback");
    },
  });
  assert.throws(
    () => captureFilterSearchPorts(inherited, gate.check),
    CriteriaPortsError,
  );
  assert.equal(getter, 0);
});

test("reflection revocation or a thrown trap stops the next property read", () => {
  for (const throws of [false, true]) {
    const gate = unitGate();
    let later = 0;
    const props = new Proxy(
      {
        messages: { label: "Synthetic" },
        onMutation() {
          later++;
        },
      },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === "messages") {
            gate.revoke();
            if (throws) throw new Error("Synthetic thrown trap");
          } else later++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    assert.throws(
      () => captureFilterSearchPorts(props, gate.check),
      CriteriaPortsError,
    );
    assert.equal(later, 0);
  }
});

test("capture invokes no callback/default/transport/cursor/source acquisition", () => {
  const gate = unitGate();
  let calls = 0;
  const originalSource = source();
  let sourceReads = 0;
  const opaqueSource = new Proxy(originalSource, {
    get() {
      sourceReads++;
      throw new Error("Source read");
    },
    getPrototypeOf() {
      sourceReads++;
      throw new Error("Source prototype");
    },
    preventExtensions() {
      sourceReads++;
      throw new Error("Source freeze");
    },
  });
  const option: FilterOptionPort = {
    source: opaqueSource,
    idType: "scalar",
    onRequest() {
      calls++;
    },
    nextPageKey() {
      calls++;
      return "next";
    },
  };
  const presentation: FilterFieldPresentation<S> = {
    label: "Synthetic",
    asyncOptions: option,
    renderEditor() {
      calls++;
      return null;
    },
    formatValue() {
      calls++;
      return null;
    },
  };
  const custom = registry(() => {
    calls++;
  });
  const props = {
    evaluationMode: "client" as const,
    fields: { first: presentation },
    registry: custom,
    createRuleId() {
      calls++;
      return "id";
    },
    onMutation() {
      calls++;
    },
  };
  const captured = captureFilterBuilderPorts(schema, props, gate.check);
  assert.equal(captured.fields.first?.asyncOptions?.source, opaqueSource);
  assert.equal(calls, 0);
  assert.equal(sourceReads, 0);
  assert.equal(Object.isFrozen(option), false);
  assert.equal(Object.isFrozen(custom), false);
  // Retained identity is NOT genuine F2 registration/adoption proof for this proxy.
});

test("toolbar observers are bare; builder/field callbacks retain original member receivers", () => {
  const gate = unitGate();
  const receivers: unknown[] = [];
  const observer = function (this: unknown) {
    receivers.push(this);
  };
  const search = captureFilterSearchPorts<S>(
    { onMutation: observer },
    gate.check,
  );
  const tabs = captureFilterTabsPorts(
    schema,
    {
      tabs: { all: { label: "All" }, active: { label: "Active" } },
      children: null,
      onMutation: observer,
    },
    gate.check,
  );
  const date = captureFilterDatePorts<S>({ onMutation: observer }, gate.check);
  search.onMutation?.(mutation);
  tabs.onMutation?.(mutation);
  date.onMutation?.(mutation);
  assert.deepEqual(receivers, [undefined, undefined, undefined]);
  const memberReceivers: unknown[] = [];
  const field: FilterFieldPresentation<S> = {
    label: "Synthetic",
    formatValue: function (this: unknown) {
      memberReceivers.push(this);
      return "value";
    },
    renderEditor: function (this: unknown) {
      memberReceivers.push(this);
      return null;
    },
  };
  const props = {
    evaluationMode: "server" as const,
    fields: { first: field },
    createRuleId: function (this: unknown) {
      memberReceivers.push(this);
      return "new";
    },
    onMutation: function (this: unknown) {
      memberReceivers.push(this);
    },
  };
  const builder = captureFilterBuilderPorts(schema, props, gate.check);
  builder.createRuleId?.();
  builder.onMutation?.(mutation, { type: "builder.clear" });
  builder.fields.first?.formatValue?.(rule);
  builder.fields.first?.renderEditor?.({
    fieldId: "first",
    field: schema.fields.first,
    operator: {
      id: "number.eq",
      labelKey: "operators.eq",
      types: ["number"],
      cardinality: "one",
      builtin: true,
    },
    value: undefined,
    acceptedRule: undefined,
    validation: { status: "incomplete", issues: [] },
    locale: "en-US",
    timeZone: "UTC",
    evaluatedAt: 0,
    isDisabled: false,
    onChange() {},
  });
  assert.equal(memberReceivers[0], props);
  assert.equal(memberReceivers[1], props);
  assert.equal(memberReceivers[2], field);
  assert.equal(memberReceivers[3], field);
});

test("option request direct-member and bare-retry receivers differ; cursor is member", () => {
  const gate = unitGate();
  const receivers: unknown[] = [];
  const port: FilterOptionPort = {
    source: source(),
    onRequest: function (this: unknown) {
      receivers.push(this);
    },
    nextPageKey: function (this: unknown) {
      receivers.push(this);
      return "next";
    },
  };
  const captured = captureFilterBuilderPorts(
    schema,
    {
      evaluationMode: "server",
      fields: { first: { label: "Synthetic", asyncOptions: port } },
    },
    gate.check,
  ).fields.first?.asyncOptions;
  assert(captured);
  const token = port.source.begin({
    definitionKey: "ports-v1",
    scopeKey: "synthetic",
    fieldId: "first",
    term: "",
    pageKey: "first",
  });
  assert(token);
  captured.onRequest(token);
  const retryToken = port.source.begin({
    definitionKey: "ports-v1",
    scopeKey: "synthetic",
    fieldId: "first",
    term: "",
    pageKey: "first",
    retry: captured.onRequest,
  });
  assert(retryToken);
  port.source.fail(retryToken, "offline");
  assert(port.source.retry()); // the actual raw source destructures/calls retry bare
  captured.nextPageKey?.(token);
  assert.deepEqual(receivers, [port, undefined, port]);
});

test("date messages preserve direct dictionary, merged receiver, and builder bare relative calls", () => {
  const gate = unitGate();
  const receivers: unknown[] = [];
  const messages = {
    label: "Synthetic dates",
    formatSummary: function (this: unknown) {
      receivers.push(this);
      return "summary";
    },
    formatTimeZone: function (this: unknown) {
      receivers.push(this);
      return "zone";
    },
    formatRelative: function (this: unknown) {
      receivers.push(this);
      return "relative";
    },
  };
  const date = captureFilterDatePorts<S>({ messages }, gate.check);
  const input = {
    operator: "date.on" as const,
    value: { kind: "day" as const, value: "2026-01-01" },
  };
  date.messages?.formatSummary?.(input, {
    locale: "en-US",
    timeZone: "UTC",
    evaluatedAt: 0,
  });
  const merged = { label: "Component default", ...date.messages };
  merged.formatTimeZone?.("UTC");
  const builder = captureFilterBuilderPorts(
    schema,
    { evaluationMode: "server", fields: {}, dateMessages: messages },
    gate.check,
  );
  const relative = builder.dateMessages?.formatRelative;
  relative?.({ kind: "relative", preset: "today" });
  assert.equal(receivers[0], messages);
  assert.equal(receivers[1], merged);
  assert.equal(receivers[2], undefined);
});

test("registry get/custom aliases and nested callbacks are fenced individually", () => {
  for (const revokeAt of ["validate", "normalize", "evaluate"] as const) {
    const gate = unitGate();
    const calls: string[] = [];
    const receivers: unknown[] = [];
    const original = registry((kind, receiver) => {
      calls.push(kind);
      receivers.push(receiver);
      if (kind === revokeAt) gate.revoke();
    });
    const captured = captureFilterBuilderPorts(
      schema,
      { evaluationMode: "client", fields: {}, registry: original },
      gate.check,
    ).registry;
    assert(captured);
    assert.equal(calls.length, 0);
    const descriptor = captured.get("number.synthetic");
    assert(descriptor?.custom);
    assert.equal(descriptor, captured.descriptors[0]);
    assert.equal(descriptor.custom, captured.custom[0]);
    assert.equal(descriptor.custom.validate, captured.custom[0]?.validate);
    assert.equal(receivers[0], original);
    if (revokeAt === "evaluate")
      assert.throws(
        () =>
          descriptor.custom?.evaluate?.(1, 1, {
            field: schema.fields.first,
            locale: "en-US",
            timeZone: "UTC",
            now: 0,
          }),
        CriteriaPortsError,
      );
    else
      assert.throws(() =>
        normalizeOperand(
          schema.fields.first,
          descriptor,
          1,
          schema.limits,
          "en-US",
          "UTC",
        ),
      );
    const before = calls.length;
    assert.throws(() => captured.get("number.synthetic"), CriteriaPortsError);
    assert.throws(() => descriptor.custom?.validate(1), CriteriaPortsError);
    assert.equal(calls.length, before);
    assert.equal(receivers[1], original.custom[0]);
    if (revokeAt === "validate")
      assert.equal(calls.includes("normalize"), false);
  }
});

test("registry-get revocation denies descriptor traversal and private results", () => {
  const gate = unitGate();
  let validations = 0;
  const original = registry((kind) => {
    if (kind === "get") gate.revoke();
    else validations++;
  });
  const captured = captureFilterDatePorts<S>(
    { registry: original },
    gate.check,
  );
  assert.throws(
    () => captured.registry?.get("number.synthetic"),
    CriteriaPortsError,
  );
  assert.equal(validations, 0);
});

test("cursor/request/mutation results are discarded after reentrant revocation or throw", () => {
  for (const kind of ["cursor", "request", "mutation", "throw"] as const) {
    const gate = unitGate();
    let calls = 0;
    const stop = () => {
      calls++;
      gate.revoke();
      if (kind === "throw")
        throw Object.defineProperty({}, "message", {
          get() {
            throw new Error("No payload inspection");
          },
        });
    };
    const option: FilterOptionPort = {
      source: source(),
      onRequest() {
        stop();
      },
      nextPageKey() {
        stop();
        return "private-cursor";
      },
    };
    const props = {
      evaluationMode: "server" as const,
      fields: { first: { label: "Synthetic", asyncOptions: option } },
      onMutation() {
        stop();
      },
    };
    const captured = captureFilterBuilderPorts(schema, props, gate.check);
    const port = captured.fields.first?.asyncOptions;
    assert(port);
    const token = option.source.begin({
      definitionKey: "ports-v1",
      scopeKey: "synthetic",
      fieldId: "first",
      term: "",
      pageKey: "first",
    });
    assert(token);
    if (kind === "cursor")
      assert.throws(() => port.nextPageKey?.(token), CriteriaPortsError);
    else if (kind === "mutation")
      assert.throws(
        () => captured.onMutation?.(mutation, { type: "builder.clear" }),
        CriteriaPortsError,
      );
    else assert.throws(() => port.onRequest(token), CriteriaPortsError);
    assert.throws(() => port.onRequest(token), CriteriaPortsError);
    assert.equal(calls, 1);
  }
});

test("missing defaults differ from invalid callbacks; legitimate own undefined is retained", () => {
  const gate = unitGate();
  const absent = captureFilterSearchPorts<S>({}, gate.check);
  assert.equal(Object.hasOwn(absent, "messages"), false);
  const explicit = captureFilterSearchPorts<S>(
    { messages: undefined, onMutation: undefined } as unknown as Parameters<
      typeof captureFilterSearchPorts<S>
    >[0],
    gate.check,
  );
  assert.equal(Object.hasOwn(explicit, "messages"), true);
  assert.equal(explicit.messages, undefined);
  assert.throws(
    () => captureFilterSearchPorts({ onMutation: null } as never, gate.check),
    CriteriaPortsError,
  );
  assert.throws(
    () =>
      captureFilterDatePorts<S>(
        { messages: { formatSummary: undefined } } as never,
        gate.check,
      ),
    CriteriaPortsError,
  );
  const presets = captureFilterDatePorts<S>({ presets: [] }, gate.check);
  assert.deepEqual(presets.presets, []);
  assert(Object.isFrozen(presets.presets));
  assert.equal(
    Object.hasOwn(captureFilterDatePorts<S>({}, gate.check), "presets"),
    false,
  );
});

test("old wrapper never adopts a new gate or latest candidate props", () => {
  const first = unitGate();
  const second = unitGate();
  let callsA = 0,
    callsB = 0;
  const input = {
    onMutation: () => {
      callsA++;
    },
  };
  const a = captureFilterSearchPorts<S>(input, first.check);
  input.onMutation = () => {
    callsB++;
  };
  const b = captureFilterSearchPorts<S>(input, second.check);
  assert.notEqual(a.onMutation, b.onMutation);
  a.onMutation?.(mutation);
  assert.equal(callsA, 1);
  assert.equal(callsB, 0);
  first.revoke();
  assert.throws(() => a.onMutation?.(mutation), CriteriaPortsError);
  b.onMutation?.(mutation);
  assert.equal(callsA, 1);
  assert.equal(callsB, 1);
});

test("formatter/render results and thrown payloads are discarded after the post-call gate", () => {
  for (const formatter of [
    "formatSummary",
    "formatTimeZone",
    "formatRelative",
  ] as const) {
    const gate = unitGate();
    let calls = 0;
    const stop = () => {
      calls++;
      gate.revoke();
      return "private formatted text";
    };
    const messages = {
      formatSummary: stop,
      formatTimeZone: stop,
      formatRelative: stop,
    };
    const captured = captureFilterDatePorts<S>({ messages }, gate.check);
    assert(captured.messages);
    if (formatter === "formatSummary")
      assert.throws(
        () =>
          captured.messages?.formatSummary?.(
            {
              operator: "date.on",
              value: { kind: "day", value: "2026-01-01" },
            },
            { locale: "en-US", timeZone: "UTC", evaluatedAt: 0 },
          ),
        CriteriaPortsError,
      );
    if (formatter === "formatTimeZone")
      assert.throws(
        () => captured.messages?.formatTimeZone?.("UTC"),
        CriteriaPortsError,
      );
    if (formatter === "formatRelative")
      assert.throws(
        () =>
          captured.messages?.formatRelative?.({
            kind: "relative",
            preset: "today",
          }),
        CriteriaPortsError,
      );
    assert.equal(calls, 1);
  }
  const gate = unitGate();
  let postChecks = 0;
  const checked = (): undefined => {
    postChecks++;
    return gate.check();
  };
  const captured = captureFilterSearchPorts<S>(
    {
      onMutation() {
        throw Object.defineProperty({}, "toString", {
          get() {
            throw new Error("Must not inspect thrown value");
          },
        });
      },
    },
    checked,
  );
  const before = postChecks;
  assert.throws(() => captured.onMutation?.(mutation), CriteriaPortsError);
  assert.equal(postChecks - before, 2); // both pre and post checks, even on app throw
});

test("tabs select only actual schema IDs and retain opaque children without traversal/freezing", () => {
  const gate = unitGate();
  let reads = 0;
  const child = new Proxy(
    { type: "span", key: null, props: {} },
    {
      get() {
        reads++;
        throw new Error("Opaque React node");
      },
      ownKeys() {
        reads++;
        throw new Error("Opaque React node");
      },
      preventExtensions() {
        reads++;
        throw new Error("Opaque React node");
      },
    },
  );
  const tabs = {
    all: {
      label: "All",
      count: { value: 2, description: "Synthetic matches" },
    },
    active: { label: "Active" },
  };
  Object.defineProperty(tabs, "notInSchema", {
    get() {
      throw new Error("Unconsumed tab");
    },
  });
  const captured = captureFilterTabsPorts(
    schema,
    { tabs, children: child as ReactNode },
    gate.check,
  );
  assert.equal(captured.children, child);
  assert.equal(reads, 0);
  assert.deepEqual(Object.keys(captured.tabs), ["all", "active"]);
  assert.notEqual(captured.tabs.all, tabs.all);
  assert.equal(Object.isFrozen(tabs.all), false);
});

test("preset and choice metadata are copied; no render/formatter is invoked during capture", () => {
  const gate = unitGate();
  let calls = 0;
  const preset = {
    id: "today",
    label: "Today",
    date: {
      operator: "date.on" as const,
      value: { kind: "relative" as const, preset: "today" as const },
    },
  };
  const date = captureFilterDatePorts<S>(
    {
      presets: [preset],
      messages: {
        formatSummary() {
          calls++;
          return "summary";
        },
      },
    },
    gate.check,
  );
  assert.equal(calls, 0);
  assert.notEqual(date.presets?.[0], preset);
  assert.equal(Object.isFrozen(preset.date), false);
  const choice = { id: "a", label: "Synthetic A" };
  const builder = captureFilterBuilderPorts(
    schema,
    {
      evaluationMode: "server",
      fields: { first: { label: "First", choices: [choice] } },
    },
    gate.check,
  );
  assert.notEqual(builder.fields.first?.choices?.[0], choice);
  assert(Object.isFrozen(builder.fields.first?.choices?.[0]));
});

test("unknown dictionary symbols deny; opaque transport results are never probed", () => {
  const gate = unitGate();
  const labels = Object.defineProperty({}, Symbol("invalid label key"), {
    get() {
      throw new Error("Must not invoke symbol getter");
    },
  });
  assert.throws(
    () =>
      captureFilterBuilderPorts(
        schema,
        {
          evaluationMode: "server",
          fields: { first: { label: "First", operatorLabels: labels } },
        },
        gate.check,
      ),
    CriteriaPortsError,
  );
  let thenReads = 0;
  const promise = Object.defineProperty(Promise.resolve(), "then", {
    get() {
      thenReads++;
      throw new Error("No then probing");
    },
  });
  const actual = source();
  const ports = captureFilterBuilderPorts(
    schema,
    {
      evaluationMode: "server",
      fields: {
        first: {
          label: "First",
          asyncOptions: {
            source: actual,
            onRequest: () => promise,
          },
        },
      },
    },
    gate.check,
  );
  const token = actual.begin({
    definitionKey: "ports-v1",
    scopeKey: "synthetic",
    fieldId: "first",
    term: "",
    pageKey: "first",
  });
  assert(token);
  assert.equal(ports.fields.first?.asyncOptions?.onRequest(token), promise);
  assert.equal(thenReads, 0); // returned opaque transport work, NOT consumed/validated here
});

const value: JsonValue = 1;
void value;
