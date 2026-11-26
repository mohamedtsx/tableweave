import { expect, test } from "vitest";
import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../../packages/react/src/presentation/binding.js";
import { context, fixture, records, required } from "./fixtures.js";

for (const enabled of [true, false])
  test(`captured pre-begin metadata and unbound publication, enabled=${enabled}`, () => {
    const f = fixture(enabled);
    f.client([]);
    let seen = false;
    const stop = f.resource.subscribe(() => {
      const request = f.resource.getSnapshot().request;
      if (!request) return;
      seen = true;
      expect(
        getControlsRequestBinding(
          f.definition,
          f.controller,
          f.resource,
          request,
        ),
      ).toBeNull();
      expect(request.extent).toEqual(
        enabled
          ? { kind: "page", pageIndex: 0, pageSize: 25 }
          : { kind: "complete" },
      );
      expect(request.evaluatedAt).toBe(0);
      const input = f.remote();
      f.reset();
      expect(f.project(input).blockedReason).toBe("binding");
      expect(f.calls.rowId).toBe(0);
      expect(() => f.authority(input).require({ type: "select-page" })).toThrow(
        expect.objectContaining({ code: "controls.unavailable" }),
      );
    });
    const start = required(f.begin("pre-begin", undefined, true));
    stop();
    expect(seen).toBe(true);
    expect(
      getControlsRequestBinding(
        f.definition,
        f.controller,
        f.resource,
        start.request,
      ),
    ).toBe(start.binding);
    expect(start.binding.extent).toEqual(start.request.extent);
  });
test("legacy enabled input preserves old physical token keys; binding resolves page independently", () => {
  const f = fixture(true),
    start = required(f.begin());
  expect(Reflect.ownKeys(start.request)).toEqual([
    "definitionKey",
    "scopeKey",
    "queryKey",
    "requestKey",
    "generation",
    "query",
  ]);
  expect(start.binding.extent).toEqual({
    kind: "page",
    pageIndex: 0,
    pageSize: 25,
  });
  expect(start.binding.evaluatedAt).toBe(0);
});
for (const enabled of [false, true])
  for (const violation of [
    "policy",
    "page-pair",
    "undefined",
    "hidden",
    "symbol",
    "extent-getter",
    "missing",
  ] as const)
    test(`metadata refusal before private normalization ${enabled}/${violation}`, () => {
      const f = fixture(enabled, { custom: true });
      let reads = 0;
      const extent =
        violation === "policy"
          ? enabled
            ? { kind: "complete" }
            : { kind: "page", pageIndex: 0, pageSize: 25 }
          : violation === "page-pair"
            ? { kind: "page", pageIndex: 9, pageSize: 25 }
            : enabled
              ? { kind: "page", pageIndex: 0, pageSize: 25 }
              : { kind: "complete" };
      const raw: Record<string, unknown> = {
        ...context,
        queryKey: "same",
        requestKey: "same",
        extent,
      };
      if (violation === "undefined") raw.extent = undefined;
      if (violation === "hidden")
        Object.defineProperty(raw, "extent", { enumerable: false });
      if (violation === "symbol")
        Object.defineProperty(extent, Symbol("invalid"), { value: true });
      if (violation === "extent-getter")
        Object.defineProperty(raw, "extent", {
          get() {
            reads++;
            throw 0;
          },
        });
      if (violation === "missing") delete raw.extent;
      const before = f.resource.getSnapshot();
      f.reset();
      if (enabled && violation === "missing") {
        expect(
          Reflect.apply(beginControlsRequest, undefined, [
            f.definition,
            f.controller,
            f.resource,
            raw,
          ]),
        ).not.toBeNull();
        return;
      }
      expect(() =>
        Reflect.apply(beginControlsRequest, undefined, [
          f.definition,
          f.controller,
          f.resource,
          raw,
        ]),
      ).toThrow(expect.objectContaining({ code: "controls.binding" }));
      expect(reads).toBe(0);
      expect(f.calls.normalize).toBe(0);
      expect(f.resource.getSnapshot()).toBe(before);
    });
for (const field of ["query", "evaluatedAt"] as const)
  for (const descriptor of ["data", "hidden", "accessor"] as const)
    test(`caller ${field}/${descriptor} override rejected without getter work`, () => {
      const f = fixture(false, { custom: true });
      let reads = 0;
      const raw = Object.defineProperty(
        f.rawInput({ extent: { kind: "complete" } }),
        field,
        descriptor === "accessor"
          ? {
              enumerable: true,
              get() {
                reads++;
                throw 0;
              },
            }
          : {
              enumerable: descriptor !== "hidden",
              value: field === "query" ? f.controller.getSnapshot().query : 0,
            },
      );
      f.reset();
      expect(() =>
        Reflect.apply(beginControlsRequest, undefined, [
          f.definition,
          f.controller,
          f.resource,
          raw,
        ]),
      ).toThrow(expect.objectContaining({ code: "controls.binding" }));
      expect(reads).toBe(0);
      expect(f.calls.normalize).toBe(0);
    });
for (const field of [
  "definitionKey",
  "scopeKey",
  "queryKey",
  "requestKey",
  "retry",
] as const)
  test(`consumed ${field} getter never executes`, () => {
    const f = fixture();
    let reads = 0;
    const raw = Object.defineProperty(
      f.rawInput({ extent: { kind: "complete" } }),
      field,
      {
        get() {
          reads++;
          return "poison";
        },
      },
    );
    expect(() =>
      Reflect.apply(beginControlsRequest, undefined, [
        f.definition,
        f.controller,
        f.resource,
        raw,
      ]),
    ).toThrow(expect.objectContaining({ code: "controls.binding" }));
    expect(reads).toBe(0);
    expect(f.resource.getSnapshot().request).toBeNull();
  });
for (const phase of ["input", "compile", "begin"] as const)
  for (const effect of ["query", "tick", "scope", "dispose"] as const)
    test(`tuple A survives/refuses ${phase}/${effect} reentry without becoming B`, () => {
      const f = fixture(false, { custom: true }),
        a = f.controller.getSnapshot();
      let once = false;
      const change = () => {
        if (once) return;
        once = true;
        if (effect === "query")
          f.controller.dispatch({ type: "search.commit", search: "B" });
        if (effect === "tick") {
          f.setNow(1234.5);
          f.controller.dispatch({ type: "clock.tick" });
        }
        if (effect === "scope")
          f.resource.setContext({ ...context, scopeKey: "other" });
        if (effect === "dispose") f.controller.dispose();
      };
      const raw = f.rawInput({ extent: { kind: "complete" } });
      const candidate =
        phase === "input"
          ? new Proxy(raw, {
              getOwnPropertyDescriptor(target, key) {
                if (key === "queryKey") change();
                return Reflect.getOwnPropertyDescriptor(target, key);
              },
            })
          : raw;
      if (phase === "compile") f.onNormalize(change);
      const stop = phase === "begin" ? f.resource.subscribe(change) : () => {};
      let result: ReturnType<typeof f.begin> = null;
      try {
        result = beginControlsRequest(
          f.definition,
          f.controller,
          f.resource,
          candidate,
        );
      } catch (error) {
        expect(error).toMatchObject({ code: "controls.binding" });
      }
      stop();
      f.onNormalize();
      expect(once).toBe(true);
      if (effect === "scope" || effect === "dispose") expect(result).toBeNull();
      else if (result) {
        expect(result.request.query).toEqual(a.query);
        expect(result.binding.queryIdentity).toBe(a.queryIdentity);
        expect(result.request.evaluatedAt).toBe(a.evaluatedAt);
        expect(result.binding.evaluatedAt).toBe(a.evaluatedAt);
        expect(result.binding.extent).toEqual({ kind: "complete" });
      }
    });
test("retry binds actual new token before transport, preserving A query/extent/time instead of current C", () => {
  const f = fixture(false, { custom: true }),
    a = f.controller.getSnapshot();
  let observed = false,
    callbackThis: unknown = "not-called";
  const start = required(
    f.begin("retry", function (this: unknown, request) {
      callbackThis = this;
      observed = true;
      const binding = required(
        getControlsRequestBinding(
          f.definition,
          f.controller,
          f.resource,
          request,
        ),
      );
      expect(binding.request).toBe(request);
      expect(binding.queryIdentity).toBe(a.queryIdentity);
      expect(binding.evaluatedAt).toBe(0);
      expect(request.evaluatedAt).toBe(0);
      expect(request.query).toEqual(a.query);
      expect(request.extent).toEqual({ kind: "complete" });
      expect(f.succeed(request, records.slice(0, 137))).toBe(true);
    }),
  );
  f.resource.fail(start.request, "timeout");
  f.setNow(9000);
  f.controller.dispatch({ type: "clock.tick" });
  f.controller.dispatch({ type: "search.commit", search: "C" });
  const retry = required(f.resource.retry());
  expect(observed).toBe(true);
  expect(callbackThis).toBeUndefined();
  expect(retry.generation).toBe(start.request.generation + 1);
  expect(f.resource.getSnapshot().snapshot?.evaluatedAt).toBe(0);
});
test("lookup cannot upgrade copied, foreign-owner, or foreign-resource tokens", () => {
  const f = fixture(),
    g = fixture(),
    a = required(f.begin());
  expect(
    getControlsRequestBinding(f.definition, f.controller, f.resource, {
      ...a.request,
    }),
  ).toBeNull();
  expect(
    getControlsRequestBinding(
      g.definition,
      g.controller,
      f.resource,
      a.request,
    ),
  ).toBeNull();
  expect(
    getControlsRequestBinding(
      f.definition,
      f.controller,
      g.resource,
      a.request,
    ),
  ).toBeNull();
});
