import { useDataTable } from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import {
  arabicDetailsRegionLabel,
  DetailsProvider,
  englishDetailsRegionLabel,
  RecordDetails,
  type RecordDetailsProps,
  useDetailsAccessory,
} from "../../packages/heroui/src/data-table/details-provider.js";
import type { DetailsAccessory } from "../../packages/heroui/src/details/types.js";
import {
  fixture,
  type Item,
  type Schema,
} from "../data-table/details-accessory/fixtures.js";

function genuine() {
  const f = fixture();
  const capture: { accessory?: DetailsAccessory<Schema, Item> } = {};
  let privateReads = 0;
  const candidate = new Proxy(f.options(), {
    getOwnPropertyDescriptor() {
      privateReads++;
      throw new Error("Private options must remain unopened before layout");
    },
  });
  function Screen() {
    const model = useDataTable(f.D, f.modelOptions());
    capture.accessory = useDetailsAccessory(model, candidate);
    return null;
  }
  renderToString(<Screen />);
  const accessory = capture.accessory;
  if (!accessory) throw new Error("Actual hook-issued accessory required");
  return { f, accessory, privateReads: () => privateReads };
}
for (const [label, expected, direction] of [
  [undefined, englishDetailsRegionLabel, "ltr"],
  [arabicDetailsRegionLabel, arabicDetailsRegionLabel, "rtl"],
  ["General details region", "General details region", "ltr"],
  [undefined, englishDetailsRegionLabel, "rtl"],
] as const)
  test(`genuine neutral SSR ${expected}/${direction} does not enter private options/source/body`, () => {
    const { f, accessory, privateReads } = genuine();
    function Screen() {
      return (
        <DetailsProvider accessory={accessory} direction={direction}>
          <RecordDetails
            accessory={accessory}
            {...(label === undefined ? {} : { neutralLabel: label })}
          />
        </DetailsProvider>
      );
    }
    try {
      const html = renderToString(<Screen />);
      expect(html).toContain(`aria-label="${expected}"`);
      expect(html).not.toContain('role="dialog"');
      expect(html).not.toContain("Synthetic record details");
      expect(privateReads()).toBe(0);
      expect(Object.values(f.counters).every((value) => value === 0)).toBe(
        true,
      );
    } finally {
      f.dispose();
    }
  });
test("unknown/copied/proxy accessory denies before neutralLabel descriptor/getter traversal", () => {
  const { f, accessory } = genuine();
  let labelReads = 0,
    accessoryReads = 0;
  try {
    for (const bad of [
      {},
      { ...accessory },
      new Proxy(accessory, {
        get() {
          accessoryReads++;
          throw 0;
        },
      }),
    ]) {
      const input = new Proxy(
        { accessory: bad },
        {
          getOwnPropertyDescriptor(target, key) {
            if (key === "neutralLabel") {
              labelReads++;
              throw 0;
            }
            return Reflect.getOwnPropertyDescriptor(target, key);
          },
        },
      );
      // Library hook-entry denial only: registry fails before hooks, not a hand-call
      // of a private app/native component and never a permitting fake accessory.
      expect(() => RecordDetails(input as never)).toThrow();
    }
    expect(labelReads).toBe(0);
    expect(accessoryReads).toBe(0);
  } finally {
    f.dispose();
  }
});
test("supplied invalid own/inherited/accessor label has one fixed safe error, no coercion/getter/private work", () => {
  const { f, accessory } = genuine();
  let getters = 0,
    coercions = 0;
  const invalid: unknown[] = [
    undefined,
    null,
    0,
    false,
    Symbol("synthetic"),
    "",
    " \n\t ",
    {
      toString() {
        coercions++;
        return "Do not coerce";
      },
    },
  ];
  const inputs: object[] = invalid.map((neutralLabel) => ({
    accessory,
    neutralLabel,
  }));
  inputs.push(
    Object.assign(Object.create({ neutralLabel: "Inherited" }), { accessory }),
  );
  inputs.push(
    Object.defineProperty({ accessory }, "neutralLabel", {
      get() {
        getters++;
        return "Getter";
      },
    }),
  );
  inputs.push(
    new Proxy(
      { accessory },
      {
        getOwnPropertyDescriptor(target, key) {
          if (key === "neutralLabel")
            throw new Error("Raw private trap payload");
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    ),
  );
  try {
    for (const input of inputs)
      expect(() =>
        RecordDetails(input as RecordDetailsProps<Schema, Item>),
      ).toThrow(new TypeError("Invalid record details neutral metadata."));
    expect(getters).toBe(0);
    expect(coercions).toBe(0);
    expect(Object.values(f.counters).every((value) => value === 0)).toBe(true);
  } finally {
    f.dispose();
  }
});
test("nonblank neutral primitive is retained without trimming its presentation", () => {
  const { f, accessory } = genuine();
  try {
    expect(
      renderToString(
        <RecordDetails
          accessory={accessory}
          neutralLabel="  General region  "
        />,
      ),
    ).toContain('aria-label="  General region  "');
  } finally {
    f.dispose();
  }
});
