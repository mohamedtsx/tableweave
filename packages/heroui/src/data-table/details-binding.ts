import {
  type CriteriaFrameOwner,
  type CriteriaSourceMetadata,
  type DataTableModel,
  getDataTableModelOwner,
  type NativeRow,
  requireCriteriaSource,
  type TableState,
} from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import type { ReactNode } from "react";
import {
  createDetailsCommitCell,
  denyDetails,
  requireDetailsDisplay,
  sameDetailsAuthority,
  sameDetailsContext,
  sameDetailsLifecycle,
} from "../details/committed-details.js";
import {
  captureAuthority,
  captureCallback,
  ownData,
} from "../details/identity.js";
import { getAdoptedDetailsSessionOwner } from "../details/session-identity.js";
import type {
  DetailsAccessory,
  DetailsAccessoryOptions,
  DetailsAccessoryOwner,
  DetailsAuthority,
  DetailsChangeRequest,
  DetailsCommitActor,
  DetailsCommitCell,
  DetailsCommitLease,
  DetailsCommitSnapshot,
  DetailsContext,
  DetailsOpenOptions,
  DetailsOutcome,
  DetailsReason,
  DetailsRenderContext,
  DetailsSession,
  DetailsShellProps,
} from "../details/types.js";
import {
  type DetailsRequestData,
  runDetailsRequest,
} from "../details/use-details-session.js";
import {
  CommitMetadata,
  sameCommitOrigin,
} from "../filters/criteria-commit-core.js";
import {
  getTableRendererOwner,
  requireTableRendererSourceTarget,
  tableRendererStatus,
} from "../table/renderer-commit.js";
import type { TableRendererCell } from "../table/types.js";

interface Trigger<S extends QuerySchema, T extends object> {
  ticket: object;
  actor: DetailsCommitActor<S, T>;
  rowId: string;
  label: string;
  children: ReactNode;
  disabled: boolean;
  className: string | undefined;
  node: HTMLElement | null;
}
interface Owned<S extends QuerySchema, T extends object> {
  key: string;
  pending: object | null;
  busy: boolean;
  focusPending: boolean;
  restore: {
    actor: DetailsCommitActor<S, T>;
    context: DetailsContext;
    focus: () => boolean;
  } | null;
  close: {
    actor: DetailsCommitActor<S, T>;
    authority: DetailsAuthority;
    accepted: TableState<S>["details"];
  } | null;
  focusReceipt: {
    authority: DetailsAuthority;
    accepted: TableState<S>["details"];
    post: DetailsAuthority;
    neutral: HTMLElement | null;
  } | null;
  output: { key: string; node: ReactNode } | null;
  waitFocus: {
    key: string;
    node: HTMLElement;
    start: number | null;
    end: number | null;
  } | null;
  contentRoot: HTMLElement | null;
  heading: HTMLElement | null;
  initialFocused: boolean;
  accepted: TableState<S>["details"];
  association: {
    model: DataTableModel<S, T>;
    authority: DetailsAuthority;
    record: T;
    row: NativeRow<T> | undefined;
  } | null;
  requests: Map<object, DetailsRequestData<S>>;
  restoreTrigger: object | null;
  triggers: Map<object, Trigger<S, T>>;
}
const accessories = new WeakMap<object, unknown>();
const shellProps = new WeakMap<object, { accessory: object; actor: object }>();
const configStamps = new WeakMap<object, object>();
function stamp(input: unknown): object {
  if (!input || typeof input !== "object") return denyDetails();
  let token = configStamps.get(input);
  if (!token) {
    token = Object.freeze({});
    configStamps.set(input, token);
  }
  return token;
}
export function detailsContentKey(authority: DetailsAuthority): string {
  const c = authority.context;
  return JSON.stringify([
    0,
    c.definitionKey,
    c.datasetKey,
    c.scopeKey,
    c.epoch,
    authority.session,
    authority.rowId,
  ]);
}

/** A real binding owns only core-backed private buffers and metadata references. */
export class DetailsBinding<S extends QuerySchema, T extends object> {
  readonly mount = Object.freeze({});
  readonly definition;
  readonly controller;
  readonly cell: DetailsCommitCell<S, T>;
  readonly owned;
  private readonly tick;
  private lease: DetailsCommitLease<S, T> | null = null;
  private configStamp: object | null = null;
  private uiVersion: object = Object.freeze({});
  private observed: DetailsCommitSnapshot<S, T> | null = null;
  private observedUI: object | null = null;
  private observedRevision = -1;
  private snapshot: DetailsCommitSnapshot<S, T> | null = null;
  private shellMount: object | null = null;
  private shellJoin: object | null = null;
  canFocusNeutral(token: object): boolean {
    return (
      this.shellMount === token &&
      (!this.joinedOnce ||
        (!!this.tableJoin && this.shellJoin === this.tableJoin.token))
    );
  }
  private tableJoin: {
    readonly cell: TableRendererCell<S, T>;
    readonly token: object;
    stop: () => void;
  } | null = null;
  private tableDomain: {
    readonly owner: CriteriaFrameOwner<S>;
    readonly metadata: Pick<CriteriaSourceMetadata<S>, "origin" | "mode">;
  } | null = null;
  private joinedOnce = false;
  private readonly actorJoins = new WeakMap<object, object>();
  private joinVersion: object = Object.freeze({});
  private readonly joinListeners = new Set<() => void>();
  readonly getJoinSnapshot = () => this.joinVersion;
  readonly subscribeJoin = (listener: () => void) => {
    this.joinListeners.add(listener);
    return () => {
      this.joinListeners.delete(listener);
    };
  };
  private notifyJoin() {
    this.joinVersion = Object.freeze({});
    for (const listener of [...this.joinListeners]) listener();
  }
  /** Exclusive actual table-cell claim, independent of parent config actor revision. */
  claimTable(cell: TableRendererCell<S, T>): object {
    const owner = getTableRendererOwner(cell) ?? denyDetails();
    if (
      owner.definition !== this.definition ||
      owner.controller !== this.controller ||
      this.tableJoin
    )
      denyDetails();
    const actor = cell.getSnapshot().actor;
    if (actor) {
      const value = requireTableRendererSourceTarget({ cell, actor }),
        source = value.model.sourceTarget ?? denyDetails(),
        domain = this.tableDomain;
      if (
        domain &&
        (source.owner !== domain.owner ||
          !sameCommitOrigin(value.origin, domain.metadata.origin) ||
          value.metadata.mode !== domain.metadata.mode)
      )
        denyDetails();
      const existingActor = this.cell.getSnapshot().actor;
      if (existingActor) {
        const existing = this.cell.require(existingActor);
        if (
          existing.owner !== source.owner ||
          !sameCommitOrigin(existing.origin, value.origin) ||
          existing.metadata.mode !== value.metadata.mode
        )
          denyDetails();
      }
    }
    const token = Object.freeze({});
    this.joinedOnce = true;
    const join = { cell, token, stop: () => {} };
    this.tableJoin = join;
    // The old standalone/old-join actor is never retagged as this table lifetime.
    const prior = this.lease;
    if (prior) this.disconnect(prior);
    join.stop = cell.subscribe(() => {
      if (this.tableJoin !== join) return;
      // Actual renderer purge revokes the join and purges the real details core;
      // a parent config B (nonnull actor) does not retire the details actor A.
      if (!cell.getSnapshot().actor) {
        const lease = this.lease;
        if (lease) this.disconnect(lease);
        this.notifyJoin();
      }
    });
    this.notifyJoin();
    return token;
  }
  releaseTable(token: object): void {
    const join = this.tableJoin;
    if (!join || join.token !== token) return;
    this.tableJoin = null;
    join.stop();
    const lease = this.lease;
    if (lease) this.disconnect(lease);
    this.notifyJoin();
  }
  private requireFreshTable() {
    if (!this.joinedOnce) return null;
    const join = this.tableJoin ?? denyDetails(),
      actor = join.cell.getSnapshot().actor ?? denyDetails();
    const value = requireTableRendererSourceTarget({ cell: join.cell, actor }),
      source = value.model.sourceTarget ?? denyDetails();
    const domain = this.tableDomain;
    if (
      domain &&
      (source.owner !== domain.owner ||
        source.owner.publication !== domain.owner.publication ||
        !sameCommitOrigin(value.origin, domain.metadata.origin) ||
        value.metadata.mode !== domain.metadata.mode)
    )
      denyDetails();
    return { join, value, source };
  }
  private requireActor(actor: DetailsCommitActor<S, T>) {
    const value = this.cell.require(actor);
    if (this.joinedOnce) {
      const join = this.tableJoin ?? denyDetails();
      if (this.actorJoins.get(actor) !== join.token) denyDetails();
      try {
        this.requireFreshTable();
      } catch {
        const current = join.cell.getSnapshot().actor,
          domain = this.tableDomain;
        if (
          !current ||
          !domain ||
          tableRendererStatus({ cell: join.cell, actor: current }) !== "waiting"
        )
          denyDetails();
        const metadata = requireCriteriaSource(value.source, value.owner);
        if (
          value.owner !== domain.owner ||
          !sameCommitOrigin(metadata.origin, domain.metadata.origin) ||
          metadata.mode !== domain.metadata.mode
        )
          denyDetails();
      }
      if (
        !this.tableDomain ||
        value.owner !== this.tableDomain.owner ||
        !sameCommitOrigin(value.origin, this.tableDomain.metadata.origin) ||
        value.metadata.mode !== this.tableDomain.metadata.mode
      )
        denyDetails();
    }
    return value;
  }
  constructor(model: DataTableModel<S, T>) {
    const owner = getDataTableModelOwner(model) ?? denyDetails();
    this.definition = owner.definition;
    this.controller = owner.controller;
    this.cell = createDetailsCommitCell(model);
    this.owned = this.cell.createLocal<Owned<S, T>>("session");
    this.tick = this.cell.createLocal<object>("receipt");
  }
  readonly getSnapshot = (): DetailsCommitSnapshot<S, T> => {
    const next = this.cell.getSnapshot(),
      revision = this.controller.getSnapshot().revision;
    if (
      !this.snapshot ||
      this.observed?.version !== next.version ||
      this.observed?.actor !== next.actor ||
      this.observed?.modelVersion !== next.modelVersion ||
      this.observedUI !== this.uiVersion ||
      this.observedRevision !== revision
    ) {
      this.observed = next;
      this.observedUI = this.uiVersion;
      this.observedRevision = revision;
      this.snapshot = Object.freeze({
        actor: next.actor,
        modelVersion: next.modelVersion,
        version: Object.freeze({}),
      });
    }
    return this.snapshot;
  };
  readonly subscribe = (listener: () => void): (() => void) => {
    const stop = this.cell.subscribe(listener);
    let stopC = () => {};
    try {
      stopC = this.controller.subscribe(() => {
        try {
          const actor = this.actor(),
            owned = this.state(actor),
            accepted = this.controller.getSnapshot().details;
          if (accepted !== owned.accepted) {
            owned.accepted = accepted;
            owned.output = null;
            owned.association = null;
            owned.waitFocus = null;
            owned.pending = null;
            owned.busy = false;
            owned.requests.clear();
            if (accepted.rowId !== null) {
              owned.restore = null;
              owned.close = null;
            }
          }
        } catch {
          /* Revoked publication has already purged its locals. */
        }
        listener();
      });
    } catch {
      /* Disposed owner is neutral. */
    }
    return () => {
      stop();
      stopC();
    };
  };
  connect(): DetailsCommitLease<S, T> {
    if (this.joinedOnce && !this.tableJoin) denyDetails();
    const lease = this.cell.connect();
    this.lease = lease;
    return lease;
  }
  disconnect(lease: DetailsCommitLease<S, T>): void {
    try {
      this.cell.disconnect(lease);
    } finally {
      if (this.lease === lease) this.lease = null;
    }
  }
  private actor(): DetailsCommitActor<S, T> {
    return this.cell.getSnapshot().actor ?? denyDetails();
  }
  private state(actor: DetailsCommitActor<S, T>): Owned<S, T> {
    this.requireActor(actor);
    return this.owned.read(actor) ?? denyDetails();
  }
  private publish(actor: DetailsCommitActor<S, T>): void {
    this.uiVersion = Object.freeze({});
    this.tick.write(actor, this.uiVersion);
  }
  configure(
    lease: DetailsCommitLease<S, T>,
    model: DataTableModel<S, T>,
    options: DetailsAccessoryOptions<S, T>,
  ): void {
    const joined = this.requireFreshTable();
    if (joined) {
      const identity = getDataTableModelOwner(model);
      if (
        identity?.definition !== this.definition ||
        identity.controller !== this.controller
      )
        denyDetails();
      const source = model.sourceTarget;
      if (!source || source.owner !== joined.source.owner) denyDetails();
      const metadata = requireCriteriaSource(source.authority, source.owner);
      if (
        !sameCommitOrigin(metadata.origin, joined.value.origin) ||
        metadata.mode !== joined.value.metadata.mode
      )
        denyDetails();
      this.tableDomain ??= {
        owner: source.owner,
        metadata: Object.freeze({
          origin: metadata.origin,
          mode: metadata.mode,
        }),
      };
    }
    let actor = this.cell.getSnapshot().actor;
    if (actor) {
      try {
        this.cell.updateModel(lease, model);
      } catch {
        // A foreign/unprovable committed metadata update cannot leave A visible
        // beneath a host that has actually committed B. A stale lease is inert.
        this.disconnect(lease);
        denyDetails();
      }
    }
    let display = false;
    if (actor) {
      try {
        requireDetailsDisplay(this.cell.require(actor));
        display = true;
      } catch {
        /* Hold old eligible output, no private option reads. */
      }
    }
    if (
      !actor ||
      (display &&
        (this.configStamp !== stamp(options) ||
          !this.cell.require(actor).ports))
    ) {
      actor = this.cell.commit(lease, model, options);
      if (joined) this.actorJoins.set(actor, joined.join.token);
      const value = this.requireActor(actor),
        ports = value.ports;
      if (ports) {
        const key = detailsContentKey(ports.authority),
          old = this.owned.read(actor);
        const same = old?.key === key;
        this.owned.write(actor, {
          key,
          pending: null,
          busy: false,
          focusPending: false,
          restore: null,
          close: null,
          focusReceipt: null,
          output: same ? old.output : null,
          waitFocus: same ? old.waitFocus : null,
          contentRoot: same ? old.contentRoot : null,
          heading: same ? old.heading : null,
          initialFocused: same ? old.initialFocused : false,
          accepted: this.controller.getSnapshot().details,
          association: null,
          triggers: new Map(),
          requests: new Map(),
          restoreTrigger: old?.restoreTrigger ?? null,
        });
        this.configStamp = stamp(options);
      }
    }
    if (actor) this.updateAssociation(actor);
  }
  private updateAssociation(actor: DetailsCommitActor<S, T>): void {
    try {
      const stored = this.state(actor),
        previous = stored.association;
      stored.association = null;
      const current = this.display(actor),
        source = current.ports.source;
      if (
        !source ||
        source.status !== "ready" ||
        !sameDetailsAuthority(source.authority, current.authority)
      )
        return;
      const check = () => {
        this.display(actor);
      };
      const row = current.model.view?.rows.find(
        (row) =>
          ownData(row, "id", check) === current.authority.rowId &&
          ownData(row, "original", check) === source.record,
      );
      const after = this.display(actor);
      if (
        after.model !== current.model ||
        !sameDetailsAuthority(after.authority, current.authority)
      )
        return;
      this.state(actor).association = {
        model: current.model,
        authority: current.authority,
        record: source.record,
        row,
      };
      if (
        previous?.model !== current.model ||
        previous.record !== source.record ||
        previous.row !== row ||
        !sameDetailsAuthority(previous.authority, current.authority)
      )
        this.publish(actor);
    } catch {
      /* Absent layout association never fabricates a row. */
    }
  }
  owner(): DetailsAccessoryOwner<S, T> | null {
    try {
      const v = this.requireActor(this.actor());
      return Object.freeze({
        definition: this.definition,
        controller: this.controller,
        controllerDefinition: v.owner.definition,
        frameOwner: v.owner,
        publication: v.owner.publication,
        source: v.source,
        mode: v.metadata.mode,
        mount: this.mount,
      });
    } catch {
      return null;
    }
  }
  private current(
    actor: DetailsCommitActor<S, T>,
    baseline?: TableState<S>["details"],
  ) {
    if (!this.shellMount || !this.canFocusNeutral(this.shellMount))
      return denyDetails();
    this.requireFreshTable();
    const v = this.requireActor(actor),
      ports = v.ports ?? denyDetails();
    const state = this.controller.getSnapshot();
    if (baseline && state.details !== baseline) return denyDetails();
    // Actual app reader is a committed port; never a permitting table proof.
    const result = ports.port.read();
    this.requireActor(actor);
    this.requireFreshTable();
    const check = () => {
      this.requireActor(actor);
      this.requireFreshTable();
    };
    const authority = captureAuthority(
      ownData(result, "authority", check),
      check,
    );
    const actual = authority?.context.access ? { authority } : null;
    if (
      !actual ||
      !sameDetailsContext(actual.authority.context, ports.expected)
    ) {
      const lease = this.lease;
      if (lease) this.disconnect(lease);
      return denyDetails();
    }
    if (
      !sameDetailsLifecycle(actual.authority, ports.authority) ||
      state.details.rowId !== actual.authority.rowId ||
      this.controller.getSnapshot().details !== state.details
    )
      return denyDetails();
    this.requireActor(actor);
    this.requireFreshTable();
    return { value: v, ports, authority: actual.authority, state };
  }
  private display(actor: DetailsCommitActor<S, T>) {
    this.requireFreshTable();
    const model = requireDetailsDisplay(this.requireActor(actor));
    const actual = this.current(actor);
    if (requireDetailsDisplay(this.requireActor(actor)) !== model)
      return denyDetails();
    return { ...actual, model };
  }
  readSession(
    expected?: DetailsCommitActor<S, T> | null,
  ): Omit<DetailsSession<S, T>, "requestOpen" | "requestClose" | "retry"> {
    const actor = this.cell.getSnapshot().actor;
    if (
      !actor ||
      (expected !== undefined && expected !== actor) ||
      !this.shellMount
    )
      return { contentKey: "", isOpen: false, canRetry: false, context: null };
    try {
      const value = this.requireActor(actor),
        ports = value.ports;
      if (!ports)
        return {
          contentKey: "",
          isOpen: false,
          canRetry: false,
          context: null,
        };
      const stored = this.state(actor),
        accepted = this.controller.getSnapshot().details;
      if (accepted.rowId === null)
        return {
          contentKey: stored.key,
          isOpen: false,
          canRetry: false,
          context: null,
        };
      try {
        requireDetailsDisplay(value);
      } catch {
        this.requireActor(actor);
        return {
          contentKey: stored.key,
          isOpen: accepted.rowId === ports.authority.rowId,
          canRetry: false,
          context: null,
        };
      }
      const current = this.display(actor);
      const source =
        ports.source &&
        sameDetailsAuthority(ports.source.authority, current.authority)
          ? ports.source
          : null;
      const record = source?.status === "ready" ? source.record : undefined;
      const association = stored.association;
      const candidate =
        record &&
        association?.model === current.model &&
        association.record === record &&
        sameDetailsAuthority(association.authority, current.authority) &&
        current.model.view?.state === current.state
          ? association.row
          : undefined;
      const row =
        candidate &&
        current.model.view?.rows.includes(candidate) &&
        ownData(candidate, "id", () => {
          this.requireActor(actor);
          this.requireFreshTable();
        }) === current.authority.rowId &&
        ownData(candidate, "original", () => {
          this.requireActor(actor);
          this.requireFreshTable();
        }) === record
          ? candidate
          : undefined;
      const final = this.display(actor);
      if (
        final.model !== current.model ||
        !sameDetailsAuthority(final.authority, current.authority)
      )
        return denyDetails();
      const fields = this.controller.getDefinition().schema.fields;
      const context: DetailsRenderContext<S, T> = {
        recordId: current.authority.rowId ?? denyDetails(),
        status: source?.status ?? "loading",
        record,
        row,
        isStale: source?.status === "ready" && source.stale === true,
        isBusy:
          !source ||
          source.status === "loading" ||
          (source.status === "ready" && source.busy === true),
        policyBusy: stored.busy,
        errorCode: source?.status === "error" ? source.code : null,
        visibleFieldIds:
          current.model.view?.visibleColumns
            .filter(
              (c) =>
                Object.hasOwn(fields, c.id) &&
                !this.controller
                  .getDefinition()
                  .columns.find((column) => column.id === c.id)?.utility,
            )
            .map((c) => c.id) ?? [],
        hiddenFieldIds: current.state.columns.order.filter(
          (id) =>
            Object.hasOwn(fields, id) &&
            current.state.columns.visibility[id] === false,
        ),
        requestClose: (reason) =>
          this.request(actor, null, reason ?? "programmatic"),
        requestOpen: (id, options) => this.open(actor, id, options),
      };
      return {
        contentKey: stored.key,
        isOpen: true,
        canRetry: source?.status === "error" && ports.port.retry !== undefined,
        context,
      };
    } catch {
      return { contentKey: "", isOpen: false, canRetry: false, context: null };
    }
  }
  request(
    actor: DetailsCommitActor<S, T>,
    toId: string | null,
    reason: DetailsReason,
    options?: DetailsOpenOptions,
    rowTarget?: string,
  ): Promise<DetailsOutcome<S>> {
    const baseline = () => {
      const state = this.state(actor),
        token = state.pending;
      return token ? state.requests.get(token)?.baseline : undefined;
    };
    const live = () => {
      try {
        if (rowTarget) this.requireRow(actor, rowTarget);
        const now = this.current(actor, baseline());
        return {
          authority: now.authority,
          binding: {
            controller: this.controller,
            beforeChange: {
              valid: true,
              invoke: now.ports.beforeChange
                ? (change: DetailsChangeRequest) => {
                    const result =
                      this.current(actor, baseline()).ports.beforeChange?.(
                        change,
                      ) ?? false;
                    this.current(actor, baseline());
                    return result;
                  }
                : null,
            },
          },
        };
      } catch {
        return null;
      }
    };
    return runDetailsRequest(
      {
        origin: () => live()?.authority ?? null,
        baseline: () => this.controller.getSnapshot().details,
        current: live,
        store: (token, data) => {
          this.state(actor).requests.set(token, data);
        },
        load: (token) => {
          try {
            return this.state(actor).requests.get(token) ?? null;
          } catch {
            return null;
          }
        },
        forget: (token) => {
          try {
            this.state(actor).requests.delete(token);
          } catch {
            /* Purged. */
          }
        },
        observer: () => ({
          valid: true,
          invoke: (outcome, change) => {
            try {
              this.requireFreshTable();
              const v = this.requireActor(actor);
              v.ports?.onOutcome?.(outcome, change);
              this.requireActor(actor);
              this.requireFreshTable();
            } catch {
              /* Stale A never calls B observer. */
            }
          },
        }),
        mounted: () => {
          try {
            this.requireActor(actor);
            return true;
          } catch {
            return false;
          }
        },
        pending: () => {
          try {
            return this.state(actor).pending;
          } catch {
            return null;
          }
        },
        setPending: (value) => {
          const state = this.state(actor);
          state.pending = value;
        },
        setBusy: (value) => {
          const state = this.state(actor);
          state.busy = value;
          this.publish(actor);
        },
        captureRestore: (input) => {
          this.current(actor, baseline());
          const result = captureCallback<[], boolean>(
            input,
            "restoreFocus",
            false,
            () => {
              this.requireActor(actor);
              this.requireFreshTable();
            },
          );
          this.current(actor, baseline());
          return result;
        },
        restore: (context, focus) => {
          this.state(actor).restore = { actor, context, focus };
        },
        result: (result, change) => {
          if (
            change.toId === null &&
            (result.status === "committed" || result.status === "proposed")
          ) {
            const accepted =
              result.status === "committed"
                ? result.transition.state.details
                : result.proposal.transition.state.details;
            this.state(actor).close = {
              actor,
              authority: change.authority,
              accepted,
            };
          }
        },
      },
      toId,
      reason,
      options,
    );
  }
  open(
    actor: DetailsCommitActor<S, T>,
    id: string,
    options?: DetailsOpenOptions,
  ): Promise<DetailsOutcome<S>> {
    try {
      const current = this.current(actor);
      return this.request(
        actor,
        id,
        current.authority.rowId === null ? "trigger" : "replace",
        options,
      );
    } catch {
      return Promise.resolve({ status: "stale" });
    }
  }
  retry(
    actor: DetailsCommitActor<S, T>,
  ): Promise<"submitted" | "stale" | "failed" | "unavailable"> {
    try {
      const before = this.current(actor);
      if (
        before.ports.source?.status !== "error" ||
        !sameDetailsAuthority(
          before.ports.source.authority,
          before.authority,
        ) ||
        !before.ports.port.retry
      )
        return Promise.resolve("unavailable");
      return this.finishRetry(actor, before.ports.port.retry(before.authority));
    } catch {
      return Promise.resolve("stale");
    }
  }
  private async finishRetry(
    actor: DetailsCommitActor<S, T>,
    decision: ReturnType<
      NonNullable<DetailsAccessoryOptions<S, T>["port"]["retry"]>
    >,
  ): Promise<"submitted" | "stale" | "failed"> {
    try {
      await decision;
      this.current(actor);
      return "submitted";
    } catch {
      try {
        this.current(actor);
        return "failed";
      } catch {
        return "stale";
      }
    }
  }
  requireRow(actor: DetailsCommitActor<S, T>, id: string): void {
    this.requireFreshTable();
    const value = this.requireActor(actor),
      model = requireDetailsDisplay(value),
      facts = model.authority?.read() ?? denyDetails();
    if (
      !facts.displayed ||
      facts.blockedReason !== null ||
      facts.obsolete ||
      facts.resourceObsolete ||
      facts.displayed.queryIdentity !==
        this.controller.getSnapshot().queryIdentity
    )
      denyDetails();
    const row = facts.rows.find((r) => r.id === id);
    if (
      !row ||
      !model.view?.rows.includes(row) ||
      model.view.state !== this.controller.getSnapshot()
    )
      denyDetails();
    requireDetailsDisplay(this.requireActor(actor));
    this.requireFreshTable();
  }
  retain(actor: DetailsCommitActor<S, T>, key: string, node: ReactNode): void {
    try {
      this.display(actor);
      const state = this.state(actor);
      if (state.key === key) state.output = { key, node };
    } catch {
      /* Abandoned/stale render never retains output. */
    }
  }
  held(actor: DetailsCommitActor<S, T>, key: string): ReactNode {
    const state = this.state(actor);
    return state.key === key && state.output?.key === key
      ? state.output.node
      : null;
  }
  renderSlot<
    K extends "renderHeader" | "renderBody" | "renderFooter" | "renderInterior",
  >(
    actor: DetailsCommitActor<S, T>,
    key: K,
    context: DetailsRenderContext<S, T>,
  ): ReactNode {
    const before = this.display(actor);
    if (before.authority.rowId !== context.recordId) return denyDetails();
    const source =
      before.ports.source &&
      sameDetailsAuthority(before.ports.source.authority, before.authority)
        ? before.ports.source
        : null;
    const record = source?.status === "ready" ? source.record : undefined;
    if (
      context.record !== record ||
      context.status !== (source?.status ?? "loading") ||
      (context.row &&
        (!before.model.view?.rows.includes(context.row) ||
          context.row.original !== record))
    )
      return denyDetails();
    const fn = before.ports[key];
    try {
      return fn?.(context) ?? null;
    } finally {
      const after = this.display(actor);
      if (!sameDetailsAuthority(before.authority, after.authority))
        denyDetails();
    }
  }
  focusInitial(actor: DetailsCommitActor<S, T>): void {
    const value = this.display(actor);
    value.ports.focusInitial?.();
    this.display(actor);
  }
  headingNode(actor: DetailsCommitActor<S, T>, node: HTMLElement | null): void {
    try {
      this.state(actor).heading = node;
    } catch {
      /* No DOM ref backup after purge. */
    }
  }
  focusOnce(actor: DetailsCommitActor<S, T>): void {
    try {
      const value = this.display(actor),
        state = this.state(actor);
      if (state.initialFocused) return;
      state.initialFocused = true;
      if (value.ports.focusInitial) this.focusInitial(actor);
      else if (state.heading?.isConnected) state.heading.focus();
      this.display(actor);
    } catch {
      /* Waiting/retired sessions do not focus private content. */
    }
  }
  scheduleFocus(
    actor: DetailsCommitActor<S, T>,
    neutral: HTMLElement | null,
  ): void {
    try {
      const owned = this.state(actor),
        receipt = owned.close;
      if (
        !receipt ||
        receipt.actor !== actor ||
        this.controller.getSnapshot().details !== receipt.accepted ||
        receipt.accepted.rowId !== null
      )
        return;
      owned.close = null;
      owned.output = null;
      owned.focusPending = true;
      const post = this.readFocusAuthority(actor);
      if (
        !sameDetailsContext(post.context, receipt.authority.context) ||
        (post.rowId !== null && !sameDetailsLifecycle(post, receipt.authority))
      )
        denyDetails();
      owned.focusReceipt = {
        authority: receipt.authority,
        accepted: receipt.accepted,
        post,
        neutral,
      };
      // Queue closes over owner/actor only; DOM/authority stay in the purgeable slot.
      this.cell.timeout(actor, 0, () => this.runCloseFocus(actor));
    } catch {
      if (
        (!this.joinedOnce ||
          (this.tableJoin &&
            this.actorJoins.get(actor) === this.tableJoin.token)) &&
        neutral?.isConnected &&
        !neutral.closest("[inert]") &&
        this.controller.getSnapshot().details.rowId === null
      )
        neutral.focus({ preventScroll: true });
    }
  }
  private readFocusAuthority(
    actor: DetailsCommitActor<S, T>,
  ): DetailsAuthority {
    this.requireFreshTable();
    const ports = this.requireActor(actor).ports ?? denyDetails();
    const result = ports.port.read(),
      check = () => {
        this.requireActor(actor);
        this.requireFreshTable();
      };
    const authority = captureAuthority(
      ownData(result, "authority", check),
      check,
    );
    if (!authority?.context.access) return denyDetails();
    this.requireActor(actor);
    this.requireFreshTable();
    return authority;
  }
  private runCloseFocus(actor: DetailsCommitActor<S, T>): undefined {
    try {
      const state = this.state(actor),
        receipt = state.focusReceipt;
      state.focusReceipt = null;
      if (
        !receipt ||
        this.controller.getSnapshot().details !== receipt.accepted ||
        receipt.accepted.rowId !== null
      )
        return undefined;
      const check = () => {
        if (
          this.controller.getSnapshot().details !== receipt.accepted ||
          !sameDetailsAuthority(this.readFocusAuthority(actor), receipt.post)
        )
          denyDetails();
      };
      check();
      const neutral = receipt.neutral,
        doc =
          neutral?.ownerDocument ??
          (typeof document !== "undefined" ? document : null),
        active = doc?.activeElement;
      if (
        active &&
        active !== doc?.body &&
        active.isConnected &&
        !active.closest("[inert]")
      )
        return undefined;
      const restore = state.restore;
      state.restore = null;
      const token = state.restoreTrigger;
      state.restoreTrigger = null;
      const trigger = token ? this.readTrigger(actor, token) : null;
      const node =
        trigger?.rowId === receipt.authority.rowId ? trigger.node : null;
      if (
        node?.isConnected &&
        !node.closest("[inert]") &&
        !node.matches(":disabled")
      ) {
        check();
        node.focus({ preventScroll: true });
        check();
        return undefined;
      }
      if (
        restore?.actor === actor &&
        sameDetailsContext(restore.context, receipt.authority.context)
      ) {
        check();
        const focused = restore.focus();
        check();
        if (focused) return undefined;
      }
      check();
      this.requireFreshTable();
      this.requireActor(actor).ports?.focusFallback("closed");
      check();
      if (
        neutral?.isConnected &&
        (!doc?.activeElement || doc.activeElement === doc.body)
      )
        neutral.focus({ preventScroll: true });
      return undefined;
    } finally {
      try {
        this.state(actor).focusPending = false;
        this.publish(actor);
      } catch {
        /* Retired exact work. */
      }
    }
  }
  focusPending(): boolean {
    try {
      return this.state(this.actor()).focusPending;
    } catch {
      return false;
    }
  }
  trigger(
    actor: DetailsCommitActor<S, T>,
    token: object,
    props: unknown,
    modelVersion: object,
  ): object {
    if (this.cell.getSnapshot().modelVersion !== modelVersion) denyDetails();
    this.requireFreshTable();
    requireDetailsDisplay(this.requireActor(actor));
    const admission = new CommitMetadata(() => {
      this.requireFreshTable();
      requireDetailsDisplay(this.requireActor(actor));
      return undefined;
    }, denyDetails);
    const rowId = admission.data(props, "rowId");
    if (typeof rowId !== "string" || !rowId) denyDetails();
    this.requireRow(actor, rowId);
    const check = () => {
      this.requireRow(actor, rowId);
      return undefined;
    };
    const metadata = new CommitMetadata(check, denyDetails);
    const label = metadata.data(props, "label"),
      children = metadata.data(props, "children", true),
      disabled = metadata.data(props, "isDisabled", true),
      className = metadata.data(props, "className", true);
    if (
      typeof label !== "string" ||
      !label.trim() ||
      (disabled !== undefined && typeof disabled !== "boolean") ||
      (className !== undefined && typeof className !== "string")
    )
      denyDetails();
    this.requireRow(actor, rowId);
    const entries = this.state(actor).triggers,
      old = entries.get(token);
    const ticket = Object.freeze({});
    entries.set(token, {
      ticket,
      actor,
      rowId,
      label,
      children: children as ReactNode,
      disabled: disabled === true,
      className,
      node: old?.node ?? null,
    });
    return ticket;
  }
  readTrigger(
    actor: DetailsCommitActor<S, T>,
    token: object,
  ): Trigger<S, T> | null {
    try {
      this.requireActor(actor);
      this.requireFreshTable();
      const v = this.state(actor).triggers.get(token);
      if (v?.actor !== actor) return null;
      this.requireRow(actor, v.rowId);
      return v;
    } catch {
      return null;
    }
  }
  triggerNode(
    actor: DetailsCommitActor<S, T>,
    token: object,
    ticket: object,
    node: HTMLElement | null,
  ): void {
    try {
      const value = this.state(actor).triggers.get(token);
      if (value?.actor !== actor || value.ticket !== ticket) return;
      if (node) this.requireRow(actor, value.rowId);
      value.node = node;
    } catch {
      /* Purged ticket has no DOM backup. */
    }
  }
  removeTrigger(
    actor: DetailsCommitActor<S, T>,
    token: object,
    ticket: object,
  ): void {
    try {
      const entries = this.state(actor).triggers;
      if (entries.get(token)?.ticket === ticket) entries.delete(token);
    } catch {
      /* Already purged. */
    }
  }
  openTrigger(
    actor: DetailsCommitActor<S, T>,
    token: object,
    ticket: object,
  ): void {
    const value = this.readTrigger(actor, token);
    if (!value || value.ticket !== ticket || value.disabled) return;
    this.state(actor).restoreTrigger = token;
    void this.request(actor, value.rowId, "trigger", undefined, value.rowId);
  }
  shell(
    actor: DetailsCommitActor<S, T>,
    session: DetailsSession<S, T>,
    token: object,
  ): DetailsShellProps<S, T> {
    if (this.shellMount !== token) return denyDetails();
    this.requireSession(actor, session);
    let props: DetailsShellProps<S, T>;
    if (session.context) {
      const value = this.display(actor),
        p = value.ports;
      props = {
        session,
        title: p.title,
        renderBody: (context) => this.renderSlot(actor, "renderBody", context),
        ...(p.description === undefined ? {} : { description: p.description }),
        ...(p.className === undefined ? {} : { className: p.className }),
        ...(p.messages === undefined ? {} : { messages: p.messages }),
        ...(p.dismissOnOutside === undefined
          ? {}
          : { dismissOnOutside: p.dismissOnOutside }),
        ...(p.dismissOnEscape === undefined
          ? {}
          : { dismissOnEscape: p.dismissOnEscape }),
        ...(p.focusInitial === undefined
          ? {}
          : { focusInitial: () => this.focusInitial(actor) }),
      };
    } else props = { session, title: "Record details", renderBody: () => null };
    shellProps.set(props, { accessory: this, actor });
    return props;
  }
  requireSession(
    actor: DetailsCommitActor<S, T>,
    session: DetailsSession<S, T>,
  ): void {
    if (!this.shellMount || !this.canFocusNeutral(this.shellMount))
      denyDetails();
    const issued = getAdoptedDetailsSessionOwner(session);
    if (
      !issued ||
      issued.binding !== this ||
      issued.actor !== actor ||
      issued.controller !== this.controller ||
      issued.mount !== this.mount
    )
      denyDetails();
    this.requireActor(actor);
  }
  claimShell(token: object): void {
    if (this.shellMount && this.shellMount !== token) denyDetails();
    this.shellMount = token;
    this.shellJoin = this.tableJoin?.token ?? null;
    const actor = this.cell.getSnapshot().actor;
    if (actor) this.publish(actor);
  }
  releaseShell(token: object): void {
    if (this.shellMount !== token) return;
    this.shellMount = null;
    this.shellJoin = null;
    const actor = this.cell.getSnapshot().actor;
    if (actor) {
      try {
        const v = this.state(actor);
        v.output = null;
        v.restore = null;
        v.waitFocus = null;
        v.contentRoot = null;
        v.heading = null;
        v.association = null;
        v.close = null;
        v.focusReceipt = null;
        v.pending = null;
        v.busy = false;
        v.requests.clear();
        v.triggers.clear();
        v.restoreTrigger = null;
      } catch {
        /* Already purged. */
      }
    }
  }
  contentNode(actor: DetailsCommitActor<S, T>, node: HTMLElement | null): void {
    try {
      const state = this.state(actor);
      if (node === null) this.captureWaitingFocus(actor, state.key);
      state.contentRoot = node;
    } catch {
      /* Purged callback stores no backup. */
    }
  }
  captureWaitingFocus(actor: DetailsCommitActor<S, T>, key: string): void {
    try {
      const state = this.state(actor),
        root = state.contentRoot,
        node = root?.ownerDocument.activeElement;
      if (
        state.key !== key ||
        !(node instanceof HTMLElement) ||
        !root?.contains(node)
      )
        return;
      const text =
        node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement
          ? node
          : null;
      state.waitFocus = {
        key,
        node,
        start: text?.selectionStart ?? null,
        end: text?.selectionEnd ?? null,
      };
    } catch {
      /* DOM is absent or owner retired. */
    }
  }
  restoreWaitingFocus(actor: DetailsCommitActor<S, T>, key: string): void {
    try {
      this.display(actor);
      const state = this.state(actor),
        saved = state.waitFocus;
      state.waitFocus = null;
      if (
        !saved ||
        saved.key !== key ||
        !saved.node.isConnected ||
        saved.node.closest("[inert]")
      )
        return;
      const active = saved.node.ownerDocument.activeElement;
      if (
        active &&
        active !== saved.node.ownerDocument.body &&
        active !== saved.node &&
        active !== state.heading &&
        active.isConnected
      )
        return;
      saved.node.focus({ preventScroll: true });
      if (
        (saved.node instanceof HTMLInputElement ||
          saved.node instanceof HTMLTextAreaElement) &&
        saved.start !== null &&
        saved.end !== null
      )
        saved.node.setSelectionRange(saved.start, saved.end);
      this.display(actor);
    } catch {
      /* Stale waiting ticket never moves focus into another lifecycle. */
    }
  }
}

export function createDetailsAccessory<S extends QuerySchema, T extends object>(
  model: DataTableModel<S, T>,
): DetailsAccessory<S, T> {
  const binding = new DetailsBinding(model),
    accessory = Object.freeze({}) as DetailsAccessory<S, T>;
  accessories.set(accessory, binding);
  bindingRegistry.set(binding, binding);
  return accessory;
}
export function getDetailsBinding<S extends QuerySchema, T extends object>(
  accessory: DetailsAccessory<S, T>,
): DetailsBinding<S, T> {
  const value =
    accessory && typeof accessory === "object"
      ? accessories.get(accessory)
      : undefined;
  return (value as DetailsBinding<S, T> | undefined) ?? denyDetails();
}
/** Producer-only binding proof; class labels/structural lookalikes are insufficient. */
export function lookupDetailsBinding<S extends QuerySchema, T extends object>(
  value: unknown,
): DetailsBinding<S, T> | null {
  if (!value || typeof value !== "object") return null;
  return (
    (bindingRegistry.get(value) as DetailsBinding<S, T> | undefined) ?? null
  );
}
const bindingRegistry = new WeakMap<object, unknown>();
export function getDetailsAccessoryOwner<
  S extends QuerySchema,
  T extends object,
>(accessory: DetailsAccessory<S, T>): DetailsAccessoryOwner<S, T> | null {
  try {
    return getDetailsBinding(accessory).owner();
  } catch {
    return null;
  }
}
export function getBoundShell<S extends QuerySchema, T extends object>(
  props: DetailsShellProps<S, T>,
): { binding: DetailsBinding<S, T>; actor: DetailsCommitActor<S, T> } | null {
  const value = shellProps.get(props);
  return value
    ? {
        binding: value.accessory as DetailsBinding<S, T>,
        actor: value.actor as DetailsCommitActor<S, T>,
      }
    : null;
}
