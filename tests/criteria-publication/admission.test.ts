import { expect, test } from "vitest";
import {
  CriteriaAuthorityError,
  requireCriteriaAuthority,
} from "../../packages/react/src/controller/criteria.js";
import type {
  CriteriaPublicationNext,
  CriteriaPublicationTicket,
} from "../../packages/react/src/controller/criteria-publication.js";
import {
  createCriteriaPublication,
  getCriteriaPublicationBinding,
} from "../../packages/react/src/controller/criteria-publication.js";
import type { S } from "./helpers.js";
import {
  controller,
  fixture,
  invalid,
  origin,
  pending,
  poison,
  settle,
  trapped,
  unsafe,
} from "./helpers.js";

test("A01 duplicate discarded construction does not claim the real controller", () => {
  const owner = controller();
  const discarded = fixture(owner);
  const f = fixture(owner);
  expect(discarded.publication.getSnapshot().phase).toBe("unready");
  expect(settle(f).authority.require().epoch).toBe(1);
  expect(discarded.calls()).toBe(0);
});
test.each([false, true])(
  "A02 active/closing owner does not prohibit construction (%s)",
  (closing) => {
    let fail = false;
    const a = fixture(controller(), () => {
      if (fail) throw 0;
    });
    const grant = settle(a);
    if (closing) {
      fail = true;
      a.publication.dispose();
    }
    const before = a.publication.getSnapshot();
    const b = fixture(a.owner);
    expect(a.publication.getSnapshot()).toBe(before);
    if (!closing) expect(grant.authority.require().epoch).toBe(1);
    expect(b.publication.getSnapshot().phase).toBe("unready");
  },
);
test("A03 constructor trap can construct another same-controller instance", () => {
  const owner = controller();
  const f = fixture(owner);
  let other: ReturnType<typeof fixture> | undefined;
  const publication = createCriteriaPublication(
    trapped(
      { controller: owner, definition: f.definition, retirement: f.retirement },
      () => {
        other = fixture(owner);
      },
    ),
  );
  expect(publication.getSnapshot().phase).toBe("unready");
  expect(other?.publication.getSnapshot().phase).toBe("unready");
  expect(settle(f).authority.require().epoch).toBe(1);
});
test("A04 unclaimed issue rejects before poisoned origin reflection", () => {
  const f = fixture();
  const p = poison();
  invalid(() => f.publication.issue(unsafe(p.value)));
  expect(p.calls()).toBe(0);
});
test("A05 invalid first begin takes no epoch or claim", () => {
  const f = fixture();
  expect(f.publication.begin(unsafe({}))).toMatchObject({
    status: "blocked",
    reason: "invalid-input",
    ticket: null,
  });
  expect(f.calls()).toBe(0);
  expect(settle(fixture(f.owner)).authority.require().epoch).toBe(1);
});
test("A06 foreign conflict invokes no payload/port/observer and preserves writer", () => {
  const a = fixture();
  const grant = settle(a);
  const b = fixture(a.owner);
  const p = poison();
  let notifications = 0;
  b.publication.subscribe({
    notify() {
      notifications++;
    },
  });
  const before = a.publication.getSnapshot();
  expect(b.publication.begin(unsafe(p.value))).toMatchObject({
    status: "blocked",
    reason: "owner-conflict",
    ticket: null,
    notificationFailures: 0,
  });
  expect(a.publication.getSnapshot()).toBe(before);
  expect(grant.authority.require().epoch).toBe(1);
  expect([notifications, b.calls(), p.calls()]).toEqual([0, 0, 0]);
});
test("A07 closing debt cannot be taken over", () => {
  const a = fixture(controller(), () => {
    throw 0;
  });
  pending(a.publication.begin(a.next()));
  expect(a.publication.dispose().status).toBe("blocked");
  const b = fixture(a.owner);
  const p = poison();
  expect(b.publication.begin(unsafe(p.value))).toMatchObject({
    reason: "owner-conflict",
  });
  expect(p.calls()).toBe(0);
});
test("A08 competing argument trap admits Q; P cannot overwrite its grant", () => {
  const p = fixture();
  const q = fixture(p.owner);
  let granted: ReturnType<typeof settle> | undefined;
  const result = p.publication.begin(
    trapped(p.next(), () => {
      granted = settle(q);
    }),
  );
  expect(result).toMatchObject({ reason: "owner-conflict", ticket: null });
  expect(granted?.authority.require().epoch).toBe(1);
  expect(p.calls()).toBe(0);
});
test("A09 competing admission beats thrown descriptor payload without inspection", () => {
  const p = fixture();
  const q = fixture(p.owner);
  const thrown = poison();
  const result = p.publication.begin(
    trapped(p.next(), () => {
      settle(q);
      throw thrown.value;
    }),
  );
  expect(result).toMatchObject({ reason: "owner-conflict" });
  expect(thrown.calls()).toBe(0);
});
test("A10 released competitor permits subsequent serial admission", () => {
  const p = fixture();
  const q = fixture(p.owner);
  let old: ReturnType<typeof settle> | undefined;
  const ticket = pending(
    p.publication.begin(
      trapped(p.next(), () => {
        old = settle(q);
        expect(q.publication.dispose().status).toBe("disposed");
      }),
    ),
  );
  expect(p.publication.complete(ticket).status).toBe("settled");
  expect(() => old?.authority.require()).toThrow(CriteriaAuthorityError);
  expect(origin(p.publication).epoch).toBe(1);
});
test("A11 self-reentry during capture interrupts both without claim/epoch", () => {
  const f = fixture();
  const result = f.publication.begin(
    trapped(f.next(), () => {
      expect(f.publication.begin(f.next())).toMatchObject({
        reason: "reentrant",
      });
    }),
  );
  expect(result).toMatchObject({ reason: "reentrant", ticket: null });
  expect(f.calls()).toBe(0);
  expect(settle(f).authority.require().epoch).toBe(1);
});
test("A12 never-admitted dispose inside capture cannot be resurrected", () => {
  const p = fixture();
  const q = fixture(p.owner);
  const result = p.publication.begin(
    trapped(p.next(), () => {
      p.publication.dispose();
      settle(q);
    }),
  );
  expect(result.snapshot.phase).toBe("disposed");
  expect(result.ticket).toBeNull();
  expect(p.calls()).toBe(0);
  expect(q.publication.issue(origin(q.publication)).require().epoch).toBe(1);
});
test("A13 rejected publication explicitly retries only after writer release", () => {
  const a = fixture();
  settle(a);
  const b = fixture(a.owner);
  expect(b.publication.begin(b.next())).toMatchObject({
    reason: "owner-conflict",
  });
  a.publication.dispose();
  expect(b.publication.getSnapshot().phase).toBe("blocked");
  expect(settle(b).authority.require().epoch).toBe(1);
});
test("A14 never-admitted disposal has zero callbacks or foreign writer effects", () => {
  const a = fixture();
  const grant = settle(a);
  const b = fixture(a.owner, () => {
    throw 0;
  });
  let calls = 0;
  b.publication.subscribe({
    notify() {
      calls++;
      throw 0;
    },
  });
  b.publication.begin(b.next());
  expect(b.publication.dispose().status).toBe("disposed");
  expect(b.publication.dispose().status).toBe("disposed");
  expect([calls, b.calls()]).toEqual([0, 0]);
  expect(grant.authority.require().epoch).toBe(1);
});
test("A15 pending actual factory authority is not permission until complete", () => {
  const f = fixture();
  const ticket = pending(f.publication.begin(f.next()));
  const authority = f.publication.issue(origin(f.publication));
  expect(() => authority.require()).toThrow(CriteriaAuthorityError);
  expect(getCriteriaPublicationBinding(authority)?.publication).toBe(
    f.publication,
  );
  expect(f.publication.complete(ticket).status).toBe("settled");
  expect(authority.require().epoch).toBe(1);
});
test.each([
  false,
  Promise.resolve(undefined),
  // Inherited Promise.then without Promise slots: must never be adopted/probed.
  Object.create(Promise.prototype),
])("A16 unsupported retirement retains admitted claim (%j)", (value) => {
  let bad = true;
  const f = fixture(controller(), () => (bad ? value : undefined));
  const ticket = pending(f.publication.begin(f.next()));
  expect(f.publication.complete(ticket)).toMatchObject({
    status: "blocked",
    reason: "retirement",
  });
  const other = fixture(f.owner);
  const p = poison();
  expect(other.publication.begin(unsafe(p.value))).toMatchObject({
    reason: "owner-conflict",
  });
  expect(p.calls()).toBe(0);
  bad = false;
  expect(f.publication.complete(ticket).status).toBe("settled");
});
test("A17 cancelled initial ticket retains claim without grant", () => {
  const f = fixture();
  const ticket = pending(f.publication.begin(f.next()));
  const a = f.publication.issue(origin(f.publication));
  expect(f.publication.cancel(ticket).status).toBe("cancelled");
  expect(f.publication.complete(ticket).status).toBe("stale");
  expect(() => a.require()).toThrow(CriteriaAuthorityError);
  expect(fixture(f.owner).publication.begin(f.next())).toMatchObject({
    reason: "owner-conflict",
  });
  expect(settle(f).authority.require().epoch).toBe(2);
});
test("A18 admitted malformed begin denies before reflection and burns epoch", () => {
  const f = fixture();
  const grant = settle(f);
  const result = f.publication.begin(
    trapped(unsafe<CriteriaPublicationNext<S>>({}), () => {
      expect(f.publication.getSnapshot().current).toBeNull();
      expect(() => grant.authority.require()).toThrow(CriteriaAuthorityError);
    }),
  );
  expect(result).toMatchObject({ reason: "invalid-input", ticket: null });
  expect(settle(f).authority.require().epoch).toBe(3);
});
test("A19 Q conflict inside P retirement cannot invalidate P outer ticket", () => {
  const owner = controller();
  const q = fixture(owner);
  const p = fixture(owner, () => {
    expect(q.publication.begin(q.next())).toMatchObject({
      reason: "owner-conflict",
    });
  });
  expect(settle(p).authority.require().epoch).toBe(1);
});
test.each(["begin", "cancel", "dispose"] as const)(
  "A20 own retirement %s reentry prevents outer grant",
  (kind) => {
    let reenter = true;
    let receipt: CriteriaPublicationTicket<S>;
    const f = fixture(controller(), () => {
      if (!reenter) return;
      if (kind === "begin") f.publication.begin(f.next());
      else if (kind === "cancel") f.publication.cancel(receipt);
      else f.publication.dispose();
    });
    receipt = pending(f.publication.begin(f.next()));
    const authority = f.publication.issue(origin(f.publication));
    expect(f.publication.complete(receipt).status).toBe("blocked");
    expect(() => authority.require()).toThrow(CriteriaAuthorityError);
    expect(fixture(f.owner).publication.begin(f.next())).toMatchObject({
      reason: "owner-conflict",
    });
    reenter = false;
    expect(f.publication.dispose().status).toBe("disposed");
  },
);
test("A21 closing retirement failure keeps writer until explicit successful dispose", () => {
  let bad = false;
  const f = fixture(controller(), () => {
    if (bad) throw 0;
  });
  settle(f);
  bad = true;
  expect(f.publication.dispose()).toMatchObject({
    status: "blocked",
    reason: "retirement",
  });
  const q = fixture(f.owner);
  expect(q.publication.begin(q.next())).toMatchObject({
    reason: "owner-conflict",
  });
  bad = false;
  expect(f.publication.dispose().status).toBe("disposed");
  expect(settle(q).authority.require().epoch).toBe(1);
});
test("A22 admitted but never-settled disposal owes actual retirement", () => {
  const f = fixture();
  pending(f.publication.begin(f.next()));
  expect(f.publication.dispose().status).toBe("disposed");
  expect(f.calls()).toBe(1);
});
test("A23 release precedes terminal notification; old dispose cannot delete Q", () => {
  const p = fixture();
  settle(p);
  const q = fixture(p.owner);
  p.publication.subscribe({
    notify() {
      if (p.publication.getSnapshot().phase === "disposed") settle(q);
    },
  });
  expect(p.publication.dispose().status).toBe("disposed");
  p.publication.dispose();
  expect(q.publication.issue(origin(q.publication)).require().epoch).toBe(1);
  expect(fixture(p.owner).publication.begin(p.next())).toMatchObject({
    reason: "owner-conflict",
  });
});
test("A24/A25/A26 equal cross-publication origin values never relink bindings", () => {
  const p = fixture();
  const old = settle(p);
  p.publication.dispose();
  const q = fixture(p.owner);
  const fresh = settle(q);
  expect(() => old.authority.require()).toThrow(CriteriaAuthorityError);
  expect(() => q.publication.complete(old.ticket)).toThrow();
  expect(requireCriteriaAuthority(fresh.authority, old.origin).epoch).toBe(1);
  expect(getCriteriaPublicationBinding(old.authority)?.publication).toBe(
    p.publication,
  );
  expect(getCriteriaPublicationBinding(fresh.authority)?.publication).toBe(
    q.publication,
  );
  const poisoned = poison();
  invalid(() =>
    p.publication.registerParticipant(fresh.authority, unsafe(poisoned.value)),
  );
  expect(poisoned.calls()).toBe(0);
});
test("A27 forged/proxy/inherited identities are not inspected as registrations", () => {
  const f = fixture();
  const grant = settle(f);
  const p = poison();
  expect(
    getCriteriaPublicationBinding(unsafe<typeof grant.authority>(p.value)),
  ).toBeNull();
  expect(p.calls()).toBe(0);
  for (const copy of [
    { ...grant.authority },
    Object.create(grant.authority),
    new Proxy(grant.authority, {}),
  ])
    expect(getCriteriaPublicationBinding(copy)).toBeNull();
  const revoked = Proxy.revocable(grant.authority, {});
  revoked.revoke();
  expect(getCriteriaPublicationBinding(revoked.proxy)).toBeNull();
  invalid(() => f.publication.complete(unsafe(p.value)));
  invalid(() => f.publication.getSnapshot.call(unsafe(p.value)));
  expect(p.calls()).toBe(0);
});
test("A28 distinct real controllers remain independent", () => {
  const a = fixture();
  const b = fixture();
  const x = settle(a);
  const y = settle(b);
  a.publication.begin(a.next("b"));
  expect(() => x.authority.require()).toThrow(CriteriaAuthorityError);
  expect(y.authority.require().epoch).toBe(1);
});
