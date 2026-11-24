import { useMemo, useState, useSyncExternalStore } from "react";
import type { QuerySchema } from "../contracts/types.js";
import type { CriteriaAuthority } from "../controller/criteria.js";
import type { CriteriaPublication } from "../controller/criteria-publication.js";
import { getCriteriaPublicationBinding } from "../controller/criteria-publication.js";
import type {
  ControllerDefinition,
  TableController,
  TableState,
} from "../controller/types.js";
import {
  type CriteriaFrames,
  createCriteriaFrames,
  requireCriteriaCommittedFrame,
  requireCriteriaSource,
  requireCriteriaTool,
  sameCriteriaSourceMetadata,
} from "../presentation/criteria-frame.js";
import {
  type CriteriaSourceFrameReactResult,
  useCriteriaSourceFrame,
} from "../presentation/criteria-frame-react.js";
import { assertTableController, assertTableDefinition } from "./definition.js";
import { projectDataTableRecovery } from "./recovery.js";
import type {
  DataTableModel,
  DataTableOptions,
  TableDefinition,
} from "./types.js";

export class DataTableModelError extends Error {
  readonly code = "table.model.unavailable";
  constructor() {
    super("Table model is unavailable.");
    this.name = "DataTableModelError";
  }
}
function deny(): never {
  throw new DataTableModelError();
}
function own(value: unknown, field: string): unknown {
  if (!value || typeof value !== "object") return deny();
  const descriptor = Object.getOwnPropertyDescriptor(value, field);
  return descriptor && Object.hasOwn(descriptor, "value")
    ? descriptor.value
    : deny();
}
interface Owner<S extends QuerySchema, T extends object> {
  readonly definition: TableDefinition<S, T>;
  readonly controller: TableController<S>;
  readonly controllerDefinition: ControllerDefinition<S>;
  readonly publication: CriteriaPublication<S>;
  readonly criteria: CriteriaAuthority<S>;
}
interface Session<S extends QuerySchema, T extends object> extends Owner<S, T> {
  readonly frames: CriteriaFrames<S, T>;
  readonly subscribe: (listener: () => void) => () => void;
  readonly read: () => TableState<S>;
}
interface Proof<S extends QuerySchema, T extends object> {
  readonly owner: Session<S, T> | null;
  readonly committed: CriteriaSourceFrameReactResult<S, T>;
}
const models = new WeakMap<object, unknown>();

/** D/C registries precede alleged source/P ports and C snapshot readers. */
function captureOwner<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  options: DataTableOptions<S, T>,
): Owner<S, T> | null {
  try {
    assertTableDefinition(definition);
    // Internal casts label only a ref about to be authenticated by exact registries;
    // they never coerce consumer record/schema/operand data into another type.
    const controller = own(options, "controller") as TableController<S>;
    const controllerDefinition = assertTableController(definition, controller);
    const criteria = own(options, "criteria") as CriteriaAuthority<S>;
    const binding = getCriteriaPublicationBinding(criteria);
    if (
      !binding ||
      binding.origin.controller !== controller ||
      binding.origin.definition !== controllerDefinition
    )
      return null;
    const publication = own(options, "publication");
    if (publication !== binding.publication) return null;
    return {
      definition,
      controller,
      controllerDefinition,
      publication: binding.publication,
      criteria,
    };
  } catch {
    return null;
  }
}
function initialize<S extends QuerySchema, T extends object>(
  owner: Owner<S, T> | null,
): Session<S, T> | null {
  if (!owner) return null;
  try {
    const frames = createCriteriaFrames({
      nativeDefinition: owner.definition.native,
      controller: owner.controller,
      publication: owner.publication,
      criteria: owner.criteria,
    });
    const read = owner.controller.getSnapshot,
      subscribe = owner.controller.subscribe;
    return Object.freeze({
      ...owner,
      frames,
      read: () => Reflect.apply(read, owner.controller, []),
      subscribe: (listener: () => void) =>
        Reflect.apply(subscribe, owner.controller, [listener]),
    });
  } catch {
    return null;
  }
}
const emptyRead = () => null;
const emptySubscribe = (_listener: () => void) => () => {};

function issue<S extends QuerySchema, T extends object>(
  owner: Session<S, T> | null,
  state: TableState<S> | null,
  committed: CriteriaSourceFrameReactResult<S, T>,
): DataTableModel<S, T> {
  const presentation = committed?.presentation ?? null;
  const phase =
    !owner || committed?.phase === "unavailable"
      ? "unavailable"
      : !committed
        ? "uncommitted"
        : presentation?.displayed
          ? "display"
          : "no-display";
  const pair = committed?.pair ?? null;
  const metadata = committed?.metadata ?? null;
  // Sole issuance cast: immutable genuine registered references plus an opaque
  // declaration brand; the separate WeakMap, not this cast/property, proves origin.
  const model = Object.freeze({
    definition: owner?.definition ?? null,
    controller: owner?.controller ?? null,
    state: phase === "unavailable" ? null : state,
    phase,
    frame: committed?.frame ?? null,
    view: committed?.frame?.view ?? null,
    presentation,
    authority: pair?.controls ?? null,
    toolTarget: pair
      ? Object.freeze({ owner: pair.owner, authority: pair.tool })
      : null,
    sourceTarget:
      owner && committed?.sourceAuthority
        ? Object.freeze({
            owner: owner.frames,
            authority: committed.sourceAuthority,
          })
        : null,
    metadata,
    recovery: projectDataTableRecovery({
      phase,
      metadata,
      presentation,
      clientInputCount: committed?.clientInputCount ?? null,
      currentQueryIdentity: state?.queryIdentity ?? null,
    }),
  }) as DataTableModel<S, T>;
  models.set(model, { owner, committed } satisfies Proof<S, T>);
  return model;
}

/** Provenance only. Unknown/copy/proxy models are rejected before payload access. */
export function assertDataTableModel<S extends QuerySchema, T extends object>(
  model: DataTableModel<S, T>,
): void {
  if (!model || typeof model !== "object" || !models.has(model)) deny();
}
/** Provenance only; null for a genuine unavailable model with no accepted owner. */
export function getDataTableModelOwner<S extends QuerySchema, T extends object>(
  model: DataTableModel<S, T>,
): Readonly<{
  definition: TableDefinition<S, T>;
  controller: TableController<S>;
}> | null {
  const proof =
    model && typeof model === "object"
      ? (models.get(model) as Proof<S, T> | undefined)
      : undefined;
  return proof?.owner
    ? Object.freeze({
        definition: proof.owner.definition,
        controller: proof.owner.controller,
      })
    : null;
}
/** Genuine neutral models carry no grant. Display/source reads recheck real caps;
 * cached visual booleans never authorize actions. Event actors still require caps. */
export function requireDataTableModel<S extends QuerySchema, T extends object>(
  model: DataTableModel<S, T>,
  expected: TableDefinition<NoInfer<S>, NoInfer<T>>,
): DataTableModel<S, T> {
  try {
    const proof =
      model && typeof model === "object"
        ? (models.get(model) as Proof<S, T> | undefined)
        : undefined;
    if (!proof?.owner || proof.owner.definition !== expected) return deny();
    const owner = proof.owner;
    if (
      assertTableController(expected, owner.controller) !==
      owner.controllerDefinition
    )
      return deny();
    const binding = getCriteriaPublicationBinding(owner.criteria);
    if (!binding || binding.publication !== owner.publication) return deny();
    if (!proof.committed) {
      const snapshot = owner.publication.getSnapshot();
      const actual = snapshot.current ?? snapshot.pending;
      const origin = binding.origin;
      if (
        !actual ||
        actual.controller !== owner.controller ||
        actual.definition !== owner.controllerDefinition ||
        actual.epoch !== origin.epoch ||
        actual.expected.definitionKey !== origin.context.definitionKey ||
        actual.expected.scopeKey !== origin.context.scopeKey ||
        actual.actual.definitionKey !== origin.context.definitionKey ||
        actual.actual.scopeKey !== origin.context.scopeKey ||
        !actual.expected.access ||
        !actual.actual.access
      )
        return deny();
    }
    if (owner.read() !== model.state) return deny();
    if (proof.committed?.phase === "unavailable") return deny();
    if (proof.committed?.sourceAuthority) {
      const metadata = requireCriteriaSource(
        proof.committed.sourceAuthority,
        owner.frames,
      );
      if (!sameCriteriaSourceMetadata(metadata, proof.committed.metadata))
        return deny();
      if (proof.committed.frame)
        requireCriteriaCommittedFrame(proof.committed.frame, owner.frames);
      if (proof.committed.pair)
        requireCriteriaTool(proof.committed.pair.tool, owner.frames);
      if (
        !sameCriteriaSourceMetadata(
          requireCriteriaSource(proof.committed.sourceAuthority, owner.frames),
          proof.committed.metadata,
        )
      )
        return deny();
    }
    if (owner.read() !== model.state) return deny();
    return model;
  } catch {
    return deny();
  }
}

/** Borrow the app's actual factory C/P; no controller/resource/lifecycle ownership. */
export function useDataTable<S extends QuerySchema, T extends object>(
  definition: TableDefinition<S, T>,
  options: DataTableOptions<NoInfer<S>, NoInfer<T>>,
): DataTableModel<S, T> {
  const candidate = captureOwner(definition, options);
  const [session] = useState(() => initialize(candidate));
  const sameOwner =
    session &&
    candidate &&
    session.definition === candidate.definition &&
    session.controller === candidate.controller &&
    session.publication === candidate.publication;
  const owner = sameOwner ? session : null;
  const state = useSyncExternalStore(
    owner?.subscribe ?? emptySubscribe,
    owner?.read ?? emptyRead,
    owner?.read ?? emptyRead,
  );
  const committed = useCriteriaSourceFrame(owner?.frames ?? null, options);
  return useMemo(
    () => issue(owner, state, committed),
    [owner, state, committed],
  );
}
