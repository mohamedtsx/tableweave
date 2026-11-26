import {
  createCriteriaFrames,
  createCriteriaPublication,
} from "@tableweave/react";
import { describe, expect, it } from "vitest";
import {
  captureCriteriaCandidate,
  createCriteriaToolbarStore,
} from "../../packages/heroui/src/toolbar/criteria-tool-host.js";
import { createCriteriaSearchLocal } from "../../packages/heroui/src/toolbar/filter-search.js";
import { records } from "../criteria-commit/fixtures.js";
import type { S } from "./fixtures.js";
import { fixture, required } from "./fixtures.js";

describe("Search/Tabs actual host provenance (authored, NOT executed)", () => {
  it("is inert until layout; envelope copy/transparent proxy retain real contained proofs", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      );
    expect(store.read()).toBeNull();
    expect(store.getMode()).toBeNull();
    const unmount = store.mount();
    expect(store.read()).toBeNull();
    for (const criteria of [
      f.target,
      { ...f.target },
      new Proxy(f.target, {}),
    ]) {
      const props = f.search({ criteria });
      expect(captureCriteriaCandidate<S>(props).kind).toBe("target");
      store.commit(props);
      expect(required(store.read()).origin.controller).toBe(f.app.C);
    }
    unmount();
    expect(store.read()).toBeNull();
    expect(f.app.P.getSnapshot().phase).toBe("settled");
  });

  it("invalid target/discriminant never reads private getters or alleged props.controller", () => {
    const f = fixture();
    let privateReads = 0;
    const never = () => {
      privateReads++;
      throw new Error("Must not traverse private data");
    };
    const raw = () =>
      Object.defineProperties(
        {},
        Object.fromEntries(
          [
            "controller",
            "messages",
            "tabs",
            "children",
            "onMutation",
            "disabled",
            "className",
          ].map((key) => [key, { get: never }]),
        ),
      );
    const candidates = [
      Object.assign(raw(), { criteria: undefined }),
      Object.assign(raw(), { criteria: null }),
      Object.defineProperty(raw(), "criteria", { get: never }),
      Object.setPrototypeOf(raw(), { criteria: f.target }),
      Object.assign(raw(), {
        criteria: {
          owner: f.target.owner,
          authority: { ...f.target.authority },
        },
      }),
      Object.assign(raw(), {
        criteria: {
          owner: new Proxy(f.target.owner, {}),
          authority: f.target.authority,
        },
      }),
      Object.assign(raw(), {
        criteria: {
          owner: f.target.owner,
          authority: new Proxy(f.target.authority, {}),
        },
      }),
      Object.assign(raw(), {
        criteria: Object.create({
          owner: f.target.owner,
          authority: f.target.authority,
        }),
      }),
      Object.assign(raw(), {
        criteria: Object.defineProperty(
          { owner: f.target.owner },
          "authority",
          { get: never },
        ),
      }),
    ];
    for (const input of candidates) {
      const store = createCriteriaToolbarStore(
          "search",
          createCriteriaSearchLocal<S>,
        ),
        stop = store.mount();
      expect(captureCriteriaCandidate<S>(input).kind).toBe("denied");
      store.commit(input);
      expect(store.read()).toBeNull();
      expect(store.getMode()).toBeNull();
      stop();
    }
    expect(privateReads).toBe(0);
  });

  it("pins mode/owner only at successful commit; invalid initial configs do not pin", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    const bad = {
      ...f.search(),
      expectedContext: { ...f.context, scopeKey: "wrong" },
    };
    store.commit(bad);
    expect(store.getMode()).toBeNull();
    const otherOwner = f.secondOwner(),
      other = f.commit(otherOwner);
    store.commit(f.search({ criteria: other }));
    const first = required(store.read());
    expect(store.getMode()).toBe("adopted");
    let read = 0;
    const foreign = Object.defineProperty({ criteria: f.target }, "messages", {
      get() {
        read++;
        throw new Error("Foreign private");
      },
    });
    store.commit(foreign);
    expect(store.read()).toBeNull();
    expect(read).toBe(0);
    expect(() => store.require(first.actor)).toThrow();
    // Dropping criteria is invalid, never a downgrade to raw.
    const omitted = { controller: f.app.C, expectedContext: f.context };
    store.commit(omitted);
    expect(store.getMode()).toBe("adopted");
    expect(store.read()).toBeNull();
    stop();
    const raw = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      close = raw.mount();
    raw.commit(omitted);
    expect(raw.getMode()).toBe("legacy");
    raw.commit(f.search());
    expect(raw.getMode()).toBe("legacy");
    expect(raw.read()).toBeNull();
    close();
  });

  it("merely captured/abandoned B does not replace A; actual B retires saved A", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    store.commit(f.search());
    const a = required(store.read());
    a.local.draft.write(a.actor, {
      text: "owned",
      base: "",
      sequence: 1,
      deadline: null,
    });
    let reads = 0;
    const b = Object.defineProperty(f.search(), "messages", {
      get() {
        reads++;
        throw new Error("Abandoned B");
      },
    });
    captureCriteriaCandidate<S>(b);
    expect(store.require(a.actor).local.draft.read(a.actor)?.text).toBe(
      "owned",
    );
    expect(reads).toBe(0);
    store.commit(f.search());
    const next = required(store.read());
    expect(next.actor).not.toBe(a.actor);
    expect(() => store.require(a.actor)).toThrow();
    expect(next.local.draft.read(next.actor)?.text).toBe("owned");
    stop();
  });

  it("layout reflection reentry invalidates the host operation before private ports", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    store.commit(f.search());
    const a = required(store.read());
    let nestedDenied = false,
      privateReads = 0;
    const input = new Proxy(
      Object.defineProperty(f.search(), "messages", {
        get() {
          privateReads++;
          throw new Error("Must not reach private capture");
        },
      }),
      {
        getOwnPropertyDescriptor(object, key) {
          if (key === "className") {
            try {
              store.commit(f.search());
            } catch {
              nestedDenied = true;
            }
          }
          return Reflect.getOwnPropertyDescriptor(object, key);
        },
      },
    );
    store.commit(input);
    expect(nestedDenied).toBe(true);
    expect(privateReads).toBe(0);
    expect(store.read()).toBeNull();
    expect(() => store.require(a.actor)).toThrow();
    stop();
  });

  it("a failed initial C candidate cannot pin C; real target proof precedes the alleged controller getter", () => {
    const f = fixture(),
      next = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    let getters = 0;
    store.commit(
      Object.defineProperty(f.search(), "controller", {
        get() {
          getters++;
          throw new Error("Alleged C reader");
        },
      }),
    );
    expect(getters).toBe(0);
    expect(store.getMode()).toBeNull();
    store.commit(next.search());
    expect(required(store.read()).origin.controller).toBe(next.app.C);
    store.commit(f.search());
    expect(store.read()).toBeNull();
    stop();
  });

  it("actual P purge clears cells before cleanup; disconnected stale cleanup cannot clear replacement", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    store.commit(f.search());
    const a = required(store.read());
    a.local.notice.write(a.actor, "Synthetic");
    let nullDuringPurge = false;
    f.app.P.registerParticipant(f.app.authority(), {
      purge() {
        nullDuringPurge =
          store.read() === null && a.cell.getSnapshot().actor === null;
        return undefined;
      },
    });
    const begun = f.app.beginReset();
    expect(nullDuringPurge).toBe(true);
    expect(store.read()).toBeNull();
    if (begun.status !== "pending")
      throw new Error("Real reset ticket missing");
    expect(f.app.completeReset(begun.ticket).status).toBe("settled");
    store.commit(f.search({ criteria: f.commit(), invalidationKey: "new" }));
    expect(
      required(store.read()).local.notice.read(required(store.read()).actor),
    ).toBeNull();
    stop();
    const replacementStop = store.mount();
    store.commit(f.search({ criteria: f.commit(), invalidationKey: "new" }));
    const b = required(store.read());
    b.local.notice.write(b.actor, "replacement");
    stop();
    expect(b.local.notice.read(b.actor)).toBe("replacement");
    replacementStop();
  });

  it("P2/equal labels, copied owner and context ABA do not relink an old callback", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    store.commit(f.search());
    const a = required(store.read());
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
    let reads = 0;
    store.commit(
      Object.defineProperty(
        {
          criteria: {
            owner: { ...f.target.owner, publication: p2 },
            authority: f.target.authority,
          },
        },
        "messages",
        {
          get() {
            reads++;
            return {};
          },
        },
      ),
    );
    expect(reads).toBe(0);
    expect(store.read()).toBeNull();
    f.reset();
    store.commit(f.search());
    expect(() => store.require(a.actor)).toThrow();
    expect(required(store.read()).origin.epoch).not.toBe(a.origin.epoch);
    stop();
  });

  it("an actual replacement P2 with equal C/CD/context/epoch cannot adopt the P1-pinned instance", () => {
    const f = fixture(),
      store = createCriteriaToolbarStore(
        "search",
        createCriteriaSearchLocal<S>,
      ),
      stop = store.mount();
    store.commit(f.search());
    const a = required(store.read());
    // Application-owned P1 disposal genuinely rejects/clears its known domain;
    // C remains the same real controller. No producer method is monkeypatched.
    expect(f.app.P.dispose().status).toBe("disposed");
    const p2 = createCriteriaPublication({
      controller: f.app.C,
      definition: f.app.CD,
      retirement: {
        retire() {
          const result = f.app.C.dispatch({ type: "selection.cancel" });
          if (result.status === "rejected")
            throw new Error("Actual retirement rejected");
          if (result.status === "proposed") {
            const accepted = f.app.C.accept(result.proposal);
            if (accepted.status !== "committed" && accepted.status !== "noop")
              throw new Error("Actual retirement not accepted");
          }
          if (Object.keys(f.app.C.getSnapshot().selection).length !== 0)
            throw new Error("Actual retirement not acknowledged");
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
    const origin = {
      controller: f.app.C,
      definition: f.app.CD,
      context: f.context,
      epoch: begun.snapshot.pending.epoch,
    };
    const authority = p2.issue(origin);
    const frames = createCriteriaFrames({
      nativeDefinition: f.native,
      controller: f.app.C,
      publication: p2,
      criteria: authority,
    });
    expect(p2.complete(begun.ticket).status).toBe("settled");
    expect(origin.epoch).toBe(a.origin.epoch);
    const frame = frames.commit(
      frames.prepare({
        criteria: authority,
        expected: f.context,
        source: { mode: "client", context: f.context, records },
        nativeInput: { mode: "client", records },
      }),
    );
    const pair = frames.issue(frame);
    let privateReads = 0;
    const input = Object.defineProperty(
      f.search({ criteria: { owner: pair.owner, authority: pair.tool } }),
      "messages",
      {
        get() {
          privateReads++;
          throw new Error("Replacement private props");
        },
      },
    );
    store.commit(input);
    expect(store.read()).toBeNull();
    expect(privateReads).toBe(0);
    expect(() => store.require(a.actor)).toThrow();
    stop();
    expect(p2.dispose().status).toBe("disposed");
  });
});
