import { Button } from "@heroui/react/button";
import {
  arabicDataTableLocale,
  englishDataTableLocale,
} from "@tableweave/heroui";
import { useSyncExternalStore } from "react";
import type { ExampleOwner } from "../shared/owner.js";
import type { Transaction } from "../shared/records.js";
import type { TransactionSchema } from "../shared/schemas.js";
export const recipeLocale = (rtl: boolean) =>
  rtl ? arabicDataTableLocale : englishDataTableLocale;
export function SyntheticRecoveryControls({
  owner,
}: {
  owner: ExampleOwner<TransactionSchema, Transaction>;
}) {
  const own = useSyncExternalStore(
    owner.subscribe,
    owner.getSnapshot,
    owner.getServerSnapshot,
  );
  const view = useSyncExternalStore(
    owner.remote.resource.subscribe,
    owner.remote.resource.getSnapshot,
    owner.remote.resource.getServerSnapshot,
  );
  return (
    <fieldset className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
      <legend>Synthetic response controls</legend>
      <Button
        variant="secondary"
        isDisabled={!own.access || view.busy}
        onPress={() => {
          owner.remote.begin();
        }}
      >
        Begin refresh
      </Button>
      <Button
        variant="secondary"
        isDisabled={!view.busy}
        onPress={() => {
          owner.remote.succeed();
        }}
      >
        Deliver known page
      </Button>
      <Button
        variant="tertiary"
        isDisabled={!view.busy}
        onPress={() => {
          owner.remote.succeed("unknown");
        }}
      >
        Deliver unknown page
      </Button>
      <Button
        variant="tertiary"
        isDisabled={!view.busy}
        onPress={() => {
          owner.remote.fail();
        }}
      >
        Fail request
      </Button>
    </fieldset>
  );
}
