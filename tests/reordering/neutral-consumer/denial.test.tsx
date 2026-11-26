import { expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import {
  ControlledCollection,
  type ControlledCollectionProps,
} from "../../../packages/heroui/src/table/controlled-collection.js";
import {
  NativeCollection,
  type NativeCollectionProps,
} from "../../../packages/heroui/src/table/native-collection.js";
import { Pagination } from "../../../packages/heroui/src/pagination/Pagination.js";
import type { PaginationProps } from "../../../packages/heroui/src/pagination/types.js";
import { fixture, type Item } from "./fixtures.js";
import { usePaginationCorrection } from "../../../packages/heroui/src/pagination/usePaginationCorrection.js";
import type {
  ControlsAuthority,
  ControlsPresentation,
} from "@tableweave/react";
import type { PaginationCorrectionContext } from "../../../packages/heroui/src/pagination/types.js";
import type { TableReorderingNavigation } from "../../../packages/heroui/src/table/reordering-types.js";
import { ColumnMoveControls } from "../../../packages/heroui/src/table/reordering-controls.js";
import type { ComponentProps } from "react";

test("column widget rejects an unissued presentation before any private widget/ref props", () => {
  let reads = 0;
  const input = {
    collection: {},
    get id() {
      reads++;
      throw Error("Private column ID");
    },
    get label() {
      reads++;
      throw Error("Private label");
    },
    get messages() {
      reads++;
      throw Error("Private messages");
    },
    get handle() {
      reads++;
      throw Error("Application ref callback is not a port");
    },
  };
  expect(() =>
    ColumnMoveControls(
      input as unknown as ComponentProps<typeof ColumnMoveControls>,
    ),
  ).toThrow();
  expect(reads).toBe(0);
});

test("disabled correction hook reads only the genuine controller definition", () => {
  const f = fixture(false, true);
  let reads = 0;
  const poison = new Proxy(
    {},
    {
      get() {
        reads++;
        throw Error("Disabled private port");
      },
      getOwnPropertyDescriptor() {
        reads++;
        throw Error("Disabled private descriptor");
      },
    },
  );
  function Disabled() {
    usePaginationCorrection(
      f.C,
      poison as ControlsPresentation<typeof f.schema, Item>,
      poison as ControlsAuthority<typeof f.schema, Item>,
      poison as PaginationCorrectionContext<typeof f.schema, Item>,
      poison as TableReorderingNavigation<typeof f.schema, Item>,
    );
    return null;
  }
  expect(renderToString(<Disabled />)).toBe("");
  expect(reads).toBe(0);
  f.P.dispose();
  f.C.dispose();
});

test("unknown supplied collection bindings deny before private fields, including inherited/accessor/own undefined", () => {
  for (const value of [
    undefined,
    {},
    new Proxy({}, {}),
    Object.freeze({ ...{} }),
  ]) {
    let reads = 0;
    const props = {
      reordering: value,
      get columns() {
        reads++;
        throw Error("Private columns");
      },
      get rows() {
        reads++;
        throw Error("Private rows");
      },
      get messages() {
        reads++;
        throw Error("Private messages");
      },
    };
    expect(
      ControlledCollection(props as unknown as ControlledCollectionProps),
    ).toBeNull();
    expect(reads).toBe(0);
  }
  const inherited = Object.create({
    reordering: {},
  }) as ControlledCollectionProps;
  const accessor = Object.defineProperty({}, "reordering", {
    get() {
      throw Error("Never invoke a binding getter");
    },
  }) as ControlledCollectionProps;
  expect(ControlledCollection(inherited)).toBeNull();
  expect(ControlledCollection(accessor)).toBeNull();
});
test("NativeCollection supplied invalid binding denies before alleged native/view/text ports", () => {
  let reads = 0;
  const props = {
    reordering: {},
    get renderer() {
      reads++;
      throw Error("Private renderer");
    },
    get view() {
      reads++;
      throw Error("Private native view");
    },
    get rowTextValue() {
      reads++;
      throw Error("Private text");
    },
  };
  expect(
    NativeCollection(
      props as unknown as NativeCollectionProps<
        ReturnType<typeof fixture>["schema"],
        Item
      >,
    ),
  ).toBeNull();
  expect(reads).toBe(0);
});
test("schema false reads no presentation/interlock/locale/formatter props", () => {
  const f = fixture(false, true);
  let reads = 0;
  const props = {
    schema: f.schema,
    get presentation() {
      reads++;
      throw Error("Private presentation");
    },
    get reorderInterlock() {
      reads++;
      throw Error("Private interlock");
    },
    get locale() {
      reads++;
      throw Error("Private locale");
    },
    get formatNumber() {
      reads++;
      throw Error("Private formatter");
    },
  };
  expect(
    Pagination(props as unknown as PaginationProps<typeof f.schema, Item>),
  ).toBeNull();
  expect(reads).toBe(0);
  f.P.dispose();
  f.C.dispose();
});
test("enabled foreign interlock denies before locale or formatter", () => {
  const f = fixture();
  let reads = 0;
  const props = {
    schema: f.schema,
    reorderInterlock: {},
    get authority() {
      reads++;
      throw Error("Not reached for unknown issuance");
    },
    get locale() {
      reads++;
      throw Error("Private locale");
    },
    get formatNumber() {
      reads++;
      throw Error("Private formatter");
    },
  };
  expect(
    Pagination(props as unknown as PaginationProps<typeof f.schema, Item>),
  ).toBeNull();
  expect(reads).toBe(0);
  f.P.dispose();
  f.C.dispose();
});
test("omitted raw controlled collection preserves ordinary static anatomy and content", () => {
  const html = renderToString(
    <ControlledCollection
      label="Raw synthetic"
      selectionMode="none"
      columns={[
        {
          kind: "leaf",
          id: "title",
          label: "Title",
          textValue: "Title",
          isRowHeader: true,
        },
      ]}
      rows={[
        {
          id: "one",
          textValue: "One",
          cells: {
            title: {
              content: (
                <input aria-label="Raw draft" defaultValue="Synthetic" />
              ),
              textValue: "Synthetic",
            },
          },
        },
      ]}
      selectedIds={new Set()}
      eligiblePageIds={[]}
      sorting={[]}
      onSelectedIdsChange={() => {}}
      onSort={() => {}}
    />,
  );
  expect(html).toContain("Raw synthetic");
  expect(html).toContain("Raw draft");
});
