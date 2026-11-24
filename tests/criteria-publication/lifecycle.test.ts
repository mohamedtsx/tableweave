import { expect, test } from "vitest";
import { CriteriaAuthorityError } from "../../packages/react/src/controller/criteria.js";
import type {
  CriteriaPublicationEvent,
  CriteriaPublicationParticipant,
} from "../../packages/react/src/controller/criteria-publication.js";
import type { S } from "./helpers.js";

test("current settled completion is idempotent; stale receipts do no app work", () => {
  const f = fixture();
  const first = settle(f);
  const before = f.publication.getSnapshot();
  expect(f.publication.complete(first.ticket).status).toBe("settled");
  expect(f.publication.cancel(first.ticket).status).toBe("stale");
  expect(f.publication.getSnapshot()).toBe(before);
  expect(f.calls()).toBe(1);
  const next = pending(f.publication.begin(f.next()));
  expect(f.publication.complete(first.ticket).status).toBe("stale");
  expect(f.publication.cancel(first.ticket).status).toBe("stale");
  expect(f.calls()).toBe(1);
  expect(f.publication.complete(next).status).toBe("settled");
});

test.each([false, Promise.resolve(undefined)])(
  "unsupported local purge acknowledgement stays blocked",
  (value) => {
    const f = fixture();
    const first = settle(f);
    f.publication.registerParticipant(
      first.authority,
      unsafe({
        purge() {
          return value;
        },
      }),
    );
    const result = f.publication.begin(f.next());
    expect(result).toMatchObject({ status: "blocked", reason: "purge" });
    expect(f.calls()).toBe(1);
  },
);

test("admitted completion notification cannot register or drain a new sink", () => {
  const f = fixture();
  const receipt = pending(f.publication.begin(f.next()));
  const a = f.publication.issue(origin(f.publication));
  let touches = 0;
  f.publication.subscribe({
    notify() {
      const p = poison();
      invalid(() => f.publication.registerParticipant(a, unsafe(p.value)));
      expect(p.calls()).toBe(0);
      touches++;
    },
  });
  expect(f.publication.complete(receipt).status).toBe("settled");
  expect(touches).toBe(1);
});

import {
  controller,
  fixture,
  invalid,
  origin,
  pending,
  poison,
  settle,
  unsafe,
} from "./helpers.js";

test("same-context reset purges exact cells before reflection, cleanup then retire", () => {
  const log: string[] = [];
  const f = fixture(controller(), (event) => {
    log.push(`retire:${event.kind}`);
  });
  const old = settle(f);
  log.length = 0;
  const previous = f.publication.getSnapshot().current;
  let cell = "synthetic-private-cell";
  let purgeEvent: CriteriaPublicationEvent<S> | undefined;
  let cleanupEvent: CriteriaPublicationEvent<S> | undefined;
  const port = {
    purge(event: CriteriaPublicationEvent<S>): undefined {
      expect(this).toBe(port);
      expect(() => old.authority.require()).toThrow(CriteriaAuthorityError);
      cell = "";
      log.push("purge");
      purgeEvent = event;
    },
    cleanup(event: CriteriaPublicationEvent<S>): undefined {
      expect(this).toBe(port);
      cleanupEvent = event;
      log.push("cleanup");
    },
  };
  const unsubscribe = f.publication.registerParticipant(old.authority, port);
  const payload = new Proxy(f.next(), {
    getPrototypeOf(target) {
      expect(cell).toBe("");
      log.push("reflection");
      return Reflect.getPrototypeOf(target);
    },
  });
  const receipt = pending(f.publication.begin(payload));
  const captured = f.publication.getSnapshot().pending;
  expect(purgeEvent?.next).toBeNull();
  expect(purgeEvent?.previous).toBe(previous);
  expect(cleanupEvent?.next).toBe(captured);
  expect(log).toEqual(["purge", "reflection", "cleanup"]);
  expect(f.publication.complete(receipt).status).toBe("settled");
  expect(log.at(-1)).toBe("retire:transition");
  const count = log.length;
  unsubscribe();
  expect(log).toHaveLength(count);
  expect(origin(f.publication).epoch).toBe(2);
});

test("partial phase retry acknowledges only owed phases and original events", () => {
  const f = fixture();
  const first = settle(f);
  let purgeCalls = 0;
  let cleanupCalls = 0;
  let fail = true;
  const purges: CriteriaPublicationEvent<S>[] = [];
  const cleanups: CriteriaPublicationEvent<S>[] = [];
  const unsubscribe = f.publication.registerParticipant(first.authority, {
    purge(event) {
      purgeCalls++;
      purges.push(event);
    },
    cleanup(event) {
      cleanupCalls++;
      cleanups.push(event);
      if (fail) throw 0;
    },
  });
  const result = f.publication.begin(f.next("b"));
  expect(result).toMatchObject({ status: "blocked", reason: "cleanup" });
  if (!result.ticket) throw new Error("Expected retry receipt");
  unsubscribe(); // Inactive debt may not be silently removed.
  expect(f.calls()).toBe(1);
  fail = false;
  expect(f.publication.complete(result.ticket).status).toBe("settled");
  expect([purgeCalls, cleanupCalls]).toEqual([1, 2]);
  expect(cleanups[0]).toBe(cleanups[1]);
  expect(purges[0]?.next).toBeNull();
  expect(cleanups[0]?.next).toBe(f.publication.getSnapshot().current);
});

test("failed purge may still clean source, but retirement waits for both acknowledgements", () => {
  const f = fixture();
  const first = settle(f);
  let fail = true;
  const calls = [0, 0];
  f.publication.registerParticipant(first.authority, {
    purge() {
      calls[0] = (calls[0] ?? 0) + 1;
      if (fail) throw 0;
    },
    cleanup() {
      calls[1] = (calls[1] ?? 0) + 1;
    },
  });
  const result = f.publication.begin(f.next());
  if (!result.ticket) throw new Error("Expected retry receipt");
  expect(f.publication.complete(result.ticket).status).toBe("blocked");
  expect(f.calls()).toBe(1);
  fail = false;
  expect(f.publication.complete(result.ticket).status).toBe("settled");
  expect(calls).toEqual([3, 1]);
});

test("carried inactive cleanup uses its original next, not newer domain config", () => {
  const f = fixture();
  const first = settle(f);
  let fail = true;
  const events: CriteriaPublicationEvent<S>[] = [];
  f.publication.registerParticipant(first.authority, {
    purge() {},
    cleanup(event) {
      events.push(event);
      if (fail) throw 0;
    },
  });
  f.publication.begin(f.next("b"));
  fail = false;
  const c = pending(f.publication.begin(f.next("c")));
  expect(events[0]).toBe(events[1]);
  expect(events[1]?.next?.expected.scopeKey).toBe("b");
  expect(f.publication.complete(c).status).toBe("settled");
  expect(origin(f.publication).context.scopeKey).toBe("c");
});

test("retired sink and stale unsubscribe cannot clear a reused port's new domain", () => {
  const f = fixture();
  const first = settle(f);
  let purges = 0;
  const port = {
    purge(): undefined {
      purges++;
    },
  };
  const oldRelease = f.publication.registerParticipant(first.authority, port);
  invalid(() => f.publication.registerParticipant(first.authority, port));
  const second = settle(f, "b");
  expect(purges).toBe(1);
  const freshRelease = f.publication.registerParticipant(
    second.authority,
    port,
  );
  oldRelease();
  expect(purges).toBe(1);
  expect(second.authority.require().epoch).toBe(2);
  freshRelease();
  expect(purges).toBe(2);
  freshRelease();
  expect(purges).toBe(2);
  expect(second.authority.require().epoch).toBe(2);
});

test("normal participant release does not reset other tools or global domain", () => {
  const f = fixture();
  const first = settle(f);
  let a = 0;
  let b = 0;
  const before = f.publication.getSnapshot();
  const release = f.publication.registerParticipant(first.authority, {
    purge() {
      a++;
      expect(() => first.authority.require()).toThrow(CriteriaAuthorityError);
    },
  });
  f.publication.registerParticipant(first.authority, {
    purge() {
      b++;
    },
  });
  release();
  expect([a, b, f.calls()]).toEqual([1, 0, 1]);
  expect(f.publication.getSnapshot()).toBe(before);
  expect(first.authority.require().epoch).toBe(1);
});

test("failed release cannot republish through the old completed ticket", () => {
  const f = fixture();
  const first = settle(f);
  let fail = true;
  const release = f.publication.registerParticipant(first.authority, {
    purge() {
      if (fail) throw 0;
    },
    cleanup() {
      expect(f.publication.getSnapshot().pending).toBeNull();
      expect(f.publication.complete(first.ticket).status).toBe("stale");
    },
  });
  expect(release).not.toThrow();
  expect(f.publication.getSnapshot()).toMatchObject({
    phase: "blocked",
    current: null,
    pending: null,
  });
  expect(f.publication.complete(first.ticket).status).toBe("stale");
  fail = false;
  expect(settle(f).authority.require().epoch).toBe(2);
});

test("reentrant release of another active participant blocks and retains cleanup", () => {
  const f = fixture();
  const first = settle(f);
  let count = 0;
  const other = f.publication.registerParticipant(first.authority, {
    purge() {
      count++;
    },
  });
  const release = f.publication.registerParticipant(first.authority, {
    purge() {
      other();
    },
  });
  release();
  expect(f.publication.getSnapshot().failure).toBe("reentrant");
  expect(count).toBe(0);
  expect(settle(f).authority.require().epoch).toBe(2);
  expect(count).toBe(1);
});

test("all local purges precede all cleanups and required app retirement", () => {
  const log: string[] = [];
  const f = fixture(controller(), () => {
    log.push("retire");
  });
  const first = settle(f);
  log.length = 0;
  for (const id of ["a", "b", "c"])
    f.publication.registerParticipant(first.authority, {
      purge() {
        log.push(`purge:${id}`);
      },
      cleanup() {
        log.push(`cleanup:${id}`);
      },
    });
  settle(f);
  expect(log).toEqual([
    "purge:a",
    "purge:b",
    "purge:c",
    "cleanup:a",
    "cleanup:b",
    "cleanup:c",
    "retire",
  ]);
});

test.each(["purge", "cleanup"] as const)(
  "%s reentry stops stale callback continuation and retains claim",
  (phase) => {
    const f = fixture();
    const first = settle(f);
    const log: string[] = [];
    let reenter = true;
    f.publication.registerParticipant(first.authority, {
      purge() {
        log.push("p1");
        if (phase === "purge" && reenter) f.publication.begin(f.next());
      },
      cleanup() {
        log.push("c1");
        if (phase === "cleanup" && reenter) f.publication.begin(f.next());
      },
    });
    f.publication.registerParticipant(first.authority, {
      purge() {
        log.push("p2");
      },
      cleanup() {
        log.push("c2");
      },
    });
    expect(f.publication.begin(f.next())).toMatchObject({
      status: "blocked",
      reason: "reentrant",
      ticket: null,
    });
    if (phase === "purge") expect(log).toEqual(["p1"]);
    else expect(log).toEqual(["p1", "p2", "c1"]);
    reenter = false;
    expect(settle(f).authority.require().epoch).toBe(3);
  },
);

test.each(["purge", "cleanup"] as const)(
  "unsupported %s result blocks without probing then/species",
  (phase) => {
    const f = fixture();
    const first = settle(f);
    const result = poison();
    const port = unsafe<CriteriaPublicationParticipant<S>>({
      purge() {
        if (phase === "purge") return result.value;
      },
      cleanup() {
        if (phase === "cleanup") return result.value;
      },
    });
    f.publication.registerParticipant(first.authority, port);
    const next = f.publication.begin(f.next());
    expect(next).toMatchObject({ status: "blocked", reason: phase });
    expect(result.calls()).toBe(0);
    expect(f.calls()).toBe(1);
  },
);

test("dispose drains owed phases without rearming acknowledgements before retirement", () => {
  const f = fixture();
  const first = settle(f);
  let bad = true;
  let p = 0;
  let c = 0;
  f.publication.registerParticipant(first.authority, {
    purge() {
      p++;
    },
    cleanup() {
      c++;
      if (bad) throw 0;
    },
  });
  expect(f.publication.dispose().status).toBe("blocked");
  expect(f.calls()).toBe(1);
  bad = false;
  expect(f.publication.dispose().status).toBe("disposed");
  expect([p, c, f.calls()]).toEqual([1, 2, 2]);
});

test("snapshot versions stable, frozen and not a cached permission boolean", () => {
  const f = fixture();
  const blank = f.publication.getSnapshot();
  expect(f.publication.getSnapshot()).toBe(blank);
  expect(Object.isFrozen(blank)).toBe(true);
  expect(Object.isFrozen(blank.version)).toBe(true);
  const first = settle(f);
  const current = f.publication.getSnapshot();
  expect(current.version).not.toBe(blank.version);
  expect(Object.isFrozen(current.current)).toBe(true);
  expect(Object.isFrozen(current.current?.expected)).toBe(true);
  f.publication.begin(f.next());
  expect(() => first.authority.require()).toThrow(CriteriaAuthorityError);
  expect(current.phase).toBe("settled");
});

test("passive observers are bounded, count-only, receiver-captured and cannot grant", () => {
  const f = fixture();
  const first = settle(f);
  const calls: string[] = [];
  let removals = () => {};
  const notifyPort = {
    notify(): undefined {
      expect(this).toBe(notifyPort);
      calls.push("first");
      expect(() => first.authority.require()).toThrow(CriteriaAuthorityError);
      removals();
      f.publication.begin(f.next());
    },
  };
  f.publication.subscribe(notifyPort);
  removals = f.publication.subscribe({
    notify() {
      calls.push("removed");
    },
  });
  f.publication.subscribe({
    notify() {
      calls.push(f.publication.getSnapshot().phase);
      throw poison().value;
    },
  });
  const result = f.publication.begin(f.next());
  expect(result).toMatchObject({
    status: "blocked",
    reason: "reentrant",
    notificationFailures: 1,
  });
  expect(calls).toEqual(["first", "blocked"]);
});

test("observer throw neither vetoes settled metadata nor acknowledges failed retirement", () => {
  let fail = false;
  const f = fixture(controller(), () => {
    if (fail) throw 0;
  });
  f.publication.subscribe({
    notify() {
      throw 0;
    },
  });
  const receipt = pending(f.publication.begin(f.next()));
  expect(f.publication.complete(receipt)).toMatchObject({
    status: "settled",
    notificationFailures: 1,
  });
  fail = true;
  const second = pending(f.publication.begin(f.next()));
  expect(f.publication.complete(second)).toMatchObject({
    status: "blocked",
    reason: "retirement",
    notificationFailures: 1,
  });
});

test("no initial notify; each explicit subscription has its own unsubscribe", () => {
  const f = fixture();
  let count = 0;
  const port = {
    notify(): undefined {
      count++;
    },
  };
  const old = f.publication.subscribe(port);
  f.publication.subscribe(port);
  old();
  old();
  expect(count).toBe(0);
  settle(f);
  expect(count).toBe(2);
});

test("actual scope/definition/access ABA and unrelated accepted commands", () => {
  const f = fixture();
  const first = settle(f);
  for (const command of [
    { type: "sorting.change", update: [{ id: "name", desc: false }] },
    { type: "pagination.change", update: { pageIndex: 2, pageSize: 10 } },
  ] as const) {
    f.owner.dispatch(command);
    expect(first.authority.require().epoch).toBe(1);
  }
  const denied = pending(f.publication.begin(f.next("b", false)));
  const deniedAuthority = f.publication.issue(origin(f.publication));
  f.publication.complete(denied);
  expect(() => deniedAuthority.require()).toThrow(CriteriaAuthorityError);
  expect(settle(f).authority.require().epoch).toBe(3);
  expect(() => first.authority.require()).toThrow(CriteriaAuthorityError);
  const mismatch = f.next();
  const receipt = pending(
    f.publication.begin({
      ...mismatch,
      actual: { ...mismatch.actual, definitionKey: "other" },
    }),
  );
  const a = f.publication.issue(origin(f.publication));
  f.publication.complete(receipt);
  expect(() => a.require()).toThrow(CriteriaAuthorityError);
});
