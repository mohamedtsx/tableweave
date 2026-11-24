import { createQuery } from "../../../packages/react/src/contracts/query.js";
import { defineQuerySchema } from "../../../packages/react/src/contracts/schema.js";
import type {
  CriteriaFrameOwner,
  CriteriaSourceAuthority,
} from "../../../packages/react/src/presentation/criteria-frame.js";
import { defineTable } from "../../../packages/react/src/table/definition.js";
import type {
  DataTableModel,
  DataTableOptions,
  DataTableToolTarget,
} from "../../../packages/react/src/table/types.js";
import { useDataTable } from "../../../packages/react/src/table/use-data-table.js";
import { fixture, type Schema } from "./fixtures.js";

const f = fixture();
const foreign = defineQuerySchema({
  id: "foreign",
  version: 1,
  fields: { other: { type: "boolean", owner: "builder" } },
});
const foreignD = defineTable<{ id: string; other: boolean }>()({
  schema: foreign,
  getRowId: (r) => r.id,
  columns: [{ id: "other", accessorKey: "other" }],
});
export function negatives(
  model: ReturnType<typeof useDataTable<Schema, import("./fixtures.js").Item>>,
  source: CriteriaSourceAuthority<Schema>,
  owner: CriteriaFrameOwner<Schema>,
) {
  // @ts-expect-error P2-N1 options cannot widen D record type
  useDataTable(f.D, {
    ...f.options(),
    source: {
      mode: "client",
      context: f.context,
      records: [
        { id: "bad", amount: "wrong", title: "bad", day: "", eligible: true },
      ],
    },
  });
  // @ts-expect-error P2-N2 options do not duplicate a native input or derivation flag
  useDataTable(f.D, {
    ...f.options(),
    nativeInput: { mode: "client", records: [] },
  });
  // @ts-expect-error P2-N3 foreign schema controller cannot retag definition
  useDataTable(f.D, {
    ...f.options(),
    controller: foreignD.createController({
      initial: {
        query: createQuery(foreign, { locale: "en-US", timeZone: "UTC" }),
      },
    }),
  });
  // @ts-expect-error P2-N4 model is readonly
  model.phase = "display";
  // @ts-expect-error P2-N5 source capability is not a headless tool target
  const target: DataTableToolTarget<Schema> = { owner, authority: source };
  // @ts-expect-error P2-N6 model brand is not a structural public constructor
  const fabricated: DataTableModel<Schema, import("./fixtures.js").Item> = {};
  // @ts-expect-error P2-N7 row inference remains actual Item
  const row: { secret: boolean } | undefined = model.view?.rows[0]?.original;
  const options: DataTableOptions<Schema, import("./fixtures.js").Item> =
    f.options();
  // @ts-expect-error P2-N8 options are readonly
  options.controller = f.app.C;
  // @ts-expect-error P2-N9 custom operator operand remains numeric
  createQuery(f.schema, {
    locale: "en-US",
    timeZone: "UTC",
    builder: {
      join: "and",
      rules: [
        {
          id: "bad",
          field: "amount",
          operator: "custom.facade",
          value: "not-a-number",
        },
      ],
    },
  });
  return [target, fabricated, row];
}
