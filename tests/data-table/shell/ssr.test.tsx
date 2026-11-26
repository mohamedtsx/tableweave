import { useDataTable } from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { DataTable } from "../../../packages/heroui/src/data-table/data-table.js";
import { useDetailsAccessory } from "../../../packages/heroui/src/data-table/details-provider.js";
import { arabicDataTableNeutralMessages } from "../../../packages/heroui/src/localization/data-table.js";
import { fixture } from "./fixtures.js";

it("actual P2/C/P/DetailsPort stays neutral with zero private calls before layout", () => {
  const f = fixture();
  let privateReads = 0;
  function App() {
    const table = useDataTable(f.D, f.options()),
      accessory = useDetailsAccessory(table, f.details());
    return (
      <DataTable
        table={table}
        accessory={accessory}
        collection={
          new Proxy(f.collection, {
            getOwnPropertyDescriptor() {
              privateReads++;
              throw 0;
            },
          })
        }
        neutralMessages={arabicDataTableNeutralMessages}
      />
    );
  }
  try {
    const html = renderToString(<App />);
    expect(html).toContain(arabicDataTableNeutralMessages.uncommitted);
    expect(privateReads).toBe(0);
    expect(f.counters.read).toBe(0);
    expect(f.counters.body).toBe(0);
    expect(f.counters.rows).toBe(0);
  } finally {
    f.dispose();
  }
});
it("unknown/copy/proxy model denies before private props or alleged model getters", () => {
  let reads = 0;
  const unknown = new Proxy(
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
  const denied = Reflect.apply(DataTable, undefined, [
    {
      table: unknown,
      get collection() {
        reads++;
        throw 0;
      },
      get neutralMessages() {
        reads++;
        throw 0;
      },
    },
  ]);
  expect(renderToString(denied)).toContain("The table is unavailable.");
  expect(reads).toBe(0);
});
