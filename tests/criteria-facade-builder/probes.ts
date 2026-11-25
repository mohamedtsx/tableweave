import {
  builderEditor,
  editorActions,
} from "../../packages/heroui/src/filters/criteria-builder-host.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import {
  closeCriteriaFacadeHost,
  consumeCriteriaFacadeHostSkip,
  criteriaFacadeState,
  getCriteriaFacadeInput,
  prepareCriteriaFacadeHost,
  takeCriteriaFacadePresentation,
} from "../../packages/heroui/src/filters/criteria-facade-config.js";
import {
  criteriaDateChild,
  criteriaDateState,
  readCriteriaDateState,
  readCriteriaDateToolbar,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import { required } from "./fixtures.js";
import type { BuilderConfig, Harness } from "./harness.js";

export async function supersession(
  h: Harness,
  kind: "number" | "point" | "range" = "number",
  throwTrap = false,
) {
  let badReceiver = 0,
    bCalls = 0;
  const cfg: BuilderConfig = h.builderConfig({
    className: "synthetic-A",
    fields: { status: { label: "Status", asyncOptions: h.options } },
    createRuleId() {
      if (this !== cfg) badReceiver++;
      return "synthetic-A-id";
    },
  });
  const p = h.probe(cfg);
  try {
    p.connectOptions();
    const editor = p.open(
      kind === "number" ? "n1" : kind === "point" ? "d1" : "d2",
    );
    const a = p.frame();
    if (kind === "number") editorActions.number(editor, 0, "synthetic partial");
    else {
      const root = required(
        readCriteriaDateToolbar(a.local.date, a.actor).handle,
      );
      if (kind === "point")
        criteriaDateState.text(
          criteriaDateChild(root, "point", "instant"),
          "synthetic partial point",
        );
      else {
        criteriaDateState.text(
          criteriaDateChild(root, "start", "instant"),
          "synthetic partial start",
        );
        criteriaDateState.text(
          criteriaDateChild(root, "end", "instant"),
          "synthetic partial end",
        );
      }
    }
    a.local.search.write(a.actor, "synthetic field search");
    a.local.term.write(a.actor, "synthetic option term");
    a.local.error.write(a.actor, "synthetic notice");
    const slots = [
      a.local.draft,
      a.local.numbers,
      a.local.search,
      a.local.term,
      a.local.error,
      a.local.announcement,
      a.local.allocated,
      a.local.focus,
      a.local.receipt,
      a.local.choiceReceipt,
      a.local.request,
      a.local.dateKey,
    ];
    const values = slots.map((slot) => slot.read(a.actor));
    const date = readCriteriaDateToolbar(a.local.date, a.actor);
    let fired = 0;
    const timer = a.cell.timeout(a.actor, 0, () => {
      fired++;
      return undefined;
    });
    const core = a.cell.getSnapshot(),
      host = p.store.snapshot();
    const publication = h.f.app.P.getSnapshot(),
      source = h.f.options.getSnapshot();
    const counts = { ...p.counts },
      invalidations = h.f.counts.invalidation;
    let notifications = 0,
      bReads = 0,
      armed = true;
    const stop = p.store.subscribe(() => notifications++);
    const replacement: BuilderConfig = new Proxy(
      h.builderConfig({
        className: "synthetic-B",
        createRuleId() {
          bCalls++;
          return "synthetic-B-id";
        },
      }),
      {
        getOwnPropertyDescriptor(target, key) {
          bReads++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      },
    );
    const candidate = p.publish(
      new Proxy(h.builderConfig({ className: "superseded-candidate" }), {
        getOwnPropertyDescriptor(target, key) {
          if (armed) {
            armed = false;
            p.publish(replacement);
            if (throwTrap) throw new Error("Synthetic descriptor throw");
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      }),
    );
    p.store.commit(candidate);
    const after = p.frame(),
      afterDate = readCriteriaDateToolbar(a.local.date, a.actor);
    const result = {
      sameActor: after.actor === a.actor,
      sameCore: a.cell.getSnapshot() === core,
      sameHost: p.store.snapshot() === host,
      samePublication: h.f.app.P.getSnapshot() === publication,
      sameSource: h.f.options.getSnapshot() === source,
      sameSlots: slots.every(
        (slot, index) => slot.read(a.actor) === values[index],
      ),
      sameDate:
        date.handle === afterDate.handle && date.draft === afterDate.draft,
      samePresentation: after.className === "synthetic-A",
      sameConnection:
        p.counts.connect === counts.connect &&
        p.counts.subscribe === counts.subscribe,
      noInvalidation: h.f.counts.invalidation === invalidations,
      notifications,
      bReads,
      oldCallback: required(a.ports.createRuleId)(),
      badReceiver,
      bCallsBeforeCommit: bCalls,
      timerDeadlinePreserved: timer.deadline !== null,
      timerFired: false,
      oldDeniedAfterB: false,
      bClassName: "",
      partial:
        kind === "number"
          ? a.local.numbers.read(a.actor)?.[0]
          : date.handle
            ? readCriteriaDateState(
                criteriaDateChild(
                  date.handle,
                  kind === "point" ? "point" : "end",
                  "instant",
                ),
              ).text
            : "",
    };
    stop();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    result.timerFired = fired === 1;
    p.store.commit(p.input());
    result.bClassName = p.frame().className;
    try {
      a.ports.createRuleId?.();
    } catch {
      result.oldDeniedAfterB = true;
    }
    return result;
  } finally {
    p.dispose();
  }
}

export function coalescing(h: Harness) {
  const cfg = h.builderConfig({ className: "coalesced-A" }),
    p = h.probe(cfg);
  try {
    const editor = p.open("n1");
    editorActions.number(editor, 0, "17e");
    const a = p.frame(),
      input = p.input();
    const core = a.cell.getSnapshot(),
      host = p.store.snapshot();
    const sameTicket = p.publish(cfg) === input;
    p.store.commit(input);
    const same =
      p.frame().actor === a.actor &&
      a.cell.getSnapshot() === core &&
      p.store.snapshot() === host;
    h.f.app.change({
      type: "sorting.change",
      update: [{ id: "amount", desc: true }],
    });
    const waiting = criteriaFacadeState(input);
    const waitingVersion = p.store.snapshot();
    p.store.commit(input);
    const keptWaiting =
      p.frame().actor === a.actor && p.store.snapshot() === waitingVersion;
    h.render();
    const refreshed = p.refreshModel();
    const before = p.store.snapshot();
    p.store.commit(refreshed);
    return {
      sameTicket,
      same,
      waiting,
      keptWaiting,
      sameRefreshTicket: refreshed === input,
      sameRefreshActor: p.frame().actor === a.actor,
      sameRefreshVersion: p.store.snapshot() === before,
      numeric: a.local.numbers.read(a.actor),
    };
  } finally {
    p.dispose();
  }
}

export function denial(
  h: Harness,
  variant:
    | "malformed"
    | "forged"
    | "reentry"
    | "reset"
    | "source-loss"
    | "no-A"
    | "raw-A",
) {
  const p = h.probe();
  try {
    if (variant === "raw-A")
      p.store.commit({
        controller: h.f.app.C,
        criteria: p.target,
        expectedResourceContext: h.f.context,
        invalidationKey: 0,
        evaluationMode:
          h.actual().table.metadata?.mode === "client" ? "client" : "server",
        fields: {},
        className: "raw-A",
      });
    if (variant === "no-A") {
      p.store.commit({ criteria: undefined });
    }
    const a = p.store.read();
    let armed = true;
    const cfg: BuilderConfig =
      variant === "malformed"
        ? h.builderConfig({})
        : new Proxy(h.builderConfig({ className: "candidate" }), {
            getOwnPropertyDescriptor(target, key) {
              if (armed) {
                armed = false;
                if (variant === "forged")
                  throw new Error("Criteria facade layout skipped.");
                if (variant === "reentry") p.store.commit(p.input());
                else if (variant === "reset") h.f.app.reset();
                else if (variant === "source-loss") p.cell.disconnect(p.lease);
                else p.publish(h.builderConfig({ className: "newer-B" }));
              }
              return Reflect.getOwnPropertyDescriptor(target, key);
            },
          });
    if (variant === "malformed") Reflect.set(cfg, "className", 3);
    p.store.commit(p.publish(cfg));
    let oldDenied = a === null;
    if (a)
      try {
        p.store.require(a.actor);
      } catch {
        oldDenied = true;
      }
    return { denied: p.store.read() === null, oldDenied };
  } finally {
    p.dispose();
  }
}

export function receipts(h: Harness) {
  const p = h.probe(),
    child = createCriteriaCommitCell("builder", h.f.app.C),
    lease = child.connect();
  try {
    const initial = p.input();
    child.commit(lease, p.target, initial);
    let armed = true;
    const input = p.publish(
      new Proxy(h.builderConfig({ className: "candidate" }), {
        getOwnPropertyDescriptor(target, key) {
          if (armed) {
            armed = false;
            p.publish(h.builderConfig({ className: "newer" }));
          }
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      }),
    );
    const foreign = prepareCriteriaFacadeHost(initial),
      carrier = prepareCriteriaFacadeHost(input);
    let error: unknown;
    try {
      child.commit(lease, p.target, input);
    } catch (caught) {
      error = caught;
    }
    const wrongCell = consumeCriteriaFacadeHostSkip(
      error,
      input,
      p.frame().cell,
      carrier,
    );
    const wrongCarrier = consumeCriteriaFacadeHostSkip(
      error,
      input,
      child,
      foreign,
    );
    const first = consumeCriteriaFacadeHostSkip(error, input, child, carrier);
    const reused = consumeCriteriaFacadeHostSkip(error, input, child, carrier);
    let noPresentation = false;
    if (carrier)
      try {
        takeCriteriaFacadePresentation(carrier, input);
      } catch {
        noPresentation = true;
      }
    closeCriteriaFacadeHost(carrier);
    closeCriteriaFacadeHost(foreign);
    return { wrongCell, wrongCarrier, first, reused, noPresentation };
  } finally {
    child.disconnect(lease);
    p.dispose();
  }
}

export function postBoundary(h: Harness) {
  const p = h.probe(),
    native = globalThis.clearTimeout;
  let armed = false,
    cancellations = 0;
  globalThis.clearTimeout = (...args: Parameters<typeof native>) => {
    Reflect.apply(native, globalThis, args);
    cancellations++;
    if (armed) {
      armed = false;
      p.publish(h.builderConfig({ className: "after-seal" }));
      throw new Error("Synthetic native cancellation failure");
    }
  };
  try {
    const a = p.frame();
    a.cell.timeout(a.actor, 100000, () => undefined);
    armed = true;
    p.store.commit(p.publish(h.builderConfig({ className: "candidate" })));
    return { denied: p.store.read() === null, cancellations };
  } finally {
    globalThis.clearTimeout = native;
    p.dispose();
  }
}

export function defaults(h: Harness) {
  const p = h.probe();
  try {
    const a = p.frame();
    return {
      amount: a.ports.fields.amount?.label,
      created: a.ports.fields.created?.label,
      sourceMode: h.actual().table.metadata?.mode,
      mode: a.ports.evaluationMode,
      registry: !!a.ports.registry,
      operatorLabel: a.ports.fields.amount?.operatorLabels?.["number.eq"],
    };
  } finally {
    p.dispose();
  }
}

export function metadata(
  h: Harness,
  name:
    | "controller"
    | "context"
    | "stamp"
    | "mode"
    | "foreign-source"
    | "copy"
    | "proxy",
) {
  const p = h.probe();
  try {
    const old = p.frame();
    if (name === "foreign-source") {
      const q = h.probe();
      try {
        const stale = q.input();
        q.publish(h.builderConfig({ className: "newer-foreign" }));
        p.store.commit(stale);
      } finally {
        q.dispose();
      }
    } else {
      const input = { ...p.input() };
      if (name === "controller") input.controller = {};
      if (name === "context")
        input.expectedResourceContext = { ...h.f.context, access: false };
      if (name === "stamp") input.invalidationKey = 1;
      if (name === "mode") input.evaluationMode = "wrong-mode";
      if (name === "copy" || name === "proxy") {
        const marker = input.criteria;
        if (!marker || typeof marker !== "object")
          throw new Error("Actual registered marker required");
        input.criteria =
          name === "copy" ? { ...marker } : new Proxy(marker, {});
      }
      p.store.commit(input);
    }
    return {
      denied: p.store.read() === null,
      oldDenied: (() => {
        try {
          p.store.require(old.actor);
          return false;
        } catch {
          return true;
        }
      })(),
    };
  } finally {
    p.dispose();
  }
}

export function association(h: Harness) {
  const p = h.probe();
  try {
    const a = p.frame();
    let observed = false,
      earlyReady = true;
    const stop = a.cell.subscribe(() => {
      const actor = a.cell.getSnapshot().actor;
      if (!observed && actor && actor !== a.actor) {
        observed = true;
        earlyReady = p.store.read() !== null;
      }
    });
    p.store.commit(
      p.publish(h.builderConfig({ className: "new-associated-B" })),
    );
    stop();
    return { observed, earlyReady, readyAfter: p.frame().className };
  } finally {
    p.dispose();
  }
}

export function savedDraft(h: Harness) {
  const p = h.probe();
  try {
    p.open("n1");
    const a = p.frame(),
      saved = builderEditor(p.store, a.actor);
    p.publish(h.builderConfig({ className: "parent-B-only" }));
    editorActions.number(saved, 0, "23");
    const beforeChild = a.local.numbers.read(a.actor);
    p.store.commit(p.input());
    let denied = false;
    try {
      editorActions.number(saved, 0, "old-A");
    } catch {
      denied = true;
    }
    return { beforeChild, denied };
  } finally {
    p.dispose();
  }
}

export function invalidationOrigin(h: Harness) {
  const p = h.probe(
    h.builderConfig({
      fields: { status: { label: "Status", asyncOptions: h.options } },
    }),
  );
  try {
    p.connectOptions();
    const a = p.frame(),
      previous = h.f.options.getSnapshot().context;
    p.publish(h.builderConfig({ className: "parent-B-without-child-B" }));
    const beforeReset = h.f.counts.invalidation;
    const begun = h.f.app.reset();
    const purged = h.f.options.getSnapshot();
    const completed = h.f.app.P.complete(begun.ticket);
    let denied = false;
    try {
      p.store.require(a.actor);
    } catch {
      denied = true;
    }
    return {
      beforeReset,
      denied,
      purged:
        purged.page === null &&
        purged.request === null &&
        purged.selected.length === 0,
      originalOrigin: h.f.invalidationOrigins.at(-1) === previous,
      settled: completed.status === "settled",
    };
  } finally {
    p.dispose();
  }
}

export function foreignOwner(h: Harness, other: Harness) {
  const p = h.probe();
  try {
    const a = p.frame();
    p.store.commit(getCriteriaFacadeInput(other.actual().parent.source));
    let oldDenied = false;
    try {
      p.store.require(a.actor);
    } catch {
      oldDenied = true;
    }
    return { denied: p.store.read() === null, oldDenied };
  } finally {
    p.dispose();
  }
}
