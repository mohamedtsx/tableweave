import type {
  FieldDefinition,
  JsonValue,
} from "../../packages/react/src/contracts/index.js";

export const vectorVersion = 1;
export interface Vector {
  readonly name: string;
  readonly field: FieldDefinition;
  readonly operator: string;
  readonly operand?: JsonValue;
  readonly values: readonly unknown[];
  readonly matches: readonly number[];
}
const text = { type: "text", owner: "builder" } as const;
const number = { type: "number", owner: "builder" } as const;
const scalar = { type: "enum", owner: "builder" } as const;
const set = { type: "set", owner: "builder" } as const;
const bool = { type: "boolean", owner: "builder", nullable: true } as const;
const day = { type: "date", owner: "builder" } as const;
const textValues = [
  null,
  undefined,
  "",
  " ",
  "Alpha",
  "alphabet",
  "beta",
  "ALPHA",
];
const numbers = [
  null,
  undefined,
  0,
  1,
  2,
  3,
  "1",
  Number.NaN,
  Number.POSITIVE_INFINITY,
];
const ids = [null, undefined, "", "a", "b", "c", 0];
const sets = [null, undefined, [], ["a"], ["b"], ["a", "b"], ["c"], "a"];
const days = [
  null,
  undefined,
  "",
  "2026-01-09",
  "2026-01-10",
  "2026-01-11",
  "2026-01-12",
  "bad",
];
const point = { kind: "day", value: "2026-01-10" } as const;
export const vectors: readonly Vector[] = [
  ...(
    [
      ["text.contains", "alpha", [4, 5, 7]],
      ["text.notContains", "alpha", [3, 6]],
      ["text.is", "alpha", [4, 7]],
      ["text.isNot", "alpha", [3, 5, 6]],
      ["text.startsWith", "al", [4, 5, 7]],
      ["text.notStartsWith", "al", [3, 6]],
      ["text.endsWith", "ha", [4, 7]],
      ["text.notEndsWith", "ha", [3, 5, 6]],
    ] as const
  ).map(([operator, operand, matches]) => ({
    name: operator,
    field: text,
    operator,
    operand,
    values: textValues,
    matches,
  })),
  ...(
    [
      ["number.eq", 1, [3]],
      ["number.ne", 1, [2, 4, 5]],
      ["number.gt", 1, [4, 5]],
      ["number.gte", 1, [3, 4, 5]],
      ["number.lt", 1, [2]],
      ["number.lte", 1, [2, 3]],
      ["number.between", [1, 2], [3, 4]],
      ["number.notBetween", [1, 2], [2, 5]],
    ] as const
  ).map(([operator, operand, matches]) => ({
    name: operator,
    field: number,
    operator,
    operand,
    values: numbers,
    matches,
  })),
  ...(
    [
      ["enum.is", "a", [3]],
      ["enum.isNot", "a", [4, 5]],
      ["enum.anyOf", ["a", "b"], [3, 4]],
      ["enum.noneOf", ["a", "b"], [5]],
    ] as const
  ).map(([operator, operand, matches]) => ({
    name: operator,
    field: scalar,
    operator,
    operand,
    values: ids,
    matches,
  })),
  ...(
    [
      ["set.anyOf", ["a", "b"], [3, 4, 5]],
      ["set.noneOf", ["a", "b"], [6]],
      ["set.allOf", ["a", "b"], [5]],
      ["set.notAllOf", ["a", "b"], [3, 4, 6]],
    ] as const
  ).map(([operator, operand, matches]) => ({
    name: operator,
    field: set,
    operator,
    operand,
    values: sets,
    matches,
  })),
  {
    name: "boolean.isTrue",
    field: bool,
    operator: "boolean.isTrue",
    values: [null, undefined, false, true, 0, "true"],
    matches: [3],
  },
  {
    name: "boolean.isFalse",
    field: bool,
    operator: "boolean.isFalse",
    values: [null, undefined, false, true, 0, "false"],
    matches: [2],
  },
  ...(
    [
      ["date.on", point, [4]],
      ["date.notOn", point, [3, 5, 6]],
      ["date.before", point, [3]],
      ["date.onOrBefore", point, [3, 4]],
      ["date.after", point, [5, 6]],
      ["date.onOrAfter", point, [4, 5, 6]],
      ["date.between", [point, { kind: "day", value: "2026-01-11" }], [4, 5]],
      [
        "date.notBetween",
        [point, { kind: "day", value: "2026-01-11" }],
        [3, 6],
      ],
    ] as const
  ).map(([operator, operand, matches]) => ({
    name: operator,
    field: day,
    operator,
    operand,
    values: days,
    matches,
  })),
  ...(
    [
      [text, textValues, [0, 1, 2], [3, 4, 5, 6, 7]],
      [number, numbers, [0, 1], [2, 3, 4, 5]],
      [scalar, ids, [0, 1, 2], [3, 4, 5]],
      [set, sets, [0, 1, 2], [3, 4, 5, 6]],
      [bool, [null, undefined, false, true, 0], [0, 1], [2, 3]],
      [day, days, [0, 1, 2], [3, 4, 5, 6]],
      [
        { type: "datetime", owner: "builder" },
        [null, undefined, "", "2026-01-01T12:00:00Z", "bad"],
        [0, 1, 2],
        [3],
      ],
    ] as const
  ).flatMap(([field, values, missing, present]) => [
    {
      name: `${field.type}.empty`,
      field,
      operator: "empty",
      values,
      matches: missing,
    },
    {
      name: `${field.type}.notEmpty`,
      field,
      operator: "notEmpty",
      values,
      matches: present,
    },
  ]),
];
