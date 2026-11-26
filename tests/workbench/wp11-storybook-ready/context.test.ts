import {
  CriteriaAuthorityError,
  getCriteriaAuthorityOrigin,
} from "@tableweave/react";
import { describe, expect, test } from "vitest";
import { transactionDefinition } from "../../../apps/examples/shared/definitions.js";
import { createExampleOwner } from "../../../apps/examples/shared/owner.js";
import { transactions } from "../../../apps/examples/shared/records.js";

function fixture(server = false) {
  return createExampleOwner(
    transactionDefinition({ full: false }),
    transactions,
    {
      id: "owner-context",
      server,
    },
  );
}

function clientSource(owner: ReturnType<typeof fixture>) {
  const { source } = owner.modelOptions();
  if (source.mode !== "client") throw new Error("Expected client source");
  return source;
}

describe("example owner preserves source availability with captured context", () => {
  test("client context is the frozen registered origin, not application expected context", () => {
    const owner = fixture(),
      appContext = owner.context,
      authority = owner.criteria(),
      origin = getCriteriaAuthorityOrigin(authority),
      options = owner.modelOptions(),
      source = clientSource(owner);
    if (!origin) throw new Error("Expected genuine publication origin");

    expect(source.context).toBe(origin.context);
    expect(Object.isFrozen(source.context)).toBe(true);
    expect(source.context).toEqual(appContext);
    expect(source.context).not.toBe(appContext);
    expect(options.expected).toBe(appContext);
    expect(owner.context).toBe(appContext);
    expect(options.controller).toBe(owner.C);
    expect(options.publication).toBe(owner.P);
    expect(options.criteria).toBe(authority);
    expect(origin.controller).toBe(owner.C);
    expect(origin.definition).toBe(owner.C.getDefinition());
  });

  test("modelOptions before connection preserves snapshots and real seed inputs", () => {
    const owner = fixture(),
      app = owner.getSnapshot(),
      controller = owner.C.getSnapshot(),
      publication = owner.P.getSnapshot(),
      resource = owner.remote.resource.getSnapshot(),
      source = clientSource(owner);

    expect(source.records).toBe(transactions);
    expect(owner.modelOptions().expected).toBe(owner.context);
    expect(clientSource(owner).context).toBe(source.context);
    expect(owner.getSnapshot()).toBe(app);
    expect(owner.C.getSnapshot()).toBe(controller);
    expect(owner.P.getSnapshot()).toBe(publication);
    expect(owner.remote.resource.getSnapshot()).toBe(resource);
  });

  test("connection and actual query transition retain C/P and captured context", () => {
    const owner = fixture(),
      authority = owner.criteria(),
      origin = getCriteriaAuthorityOrigin(authority),
      before = owner.modelOptions(),
      source = clientSource(owner),
      publication = owner.P.getSnapshot(),
      stop = owner.connect();
    if (!origin) throw new Error("Expected genuine publication origin");
    try {
      expect(clientSource(owner).records).toBe(transactions);
      owner.dispatch({ type: "search.commit", search: "Transfer" });

      expect(owner.C.getSnapshot().query.search).toBe("Transfer");
      expect(owner.modelOptions().controller).toBe(before.controller);
      expect(owner.modelOptions().publication).toBe(before.publication);
      expect(owner.modelOptions().criteria).toBe(authority);
      expect(owner.modelOptions().expected).toBe(owner.context);
      expect(clientSource(owner).context).toBe(source.context);
      expect(clientSource(owner).context).toBe(origin.context);
      expect(owner.P.getSnapshot()).toBe(publication);
      expect(authority.require()).toBe(origin);
    } finally {
      stop();
    }
  });

  test("disconnect denies the source without retiring C/P, reconnect restores captured context", () => {
    const owner = fixture(),
      before = owner.modelOptions(),
      context = clientSource(owner).context,
      stop = owner.connect();
    stop();

    expect(owner.getSnapshot().access).toBe(false);
    expect(clientSource(owner).records).toEqual([]);
    expect(context.access).toBe(true);
    expect(clientSource(owner).context.access).toBe(false);
    expect(clientSource(owner).context).not.toBe(context);
    expect(clientSource(owner).context).toEqual({
      ...owner.context,
      access: false,
    });
    expect(owner.P.getSnapshot().phase).toBe("settled");
    expect(owner.criteria().require().context).toBe(context);
    expect(owner.modelOptions().controller).toBe(before.controller);
    expect(owner.modelOptions().publication).toBe(before.publication);
    expect(owner.modelOptions().criteria).toBe(before.criteria);
    expect(owner.modelOptions().expected).toBe(owner.context);
    const stopAgain = owner.connect();
    try {
      expect(owner.getSnapshot().access).toBe(true);
      expect(clientSource(owner).records).toBe(transactions);
      expect(clientSource(owner).context).toBe(context);
      expect(owner.modelOptions().controller).toBe(before.controller);
      expect(owner.modelOptions().publication).toBe(before.publication);
      expect(owner.modelOptions().criteria).toBe(before.criteria);
      expect(owner.modelOptions().expected).toBe(owner.context);
    } finally {
      stopAgain();
    }
  });

  test("P-first terminal revocation denies the saved authority despite immutable access=true", () => {
    const owner = fixture(),
      authority = owner.criteria(),
      origin = getCriteriaAuthorityOrigin(authority),
      appContext = owner.context,
      source = clientSource(owner),
      stop = owner.connect();
    if (!origin) throw new Error("Expected genuine publication origin");
    try {
      expect(authority.require()).toBe(origin);
      owner.revoke();

      expect(source.context.access).toBe(true);
      expect(Object.isFrozen(source.context)).toBe(true);
      expect(clientSource(owner).context.access).toBe(false);
      expect(clientSource(owner).context).not.toBe(source.context);
      expect(clientSource(owner).context).toEqual({
        ...appContext,
        access: false,
      });
      expect(clientSource(owner).records).toEqual([]);
      expect(owner.getSnapshot().access).toBe(false);
      expect(owner.context).toBe(appContext);
      expect(owner.modelOptions().expected).toBe(appContext);
      expect(owner.modelOptions().criteria).toBe(authority);
      expect(getCriteriaAuthorityOrigin(authority)).toBe(origin);
      expect(() => authority.require()).toThrow(CriteriaAuthorityError);
      expect(owner.remote.resource.getSnapshot().context.access).toBe(false);
      expect(owner.numericOptions.source.getSnapshot().context.access).toBe(
        false,
      );
      expect(owner.stringOptions.source.getSnapshot().context.access).toBe(
        false,
      );
      owner.dispatch({ type: "search.commit", search: "must not apply" });
      expect(owner.C.getSnapshot().query.search).toBe("");
    } finally {
      stop();
    }
  });

  test("server source keeps its actual adapter, view and binding composition", () => {
    const owner = fixture(true),
      options = owner.modelOptions();
    if (options.source.mode !== "server")
      throw new Error("Expected server source");

    expect(options.controller).toBe(owner.C);
    expect(options.publication).toBe(owner.P);
    expect(options.criteria).toBe(owner.criteria());
    expect(options.expected).toBe(owner.context);
    expect(options.source.resource).toBe(owner.remote.resource);
    expect(options.source.view).toBe(owner.remote.resource.getSnapshot());
    expect(options.source.bindings).toEqual(owner.remote.bindings());
  });
});
