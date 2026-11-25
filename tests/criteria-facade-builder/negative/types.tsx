import type { QuerySchema } from "@tableweave/react/contracts";
import type { CriteriaFacadeSource } from "../../../packages/heroui/src/filters/criteria-facade-config.js";
import type { TableRendererCell } from "../../../packages/heroui/src/table/types.js";
import { BuilderBridge } from "../bridge.js";
import type { Item, S } from "../fixtures.js";

declare const cell: TableRendererCell<S, Item>;
declare const search: CriteriaFacadeSource<"search", S, Item>;
declare const foreignSchema: CriteriaFacadeSource<"builder", QuerySchema, Item>;
declare const foreignRecord: CriteriaFacadeSource<
  "builder",
  S,
  { unrelated: number }
>;
// Three independent producer-boundary errors; authored, not compiled now.
BuilderBridge({ cell, source: search });
BuilderBridge({ cell, source: foreignSchema });
BuilderBridge({ cell, source: foreignRecord });
