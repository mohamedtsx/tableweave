import {
  FilterBuilder,
  NativeCollection,
  SelectionToolbar,
} from "@tableweave/heroui";
import {
  type ControlsInput,
  createControlsAuthority,
  getControlsAuthorityOwner,
  projectControls,
  useNativeTable,
} from "@tableweave/react";
import { StrictMode, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CompositionOwner,
  type CompositionRecord,
  compositionRecords,
  type compositionSchema,
} from "../../../apps/storybook/src/controls/FilterControlsComposition.js";
import "@heroui/styles/css";
import "@tableweave/heroui/styles.css";
import "./fixture.css";

type Schema = typeof compositionSchema;
type Frame = ControlsInput<Schema, CompositionRecord>;
export type ProbeId = "first" | "second";
export interface ProbeFlags {
  deny: boolean;
  rapid: boolean;
  unmount: boolean;
  revokeInRestore: boolean;
  externalInRestore: boolean;
}
interface Counters {
  restore: number;
  action: number;
  error: number;
}
export interface ProbeActor {
  readonly owner: CompositionOwner;
  select(flags?: Partial<ProbeFlags>): void;
  cancel(flags?: Partial<ProbeFlags>): void;
  inspect(): {
    readonly query: ReturnType<
      CompositionOwner["controller"]["getSnapshot"]
    >["query"];
    readonly selected: readonly string[];
    readonly counters: Readonly<Counters>;
    readonly blockedReason: ReturnType<
      typeof projectControls<Schema, CompositionRecord>
    >["blockedReason"];
    readonly requestedQueryPresent: boolean;
    readonly expectedAccess: boolean;
    readonly sourceAccess: boolean;
  };
}
declare global {
  interface Window {
    focusHandoff: Partial<Record<ProbeId, ProbeActor>>;
  }
}

const params = new URLSearchParams(location.search);
window.focusHandoff = {};

/** A real current-frame host port, never an authority/native implementation. */
function Instance({ id }: { readonly id: ProbeId }) {
  const [owner] = useState(() => {
    const value = new CompositionOwner({
      id,
      locale: "en-US",
      controlled: false,
      initialRule: true,
    });
    if (params.has("initial-selection"))
      value.external({
        type: "selection.change",
        update: { unavailable: true },
      });
    return value;
  });
  const view = useNativeTable(owner.definition, owner.controller, {
    mode: "client",
    records: compositionRecords,
  });
  const input: Frame = {
    native: view,
    expected: owner.context,
    source: {
      mode: "client",
      context: owner.context,
      records: compositionRecords,
    },
  };
  // Populate ONLY in parent layout: no abandoned render can publish live input.
  const live = useRef<Frame | null>(null);
  const counters = useRef<Counters>({ restore: 0, action: 0, error: 0 });
  const flags = useRef<ProbeFlags>({
    deny: false,
    rapid: false,
    unmount: false,
    revokeInRestore: false,
    externalInRestore: false,
  });
  const once = useRef(false);
  const [shown, setShown] = useState(true);
  const root = useRef<HTMLElement>(null);
  const external = useRef<HTMLButtonElement>(null);
  const [externalClicks, setExternalClicks] = useState(0);
  const authority = useMemo(
    () =>
      createControlsAuthority({
        definition: owner.definition,
        controller: owner.controller,
        context: owner.context,
        queryIdentity: view.state.queryIdentity,
        mode: "client",
        readCommitted: () => {
          if (!live.current) throw new Error("Host frame is not committed");
          return live.current;
        },
      }),
    [owner, view.state.queryIdentity],
  );
  const presentation = projectControls(owner.definition, input);
  const factoryOwner = getControlsAuthorityOwner(authority);

  function publishDenial() {
    const current = live.current;
    if (current?.source.mode !== "client")
      throw new Error("Expected this host's actual committed client frame");
    const denied = Object.freeze({ ...owner.context, access: false });
    // Keep the real current native view and complete records. These are genuine
    // app expected/source context inputs, not fabricated authority.read facts.
    live.current = {
      ...current,
      expected: denied,
      source: { ...current.source, context: denied },
    };
    owner.commit(live.current);
  }

  useLayoutEffect(() => {
    live.current = input;
    owner.commit(input);
    if (flags.current.deny) publishDenial();
    const actor: ProbeActor = {
      owner,
      select(next = {}) {
        Object.assign(flags.current, next);
        owner.external({
          type: "selection.change",
          update: { unavailable: true },
        });
      },
      cancel(next = {}) {
        Object.assign(flags.current, next);
        owner.external({ type: "selection.cancel" });
      },
      inspect() {
        const current = live.current;
        if (current?.source.mode !== "client")
          throw new Error("Missing real committed client frame");
        const state = owner.controller.getSnapshot();
        const facts = authority.read();
        return {
          query: state.query,
          selected: Object.keys(state.selection)
            .filter((key) => state.selection[key])
            .sort(),
          counters: { ...counters.current },
          blockedReason: facts.blockedReason,
          requestedQueryPresent: facts.requestedQuery !== null,
          expectedAccess: current.expected.access,
          sourceAccess: current.source.context.access,
        };
      },
    };
    window.focusHandoff[id] = actor;
    if (
      !once.current &&
      presentation.selectedIds.length > 0 &&
      (flags.current.rapid || flags.current.unmount)
    ) {
      once.current = true;
      if (flags.current.rapid) owner.external({ type: "selection.cancel" });
      else setShown(false);
    }
    return () => {
      if (window.focusHandoff[id] === actor) delete window.focusHandoff[id];
      live.current = null;
    };
  });

  return (
    <section
      id={id}
      ref={root}
      className="fc-composition"
      data-owner-match={String(
        factoryOwner?.definition === owner.definition &&
          factoryOwner.controller === owner.controller,
      )}
    >
      <h2>{id} real focus handoff</h2>
      <button
        ref={external}
        type="button"
        data-testid="survivor"
        onClick={() => setExternalClicks((count) => count + 1)}
      >
        External {id}
      </button>
      <output aria-label={`${id} external clicks`}>{externalClicks}</output>
      {shown ? (
        <SelectionToolbar
          presentation={presentation}
          authority={authority}
          normal={
            <div data-testid="normal">
              <FilterBuilder
                controller={owner.controller}
                evaluationMode="client"
                expectedResourceContext={owner.context}
                invalidationKey={0}
                fields={{ amount: { label: "Amount" } }}
                createRuleId={owner.createRuleId}
              />
            </div>
          }
          getRestoreFocusTarget={() => {
            counters.current.restore++;
            if (flags.current.revokeInRestore) publishDenial();
            // This intentional APPLICATION fallback side effect exercises the
            // producer's surviving-focus recheck; it is not a repair/override.
            if (flags.current.externalInRestore) external.current?.focus();
            return (
              root.current?.querySelector<HTMLButtonElement>(
                '[data-testid="normal"] button',
              ) ?? null
            );
          }}
          onError={() => {
            counters.current.error++;
          }}
          actions={[
            {
              id: "probe",
              label: "Probe action",
              onAction: () => {
                counters.current.action++;
              },
            },
          ]}
        />
      ) : null}
      <div className="focus-table-scroll">
        <NativeCollection
          view={view}
          label={`${id} records`}
          rowHeaderColumnId="description"
          selectionColumnId="selection"
          columnTextValue={(column) =>
            typeof column.columnDef.header === "string"
              ? column.columnDef.header
              : column.id
          }
          rowTextValue={(row) => row.original.description}
          cellTextValue={(cell) => String(cell.getValue() ?? "Empty")}
          controls={{ definition: owner.definition, presentation, authority }}
          diagnostics={false}
        />
      </div>
    </section>
  );
}

const tree = (
  <main>
    <h1>Real producer focus handoff regressions</h1>
    <Instance id="first" />
    {params.has("pair") ? <Instance id="second" /> : null}
  </main>
);
const container = document.getElementById("root");
if (!container) throw new Error("Missing fixture root");
createRoot(container).render(
  params.has("strict") ? <StrictMode>{tree}</StrictMode> : tree,
);
