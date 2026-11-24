import { useDataTable } from "@tableweave/react";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { getDetailsBinding } from "../../packages/heroui/src/data-table/details-binding.js";
import {
  arabicDetailsRegionLabel,
  DetailsProvider,
  englishDetailsRegionLabel,
  RecordDetails,
  useDetailsAccessory,
} from "../../packages/heroui/src/data-table/details-provider.js";
import type { DetailsAccessory } from "../../packages/heroui/src/details/types.js";
import {
  fixture,
  type Item,
  type Schema,
} from "../data-table/details-accessory/fixtures.js";

const f = fixture(),
  modelOptions = f.modelOptions();
let accessory: DetailsAccessory<Schema, Item> | null = null,
  updateLabel: ((value: string) => void) | null = null;
f.setBody((context) => {
  f.counters.body++;
  return (
    <input
      aria-label="Local details draft"
      defaultValue={context.record?.title ?? ""}
    />
  );
});
function LabelOnly({
  details,
}: {
  readonly details: DetailsAccessory<Schema, Item>;
}) {
  const [label, setLabel] = useState(englishDetailsRegionLabel);
  // Test harness stores a setter only. It is not an event permission/config ref.
  updateLabel = setLabel;
  return <RecordDetails accessory={details} neutralLabel={label} />;
}
function Screen() {
  const model = useDataTable(f.D, modelOptions),
    details = useDetailsAccessory(model, f.options());
  accessory = details;
  return (
    <DetailsProvider accessory={details}>
      <LabelOnly details={details} />
    </DetailsProvider>
  );
}
const host = document.createElement("div");
document.body.append(host);
createRoot(host).render(
  <StrictMode>
    <Screen />
  </StrictMode>,
);
function actual() {
  if (!accessory) throw new Error("Actual accessory required");
  const binding = getDetailsBinding(accessory),
    actor = binding.cell.getSnapshot().actor;
  if (!actor) throw new Error("Actual actor required");
  return {
    accessory,
    binding,
    actor,
    committed: binding.cell.require(actor),
    session: binding.readSession(actor),
  };
}
let previous: ReturnType<typeof actual> | null = null;
const api = {
  ready() {
    try {
      return !!actual().committed.ports;
    } catch {
      return false;
    }
  },
  async open() {
    const { binding, actor } = actual();
    await binding.request(actor, "one", "programmatic");
  },
  capture() {
    previous = actual();
  },
  arabic() {
    updateLabel?.(arabicDetailsRegionLabel);
  },
  custom() {
    updateLabel?.("General details region");
  },
  identity() {
    if (!previous) throw 0;
    const now = actual();
    return {
      accessory: now.accessory === previous.accessory,
      binding: now.binding === previous.binding,
      actor: now.actor === previous.actor,
      model: now.committed.model === previous.committed.model,
      ports: now.committed.ports === previous.committed.ports,
      source: now.committed.ports?.source === previous.committed.ports?.source,
      contentKey: now.session.contentKey === previous.session.contentKey,
    };
  },
};
declare global {
  interface Window {
    detailsNeutralLabel: typeof api;
  }
}
window.detailsNeutralLabel = api;
