import type { CriteriaToolAuthority } from "@tableweave/react";
import {
  createCriteriaFrames,
  createCriteriaPublication,
} from "@tableweave/react";
import { createOptionSource } from "@tableweave/react/filters";
import { describe, expect, it, vi } from "vitest";
import {
  CriteriaCommitError,
  createCriteriaCommitCell,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import type { S } from "./fixtures.js";
import { fixture, required } from "./fixtures.js";

describe("genuine committed criteria cells (authored, execution deferred)", () => {
  it("captures controller identity without traversing it or acquiring anything at construction/connect", () => {
    const f = fixture(),
      read = vi.fn(() => {
        throw new Error("No constructor reader");
      });
    const controller = new Proxy(f.app.C, {
      get: read,
      getOwnPropertyDescriptor: read,
    });
    const cell = createCriteriaCommitCell("search", controller),
      lease = cell.connect();
    expect(cell.getSnapshot().actor).toBeNull();
    cell.disconnect(lease);
    expect(read).not.toHaveBeenCalled();
  });
  it("rejects foreign same-schema actors/leases without clearing the owning mount", () => {
    const f = fixture(),
      target = f.commit();
    const first = createCriteriaCommitCell("search", f.app.C),
      second = createCriteriaCommitCell("search", f.app.C);
    const one = first.connect(),
      two = second.connect();
    const a = first.commit(one, target, f.search()),
      b = second.commit(two, target, f.search());
    expect(() => first.commit(two, target, f.search())).toThrow(
      CriteriaCommitError,
    );
    expect(() => first.require(b)).toThrow(CriteriaCommitError);
    expect(() => first.disconnect(two)).toThrow(CriteriaCommitError);
    expect(first.require(a).actor).toBe(a);
    expect(second.require(b).actor).toBe(b);
  });
  it("constructs/connects inertly; abandoned candidates never replace A", () => {
    const f = fixture();
    const state = f.app.C.getSnapshot();
    const cell = createCriteriaCommitCell("search", f.app.C);
    expect(cell.getSnapshot().actor).toBeNull();
    expect(cell.getSnapshot()).toBe(cell.getSnapshot());
    const lease = cell.connect();
    expect(cell.getSnapshot().actor).toBeNull();
    const target = f.commit();
    const calls = vi.fn();
    const a = cell.commit(lease, target, f.search({ onMutation: calls }));
    const old = cell.require(a);
    const abandoned = new Proxy(
      {},
      {
        getOwnPropertyDescriptor() {
          throw new Error("Abandoned render must not be read");
        },
      },
    );
    void abandoned;
    expect(cell.require(a)).toBe(old);
    expect(calls).not.toHaveBeenCalled();
    cell.disconnect(lease);
    expect(f.app.C.getSnapshot()).toBe(state);
    expect(f.app.P.getSnapshot().phase).toBe("settled");
    expect(f.resource.getSnapshot().kind).toBe("idle");
  });

  it("keeps A callable during B reflection, then publishes B and denies old A wrappers", () => {
    const f = fixture(),
      target = f.commit();
    const cell = createCriteriaCommitCell("builder", f.app.C),
      lease = cell.connect();
    const aCall = vi.fn(() => "a"),
      bCall = vi.fn(() => "b");
    const a = cell.commit(lease, target, f.builder({ createRuleId: aCall }));
    const old = required(cell.require(a).ports.createRuleId);
    const raw = f.builder({ createRuleId: bCall });
    let read = false;
    const b = cell.commit(
      lease,
      target,
      new Proxy(raw, {
        getOwnPropertyDescriptor(value, key) {
          if (key === "createRuleId" && !read) {
            read = true;
            expect(old()).toBe("a");
          }
          return Reflect.getOwnPropertyDescriptor(value, key);
        },
      }),
    );
    expect(aCall).toHaveBeenCalledTimes(1);
    expect(bCall).not.toHaveBeenCalled();
    expect(() => old()).toThrow();
    expect(required(cell.require(b).ports.createRuleId)()).toBe("b");
  });

  it("same-domain replacements keep draft/session identity and the exact participant", () => {
    const f = fixture(),
      target = f.commit();
    const cell = createCriteriaCommitCell("builder", f.app.C),
      lease = cell.connect();
    const draft = cell.createLocal<{ value: number }>("draft"),
      session = cell.createLocal<object>("session");
    const raw = f.builder(),
      value = { value: 42 },
      sessionValue = {};
    const a = cell.commit(lease, target, raw);
    draft.write(a, value);
    session.write(a, sessionValue);
    const b = cell.commit(lease, target, raw);
    expect(draft.read(b)).toBe(value);
    expect(session.read(b)).toBe(sessionValue);
    expect(() => draft.read(a)).toThrow(CriteriaCommitError);
    expect(Object.isFrozen(value)).toBe(false);
    let observations = 0;
    cell.subscribe(() => {
      observations++;
    });
    let duringPurge: number | null = null,
      clearedInPurge = false;
    // An actual later P participant observes the purge barrier before P's
    // cleanup pass. begin itself performs both passes synchronously.
    f.app.P.registerParticipant(f.app.authority(), {
      purge() {
        duringPurge = observations;
        clearedInPurge = cell.getSnapshot().actor === null;
        return undefined;
      },
    });
    const begun = f.app.beginReset();
    expect(begun.status).toBe("pending");
    expect(duringPurge).toBe(0);
    expect(clearedInPurge).toBe(true);
    expect(observations).toBe(1); // Actual cleanup already ran in begin.
    expect(cell.getSnapshot().actor).toBeNull();
    if (begun.status !== "pending") throw new Error("Missing actual ticket");
    expect(f.app.completeReset(begun.ticket).status).toBe("settled");
    expect(observations).toBe(1); // One actual participant cleanup, not one per config.
    const c = cell.commit(
      lease,
      f.commit(),
      f.builder({ invalidationKey: "new-stamp" }),
    );
    expect(draft.read(c)).toBeNull();
    expect(session.read(c)).toBeNull();
    expect(value.value).toBe(42);
  });

  it("consumes own metadata once and rejects inherited/accessor/supplied invalid before private fields", () => {
    for (const variant of [
      "getter",
      "inherited",
      "wrong-controller",
      "wrong-context",
      "infinite",
      "undefined-builder",
    ] as const) {
      const f = fixture(),
        cell = createCriteriaCommitCell("builder", f.app.C),
        lease = cell.connect(),
        target = f.commit();
      const field = vi.fn();
      const raw = f.builder();
      const props = Object.defineProperty({ ...raw }, "fields", {
        get: field,
        configurable: true,
      });
      if (variant === "getter")
        Object.defineProperty(props, "invalidationKey", {
          get: () => {
            throw new Error("Do not run metadata getters");
          },
        });
      if (variant === "inherited") {
        Reflect.deleteProperty(props, "invalidationKey");
        Object.setPrototypeOf(props, { invalidationKey: "inherited" });
      }
      if (variant === "wrong-controller")
        Object.defineProperty(props, "controller", { value: {} });
      if (variant === "wrong-context")
        Object.defineProperty(props, "expectedResourceContext", {
          value: { ...f.context, scopeKey: "other" },
        });
      if (variant === "infinite")
        Object.defineProperty(props, "invalidationKey", { value: Infinity });
      if (variant === "undefined-builder")
        Object.defineProperty(props, "invalidationKey", { value: undefined });
      expect(() => cell.commit(lease, target, props)).toThrow(
        CriteriaCommitError,
      );
      expect(field).not.toHaveBeenCalled();
    }
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("search", f.app.C),
      lease = cell.connect();
    const counts = new Map<PropertyKey, number>();
    const proxy = new Proxy(f.search(), {
      getOwnPropertyDescriptor(value, key) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
        return Reflect.getOwnPropertyDescriptor(value, key);
      },
    });
    cell.commit(lease, target, proxy);
    for (const key of ["controller", "expectedContext", "invalidationKey"])
      expect(counts.get(key)).toBe(1);
  });

  it("denies same-domain reset-stamp/mode changes and never falls back to old configuration", () => {
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("builder", f.app.C),
      lease = cell.connect();
    const a = cell.commit(lease, target, f.builder());
    expect(() =>
      cell.commit(lease, target, f.builder({ invalidationKey: "changed" })),
    ).toThrow(CriteriaCommitError);
    expect(cell.getSnapshot().actor).toBeNull();
    expect(() => cell.require(a)).toThrow(CriteriaCommitError);
    const b = cell.commit(lease, target, f.builder());
    expect(() =>
      cell.commit(lease, target, f.builder({ evaluationMode: "client" })),
    ).toThrow(CriteriaCommitError);
    expect(() => cell.require(b)).toThrow(CriteriaCommitError);
    const c = cell.commit(
      lease,
      f.reset(),
      f.builder({ evaluationMode: "client", invalidationKey: "not-an-epoch" }),
    );
    expect(cell.require(c).ports.evaluationMode).toBe("client");
  });

  it("checks current frame/owner before props; rejects copied/proxied tools and pins first committed owner", () => {
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("search", f.app.C),
      lease = cell.connect();
    const read = vi.fn();
    const opaque = new Proxy({}, { getOwnPropertyDescriptor: read });
    for (const authority of [
      { ...target.authority },
      new Proxy(target.authority, {}),
    ]) {
      expect(() =>
        cell.commit(
          lease,
          {
            owner: target.owner,
            authority: authority as CriteriaToolAuthority<S>,
          },
          opaque,
        ),
      ).toThrow(CriteriaCommitError);
    }
    expect(read).not.toHaveBeenCalled();
    const other = f.secondOwner(),
      otherTarget = f.commit(other);
    // A candidate that was never committed must not pin the first owner.
    const a = cell.commit(lease, target, f.search());
    expect(() => cell.commit(lease, otherTarget, opaque)).toThrow(
      CriteriaCommitError,
    );
    expect(() => cell.require(a)).toThrow(CriteriaCommitError);
    expect(read).not.toHaveBeenCalled();
    f.commit(); // Retires target's real frame without publication transition.
    expect(() => cell.commit(lease, target, opaque)).toThrow(
      CriteriaCommitError,
    );
    expect(read).not.toHaveBeenCalled();
  });

  it("denies unknown P2 before private props without treating equal labels/epoch as provenance", () => {
    const f = fixture(),
      cell = createCriteriaCommitCell("search", f.app.C),
      lease = cell.connect();
    const p2 = createCriteriaPublication({
      controller: f.app.C,
      definition: f.app.CD,
      retirement: { retire: () => undefined },
    });
    expect(
      p2.begin({
        controller: f.app.C,
        definition: f.app.CD,
        expected: f.context,
        actual: f.context,
      }).status,
    ).toBe("blocked");
    const target = f.commit();
    const lookalike = { ...target.owner, publication: p2 };
    const read = vi.fn();
    expect(() =>
      cell.commit(
        lease,
        { owner: lookalike, authority: target.authority },
        new Proxy({}, { getOwnPropertyDescriptor: read }),
      ),
    ).toThrow(CriteriaCommitError);
    expect(read).not.toHaveBeenCalled();
    expect(() =>
      createCriteriaFrames({
        nativeDefinition: f.native,
        controller: f.app.C,
        publication: p2,
        criteria: f.app.authority(),
      }),
    ).toThrow();
  });

  it("reflection reentry invalidates candidate/current actor without leaking copied ports", () => {
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("builder", f.app.C),
      lease = cell.connect();
    const a = cell.commit(lease, target, f.builder());
    const privateCall = vi.fn(() => "never");
    let entered = false,
      nestedDenied = false;
    const props = new Proxy(f.builder({ createRuleId: privateCall }), {
      getOwnPropertyDescriptor(value, key) {
        if (key === "createRuleId" && !entered) {
          entered = true;
          try {
            cell.commit(lease, target, f.builder());
          } catch (error) {
            nestedDenied = error instanceof CriteriaCommitError;
          }
        }
        return Reflect.getOwnPropertyDescriptor(value, key);
      },
    });
    expect(() => cell.commit(lease, target, props)).toThrow(
      CriteriaCommitError,
    );
    expect(cell.getSnapshot().actor).toBeNull();
    expect(() => cell.require(a)).toThrow(CriteriaCommitError);
    expect(nestedDenied).toBe(true);
    expect(privateCall).not.toHaveBeenCalled();
  });

  it("P.begin inside reflection denies capture; cleanup never uses permission readers", () => {
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("builder", f.app.C),
      lease = cell.connect();
    cell.commit(lease, target, f.builder());
    let began = false;
    const props = new Proxy(f.builder(), {
      getOwnPropertyDescriptor(value, key) {
        if (key === "fields" && !began) {
          began = true;
          f.app.beginReset();
        }
        return Reflect.getOwnPropertyDescriptor(value, key);
      },
    });
    expect(() => cell.commit(lease, target, props)).toThrow(
      CriteriaCommitError,
    );
    expect(cell.getSnapshot().actor).toBeNull();
    cell.disconnect(lease); // Already-denied frame cannot be consulted by cleanup.
  });

  it("Strict/hide disconnect purges only local lifetime and stale leases cannot clear replacements", () => {
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("search", f.app.C);
    const text = cell.createLocal("text"),
      first = cell.connect();
    const a = cell.commit(first, target, f.search());
    text.write(a, "local edit");
    cell.disconnect(first);
    const second = cell.connect(),
      b = cell.commit(second, target, f.search());
    expect(text.read(b)).toBeNull();
    text.write(b, "replacement");
    cell.disconnect(first);
    expect(() => cell.commit(first, target, f.search())).toThrow(
      CriteriaCommitError,
    );
    expect(text.read(b)).toBe("replacement");
    expect(f.app.C.getSnapshot().selection).toEqual({ one: true });
    expect(f.app.P.getSnapshot().phase).toBe("settled");
  });

  it("requires actual remote request/resource frame proof and preserves controller availability while UI denies", () => {
    const f = fixture(),
      cell = createCriteriaCommitCell("date", f.app.C),
      lease = cell.connect();
    const actor = cell.commit(lease, f.remote(), f.search());
    expect(cell.require(actor).origin.controller).toBe(f.app.C);
    f.resource.setContext({ ...f.context, scopeKey: "replacement" });
    expect(() => cell.require(actor)).toThrow(CriteriaCommitError);
    expect(f.app.C.isDisposed()).toBe(false);
    expect(() => f.app.C.dispatch({ type: "selection.cancel" })).not.toThrow();
  });

  it("captures all four actual tool kinds; toolbar callbacks stay bare and postcallback revocation denies", () => {
    const f = fixture(),
      target = f.commit();
    const tabs = createCriteriaCommitCell("tabs", f.app.C),
      tabLease = tabs.connect();
    const tabActor = tabs.commit(tabLease, target, {
      ...f.search(),
      tabs: { all: { label: "All" }, active: { label: "Active" } },
      children: null,
    });
    expect(Object.keys(tabs.require(tabActor).ports.tabs)).toEqual([
      "all",
      "active",
    ]);
    const date = createCriteriaCommitCell("date", f.app.C),
      dateLease = date.connect();
    const dateActor = date.commit(dateLease, target, f.search());
    expect(date.require(dateActor).ports.messages).toBeUndefined();
    const search = createCriteriaCommitCell("search", f.app.C),
      searchLease = search.connect();
    let receiver: unknown = "not called";
    const searchActor = search.commit(
      searchLease,
      target,
      f.search({
        onMutation: function (this: unknown) {
          receiver = this;
        },
      }),
    );
    const command = { type: "selection.cancel" } as const,
      result = f.app.C.dispatch(command);
    required(search.require(searchActor).ports.onMutation)(result);
    expect(receiver).toBeUndefined();
    let builderReceiver: unknown;
    const props = f.builder({
      createRuleId() {
        builderReceiver = this;
        f.app.beginReset();
        return "stale";
      },
    });
    const builder = createCriteriaCommitCell("builder", f.app.C),
      lease = builder.connect();
    const actor = builder.commit(lease, target, props);
    expect(() =>
      required(builder.require(actor).ports.createRuleId)(),
    ).toThrow();
    expect(builderReceiver).toBe(props);
    expect(builder.getSnapshot().actor).toBeNull();
  });

  it("does not pin an invalid first configuration and does not acquire/reset a captured option source", () => {
    const f = fixture(),
      target = f.commit(),
      cell = createCriteriaCommitCell("builder", f.app.C),
      lease = cell.connect();
    expect(() =>
      cell.commit(lease, target, {
        ...f.builder(),
        invalidationKey: undefined,
      }),
    ).toThrow(CriteriaCommitError);
    const other = f.secondOwner(),
      otherTarget = f.commit(other);
    const invalidate = vi.fn(() => undefined),
      request = vi.fn();
    const context = { ...f.context, fieldId: "amount" };
    const source = createOptionSource<number>(context, {
      onInvalidate: invalidate,
    });
    const initial = source.getSnapshot();
    const actor = cell.commit(
      lease,
      otherTarget,
      f.builder({
        fields: {
          amount: {
            label: "Amount",
            asyncOptions: { idType: "number", source, onRequest: request },
          },
        },
      }),
    );
    expect(cell.require(actor).ports.fields.amount?.asyncOptions?.source).toBe(
      source,
    );
    cell.disconnect(lease);
    expect(source.getSnapshot()).toBe(initial);
    expect(invalidate).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
  });
});
