import { expect, it } from "vitest";
import { criteriaOptionView, criteriaRequestOptions } from "../../packages/heroui/src/filters/option-owners.js";
import { fixture, required, choiceRules } from "./fixtures.js";

function adopted(f = fixture(choiceRules)) {
  const stop = f.store.mount();
  const fields = { ...f.props().fields, status: { label: "Status", asyncOptions: { idType: "string" as const, source: f.source, onRequest: () => undefined } } };
  const actor = f.commit({ fields });
  f.store.syncOptions(actor);
  const connection = required(f.store.connections()[0]), disconnect = f.store.connect(connection);
  f.store.syncOptions(actor);
  return { f, stop, fields, actor, connection, disconnect };
}
it("real F2 claim owns one passive connection and selected IDs are the accepted field-wide union", () => {
  const { f, actor, fields, disconnect, stop } = adopted();
  expect(f.source.getSnapshot().selected.map(option => option.id)).toEqual(["a", "b", "c"]);
  expect(() => f.source.connect()).toThrow();
  const before = f.source.getSnapshot();
  f.open("c1");
  expect(f.source.getSnapshot()).toBe(before);
  const b = f.commit({ fields });
  f.store.syncOptions(b);
  expect(f.store.connections()).toHaveLength(1);
  expect(() => criteriaOptionView(f.store, actor, "status")).toThrow();
  expect(criteriaOptionView(f.store, b, "status").selected.map(option => option.id)).toEqual(["a", "b", "c"]);
  disconnect(); f.store.releaseOptions(); stop();
});
it("populated source history never adopts from equal tags or a public clear", () => {
  const f = fixture(choiceRules);
  const request = required(f.source.begin({ ...f.context, fieldId: "status", term: "private-old-term", pageKey: "first" }));
  f.source.succeed(request, { options: [{ id: "a", label: "private-old-label" }], hasMore: false });
  f.source.clear();
  const { actor, stop } = adopted(f);
  expect(() => f.store.option(actor, "status")).toThrow();
  expect(f.store.connections()).toHaveLength(0);
  stop();
});
it("real cleanup refusal leaves P blocked and source private state purged; no public clear/void permission inference", () => {
  const { f, actor, stop } = adopted();
  const request = required(f.source.begin({ ...f.context, fieldId: "status", term: "synthetic-sensitive-term", pageKey: "first" }));
  f.source.succeed(request, { options: [{ id: "a", label: "synthetic-private-label" }], hasMore: false });
  f.sourceFaults.refusal = true;
  const begun = f.app.beginReset();
  expect(begun.status).toBe("pending");
  expect(f.source.getSnapshot().page).toBeNull();
  expect(f.source.getSnapshot().request).toBeNull();
  expect(f.source.getSnapshot().selected).toEqual([]);
  if (begun.status !== "pending") throw new Error("Real ticket missing");
  expect(f.app.completeReset(begun.ticket).status).not.toBe("settled");
  expect(() => f.store.option(actor, "status")).toThrow();
  expect(f.invalidations.at(-1)?.context).toMatchObject({ scopeKey: f.context.scopeKey });
  f.sourceFaults.refusal = false;
  expect(f.app.completeReset(begun.ticket).status).toBe("settled");
  stop();
});
it("saved A request/retry ports deny after B; ordinary actor refresh does not reconnect or reset the source", () => {
  const { f, fields, stop } = adopted(), handle = f.open("c1");
  criteriaRequestOptions(handle, "first-term", "first");
  const request = f.source.getSnapshot().request;
  f.commit({ fields });
  expect(f.source.getSnapshot().request).toBe(request);
  expect(() => criteriaRequestOptions(handle, "old-A-term", "first")).toThrow();
  expect(f.source.getSnapshot().request).toBe(request);
  expect(f.invalidations).toHaveLength(0);
  f.store.releaseOptions(); stop();
});
it("genuine P/F2 reset clears known labels, not just visible pages, before a new field claim can read", () => {
  const { f, actor, fields, stop } = adopted();
  const request = required(f.source.begin({ ...f.context, fieldId: "status", term: "synthetic-old-term", pageKey: "first" }));
  f.source.succeed(request, { options: [{ id: "a", label: "synthetic-old-private-label" }], hasMore: false });
  expect(criteriaOptionView(f.store, actor, "status").selected[0]?.label).toBe("synthetic-old-private-label");
  f.reset();
  expect(f.source.getSnapshot().selected).toEqual([]);
  const b = f.commit({ fields }); f.store.syncOptions(b);
  expect(criteriaOptionView(f.store, b, "status").selected.map(option => option.label)).toEqual(["a", "b", "c"]);
  expect(f.invalidations[0]?.context).toMatchObject({ fieldId: "status", scopeKey: f.context.scopeKey });
  f.store.releaseOptions(); stop();
});
