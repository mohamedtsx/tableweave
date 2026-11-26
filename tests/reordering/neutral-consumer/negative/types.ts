import type { QuerySchema } from "@tableweave/react/contracts";
import type {
  TableReorderingBinding,
  TableReorderingNavigation,
} from "../../../../packages/heroui/src/table/reordering-types.js";
declare const binding: TableReorderingBinding<QuerySchema, { id: string }>;
declare const wrongRow: TableReorderingBinding<QuerySchema, { amount: number }>;
const invalid: typeof binding = wrongRow;
const fabricated: TableReorderingNavigation<QuerySchema, { id: string }> = {};
void invalid;
void fabricated;
