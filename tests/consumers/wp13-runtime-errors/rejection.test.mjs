// FINAL UNRUN. Rejection-only report metadata, not real HTTP/browser observations.
import assert from "node:assert/strict";
import test from "node:test";
import { validateReport } from "../wp13/lib/runtime.mjs";

if (process.env.WP13_FINAL !== "1") throw Error("FINAL-only report adversary");
test("an API RSC rejection cannot permit any unrelated browser-page error", () => {
  const attempt = { family: "next", variant: "rsc-negative" };
  const rejected = {
    schema: "wp13-family-observations-v1",
    inputSHA256: "rejection-only",
    status: "observed",
    completed: true,
    browserVersion: "123.0.0",
    ...attempt,
    serverStarted: true,
    serverExited: true,
    cleanupDebt: null,
    primaryFailure: null,
    truncated: false,
    unexpectedErrors: 1,
    unexpectedNetwork: 0,
    intentionalFrameworkEvents: 1,
    intentionalErrors: 1,
    cases: [],
  };
  assert.throws(
    () => validateReport(rejected, attempt, "rejection-only"),
    /E_RUNTIME_FAILURE_OR_CLEANUP_DEBT/,
  );
});
