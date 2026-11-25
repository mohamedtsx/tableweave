import { expect, test } from "vitest";
import { renderToString } from "react-dom/server";
import { RowMoveControls } from "../../../packages/heroui/src/table/reordering-controls.js";
import {
  captureRendererRowNotification,
  revokeRendererRowPreparation,
  requireRendererRowPreparation,
  submitRendererRowMove,
} from "../../../packages/heroui/src/table/renderer-commit.js";
import {
  releaseNativeRowAction,
  requireNativeRowAction,
} from "../../../packages/heroui/src/table/native-resource-lifetime.js";
import type { ComponentProps } from "react";
import { ControlledCollection } from "../../../packages/heroui/src/table/controlled-collection.js";
import { useDataTable } from "@tableweave/react";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import { createFixture } from "./fixtures.js";
test("unknown row presentation denies before private ID/label/messages/ref getters", () => {
  let reads = 0;
  const poison = () => {
    reads++;
    throw Error("Private widget port");
  };
  const props = {
    collection: {},
    get id() {
      return poison();
    },
    get label() {
      return poison();
    },
    get messages() {
      return poison();
    },
    get handle() {
      return poison();
    },
  };
  expect(() =>
    RowMoveControls(props as unknown as ComponentProps<typeof RowMoveControls>),
  ).toThrow();
  expect(reads).toBe(0);
});
test("unknown prepared/native keys are pure release no-ops, never reflective authority", () => {
  let reads = 0;
  const alleged = new Proxy(
    {},
    {
      get() {
        reads++;
        throw 0;
      },
      ownKeys() {
        reads++;
        throw 0;
      },
      getPrototypeOf() {
        reads++;
        throw 0;
      },
    },
  );
  const revoked = Proxy.revocable({}, {});
  revoked.revoke();
  for (const input of [
    undefined,
    null,
    0,
    "token",
    Symbol("token"),
    alleged,
    revoked.proxy,
  ]) {
    expect(revokeRendererRowPreparation(input)).toBeUndefined();
    expect(releaseNativeRowAction(input)).toBeUndefined();
    expect(() =>
      requireRendererRowPreparation(input, alleged, alleged),
    ).toThrow();
    expect(() => requireNativeRowAction(input)).toThrow();
  }
  expect(reads).toBe(0);
});
test("unknown notification port denies before target/admission/placement private props", () => {
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
  expect(() =>
    Reflect.apply(submitRendererRowMove, undefined, [
      poison,
      {},
      poison,
      poison,
      poison,
      poison,
      poison,
      poison,
      poison,
    ]),
  ).toThrow();
  expect(reads).toBe(0);
});
test("notification capture requires the actual active R capture stack, not an application factory", () => {
  let reads = 0;
  const receiver = new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        reads++;
        throw 0;
      },
    },
  );
  expect(() =>
    captureRendererRowNotification({}, () => {}, receiver),
  ).toThrow();
  expect(reads).toBe(0);
});
test("raw omission still server-renders real native content without row controls", () => {
  const html = renderToString(
    <ControlledCollection
      label="Raw SSR"
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
          id: "row",
          textValue: "Row",
          cells: {
            title: {
              textValue: "Title",
              content: (
                <input aria-label="SSR retained draft" defaultValue="Draft" />
              ),
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
  expect(html).toContain("SSR retained draft");
  expect(html).not.toContain("Move row");
});
test("genuine SSR useDataTable remains uncommitted without row/native grants or notification", () => {
  const f = createFixture();
  function Source() {
    const model = useDataTable(f.D, f.options());
    return <DataTable table={model} {...f.config} collection={f.collection} />;
  }
  try {
    const html = renderToString(<Source />);
    expect(html).not.toContain("Move row");
    expect(f.counts.notifications).toBe(0);
    expect(f.helper?.admission.getSnapshot().phase).toBe("unready");
  } finally {
    f.dispose();
  }
});
