import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { compileQueryExecution } from "../../../packages/react/src/contracts/execution.js";
import {
  ContractError,
  canonicalJson,
  createQuery,
  defineQuerySchema,
  getQueryIdentity,
} from "../../../packages/react/src/contracts/index.js";
import type {
  IssueCode,
  OperatorRegistry,
} from "../../../packages/react/src/contracts/types.js";
import { createFilterEvaluator } from "../../../packages/react/src/filters/evaluate.js";
import { compileFilter } from "../../../packages/react/src/filters/plan.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import { translateQuery } from "../../../packages/react/src/filters/translate.js";
import {
  customSizes,
  active as legacyActive,
  context as legacyContext,
  now as legacyNow,
  schemaFor as legacySchema,
} from "../contracts/fixtures.js";
import {
  active,
  context,
  customFixture,
  records,
  schemaFor,
  T1,
  T2,
  translator,
} from "./fixtures.js";

function failure(action: () => unknown, code: IssueCode) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ContractError);
    if (error instanceof ContractError) {
      expect(error.message).toBe("Invalid Tableweave contract.");
      expect(error.issues.map((issue) => issue.code)).toEqual([code]);
      expect(error.message).not.toContain("private");
    }
    return;
  }
  throw new Error(`Expected ${code}`);
}
function deeplyFrozen(value: unknown) {
  if (value && typeof value === "object") {
    expect(Object.isFrozen(value)).toBe(true);
    for (const child of Object.values(value)) deeplyFrozen(child);
  }
}
const golden = JSON.parse(
  readFileSync(new URL("../contracts/baselines.json", import.meta.url), "utf8"),
);
for (const custom of [false, true])
  for (const enabled of [undefined, true] as const) {
    it(`preserves real old paged identity bytes custom=${custom}, enabled=${enabled}`, () => {
      const schema = legacySchema({
        ...(custom ? customSizes : {}),
        ...(enabled === undefined ? {} : { enabled }),
      });
      const old = golden.cases[custom ? "custom" : "defaults"];
      for (const [key, query] of [
        ["default", createQuery(schema, legacyContext)],
        ["active", createQuery(schema, legacyActive(schema))],
      ] as const) {
        const descriptor = compileQueryExecution(schema, query, {
          now: legacyNow,
        });
        expect(canonicalJson(descriptor.query)).toBe(old[`${key}Wire`]);
        expect(descriptor.queryIdentity).toBe(old[`${key}QueryIdentity`]);
        expect(descriptor.extent).toEqual({
          kind: "page",
          ...query.pagination,
        });
        expect(descriptor.evaluatedAt).toBe(legacyNow);
      }
    });
  }
for (const enabled of [true, false])
  it(`preserves ordered sorting/all owners, clones input and deeply freezes fresh output enabled=${enabled}`, () => {
    const schema = schemaFor(enabled);
    const query = createQuery(schema, active(schema));
    const input = JSON.parse(canonicalJson(query));
    const options = { now: T1 };
    const before = canonicalJson(input);
    const result = compileQueryExecution(schema, input, options);
    const other = compileQueryExecution(schema, input, options);
    expect(result).not.toBe(other);
    expect(result.query).not.toBe(other.query);
    expect(result.filter).not.toBe(other.filter);
    expect(result.extent).not.toBe(other.extent);
    expect(canonicalJson(result)).toBe(canonicalJson(other));
    expect(canonicalJson(input)).toBe(before);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(input.builder.rules)).toBe(false);
    expect(Object.isFrozen(options)).toBe(false);
    deeplyFrozen(result);
    expect(Object.keys(result).sort()).toEqual([
      "evaluatedAt",
      "extent",
      "filter",
      "query",
      "queryIdentity",
      "version",
    ]);
    expect(result.query.sorting).toEqual([
      { id: "amount", desc: true },
      { id: "label", desc: false },
    ]);
    expect(result.query.search).toBe("ALPHA");
    expect(result.query.builder.rules[1]?.value).toEqual(["basic", "vip"]);
    expect(result.query.schemaVersion).toBe(9);
    expect(result.filter.tab.rules).toHaveLength(1);
    expect(result.filter.date?.interval?.kind).toBe("instants");
    expect(Object.hasOwn(result.filter, "sorting")).toBe(false);
    expect(Object.hasOwn(result.filter, "pagination")).toBe(false);
    if (enabled)
      expect(result.extent).toEqual({
        kind: "page",
        pageIndex: 2,
        pageSize: 25,
      });
    else {
      expect(Reflect.ownKeys(result.extent)).toEqual(["kind"]);
      expect(result.extent).toEqual({ kind: "complete" });
      expect(result.query.pagination).toEqual({ pageIndex: 0, pageSize: 25 });
    }
    input.builder.rules[0].value = 99;
    input.sorting.reverse();
    options.now = T2;
    expect(result.query.builder.rules[0]?.value).toBe(7);
    expect(result.query.sorting[0]?.id).toBe("amount");
    expect(result.evaluatedAt).toBe(T1);
  });

const invalidOptions: unknown[] = [
  undefined,
  null,
  false,
  1,
  "now",
  [],
  () => T1,
  {},
  { now: undefined },
  { now: null },
  { now: "0" },
  { now: Number.NaN },
  { now: Infinity },
  { now: 8.64e15 + 1 },
  { now: -8.64e15 - 1 },
  { now: new Number(0) },
  { now: T1, registry: undefined },
  { now: T1, registry: null },
  { now: T1, registry: false },
  { now: T1, extra: true },
  Object.create({ now: T1 }),
  Object.assign(Object.create({ inherited: true }), { now: T1 }),
  Object.assign(new Date(0), { now: T1 }),
  Object.defineProperty({}, "now", { value: T1 }),
  { now: T1, [Symbol("extra")]: true },
  Object.defineProperty({ now: T1 }, "hidden", { value: true }),
];
for (const [index, options] of invalidOptions.entries())
  it(`bad options ${index} reject query.context before query/custom work`, () => {
    const fixture = customFixture();
    let queryReads = 0;
    const input = Object.defineProperty({}, "version", {
      enumerable: true,
      get() {
        queryReads++;
        throw new Error("private query getter");
      },
    });
    failure(
      () =>
        Reflect.apply(compileQueryExecution, undefined, [
          fixture.schema,
          input,
          options,
        ]),
      "query.context",
    );
    expect(queryReads).toBe(0);
    expect(fixture.calls).toEqual({ validate: 0, normalize: 0, evaluate: 0 });
  });
for (const field of ["now", "registry", "extra"])
  it(`never executes options ${field} accessor`, () => {
    const fixture = customFixture();
    let reads = 0;
    const options = Object.defineProperty(
      field === "now" ? {} : { now: T1 },
      field,
      {
        enumerable: true,
        get() {
          reads++;
          throw new Error("private accessor");
        },
      },
    );
    failure(
      () =>
        Reflect.apply(compileQueryExecution, undefined, [
          fixture.schema,
          fixture.query,
          options,
        ]),
      "query.context",
    );
    expect(reads).toBe(0);
    expect(fixture.calls.validate).toBe(0);
  });
for (const trap of [
  "getPrototypeOf",
  "ownKeys",
  "getOwnPropertyDescriptor",
] as const)
  it(`sanitizes throwing options proxy ${trap} without claiming universal proxy rejection`, () => {
    const fixture = customFixture();
    const handler = {
      [trap]() {
        throw new Error("private proxy exception");
      },
    };
    const options = new Proxy({ now: T1 }, handler);
    failure(
      () => compileQueryExecution(fixture.schema, fixture.query, options),
      "query.context",
    );
    expect(fixture.calls.validate).toBe(0);
  });
it("rejects a revoked options proxy safely", () => {
  const fixture = customFixture();
  const revocable = Proxy.revocable({ now: T1 }, {});
  revocable.revoke();
  failure(
    () => compileQueryExecution(fixture.schema, fixture.query, revocable.proxy),
    "query.context",
  );
  expect(fixture.calls.validate).toBe(0);
});
it("does not call a supplied clock function", () => {
  const schema = schemaFor();
  let reads = 0;
  failure(
    () =>
      Reflect.apply(compileQueryExecution, undefined, [
        schema,
        createQuery(schema, context),
        {
          now() {
            reads++;
            return T1;
          },
        },
      ]),
    "query.context",
  );
  expect(reads).toBe(0);
});
for (const now of [0, -1, 0.5, 8.64e15, -8.64e15])
  it(`preserves exact finite Date-valid explicit evaluation ${now}`, () => {
    const schema = schemaFor();
    expect(
      compileQueryExecution(schema, createQuery(schema, context), { now })
        .evaluatedAt,
    ).toBe(now);
  });
it("accepts plain/null-prototype options and preserves an opaque trusted registry reference without freezing it", () => {
  const fixture = customFixture();
  let calls = 0;
  class RegistryHost implements OperatorRegistry {
    custom = fixture.registry.custom;
    descriptors = fixture.registry.descriptors;
    mutable = { allowed: true };
    get(id: string) {
      expect(this).toBe(registry);
      calls++;
      return fixture.registry.get(id);
    }
  }
  const registry = new RegistryHost();
  const options = Object.assign(Object.create(null), { now: T1, registry });
  const result = compileQueryExecution(fixture.schema, fixture.query, options);
  expect(calls).toBeGreaterThan(0);
  expect(Object.isFrozen(options)).toBe(false);
  expect(Object.isFrozen(registry)).toBe(false);
  expect(Object.isFrozen(registry.mutable)).toBe(false);
  registry.mutable.allowed = false;
  expect(Object.hasOwn(result, "registry")).toBe(false);
  deeplyFrozen(result);
});
it("captures own data descriptors once, never rereads hostile ordinary properties", () => {
  const fixture = customFixture();
  const descriptorReads = { now: 0, registry: 0 };
  let gets = 0;
  let ownKeys = 0;
  const target = { now: T1, registry: fixture.registry };
  const options = new Proxy(target, {
    get() {
      gets++;
      throw new Error("private property get");
    },
    ownKeys(object) {
      ownKeys++;
      return Reflect.ownKeys(object);
    },
    getOwnPropertyDescriptor(object, key) {
      if (key === "now") {
        descriptorReads.now++;
        return {
          ...Reflect.getOwnPropertyDescriptor(object, key),
          value: descriptorReads.now === 1 ? T1 : T2,
        };
      }
      if (key === "registry") {
        descriptorReads.registry++;
        target.now = T2;
        return Reflect.getOwnPropertyDescriptor(object, key);
      }
      return Reflect.getOwnPropertyDescriptor(object, key);
    },
  });
  const result = compileQueryExecution(fixture.schema, fixture.query, options);
  expect(result.evaluatedAt).toBe(T1);
  expect(target.now).toBe(T2);
  expect(descriptorReads).toEqual({ now: 1, registry: 1 });
  expect(gets).toBe(0);
  expect(ownKeys).toBe(1);
  expect(result.filter).toEqual(
    compileFilter(fixture.schema, fixture.query, {
      now: T1,
      registry: fixture.registry,
    }),
  );
});
it("captures original wire once and evaluation/registry before reentrant trusted registry work", () => {
  const fixture = customFixture();
  const raw = JSON.parse(canonicalJson(fixture.query));
  raw.search = "alpha";
  let mutated = false;
  const options: { now: number; registry: OperatorRegistry } = {
    now: T1,
    registry: fixture.registry,
  };
  const registry: OperatorRegistry = {
    custom: fixture.registry.custom,
    descriptors: fixture.registry.descriptors,
    get(id) {
      expect(this).toBe(registry);
      if (!mutated) {
        mutated = true;
        raw.search = "changed";
        raw.builder.rules[0].value = 100;
        options.now = T2;
        options.registry = {
          custom: [],
          descriptors: [],
          get() {
            throw new Error("wrong later registry");
          },
        };
      }
      return fixture.registry.get(id);
    },
  };
  options.registry = registry;
  const reads = new Map<PropertyKey, number>();
  let ordinaryGets = 0;
  const wire = new Proxy(raw, {
    get() {
      ordinaryGets++;
      throw new Error("private wire property get");
    },
    getOwnPropertyDescriptor(object, key) {
      reads.set(key, (reads.get(key) ?? 0) + 1);
      return Reflect.getOwnPropertyDescriptor(object, key);
    },
  });
  const result = compileQueryExecution(fixture.schema, wire, options);
  expect(mutated).toBe(true);
  expect(ordinaryGets).toBe(0);
  expect([...reads.values()].every((count) => count === 1)).toBe(true);
  expect(result.evaluatedAt).toBe(T1);
  expect(result.query.search).toBe("alpha");
  expect(result.query.builder.rules[0]?.value).toBe(7);
  expect(result.filter).toEqual(
    compileFilter(fixture.schema, result.query, {
      now: T1,
      registry: fixture.registry,
    }),
  );
  expect(result.queryIdentity).toBe(
    getQueryIdentity(fixture.schema, result.query, {
      now: T1,
      registry: fixture.registry,
    }),
  );
});

for (const pagination of [
  { pageIndex: 1, pageSize: 10 },
  { pageIndex: 0, pageSize: 25 },
])
  it(`denied original dormant pair precedes custom callbacks ${JSON.stringify(pagination)}`, () => {
    const fixture = customFixture(false);
    failure(
      () =>
        compileQueryExecution(
          fixture.schema,
          { ...fixture.query, pagination },
          { now: T1, registry: fixture.registry },
        ),
      "query.invalid",
    );
    expect(fixture.calls).toEqual({ validate: 0, normalize: 0, evaluate: 0 });
  });
for (const key of [
  "extent",
  "enabled",
  "paginationEnabled",
  "filter",
  "queryIdentity",
  "evaluatedAt",
  "records",
])
  it(`rejects original wire injection ${key}`, () => {
    const fixture = customFixture();
    failure(
      () =>
        compileQueryExecution(
          fixture.schema,
          { ...fixture.query, [key]: { kind: "complete" } },
          { now: T1, registry: fixture.registry },
        ),
      "query.invalid",
    );
    expect(fixture.calls.validate).toBe(0);
  });
it("does not accept a client cached FilterPlan instead of original wire", () => {
  const schema = schemaFor();
  const query = createQuery(schema, active(schema));
  failure(
    () =>
      compileQueryExecution(schema, compileFilter(schema, query, { now: T1 }), {
        now: T1,
      }),
    "query.invalid",
  );
  failure(
    () =>
      compileQueryExecution(
        schema,
        { ...query, pagination: { ...query.pagination, enabled: false } },
        { now: T1 },
      ),
    "query.invalid",
  );
});
it("keeps original safe schema/context/numeric/sort/owner errors", () => {
  const schema = schemaFor();
  const query = createQuery(schema, context);
  failure(
    () =>
      compileQueryExecution(
        schema,
        { ...query, schemaVersion: 8 },
        { now: T1 },
      ),
    "schema.version",
  );
  failure(
    () =>
      compileQueryExecution(
        schema,
        { ...query, timeZone: "invalid/zone" },
        { now: T1 },
      ),
    "query.context",
  );
  failure(
    () =>
      compileQueryExecution(
        schema,
        { ...query, pagination: { pageIndex: -1, pageSize: 25 } },
        { now: T1 },
      ),
    "query.limit",
  );
  failure(
    () =>
      compileQueryExecution(
        schema,
        { ...query, sorting: [{ id: "tags", desc: true }] },
        { now: T1 },
      ),
    "query.sort",
  );
  failure(
    () =>
      compileQueryExecution(
        schema,
        {
          ...query,
          builder: {
            join: "and",
            rules: [
              {
                id: "bad",
                field: "label",
                operator: "text.contains",
                value: "x",
              },
            ],
          },
        },
        { now: T1 },
      ),
    "rule.field",
  );
});
it("takes complete only from the trusted registered schema, not a client policy", () => {
  const paged = schemaFor(true);
  const complete = schemaFor(false);
  const query = createQuery(complete, context);
  expect(compileQueryExecution(paged, query, { now: T1 }).extent.kind).toBe(
    "page",
  );
  expect(compileQueryExecution(complete, query, { now: T1 }).extent).toEqual({
    kind: "complete",
  });
});
it("sanitizes throwing custom callbacks through existing query error semantics", () => {
  const fixture = customFixture();
  const registry: OperatorRegistry = {
    custom: fixture.registry.custom,
    descriptors: fixture.registry.descriptors,
    get() {
      throw new Error("private registry payload");
    },
  };
  failure(
    () =>
      compileQueryExecution(fixture.schema, fixture.query, {
        now: T1,
        registry,
      }),
    "query.invalid",
  );
});

for (const enabled of [true, false])
  for (const now of [T1, T2])
    for (const kind of ["relative", "rolling", "day"] as const) {
      it(`built-in ${kind} DST/rolling semantics and filter translator parity enabled=${enabled} now=${now}`, () => {
        const schema = schemaFor(enabled);
        const value =
          kind === "relative"
            ? { kind: "relative" as const, preset: "today" as const }
            : kind === "rolling"
              ? {
                  kind: "rolling" as const,
                  days: 3 as const,
                  direction: "past" as const,
                }
              : { kind: "day" as const, value: "2026-03-08" };
        const query = createQuery(schema, {
          ...active(schema),
          date: { operator: "date.on", value },
        });
        const result = compileQueryExecution(schema, query, { now });
        expect(result.filter).toEqual(
          compileFilter(schema, query, { now: result.evaluatedAt }),
        );
        expect(result.queryIdentity).toBe(
          getQueryIdentity(schema, query, { now: result.evaluatedAt }),
        );
        const client = records
          .filter(
            createFilterEvaluator<typeof schema, (typeof records)[number]>(
              schema,
              result.query,
              { now: result.evaluatedAt },
            ),
          )
          .map((row) => row.id);
        const translated = records
          .filter(
            translateQuery(
              schema,
              result.query,
              translator(result.evaluatedAt),
              { now: result.evaluatedAt },
            ),
          )
          .map((row) => row.id);
        expect(translated).toEqual(client);
        if (kind === "day" || (kind === "relative" && now === T1)) {
          expect(client).toEqual(["mar8"]);
          expect(result.filter.date?.interval).toEqual({
            kind: "instants",
            start: Date.parse("2026-03-08T05:00:00Z"),
            endExclusive: Date.parse("2026-03-09T04:00:00Z"),
          });
        } else if (kind === "relative") expect(client).toEqual(["mar9"]);
        else expect(client).toEqual(now === T1 ? ["mar8"] : ["mar8", "mar9"]);
      });
    }
for (const now of [T1, T2])
  it(`date-only relative days retain calendar identity at ${now}`, () => {
    const schema = defineQuerySchema({
      id: "execution-days",
      version: 2,
      fields: { day: { type: "date", owner: "builder" } },
    });
    const query = createQuery(schema, {
      ...context,
      builder: {
        join: "and",
        rules: [
          {
            id: "r1",
            field: "day",
            operator: "date.on",
            value: { kind: "relative", preset: "today" },
          },
        ],
      },
    });
    const result = compileQueryExecution(schema, query, { now });
    expect(result.filter.builder.rules[0]?.interval).toEqual({
      kind: "days",
      start: now === T1 ? "2026-03-08" : "2026-03-09",
      endExclusive: now === T1 ? "2026-03-09" : "2026-03-10",
    });
    expect(result.queryIdentity).toBe(getQueryIdentity(schema, query, { now }));
  });
for (const now of [T1, T2])
  it(`valid idempotent custom normalization preserves same-evaluation client/translator parity ${now}`, () => {
    const fixture = customFixture(false);
    const input = {
      ...fixture.query,
      builder: {
        join: "and",
        rules: [
          {
            id: "r1",
            field: "amount",
            operator: "custom.roundedClock",
            value: 7.4,
          },
        ],
      },
    };
    const result = compileQueryExecution(fixture.schema, input, {
      now,
      registry: fixture.registry,
    });
    expect(result.query.builder.rules[0]?.value).toBe(7);
    expect(result.filter.builder.rules[0]?.value).toBe(7);
    expect(result.filter).toEqual(
      compileFilter(fixture.schema, result.query, {
        now: result.evaluatedAt,
        registry: fixture.registry,
      }),
    );
    expect(result.queryIdentity).toBe(
      getQueryIdentity(fixture.schema, result.query, {
        now: result.evaluatedAt,
        registry: fixture.registry,
      }),
    );
    expect(fixture.calls.normalize).toBeGreaterThan(1);
    const client = records
      .filter(
        createFilterEvaluator<typeof fixture.schema, (typeof records)[number]>(
          fixture.schema,
          result.query,
          { now: result.evaluatedAt, registry: fixture.registry },
        ),
      )
      .map((row) => row.id);
    const translated = records
      .filter(
        translateQuery(
          fixture.schema,
          result.query,
          translator(result.evaluatedAt),
          { now: result.evaluatedAt, registry: fixture.registry },
        ),
      )
      .map((row) => row.id);
    expect(translated).toEqual(client);
    expect(client).toEqual(now === T1 ? [] : ["mar8", "mar9"]);
  });

for (const mode of ["throwing", "non-idempotent"] as const)
  it(`keeps existing custom rule error for ${mode} callback`, () => {
    const operator = defineOperator({
      id: "custom.failure",
      labelKey: "synthetic.failure",
      types: ["number"],
      cardinality: "one",
      validate(value: unknown): value is number {
        if (mode === "throwing") throw new Error("private callback exception");
        return typeof value === "number" && Number.isFinite(value);
      },
      normalize(value: number) {
        return value + 1;
      },
    });
    const registry = createOperatorRegistry([operator]);
    const schema = defineQuerySchema(
      {
        id: "execution-errors",
        version: 1,
        fields: {
          amount: {
            type: "number",
            owner: "builder",
            operators: ["custom.failure"],
          },
        },
      },
      registry,
    );
    const query = createQuery(schema, context, { registry });
    const input = {
      ...query,
      builder: {
        join: "and",
        rules: [
          { id: "r1", field: "amount", operator: "custom.failure", value: 7 },
        ],
      },
    };
    failure(
      () => compileQueryExecution(schema, input, { now: T1, registry }),
      "rule.value",
    );
  });
it("does not migrate captured custom clock identity or timestamp fixed-date identities", () => {
  const fixture = customFixture();
  const first = compileQueryExecution(fixture.schema, fixture.query, {
    now: T1,
    registry: fixture.registry,
  });
  const second = compileQueryExecution(fixture.schema, fixture.query, {
    now: T2,
    registry: fixture.registry,
  });
  expect(first.evaluatedAt).not.toBe(second.evaluatedAt);
  expect(first.queryIdentity).toBe(second.queryIdentity);
  expect(first.filter).toEqual(second.filter);
  const schema = schemaFor();
  const relative = createQuery(schema, active(schema));
  expect(
    compileQueryExecution(schema, relative, { now: T1 }).queryIdentity,
  ).not.toBe(
    compileQueryExecution(schema, relative, { now: T2 }).queryIdentity,
  );
  const fixed = createQuery(schema, {
    ...active(schema),
    date: { operator: "date.on", value: { kind: "day", value: "2026-03-08" } },
  });
  expect(compileQueryExecution(schema, fixed, { now: T1 }).queryIdentity).toBe(
    compileQueryExecution(schema, fixed, { now: T2 }).queryIdentity,
  );
});
it("rejects an original wire accessor without executing it", () => {
  const fixture = customFixture();
  let reads = 0;
  const wire = Object.defineProperty({ ...fixture.query }, "pagination", {
    enumerable: true,
    get() {
      reads++;
      throw new Error("private query getter");
    },
  });
  failure(
    () =>
      compileQueryExecution(fixture.schema, wire, {
        now: T1,
        registry: fixture.registry,
      }),
    "query.invalid",
  );
  expect(reads).toBe(0);
  expect(fixture.calls.validate).toBe(0);
});
