import type {
  NativeCollectionProps,
  SelectionToolbarProps,
} from "@tableweave/heroui";
import type { ControlsInput } from "@tableweave/react";
import type {
  CompositionRecord,
  compositionSchema,
} from "../../../apps/storybook/src/controls/FilterControlsComposition.js";
import type { ProbeActor, ProbeFlags } from "./probe-fixture.js";

type Schema = typeof compositionSchema;
export const denied: Partial<ProbeFlags> = { deny: true };
// @ts-expect-error actor scenarios cannot invent an untyped private bypass flag
export const invalidFlag: Partial<ProbeFlags> = { skipAuthority: true };
export function contracts(
  input: ControlsInput<Schema, CompositionRecord>,
  toolbar: SelectionToolbarProps<Schema, CompositionRecord>,
  collection: NativeCollectionProps<Schema, CompositionRecord>,
  actor: ProbeActor,
) {
  const client: typeof input.source = {
    mode: "client",
    context: input.expected,
    records: [],
  };
  const fallback: typeof toolbar.getRestoreFocusTarget = () => null;
  // @ts-expect-error restoration is a synchronous actual DOM-target callback
  const asyncFallback: typeof toolbar.getRestoreFocusTarget = async () => null;
  const snapshot = actor.inspect();
  const expected: boolean = snapshot.expectedAccess;
  if (collection.controls) {
    // @ts-expect-error guarded native collection requires the actual definition
    const missing: NonNullable<typeof collection.controls> = {
      presentation: collection.controls.presentation,
      authority: collection.controls.authority,
    };
    void missing;
  }
  void client;
  void fallback;
  void asyncFallback;
  void expected;
}
