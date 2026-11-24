import type {
  ControlsAuthority,
  ControlsInput,
  ControlsPresentation,
  StateProposal,
} from "@tableweave/react";
import {
  createControlsAuthority,
  createNativeController,
  defineNativeTable,
  getControlsAuthorityOwner,
  projectControls,
  useNativeTable,
} from "@tableweave/react";
import {
  canonicalJson,
  createQuery,
  defineQuerySchema,
} from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import { Component, StrictMode, useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { PaginationCorrectionContext } from "../../../packages/heroui/src/pagination/index.js";
import { usePaginationCorrection } from "../../../packages/heroui/src/pagination/index.js";

const mode = new URLSearchParams(location.search).get("mode") ?? "paired";
const schema = defineQuerySchema({
  id: "review-pager",
  version: 1,
  fields: { amount: { type: "number", owner: "builder", sort: true } },
});
interface RecordRow {
  id: string;
  amount: number;
}
const records = Array.from({ length: 12 }, (_, amount) => ({
  id: `synthetic-${amount}`,
  amount,
}));
const definition = defineNativeTable<typeof schema, RecordRow>({
  schema,
  selection: true,
  getRowId: (record) => record.id,
  columns: [{ id: "amount", accessorKey: "amount" }],
});
const otherDefinition = defineNativeTable<typeof schema, RecordRow>({
  schema,
  selection: true,
  getRowId: (record) => record.id,
  columns: [{ id: "amount", accessorKey: "amount" }],
});
const query = createQuery(schema, { locale: "en-US", timeZone: "UTC" });
const commits: { a: string[]; b: string[] } = { a: [], b: [] };
const proposals: {
  a: StateProposal<typeof schema>[];
  b: StateProposal<typeof schema>[];
} = { a: [], b: [] };
function controllerFor(key: "a" | "b") {
  return createNativeController(definition, {
    initial: {
      query: { ...query, pagination: { ...query.pagination, pageIndex: 4 } },
    },
    now: () => 0,
    onCommit: (transition) => {
      commits[key].push(transition.reason);
    },
    onRequest: (proposal) => {
      proposals[key].push(proposal);
    },
  });
}
const a = controllerFor("a"),
  b = controllerFor("b");
const context = {
  definitionKey: "review-definition",
  scopeKey: "synthetic-scope",
  access: true,
};
const denied = { ...context, access: false };
let committedA: ControlsInput<typeof schema, RecordRow>;
let committedB: ControlsInput<typeof schema, RecordRow>;
let proof: {
  sameQueryIdentity: boolean;
  sameEvaluatedAt: boolean;
  sameQueryObject: boolean;
  metadataEqual: boolean;
} | null = null;
let lastAuthority: ControlsAuthority<typeof schema, RecordRow>;
const audit = {
  reads: 0,
  receiverChecks: [] as boolean[],
  getterReads: 0,
  authorityReads: 0,
  constructorReads: 0,
  speciesReads: 0,
  rawError: null as string | null,
};
let tick = () => {};
function descriptors(input: object) {
  return Reflect.ownKeys(input).map(
    (key) => [key, Object.getOwnPropertyDescriptor(input, key)] as const,
  );
}
function sameDescriptors(
  input: object,
  before: ReturnType<typeof descriptors>,
) {
  const after = descriptors(input);
  return (
    before.length === after.length &&
    before.every(([key, expected], index) => {
      const [actualKey, actual] = after[index] ?? [];
      return (
        key === actualKey &&
        expected !== undefined &&
        actual !== undefined &&
        actual.value === expected.value &&
        actual.get === expected.get &&
        actual.set === expected.set &&
        actual.writable === expected.writable &&
        actual.enumerable === expected.enumerable &&
        actual.configurable === expected.configurable
      );
    })
  );
}
let readPoisonEvidence:
  | (() => {
      constructorLocked: boolean;
      returnedDescriptorsUnchanged: boolean;
      returnedPrototypeUnchanged: boolean;
      returnedFrozenStatusUnchanged: boolean;
      nativePrototypeDescriptorsUnchanged: boolean;
      nativeConstructorDescriptorsUnchanged: boolean;
    })
  | null = null;
const methodPort = {
  definition,
  context,
  epoch: 0,
  readCurrent() {
    audit.reads++;
    audit.receiverChecks.push(this === methodPort);
    return { context: this.context, epoch: this.epoch };
  },
};
function contextPort(): PaginationCorrectionContext<typeof schema, RecordRow> {
  let getterReads = 0;
  const port = {
    definition: mode === "definition-mismatch" ? otherDefinition : definition,
    context: mode === "denied" ? denied : context,
    epoch: 0,
    readCurrent: () => ({
      context: mode === "denied" ? denied : context,
      epoch: 0,
    }),
  };
  const getter = (value: unknown) => ({
    configurable: true,
    get() {
      audit.getterReads++;
      return value;
    },
  });
  if (mode === "receiver") return methodPort;
  if (mode === "context-accessor")
    Object.defineProperty(port, "context", {
      get() {
        audit.getterReads++;
        return ++getterReads === 1 ? denied : context;
      },
    });
  if (mode === "nested-context-accessor")
    port.context = Object.defineProperty(
      { ...context },
      "access",
      getter(true),
    );
  if (mode === "epoch-accessor")
    Object.defineProperty(port, "epoch", getter(0));
  if (mode === "definition-accessor")
    Object.defineProperty(port, "definition", getter(definition));
  if (mode === "callback-accessor")
    Object.defineProperty(port, "readCurrent", getter(port.readCurrent));
  if (mode === "throwing-port")
    port.readCurrent = () => {
      throw new Error("Synthetic private read detail");
    };
  if (mode === "malformed-port")
    return {
      ...port,
      readCurrent: () => null,
    } as unknown as PaginationCorrectionContext<typeof schema, RecordRow>;
  if (mode === "async-port")
    return {
      ...port,
      readCurrent: async () => {
        throw new Error("Synthetic rejected private port");
      },
    } as unknown as PaginationCorrectionContext<typeof schema, RecordRow>;
  if (mode === "poison-promise")
    return {
      ...port,
      readCurrent() {
        audit.reads++;
        const result = Promise.reject(
          new Error("SYNTHETIC PRIVATE REJECTED PROMISE"),
        );
        Object.defineProperty(result, "constructor", {
          get() {
            audit.constructorReads++;
            throw new Error("SYNTHETIC PRIVATE CONSTRUCTOR GETTER");
          },
        });
        // Test-only readback: no mutation after the synthetic app creates poison.
        const ownBefore = descriptors(result);
        const prototypeBefore = Object.getPrototypeOf(result);
        const frozenBefore = Object.isFrozen(result);
        const nativePrototypeBefore = descriptors(Promise.prototype);
        const nativeConstructorBefore = descriptors(Promise);
        readPoisonEvidence = () => ({
          constructorLocked:
            Object.getOwnPropertyDescriptor(result, "constructor")
              ?.configurable === false,
          returnedDescriptorsUnchanged: sameDescriptors(result, ownBefore),
          returnedPrototypeUnchanged:
            Object.getPrototypeOf(result) === prototypeBefore,
          returnedFrozenStatusUnchanged:
            Object.isFrozen(result) === frozenBefore,
          nativePrototypeDescriptorsUnchanged: sameDescriptors(
            Promise.prototype,
            nativePrototypeBefore,
          ),
          nativeConstructorDescriptorsUnchanged: sameDescriptors(
            Promise,
            nativeConstructorBefore,
          ),
        });
        return result;
      },
    } as unknown as PaginationCorrectionContext<typeof schema, RecordRow>;
  if (
    [
      "ordinary-rejection",
      "poison-fulfilled-constructor",
      "poison-fulfilled-species",
    ].includes(mode)
  )
    return {
      ...port,
      readCurrent() {
        audit.reads++;
        const result =
          mode === "ordinary-rejection"
            ? Promise.reject(new Error("SYNTHETIC ORDINARY ASYNC REJECTION"))
            : Promise.resolve(null);
        if (mode === "poison-fulfilled-constructor")
          Object.defineProperty(result, "constructor", {
            get() {
              audit.constructorReads++;
              throw new Error("SYNTHETIC CONSTRUCTOR GETTER");
            },
          });
        if (mode === "poison-fulfilled-species") {
          const poisonedConstructor = Object.defineProperty(
            {},
            Symbol.species,
            {
              get() {
                audit.speciesReads++;
                throw new Error("SYNTHETIC SPECIES GETTER");
              },
            },
          );
          Object.defineProperty(result, "constructor", {
            value: poisonedConstructor,
          });
        }
        return result;
      },
    } as unknown as PaginationCorrectionContext<typeof schema, RecordRow>;
  if (mode === "result-accessor")
    port.readCurrent = () =>
      Object.defineProperty({ context, epoch: 0 }, "context", getter(denied));
  if (mode === "result-nested-accessor")
    port.readCurrent = () => ({
      context: Object.defineProperty({ ...context }, "access", getter(true)),
      epoch: 0,
    });
  if (mode === "result-epoch-accessor")
    port.readCurrent = () =>
      Object.defineProperty({ context, epoch: 0 }, "epoch", getter(0));
  if (mode === "then-accessor")
    port.readCurrent = () =>
      Object.defineProperty(
        { context, epoch: 0 },
        // biome-ignore lint/suspicious/noThenProperty: Intentional hostile thenable regression; its getter must never run.
        "then",
        getter(() => {}),
      );
  if (mode === "proxy-origin-throw")
    return new Proxy(port, {
      getOwnPropertyDescriptor() {
        throw new Error("Synthetic descriptor failure");
      },
    });
  if (mode === "proxy-result-throw")
    port.readCurrent = () =>
      new Proxy(
        { context, epoch: 0 },
        {
          getOwnPropertyDescriptor() {
            throw new Error("Synthetic result failure");
          },
        },
      );
  if (mode === "proxy-nested-throw")
    port.context = new Proxy(context, {
      getOwnPropertyDescriptor() {
        throw new Error("Synthetic nested failure");
      },
    });
  if (mode === "proxy-get-trap")
    return new Proxy(port, {
      get() {
        audit.getterReads++;
        throw new Error("Do not invoke a property get trap");
      },
    });
  if (mode === "callback-rebind") {
    const original = () => {
      audit.reads++;
      port.readCurrent = () => {
        throw new Error("Rebound callback must not run");
      };
      return { context, epoch: 0 };
    };
    port.readCurrent = original;
  }
  if (mode === "final-denied")
    port.readCurrent = () => ({
      context: ++audit.reads >= 3 ? denied : context,
      epoch: 0,
    });
  return port;
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError(error: unknown) {
    audit.rawError =
      error instanceof Error ? error.message : "Synthetic unknown error";
    return { failed: true };
  }
  override render() {
    return this.state.failed ? (
      <p id="caught-error">Correction failed</p>
    ) : (
      this.props.children
    );
  }
}
function Correction({
  presentation,
  authority,
}: {
  presentation: ControlsPresentation<typeof schema, RecordRow>;
  authority: ControlsAuthority<typeof schema, RecordRow>;
}) {
  const port = contextPort();
  const displayed = presentation.displayed;
  if (mode === "metadata-accessor" && displayed)
    presentation = {
      ...presentation,
      displayed: {
        ...displayed,
        pageInfo: Object.defineProperty({ kind: "known", total: 12 }, "total", {
          get() {
            audit.getterReads++;
            return 12;
          },
        }),
      },
    };
  usePaginationCorrection(b, presentation, authority, port);
  return <p id="mounted">Correction mounted</p>;
}
function App() {
  const [, update] = useState(0);
  tick = () => update((value) => value + 1);
  const va = useNativeTable(definition, a, { mode: "client", records });
  const vb = useNativeTable(definition, b, { mode: "client", records });
  const ia: ControlsInput<typeof schema, RecordRow> = {
    native: va,
    expected: context,
    source: { mode: "client", records, context },
  };
  const ib: ControlsInput<typeof schema, RecordRow> = {
    native: vb,
    expected: context,
    source: { mode: "client", records, context },
  };
  useLayoutEffect(() => {
    committedA = ia;
    committedB = ib;
  });
  const pa = projectControls(definition, ia),
    pb = projectControls(definition, ib);
  const aa = createControlsAuthority({
    definition,
    controller: a,
    context,
    mode: "client",
    queryIdentity: va.state.queryIdentity,
    readCommitted: () => {
      audit.authorityReads++;
      return committedA;
    },
  });
  const ab = createControlsAuthority({
    definition,
    controller: b,
    context,
    mode: "client",
    queryIdentity: vb.state.queryIdentity,
    readCommitted: () => {
      audit.authorityReads++;
      return committedB;
    },
  });
  const authority =
    mode === "mismatched-owner"
      ? aa
      : mode === "unregistered-authority"
        ? { ...ab }
        : ab;
  useLayoutEffect(() => {
    lastAuthority = authority;
    proof ??= {
      sameQueryIdentity: va.state.queryIdentity === vb.state.queryIdentity,
      sameEvaluatedAt: va.state.evaluatedAt === vb.state.evaluatedAt,
      sameQueryObject: va.state.query === vb.state.query,
      metadataEqual:
        JSON.stringify(pa.displayed) === JSON.stringify(pb.displayed),
    };
  });
  return (
    <main>
      <h1>Correction owner regressions</h1>
      <Correction presentation={pb} authority={authority} />
      <p id="diagnostic">
        {JSON.stringify({
          a: va.state.query.pagination,
          b: vb.state.query.pagination,
        })}
      </p>
    </main>
  );
}
const api = {
  poisonFacts: () => readPoisonEvidence?.() ?? null,
  snapshot: () => ({
    a: a.getSnapshot().query.pagination,
    b: b.getSnapshot().query.pagination,
    commits,
    audit,
    proof,
    distinctDefinition: definition !== otherDefinition,
    sameDefinitionConfiguration:
      canonicalJson(definition.controllerDefinition) ===
      canonicalJson(otherDefinition.controllerDefinition),
    ownerA: getControlsAuthorityOwner(lastAuthority)?.controller === a,
    ownerB: getControlsAuthorityOwner(lastAuthority)?.controller === b,
  }),
  tick: () => tick(),
};
declare global {
  interface Window {
    correctionProbe: typeof api;
  }
}
window.correctionProbe = api;
const root = document.getElementById("root");
if (!root) throw new Error("Missing synthetic root");
const content = (
  <Boundary>
    <App />
  </Boundary>
);
createRoot(root).render(
  new URLSearchParams(location.search).has("noStrict") ? (
    content
  ) : (
    <StrictMode>{content}</StrictMode>
  ),
);
