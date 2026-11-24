"use client";

import { Button } from "@heroui/react/button";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  type ReactNode,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { getDetailsBinding } from "./details-binding.js";
import { useDetailsContext } from "./details-provider.js";

export interface BoundDetailsTriggerProps {
  readonly rowId: string;
  readonly label: string;
  readonly children?: ReactNode;
  readonly isDisabled?: boolean;
  readonly className?: string;
}
export function DetailsTrigger<S extends QuerySchema, T extends object>(
  props: BoundDetailsTriggerProps,
) {
  const accessory = useDetailsContext<S, T>(),
    binding = getDetailsBinding(accessory);
  const snapshot = useSyncExternalStore(
    binding.subscribe,
    binding.getSnapshot,
    binding.getSnapshot,
  );
  const [token] = useState(() => Object.freeze({})),
    [revision, setRevision] = useState(0);
  const actor = snapshot.actor;
  useLayoutEffect(() => {
    if (!actor) return;
    try {
      const ticket = binding.trigger(
        actor,
        token,
        props,
        snapshot.modelVersion,
      );
      setRevision((n) => n + 1);
      return () => binding.removeTrigger(actor, token, ticket);
    } catch {
      /* No private labels before the row's real commit. */
    }
  }, [binding, actor, snapshot.modelVersion, token, props]);
  void revision;
  const entry = actor ? binding.readTrigger(actor, token) : null;
  if (!actor || !entry) return null;
  return (
    <Button
      ref={(node) => binding.triggerNode(actor, token, entry.ticket, node)}
      type="button"
      variant="tertiary"
      aria-label={entry.label}
      isDisabled={entry.disabled}
      className={["tw-details__trigger", entry.className]
        .filter(Boolean)
        .join(" ")}
      onPress={() => binding.openTrigger(actor, token, entry.ticket)}
    >
      {entry.children ?? entry.label}
    </Button>
  );
}
