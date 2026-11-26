import {
  createCriteriaFrames,
  createCriteriaPublication,
} from "@tableweave/react";
import { expect, it } from "vitest";
import {
  readCriteriaDateToolbar,
  requireCriteriaDateState,
} from "../../packages/heroui/src/date/criteria-date-state.js";
import { createCriteriaToolbarStore } from "../../packages/heroui/src/toolbar/criteria-tool-host.js";
import {
  createCriteriaDateLocal,
  criteriaDate,
} from "../../packages/heroui/src/toolbar/filter-date.js";
import type { S } from "./fixtures.js";
import { fixture, required } from "./fixtures.js";

it("inert host reads no private props until genuine committed Date capture; target envelopes are structural", () => {
  const f = fixture(),
    store = createCriteriaToolbarStore("date", createCriteriaDateLocal<S>);
  expect(store.read()).toBeNull();
  expect(store.getMode()).toBeNull();
  const stop = store.mount();
  for (const criteria of [f.target, { ...f.target }, new Proxy(f.target, {})]) {
    store.commit(f.props({ criteria }));
    expect(required(store.read()).origin.controller).toBe(f.app.C);
  }
  stop();
  expect(store.read()).toBeNull();
  expect(f.app.C.isDisposed()).toBe(false);
  expect(f.app.P.getSnapshot().phase).toBe("settled");
});
it("undefined/null/inherited/accessor/malformed and copied contained proof deny before private props", () => {
  const f = fixture();
  let reads = 0;
  const bad = () => {
    reads++;
    throw new Error("Candidate private input");
  };
  const raw = () =>
    Object.defineProperties(
      {},
      Object.fromEntries(
        [
          "controller",
          "messages",
          "registry",
          "presets",
          "onMutation",
          "disabled",
          "className",
          "expectedContext",
        ].map((key) => [key, { get: bad }]),
      ),
    );
  for (const input of [
    Object.assign(raw(), { criteria: undefined }),
    Object.assign(raw(), { criteria: null }),
    Object.defineProperty(raw(), "criteria", { get: bad }),
    Object.setPrototypeOf(raw(), { criteria: f.target }),
    Object.assign(raw(), {
      criteria: { owner: { ...f.target.owner }, authority: f.target.authority },
    }),
    Object.assign(raw(), {
      criteria: { owner: f.target.owner, authority: { ...f.target.authority } },
    }),
    Object.assign(raw(), {
      criteria: {
        owner: f.target.owner,
        authority: new Proxy(f.target.authority, {}),
      },
    }),
  ]) {
    const store = createCriteriaToolbarStore(
        "date",
        createCriteriaDateLocal<S>,
      ),
      stop = store.mount();
    store.commit(input);
    expect(store.read()).toBeNull();
    stop();
  }
  expect(reads).toBe(0);
});
it("actual commit pins mode/owner; dropping criteria cannot mount legacy and clears local state", () => {
  const f = fixture(),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  criteriaDate.open(f.store, a.actor);
  const handle = required(
    readCriteriaDateToolbar(a.local.bundle, a.actor).handle,
  );
  f.store.commit({ controller: f.app.C, expectedContext: f.context });
  expect(f.store.getMode()).toBe("adopted");
  expect(f.store.read()).toBeNull();
  expect(() => requireCriteriaDateState(handle)).toThrow();
  expect(f.app.C.getSnapshot().selection).toEqual({ one: true });
  stop();
});
it("real reset epoch ABA cannot relink a P1 callback", () => {
  const f = fixture(),
    stop = f.store.mount();
  f.store.commit(f.props());
  const original = required(f.store.read());
  criteriaDate.open(f.store, original.actor);
  const handle = required(
    readCriteriaDateToolbar(original.local.bundle, original.actor).handle,
  );
  f.reset();
  f.store.commit(f.props());
  const a = required(f.store.read());
  expect(a.origin.epoch).not.toBe(original.origin.epoch);
  expect(() => requireCriteriaDateState(handle)).toThrow();
  criteriaDate.apply(f.store, original.actor);
  expect(f.observed).toHaveLength(0);
  stop();
});
it("equal C/CD/context/epoch from a genuine P2 cannot relink a P1 callback", () => {
  const f = fixture(),
    stop = f.store.mount();
  f.store.commit(f.props());
  const a = required(f.store.read());
  expect(f.app.P.dispose().status).toBe("disposed");
  const p2 = createCriteriaPublication({
    controller: f.app.C,
    definition: f.app.CD,
    retirement: {
      retire() {
        const result = f.app.C.dispatch({ type: "selection.cancel" });
        if (result.status === "rejected")
          throw new Error("Retirement rejected");
        if (result.status === "proposed") {
          const accepted = f.app.C.accept(result.proposal);
          if (accepted.status !== "committed" && accepted.status !== "noop")
            throw new Error("Retirement unaccepted");
        }
        if (Object.keys(f.app.C.getSnapshot().selection).length)
          throw new Error("Retirement unacknowledged");
        return undefined;
      },
    },
  });
  const begun = p2.begin({
    controller: f.app.C,
    definition: f.app.CD,
    expected: f.context,
    actual: f.context,
  });
  if (begun.status !== "pending" || !begun.snapshot.pending)
    throw new Error("Actual P2 admission missing");
  expect(begun.snapshot.pending.epoch).toBe(a.origin.epoch);
  const authority = p2.issue({
      controller: f.app.C,
      definition: f.app.CD,
      context: f.context,
      epoch: begun.snapshot.pending.epoch,
    }),
    frames = createCriteriaFrames({
      nativeDefinition: f.native,
      controller: f.app.C,
      publication: p2,
      criteria: authority,
    });
  expect(p2.complete(begun.ticket).status).toBe("settled");
  const frame = frames.commit(
      frames.prepare({
        criteria: authority,
        expected: f.context,
        source: { mode: "client", context: f.context, records: f.records },
        nativeInput: { mode: "client", records: f.records },
      }),
    ),
    pair = frames.issue(frame);
  let reads = 0;
  const input = Object.defineProperty(
    f.props({ criteria: { owner: pair.owner, authority: pair.tool } }),
    "messages",
    {
      get() {
        reads++;
        throw new Error("P2 private configuration");
      },
    },
  );
  f.store.commit(input);
  expect(f.store.read()).toBeNull();
  expect(reads).toBe(0);
  expect(() => f.store.require(a.actor)).toThrow();
  stop();
  expect(p2.dispose().status).toBe("disposed");
});
