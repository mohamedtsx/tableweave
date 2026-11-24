import type {
  SelectionAction,
  SelectionToolbarProps,
} from "selection-producer";
import { defineQuerySchema } from "../../../packages/react/src/contracts/index.js";

const schema = defineQuerySchema({
  id: "selection-types",
  version: 1,
  fields: { amount: { type: "number", owner: "builder" } },
});
interface RecordRow {
  id: string;
  amount: number;
}
const action: SelectionAction<typeof schema, RecordRow> = {
  id: "review",
  label: "Review",
  onAction(context) {
    const amount: number | undefined = context.loadedSelected[0]?.record.amount;
    const ids: readonly string[] = context.selectedIds;
    void amount;
    void ids;
    // @ts-expect-error record inference must not become any
    const nonexistent: string = context.loadedSelected[0]?.record.nonexistent;
    void nonexistent;
    // @ts-expect-error a selected ID does not fabricate a loaded record
    const allRecords: readonly RecordRow[] = context.selectedIds;
    void allRecords;
  },
};
const wrongAction: SelectionAction<typeof schema, RecordRow> = {
  id: "bad",
  label: "Bad",
  // @ts-expect-error action receives a structured context, not a vendor row array
  onAction(_context: readonly RecordRow[]) {},
};
const propsCheck = (props: SelectionToolbarProps<typeof schema, RecordRow>) => {
  // @ts-expect-error no vendor polymorphic as prop
  props.as = "a";
  // @ts-expect-error no implicit Export/action or selection-store API
  props.onSelectionChange = () => {};
  // @ts-expect-error framework vendor button events must not leak
  props.onPress = () => {};
};
void action;
void wrongAction;
void propsCheck;
