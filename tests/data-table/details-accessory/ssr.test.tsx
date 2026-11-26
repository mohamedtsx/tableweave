import { useDataTable } from "@tableweave/react";
import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import {
  DetailsProvider,
  RecordDetails,
  useDetailsAccessory,
} from "../../../packages/heroui/src/data-table/details-provider.js";
import { DetailsTrigger } from "../../../packages/heroui/src/data-table/details-trigger.js";
import { DetailsShell } from "../../../packages/heroui/src/details/details-shell.js";
import {
  getAdoptedDetailsSessionOwner,
  getDetailsSessionOwner,
} from "../../../packages/heroui/src/details/session-identity.js";
import type { DetailsSession } from "../../../packages/heroui/src/details/types.js";
import { useDetailsSession } from "../../../packages/heroui/src/details/use-details-session.js";
import { fixture, type Item, type Schema } from "./fixtures.js";

it("real initial P2 model + bound SSR performs no private capture/read/row projection", () => {
  const f = fixture();
  let descriptors = 0;
  const candidate = new Proxy(f.options(), {
    getOwnPropertyDescriptor() {
      descriptors++;
      throw new Error("SSR candidate reflection");
    },
  });
  function Screen() {
    const model = useDataTable(f.D, f.modelOptions()),
      accessory = useDetailsAccessory(model, candidate);
    return (
      <DetailsProvider accessory={accessory}>
        <DetailsTrigger rowId="one" label="Private row trigger" />
        <RecordDetails accessory={accessory} />
      </DetailsProvider>
    );
  }
  try {
    const html = renderToString(<Screen />);
    expect(html).not.toContain("Private row trigger");
    expect(html).not.toContain("Synthetic record details");
    expect(html).not.toContain('role="dialog"');
    expect(descriptors).toBe(0);
    expect(f.counters.read).toBe(0);
    expect(f.counters.body).toBe(0);
  } finally {
    f.dispose();
  }
});
it("raw SSR retains its actual read behavior and legacy issuance, without adopted blessing", () => {
  const f = fixture(),
    views: DetailsSession<Schema, Item>[] = [];
  function Raw() {
    const session = useDetailsSession({
      ...f.options(),
      controller: f.app.C,
      visibleFieldIds: ["title"],
      hiddenFieldIds: [],
    });
    views.push(session);
    return (
      <DetailsShell
        session={session}
        title="Raw details"
        renderBody={() => null}
      />
    );
  }
  try {
    expect(renderToString(<Raw />)).toBe("");
    expect(f.counters.read).toBe(1);
    const view = views[0];
    if (!view) throw new Error("Actual raw producer view required");
    expect(getDetailsSessionOwner(view)?.controller).toBe(f.app.C);
    expect(getDetailsSessionOwner(view)?.mode).toBe("legacy");
    expect(getAdoptedDetailsSessionOwner(view)).toBeNull();
  } finally {
    f.dispose();
  }
});
