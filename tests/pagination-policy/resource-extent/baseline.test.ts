import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import { context, fixture, input, requireToken, success } from "./fixtures.js";
import { own, requireOriginal } from "./guard.mjs";

test("prechange legacy physical keys, literal snapshots, retained buffers, retry and refusal remain exact", async () => {
  const captured: unknown[] = [];
  for (const withRetry of [false, true])
    for (const same of [false, true]) {
      const f = fixture(),
        states: unknown[] = [];
      const record = () => {
        const v = f.adapter.getSnapshot();
        states.push({
          bytes: JSON.stringify(v),
          requestKeys: v.request && Reflect.ownKeys(v.request),
          snapshotKeys: v.snapshot && Reflect.ownKeys(v.snapshot),
          notifications: f.notifications(),
        });
      };
      record();
      const a = requireToken(f.adapter.begin(input("a", 2)));
      record();
      f.adapter.succeed(a, success(2, 90));
      const retained = f.adapter.getSnapshot().snapshot;
      record();
      let seenGeneration = 0,
        retryThis: unknown = "not-called";
      const candidate = input(
        same ? "a" : "b",
        same ? 2 : 5,
        withRetry
          ? {
              retry: function (this: unknown, next) {
                retryThis = this;
                seenGeneration = next.generation;
                f.adapter.succeed(next, success(0, 0));
              },
            }
          : {},
      );
      if (!withRetry) Reflect.set(candidate, "retry", undefined);
      const b = requireToken(f.adapter.begin(candidate));
      record();
      const retainedPending = f.adapter.getSnapshot().snapshot === retained;
      f.adapter.fail(b, "timeout");
      record();
      const retried = f.adapter.retry();
      record();
      if (!withRetry) {
        const next = requireToken(f.adapter.begin(input("empty")));
        f.adapter.succeed(next, success(0));
        record();
      }
      const c = requireToken(f.adapter.begin(input("c")));
      f.adapter.fail(c, "offline");
      record();
      captured.push({
        withRetry,
        same,
        states,
        retainedPending,
        seenGeneration,
        retryThisUndefined: retryThis === undefined,
        retryGeneration: retried?.generation ?? null,
        late: f.adapter.succeed(a, success(1)),
      });
    }
  const a = createResourceAdapter(context),
    server = a.getServerSnapshot(),
    cleanup = a.connect();
  a.begin(input());
  cleanup();
  const inactive = a.begin(input());
  const stop = a.connect();
  stop();
  a.dispose();
  captured.push({
    inactive,
    disposed: a.begin(input()),
    serverStable: a.getServerSnapshot() === server,
    final: JSON.stringify(a.getSnapshot()),
  });
  const file = join(own, ".artifacts/legacy-baselines.raw.json");
  if (process.env.U3_RUN === "before-legacy") {
    await requireOriginal();
    writeFileSync(file, `${JSON.stringify(captured, null, 2)}\n`, {
      flag: "wx",
    });
  }
  expect(captured).toEqual(
    JSON.parse(
      readFileSync(
        process.env.U3_RUN === "before-legacy"
          ? file
          : join(own, "legacy-baselines.json"),
        "utf8",
      ),
    ),
  );
});
