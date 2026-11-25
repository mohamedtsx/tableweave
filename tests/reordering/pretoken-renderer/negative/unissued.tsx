import { RowMoveControls } from "../../../../packages/heroui/src/table/reordering-controls.js";
import { nativeHandleRef } from "../../../../packages/heroui/src/table/native-resource-lifetime.js";
import type { RendererRowNotification } from "../../../../packages/heroui/src/table/reordering-types.js";
import type { QuerySchema } from "@tableweave/react/contracts";
// Deliberate negative TS failures. Never included in positive/light commands.
nativeHandleRef({});
const notification: RendererRowNotification<QuerySchema, object> = () => {};
notification();
const props: Parameters<typeof RowMoveControls>[0] = {
  collection: {},
  id: "row",
  label: "Row",
  messages: {},
  isOpen: false,
  onOpenChange: () => {},
  handle: () => {},
};
export const invalid = <RowMoveControls {...props} />;
