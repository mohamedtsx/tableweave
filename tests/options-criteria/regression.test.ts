import assert from "node:assert/strict";
import test from "node:test";
import type { CriteriaPublicationBeginResult } from "../../packages/react/src/controller/criteria-publication.js";
import type {
  FilterOption,
  OptionRequestInput,
  OptionSource,
} from "../../packages/react/src/filters/editor-types.js";
import {
  registerOptionCriteriaSource,
  OptionCriteriaError,
} from "../../packages/react/src/filters/options-criteria.js";
import {
  createOptionSource,
  projectOptionSourceView,
} from "../../packages/react/src/filters/options-source.js";
import {
  createCriteriaAuthority,
  requireCriteriaAuthority,
} from "../../packages/react/src/controller/criteria.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import { getOptionCriteriaCapability } from "../../packages/react/src/filters/options-criteria-core.js";
import { context, optionContext, owner, request, type S } from "./fixtures.js";

function bind(app: ReturnType<typeof owner>, source: OptionSource<string>) {
  return registerOptionCriteriaSource({
    publication: app.publication,
    criteria: app.issue(),
    fieldId: "choice",
    source,
  });
}
function pending(result: CriteriaPublicationBeginResult<S>) {
  assert.ok(result.ticket);
  return result.ticket;
}
function empty(source: OptionSource<string>) {
  const view = source.getSnapshot();
  assert.equal(view.page, null);
  assert.equal(view.request, null);
  assert.deepEqual(view.selected, []);
  assert.equal(view.canRetry, false);
  assert.equal(view.canChoose, false);
}

test("O01: real same-context publication purge clears page/known/IDs/retry before callbacks", () => {
  const app = owner();
  let invalidations = 0;
  let notices = 0;
  const source = createOptionSource<string>(optionContext, {
    onInvalidate(event) {
      invalidations++;
      empty(source);
      assert.equal(source.getSnapshot().display, "blocked");
      if (event.reason !== "unmount")
        assert.equal(app.publication.getSnapshot().current, null);
    },
  });
  const disconnect = source.connect();
  const release = bind(app, source);
  source.subscribe(() => {
    notices++;
  });
  const first = source.begin(request());
  assert.ok(first);
  source.setSelectedIds(optionContext, ["a"]);
  source.succeed(first, {
    options: [{ id: "a", label: "Synthetic A" }],
    hasMore: true,
  });
  const retry = source.begin(request());
  assert.ok(retry);
  source.fail(retry, "offline");
  const beforeNotice = notices;
  const next = app.begin();
  empty(source);
  assert.equal(invalidations, 1);
  assert.equal(notices, beforeNotice + 1); // cleanup notification, not purge
  assert.equal(
    source.succeed(retry, {
      options: [{ id: "a", label: "Late" }],
      hasMore: false,
    }),
    false,
  );
  assert.equal(
    source.recoverSelectedLabels(first, [{ id: "a", label: "Late" }]),
    false,
  );
  assert.equal(app.complete(pending(next)).status, "settled");
  assert.equal(source.begin(request()), null); // no automatic regrant
  const replacement = bind(app, source);
  release(); // exact stale release cannot erase or deactivate replacement
  const fresh = source.begin(request("fresh"));
  assert.ok(fresh);
  assert.equal(source.getSnapshot().request, fresh);
  replacement();
  disconnect();
});

test("O02: purge during request capture interrupts even a subsequently thrown trap", () => {
  for (const throws of [false, true]) {
    const app = owner();
    const source = createOptionSource<string>(optionContext);
    bind(app, source);
    let begun: CriteriaPublicationBeginResult<S> | undefined;
    const hostile = new Proxy(request(), {
      ownKeys(target) {
        begun = app.begin();
        empty(source);
        if (throws) throw new Error("Synthetic hostile capture");
        return Reflect.ownKeys(target);
      },
    });
    assert.equal(source.begin(hostile), null);
    empty(source);
    assert.ok(begun);
    assert.equal(app.complete(pending(begun)).status, "settled");
    bind(app, source);
    assert.ok(source.begin(request()));
  }
});

test("O02: guarded page/options/IDs/context/label captures cannot write past purge", () => {
  for (const operation of [
    "page",
    "options",
    "ids",
    "context",
    "labels",
  ] as const) {
    const app = owner();
    const source = createOptionSource<string>(optionContext);
    bind(app, source);
    const token = source.begin(request());
    assert.ok(token);
    source.setSelectedIds(optionContext, ["a"]);
    let begun: CriteriaPublicationBeginResult<S> | undefined;
    let laterDescriptors = 0;
    const trap = <T extends object>(value: T) =>
      new Proxy(value, {
        ownKeys(target) {
          begun = app.begin();
          return Reflect.ownKeys(target);
        },
        getOwnPropertyDescriptor(target, key) {
          laterDescriptors++;
          return Reflect.getOwnPropertyDescriptor(target, key);
        },
      });
    if (operation === "page")
      assert.equal(
        source.succeed(token, trap({ options: [], hasMore: false })),
        false,
      );
    if (operation === "options")
      assert.equal(
        source.succeed(token, {
          options: trap([{ id: "a", label: "Synthetic" }]),
          hasMore: false,
        }),
        false,
      );
    if (operation === "ids")
      assert.equal(source.setSelectedIds(optionContext, trap(["b"])), false);
    if (operation === "context")
      source.setContext(trap({ ...optionContext, scopeKey: "scope-b" }));
    if (operation === "labels")
      assert.equal(
        source.recoverSelectedLabels(
          token,
          trap([{ id: "a", label: "Synthetic" }]),
        ),
        false,
      );
    empty(source);
    assert.equal(laterDescriptors, 0); // stopped immediately after the reset trap
    assert.ok(begun);
    assert.equal(app.complete(pending(begun)).status, "settled");
  }
});

test("O02: notification-triggered reset prevents old retry transport", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  bind(app, source);
  let transports = 0;
  const input = {
    ...request(),
    retry: () => {
      transports++;
    },
  };
  const token = source.begin(input);
  assert.ok(token);
  source.fail(token, "offline");
  let begun: CriteriaPublicationBeginResult<S> | undefined;
  const unsubscribe = source.subscribe(() => {
    if (!begun) begun = app.begin();
  });
  assert.equal(source.retry(), null);
  assert.equal(transports, 0);
  assert.ok(begun);
  unsubscribe();
  assert.equal(app.complete(pending(begun)).status, "settled");
});

test("O02: publication denial WITHOUT source purge also stops an in-flight data capture", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  bind(app, source);
  let fail = true;
  const releaseOther = app.publication.registerParticipant(app.issue(), {
    purge: () => undefined,
    cleanup() {
      if (fail) throw new Error("Synthetic foreign cleanup debt");
      return undefined;
    },
  });
  const hostile = new Proxy(request(), {
    ownKeys(target) {
      releaseOther(); // real failed release denies P without purging other active participants
      return Reflect.ownKeys(target);
    },
  });
  assert.equal(source.begin(hostile), null);
  assert.equal(source.getSnapshot().request, null);
  fail = false;
  const next = app.begin();
  assert.equal(app.complete(pending(next)).status, "settled");
  bind(app, source);
});

test("O03: unsupported adopted acknowledgements never inspect then/species", () => {
  let thenReads = 0,
    constructorReads = 0;
  const poisoned = Object.defineProperty({}, "then", {
    get() {
      thenReads++;
      throw new Error("Do not read then");
    },
  });
  const promise = Object.defineProperty(Promise.resolve(), "constructor", {
    get() {
      constructorReads++;
      throw new Error("Do not inspect species");
    },
  });
  for (const result of [true, null, poisoned, promise]) {
    const app = owner();
    let bad = true;
    let calls = 0;
    const source = createOptionSource<string>(optionContext, {
      onInvalidate() {
        calls++;
        if (bad) return result;
      },
    });
    bind(app, source);
    const begun = app.begin();
    assert.equal(app.complete(pending(begun)).status, "blocked");
    empty(source);
    bad = false;
    assert.equal(app.complete(pending(begun)).status, "settled");
    assert.equal(calls, 3); // begin failed, complete failed, final explicit retry
  }
  assert.equal(thenReads, 0);
  assert.equal(constructorReads, 0);
});

test("O03/O04: notification debt retries only unacknowledged phases", () => {
  const app = owner();
  let invalidations = 0;
  const source = createOptionSource<string>(optionContext, {
    onInvalidate() {
      invalidations++;
    },
  });
  bind(app, source);
  let first = 0,
    second = 0,
    fail = true;
  source.subscribe(() => {
    first++;
  });
  source.subscribe(() => {
    second++;
    if (fail) throw new Error("Synthetic observer failure");
  });
  const begun = app.begin();
  assert.equal(first, 1);
  assert.equal(second, 1);
  assert.equal(invalidations, 1);
  fail = false;
  assert.equal(app.complete(pending(begun)).status, "settled");
  assert.equal(first, 1);
  assert.equal(second, 2);
  assert.equal(invalidations, 1);
});

test("O04: original target survives superseding transitions and ABA needs new registration", () => {
  const app = owner();
  let fail = true;
  const seen: string[] = [];
  const source = createOptionSource<string>(optionContext, {
    onInvalidate(event) {
      seen.push(event.next.scopeKey);
      if (fail) throw new Error("Synthetic cleanup failure");
    },
  });
  const old = bind(app, source);
  app.begin({ ...context, scopeKey: "scope-b" });
  fail = false;
  const latest = app.begin();
  assert.equal(app.complete(pending(latest)).status, "settled");
  assert.deepEqual(seen, ["scope-b", "scope-b"]);
  assert.equal(source.getSnapshot().context.scopeKey, "scope-b");
  assert.throws(() => bind(app, source), OptionCriteriaError);
  source.setContext(optionContext); // explicit actual source owner, not registration retagging
  const release = bind(app, source);
  old();
  assert.ok(source.begin(request()));
  release();
});

test("O05: registration neither connects nor repairs unmount active=false", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  const disconnect = source.connect();
  const release = bind(app, source);
  assert.throws(() => source.connect()); // no duplicate hidden acquisition
  release();
  disconnect();
  assert.equal(source.getSnapshot().active, false);
  const rebound = bind(app, source);
  assert.equal(source.begin(request()), null);
  const end = source.connect();
  assert.ok(source.begin(request()));
  rebound();
  end();
  source.dispose();
  assert.throws(() => bind(app, source), OptionCriteriaError);
});

test("O05: dispose interrupted by publication purge stays terminal and releases observers", () => {
  const app = owner();
  let begun: CriteriaPublicationBeginResult<S> | undefined;
  let notices = 0;
  const source = createOptionSource<string>(optionContext, {
    onInvalidate(event) {
      if (event.reason === "dispose") begun = app.begin();
    },
  });
  bind(app, source);
  source.subscribe(() => {
    notices++;
  });
  source.dispose();
  assert.equal(source.getSnapshot().kind, "disposed");
  assert.ok(begun);
  assert.equal(app.complete(pending(begun)).status, "settled");
  assert.equal(notices, 0);
  assert.equal(source.getSnapshot().kind, "disposed");
  assert.throws(() => bind(app, source), OptionCriteriaError);
  assert.equal(source.begin(request()), null);
});

test("O06: unknown/copy/proxy sources deny before any alleged source port or getter", () => {
  const app = owner();
  const genuine = createOptionSource<string>(optionContext);
  let reads = 0;
  const structural = Object.defineProperty({}, "getSnapshot", {
    get() {
      reads++;
      throw new Error("Private source");
    },
  });
  const proxy = new Proxy(genuine, {
    get() {
      reads++;
      throw new Error("Private source");
    },
    getPrototypeOf() {
      reads++;
      throw new Error("Private source");
    },
  });
  for (const source of [structural, { ...genuine }, proxy]) {
    assert.throws(
      () => bind(app, source as OptionSource<string>),
      OptionCriteriaError,
    );
  }
  assert.equal(reads, 0);
  assert.throws(
    () =>
      registerOptionCriteriaSource({
        publication: app.publication,
        criteria: app.issue(),
        fieldId: "other",
        source: genuine,
      }),
    OptionCriteriaError,
  );
  const plain = createCriteriaAuthority({
    origin: {
      controller: app.controller,
      definition: app.definition,
      context,
      epoch: 1,
    },
    readCurrent() {
      throw new Error("Unbound reader must not run");
    },
  });
  assert.throws(
    () =>
      registerOptionCriteriaSource({
        publication: app.publication,
        criteria: plain,
        fieldId: "choice",
        source: genuine,
      }),
    OptionCriteriaError,
  );
  bind(app, genuine); // denied attempts left no source claim
});

test("O06: exact publisher cannot be substituted with equal-valued origins", () => {
  const left = owner();
  const right = owner();
  const source = createOptionSource<string>(optionContext);
  assert.throws(
    () =>
      registerOptionCriteriaSource({
        publication: right.publication,
        criteria: left.issue(),
        fieldId: "choice",
        source,
      }),
    OptionCriteriaError,
  );
  bind(left, source);
  const other = createOptionSource<string>(optionContext);
  bind(right, other);
  left.begin();
  empty(source);
  assert.ok(other.begin(request()));
});

test("O06: disposed P1/new P2, SAME controller/definition/context/epoch1, still pins expected P", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  const oldCriteria = app.issue();
  const oldOrigin = getCriteriaPublicationBinding(oldCriteria)?.origin;
  assert.ok(oldOrigin);
  const oldRelease = registerOptionCriteriaSource({
    publication: app.publication,
    criteria: oldCriteria,
    fieldId: "choice",
    source,
  });
  assert.equal(app.publication.dispose().status, "disposed");
  const snapshot = app.controller.getSnapshot();
  let candidate: object | null = null;
  const second = createCriteriaPublication({
    controller: app.controller,
    definition: app.definition,
    retirement: {
      retire(event): undefined {
        // New app-owner certificate: predecessor P really disposed, source reset
        // acknowledged, no pending intent (the fixture controller is uncontrolled).
        assert.equal(app.publication.getSnapshot().phase, "disposed");
        assert.equal(event.next, candidate);
        assert.equal(app.controller.getSnapshot(), snapshot);
        assert.equal(Object.keys(snapshot.selection).length, 0);
        return undefined;
      },
    },
  });
  const begun = second.begin({
    controller: app.controller,
    definition: app.definition,
    expected: context,
    actual: context,
  });
  candidate = begun.snapshot.pending;
  assert.equal(second.complete(pending(begun)).status, "settled");
  const criteria = second.issue(oldOrigin);
  assert.doesNotThrow(() => requireCriteriaAuthority(criteria, oldOrigin)); // deliberate plain-helper behavior
  assert.throws(
    () =>
      registerOptionCriteriaSource({
        publication: app.publication,
        criteria,
        fieldId: "choice",
        source,
      }),
    OptionCriteriaError,
  );
  const release = registerOptionCriteriaSource({
    publication: second,
    criteria,
    fieldId: "choice",
    source,
  });
  const disconnect = source.connect();
  oldRelease();
  assert.ok(source.begin(request()));
  // Close the local source owner without inventing another P2 bootstrap certificate.
  release();
  disconnect();
});

test("O06/O08: unpublished internal reservation rolls back on failed final check", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  const capability = getOptionCriteriaCapability(source);
  assert.ok(capability);
  let checks = 0;
  assert.throws(
    () =>
      capability.reserve(optionContext, () => {
        if (++checks === 2)
          throw new Error("Synthetic failed registration check");
      }),
    OptionCriteriaError,
  );
  bind(app, source); // real publication registration remains available
});

test("O02/O06: registration notification reentry retains actual cleanup debt, no hidden claim leak", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  const criteria = app.issue();
  let begun: CriteriaPublicationBeginResult<S> | undefined;
  const unsubscribe = source.subscribe(() => {
    if (!begun) begun = app.begin();
  });
  assert.throws(
    () =>
      registerOptionCriteriaSource({
        publication: app.publication,
        criteria,
        fieldId: "choice",
        source,
      }),
    OptionCriteriaError,
  );
  empty(source);
  unsubscribe();
  assert.ok(begun);
  assert.throws(
    () =>
      registerOptionCriteriaSource({
        publication: app.publication,
        criteria,
        fieldId: "choice",
        source,
      }),
    OptionCriteriaError,
  );
  assert.equal(app.complete(pending(begun)).status, "settled");
  bind(app, source);
});

test("O07: actual owner distinguishes a known reset echo from a genuinely new revocation", () => {
  const app = owner();
  let ownReset = false,
    newRevocation = false;
  let calls = 0;
  const source = createOptionSource<string>(optionContext, {
    onInvalidate() {
      calls++;
      if (!ownReset || newRevocation) app.begin({ ...context, access: false });
    },
  });
  bind(app, source);
  ownReset = true;
  const first = app.begin();
  assert.equal(app.complete(pending(first)).status, "settled");
  bind(app, source);
  newRevocation = true;
  const second = app.begin();
  assert.equal(second.status, "blocked");
  empty(source);
  assert.equal(app.publication.getSnapshot().current, null);
  assert.equal(calls, 2); // no library echo suppression or automatic recursion
});

test("O08: empty public snapshots do not prove acknowledged source history", () => {
  const app = owner();
  const source = createOptionSource<string>(optionContext);
  const token = source.begin(request());
  assert.ok(token);
  source.succeed(token, { options: [], hasMore: false });
  assert.throws(() => bind(app, source), OptionCriteriaError);
  source.clear("reset");
  bind(app, source);
  assert.ok(source.begin(request()));
});

test("O08: busy void clear is not a source-history acknowledgement", () => {
  const app = owner();
  let attempted = 0;
  const source = createOptionSource<string>(optionContext, {
    onInvalidate() {
      empty(source);
      assert.equal(source.clear("reset"), undefined); // genuine legacy mutating noop
      assert.throws(() => bind(app, source), OptionCriteriaError);
      attempted++;
    },
  });
  const token = source.begin(request());
  assert.ok(token);
  source.clear("reset");
  assert.equal(attempted, 1);
  bind(app, source); // only after the outer real owner reset actually acknowledged
});

test("O04/O05: void release retains failed cleanup debt and cannot reactivate a replacement", () => {
  const app = owner();
  let fail = true;
  const source = createOptionSource<string>(optionContext, {
    onInvalidate() {
      if (fail) throw new Error("Synthetic release cleanup failure");
    },
  });
  const release = bind(app, source);
  assert.equal(release(), undefined);
  assert.equal(app.publication.getSnapshot().phase, "blocked");
  empty(source);
  fail = false;
  const next = app.begin();
  assert.equal(app.complete(pending(next)).status, "settled");
  const replacement = bind(app, source);
  assert.equal(source.begin(request()), null); // release/unmount active=false persisted
  const disconnect = source.connect();
  release();
  const token = source.begin(request());
  assert.ok(token);
  assert.equal(source.getSnapshot().request, token);
  replacement();
  disconnect();
});

test("raw controls: legacy nonvoid returns/refusals/selected labels/projection remain", () => {
  const receivers: unknown[] = [];
  const source = createOptionSource<string>(optionContext, {
    onInvalidate: function () {
      receivers.push(this);
      return true;
    },
  });
  const initial = source.getServerSnapshot();
  const first = source.begin(request());
  assert.ok(first);
  source.setSelectedIds(optionContext, ["a"]);
  source.succeed(first, {
    options: [{ id: "a", label: "Synthetic A" }],
    hasMore: true,
  });
  assert.equal(source.getSnapshot().selected[0]?.label, "Synthetic A");
  assert.equal(
    projectOptionSourceView(source.getSnapshot(), optionContext),
    source.getSnapshot(),
  );
  source.setContext(optionContext); // identical context is still no-op
  assert.equal(receivers.length, 0);
  source.clear();
  assert.equal(receivers[0], undefined);
  assert.equal(source.getSnapshot().invalidationFailed, false);
  assert.equal(source.getServerSnapshot(), initial);
  const app = owner();
  assert.throws(() => bind(app, source), OptionCriteriaError); // stricter adopted history, not legacy policy
  assert.ok(source.begin(request()));
});

test("raw controls: reentrant observer clear preserves legacy settlement return value", () => {
  const source = createOptionSource<string>(optionContext);
  const token = source.begin(request());
  assert.ok(token);
  let once = true;
  source.subscribe(() => {
    if (once) {
      once = false;
      source.clear("unmount");
    }
  });
  assert.equal(source.succeed(token, { options: [], hasMore: false }), true);
  assert.equal(source.getSnapshot().active, false);
});

// Type-only assertion that raw request/callback/options interfaces were not extended.
const unchanged: OptionRequestInput = request();
const supplied: readonly FilterOption<string>[] = [
  { id: "a", label: "Synthetic" },
];
void unchanged;
void supplied;
