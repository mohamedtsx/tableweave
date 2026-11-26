import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import {
  ContractError,
  canonicalJson,
  createQuery,
  defineQuerySchema,
  getFilterIdentity,
  getQueryIdentity,
  normalizeQuery,
  parseQuery,
} from "../../../packages/react/src/contracts/index.js";
import type {
  ContractResult,
  IssueCode,
} from "../../../packages/react/src/contracts/types.js";
import {
  createTableController,
  replaceTableDefinition,
} from "../../../packages/react/src/controller/store.js";
import {
  ControllerError,
  defineController,
} from "../../../packages/react/src/controller/validation.js";
import {
  createOperatorRegistry,
  defineOperator,
} from "../../../packages/react/src/filters/registry.js";
import {
  active,
  context,
  customSizes,
  descriptor,
  now,
  schemaFor,
} from "./fixtures.js";

interface Baseline {
  schema: string;
  controller: string;
  defaultWire: string;
  activeWire: string;
  defaultFilterIdentity: string;
  activeFilterIdentity: string;
  defaultQueryIdentity: string;
  activeQueryIdentity: string;
}
const baseline: { cases: Record<"defaults" | "custom", Baseline> } = JSON.parse(
  readFileSync(new URL("./baselines.json", import.meta.url), "utf8"),
);
function issue(result: ContractResult<unknown>, code: IssueCode) {
  expect(result.success).toBe(false);
  if (result.success) throw new Error("Expected rejected original query");
  expect(result.issues).toEqual([{ code }]);
}
function schemaIssue(input: unknown) {
  try {
    Reflect.apply(defineQuerySchema, undefined, [input]);
  } catch (error) {
    expect(error).toBeInstanceOf(ContractError);
    if (error instanceof ContractError)
      expect(error.issues).toEqual([{ code: "schema.invalid" }]);
    return;
  }
  throw new Error("Expected strict schema rejection");
}

for (const custom of [false, true]) {
  for (const enabled of [undefined, true] as const) {
    it(`matches pre-edit literal paged bytes: custom=${custom}, enabled=${enabled}`, () => {
      const sizes = custom ? customSizes : {};
      const schema = schemaFor(
        enabled === undefined && !custom
          ? undefined
          : {
              ...sizes,
              ...(enabled === undefined ? {} : { enabled }),
            },
      );
      const neutral = createQuery(schema, context);
      const filtered = createQuery(schema, active(schema));
      const actual: Baseline = {
        schema: canonicalJson(schema),
        controller: canonicalJson(
          defineController({
            schema,
            columns: [{ id: "amount" }, { id: "title" }],
            selection: true,
          }),
        ),
        defaultWire: canonicalJson(neutral),
        activeWire: canonicalJson(filtered),
        defaultFilterIdentity: getFilterIdentity(schema, neutral, { now }),
        activeFilterIdentity: getFilterIdentity(schema, filtered, { now }),
        defaultQueryIdentity: getQueryIdentity(schema, neutral, { now }),
        activeQueryIdentity: getQueryIdentity(schema, filtered, { now }),
      };
      expect(actual).toEqual(baseline.cases[custom ? "custom" : "defaults"]);
      expect(Object.hasOwn(schema.pagination, "enabled")).toBe(false);
      expect(Object.keys(schema.pagination).sort()).toEqual([
        "defaultSize",
        "sizes",
      ]);
    });
  }
  it(`disabled is frozen/dormant and adds only the query policy tag: custom=${custom}`, () => {
    const schema = schemaFor({
      ...(custom ? customSizes : {}),
      enabled: false,
    });
    const query = createQuery(schema, context);
    const old = baseline.cases[custom ? "custom" : "defaults"];
    expect(schema.pagination.enabled).toBe(false);
    expect(Object.hasOwn(schema.pagination, "enabled")).toBe(true);
    expect(Object.isFrozen(schema)).toBe(true);
    expect(Object.isFrozen(schema.pagination)).toBe(true);
    expect(Object.isFrozen(schema.pagination.sizes)).toBe(true);
    expect(canonicalJson(query)).toBe(old.defaultWire);
    expect(query.version).toBe(1);
    expect(query.pagination).toEqual({
      pageIndex: 0,
      pageSize: custom ? 25 : 10,
    });
    expect(Object.hasOwn(query.pagination, "enabled")).toBe(false);
    expect(getFilterIdentity(schema, query, { now })).toBe(
      old.defaultFilterIdentity,
    );
    expect(JSON.parse(getQueryIdentity(schema, query, { now }))).toEqual({
      ...JSON.parse(old.defaultQueryIdentity),
      paginationEnabled: false,
    });
    expect(getQueryIdentity(schema, query, { now })).not.toBe(
      old.defaultQueryIdentity,
    );
    const filtered = createQuery(schema, {
      ...active(schema),
      pagination: query.pagination,
    });
    expect(getFilterIdentity(schema, filtered, { now })).toBe(
      old.activeFilterIdentity,
    );
    expect(filtered.schemaVersion).toBe(7);
    expect(Object.keys(schema.fields).sort()).toEqual([
      "amount",
      "day",
      "status",
      "title",
    ]);
  });
}

for (const pagination of [
  { pageIndex: 1, pageSize: 25 },
  { pageIndex: Number.MAX_SAFE_INTEGER, pageSize: 25 },
  { pageIndex: 0, pageSize: 5 },
  { pageIndex: 0, pageSize: 75 },
])
  it(`rejects otherwise valid noncanonical dormant pair ${JSON.stringify(pagination)}`, () => {
    const schema = schemaFor({ ...customSizes, enabled: false });
    const query = createQuery(schema, context);
    const candidate = {
      ...query,
      pagination,
      sorting: [{ id: "amount", desc: true }],
      search: "changed",
    };
    const before = canonicalJson(candidate);
    issue(parseQuery(schema, candidate), "query.invalid");
    expect(() => normalizeQuery(schema, candidate)).toThrow(ContractError);
    expect(() => createQuery(schema, { ...context, pagination })).toThrow(
      ContractError,
    );
    expect(canonicalJson(candidate)).toBe(before);
  });

const malformedPairs: readonly [unknown, IssueCode][] = [
  [{ pageIndex: -1, pageSize: 25 }, "query.limit"],
  [{ pageIndex: 0.5, pageSize: 25 }, "query.invalid"],
  [{ pageIndex: Number.MAX_SAFE_INTEGER + 1, pageSize: 25 }, "query.invalid"],
  [{ pageIndex: Number.POSITIVE_INFINITY, pageSize: 25 }, "query.invalid"],
  [{ pageIndex: 0, pageSize: 0 }, "query.limit"],
  [{ pageIndex: 0, pageSize: -1 }, "query.limit"],
  [{ pageIndex: 0, pageSize: 26 }, "query.limit"],
  [{ pageIndex: 0, pageSize: 101 }, "query.limit"],
  [{ pageIndex: 0, pageSize: 25.5 }, "query.invalid"],
  [{ pageIndex: 0, pageSize: Number.NaN }, "query.invalid"],
  [{ pageIndex: 0, pageSize: Number.MAX_SAFE_INTEGER + 1 }, "query.invalid"],
  [{ pageIndex: 0, pageSize: undefined }, "query.invalid"],
  [{ pageIndex: 0, pageSize: null }, "query.invalid"],
  [{ pageIndex: 0, pageSize: "25" }, "query.invalid"],
  [{ pageIndex: 0 }, "query.invalid"],
  [null, "query.invalid"],
];
for (const [index, [pagination, code]] of malformedPairs.entries()) {
  it(`preserves original shape/bound diagnostics ${index}: ${code}`, () => {
    const schema = schemaFor({ ...customSizes, enabled: false });
    issue(
      parseQuery(schema, { ...createQuery(schema, context), pagination }),
      code,
    );
  });
}

it("preserves malformed/context/version precedence before dormant policy", () => {
  const schema = schemaFor({ enabled: false });
  const query = createQuery(schema, context);
  const navigation = { ...query, pagination: { pageIndex: 1, pageSize: 10 } };
  issue(
    parseQuery(schema, { ...navigation, timeZone: "invalid/zone" }),
    "query.context",
  );
  issue(
    parseQuery(schema, {
      ...navigation,
      schemaVersion: 6,
      timeZone: "invalid/zone",
    }),
    "schema.version",
  );
  issue(
    parseQuery(schema, {
      ...navigation,
      timeZone: "invalid/zone",
      pagination: null,
    }),
    "query.invalid",
  );
  issue(
    parseQuery(schema, {
      ...navigation,
      pagination: { pageIndex: -1, pageSize: 10 },
    }),
    "query.limit",
  );
});

for (const enabled of [null, undefined, 0, 1, "false", {}, [], Number.NaN]) {
  it(`rejects invalid explicit enabled data ${String(enabled)}`, () => {
    schemaIssue({ ...descriptor(), pagination: { enabled } });
  });
}
for (const pagination of [
  null,
  undefined,
  { enabled: false, unknown: true },
  { enable: false },
]) {
  it(`retains strict pagination-container/unknown-key rejection ${String(pagination)}`, () => {
    schemaIssue({ ...descriptor(), pagination });
  });
}

it("never invokes schema getters or adopts unsupported prototypes/hidden/symbol policy", () => {
  let getters = 0;
  const getter = Object.defineProperty({}, "enabled", {
    enumerable: true,
    get() {
      getters++;
      return false;
    },
  });
  schemaIssue({ ...descriptor(), pagination: getter });
  schemaIssue(
    Object.defineProperty(descriptor(), "pagination", {
      enumerable: true,
      get() {
        getters++;
        return { enabled: false };
      },
    }),
  );
  schemaIssue({
    ...descriptor(),
    pagination: Object.create({ enabled: false }),
  });
  schemaIssue({
    ...descriptor(),
    pagination: Object.defineProperty({}, "enabled", { value: false }),
  });
  schemaIssue({ ...descriptor(), pagination: { [Symbol("enabled")]: false } });
  expect(getters).toBe(0);
});

it("accepts existing null-prototype data, without mutating/freezing caller state", () => {
  const pagination = Object.assign(Object.create(null), {
    enabled: false,
    defaultSize: 25,
    sizes: [5, 25],
  });
  const input = { ...descriptor(), pagination };
  const bytes = canonicalJson(input);
  const schema = defineQuerySchema(input);
  expect(canonicalJson(input)).toBe(bytes);
  expect(Object.isFrozen(input)).toBe(false);
  expect(Object.isFrozen(pagination.sizes)).toBe(false);
  pagination.enabled = true;
  pagination.sizes.push(50);
  expect(schema.pagination.enabled).toBe(false);
  expect(schema.pagination.sizes).toEqual([5, 25]);
  expect(Object.isFrozen(schema.fields.amount)).toBe(true);
  const pair = { pageIndex: -0, pageSize: 25 };
  const queryInput = { ...context, pagination: pair };
  const queryBytes = canonicalJson(queryInput);
  const query = createQuery(schema, queryInput);
  expect(canonicalJson(queryInput)).toBe(queryBytes);
  expect(Object.isFrozen(pair)).toBe(false);
  expect(Object.isFrozen(query.pagination)).toBe(true);
  pair.pageIndex = 4;
  expect(query.pagination.pageIndex).toBe(0);
});

for (const pagination of [
  { defaultSize: 0, sizes: [0] },
  { defaultSize: 5, sizes: [] },
  { defaultSize: 10, sizes: [5] },
  { defaultSize: 10, sizes: [10, 10] },
  { defaultSize: 10, sizes: [10, 101] },
  { defaultSize: 10, sizes: [10, -1] },
  { defaultSize: 10.5, sizes: [10.5] },
  {
    defaultSize: Number.MAX_SAFE_INTEGER + 1,
    sizes: [Number.MAX_SAFE_INTEGER + 1],
  },
])
  it(`disabled retains numeric schema constraints ${JSON.stringify(pagination)}`, () => {
    schemaIssue({
      ...descriptor(),
      pagination: { ...pagination, enabled: false },
    });
  });
it("does not repair disabled defaults to fit a lower maxPageRows", () => {
  schemaIssue({
    ...descriptor({ enabled: false }),
    limits: { maxPageRows: 5 },
  });
  schemaIssue({
    ...descriptor({ enabled: false, defaultSize: 5, sizes: [5, 25] }),
    limits: { maxPageRows: 5 },
  });
  const schema = defineQuerySchema({
    ...descriptor({ enabled: false, defaultSize: 1, sizes: [1] }),
    limits: { maxPageRows: 1 },
  });
  expect(createQuery(schema, context).pagination).toEqual({
    pageIndex: 0,
    pageSize: 1,
  });
});

it("rejects original navigation before every custom rule validation/normalization path", () => {
  const calls = { validate: 0, normalize: 0 };
  const operator = defineOperator({
    id: "custom.numeric",
    labelKey: "synthetic.numeric",
    types: ["number"],
    cardinality: "one",
    validate(value: unknown): value is number {
      calls.validate++;
      return typeof value === "number" && Number.isFinite(value);
    },
    normalize(value: number) {
      calls.normalize++;
      return value;
    },
  });
  const registry = createOperatorRegistry([operator]);
  const schema = defineQuerySchema(
    {
      id: "callback-policy",
      version: 3,
      fields: {
        amount: {
          type: "number",
          owner: "builder",
          sort: true,
          operators: ["custom.numeric"],
        },
      },
      pagination: { enabled: false, defaultSize: 10, sizes: [10, 25] },
    },
    registry,
  );
  const query = createQuery(
    schema,
    {
      ...context,
      builder: {
        join: "and",
        rules: [
          { id: "r1", field: "amount", operator: "custom.numeric", value: 7 },
        ],
      },
    },
    { registry },
  );
  for (const pagination of [
    { pageIndex: 1, pageSize: 10 },
    { pageIndex: 0, pageSize: 25 },
  ]) {
    const candidate = {
      ...query,
      pagination,
      sorting: [{ id: "amount", desc: true }],
    };
    calls.validate = calls.normalize = 0;
    issue(parseQuery(schema, candidate, { registry }), "query.invalid");
    expect(() => normalizeQuery(schema, candidate, { registry })).toThrow(
      ContractError,
    );
    expect(() =>
      getFilterIdentity(schema, candidate, { now, registry }),
    ).toThrow(ContractError);
    expect(() =>
      getQueryIdentity(schema, candidate, { now, registry }),
    ).toThrow(ContractError);
    expect(() =>
      createQuery(
        schema,
        { ...context, pagination, builder: query.builder },
        { registry },
      ),
    ).toThrow(ContractError);
    expect(calls).toEqual({ validate: 0, normalize: 0 });
  }
  expect(parseQuery(schema, query, { registry }).success).toBe(true);
  expect(calls.validate).toBeGreaterThan(0);
  expect(calls.normalize).toBeGreaterThan(0);
});

it("rejects query getters/unknown policy/explicit undefined without invoking accessors", () => {
  const schema = schemaFor({ enabled: false });
  const query = createQuery(schema, context);
  let getters = 0;
  const pagination = Object.defineProperty({ pageIndex: 0 }, "pageSize", {
    enumerable: true,
    get() {
      getters++;
      return 10;
    },
  });
  issue(parseQuery(schema, { ...query, pagination }), "query.invalid");
  issue(
    parseQuery(schema, {
      ...query,
      pagination: { ...query.pagination, enabled: false },
    }),
    "query.invalid",
  );
  issue(
    parseQuery(schema, { ...query, pagination: undefined }),
    "query.invalid",
  );
  expect(getters).toBe(0);
});

for (const reversed of [false, true])
  it(`real replacement rejects same-version policy change without retiring owner; reversed=${reversed}`, () => {
    const previousSchema = schemaFor(reversed ? { enabled: false } : undefined);
    const nextSchema = schemaFor(reversed ? undefined : { enabled: false });
    const previous = createTableController(
      { schema: previousSchema },
      {
        initial: { query: createQuery(previousSchema, context) },
        now: () => now,
      },
    );
    const before = previous.getSnapshot();
    expect(() =>
      replaceTableDefinition(
        previous,
        { schema: nextSchema },
        {
          initial: { query: createQuery(nextSchema, context) },
          now: () => now,
        },
      ),
    ).toThrow(new ControllerError("state.definition"));
    expect(previous.isDisposed()).toBe(false);
    expect(previous.getSnapshot()).toBe(before);
    previous.dispose();
  });
it("real replacement treats omitted and explicit true as the identical definition", () => {
  const omitted = schemaFor();
  const explicit = schemaFor({ enabled: true });
  const previous = createTableController(
    { schema: omitted },
    { initial: { query: createQuery(omitted, context) }, now: () => now },
  );
  const fingerprint = previous.getSnapshot().definitionIdentity;
  const next = replaceTableDefinition(
    previous,
    { schema: explicit },
    { initial: { query: createQuery(explicit, context) }, now: () => now },
  );
  expect(previous.isDisposed()).toBe(true);
  expect(next.getSnapshot().definitionIdentity).toBe(fingerprint);
  next.dispose();
});
it("explicit versioned replacement revalidates the dormant seed before disposing prior owner", () => {
  const schema = schemaFor();
  const previous = createTableController(
    { schema },
    { initial: { query: createQuery(schema, context) }, now: () => now },
  );
  const nextSchema = defineQuerySchema({
    ...descriptor({ enabled: false }),
    version: 8,
  });
  const nextQuery = createQuery(nextSchema, context);
  expect(() =>
    replaceTableDefinition(
      previous,
      { schema: nextSchema },
      {
        initial: {
          query: { ...nextQuery, pagination: { pageIndex: 1, pageSize: 10 } },
        },
        now: () => now,
      },
    ),
  ).toThrow(ContractError);
  expect(previous.isDisposed()).toBe(false);
  const next = replaceTableDefinition(
    previous,
    { schema: nextSchema },
    { initial: { query: nextQuery }, now: () => now },
  );
  expect(previous.isDisposed()).toBe(true);
  expect(next.getSnapshot().query.schemaVersion).toBe(8);
  expect(next.getSnapshot().query.pagination).toEqual({
    pageIndex: 0,
    pageSize: 10,
  });
  next.dispose();
});
