// FINAL UNRUN adversaries. All synthetic metadata here is rejection-only, not a
// positive producer/main approval or a permitting application fixture.
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import {
  validateReport,
  verifyBuild,
  runFamily,
  freshRuntimeOutput,
} from "../wp13/lib/runtime.mjs";
import { nativeInputs } from "../wp13/lib/installer.mjs";
import { receipt } from "../wp13/lib/receipts.mjs";
import { toRequest } from "../wp13/fixtures/start-host.mjs";
import {
  genuineRsc,
  refuseOccupiedPort,
  stopOwned,
  deadline,
} from "../wp13/fixtures/family-runtime.mjs";

if (process.env.WP13_FINAL !== "1")
  throw Error("FINAL-only authored adversaries, not LIGHT");
const childFile = fileURLToPath(
  new URL("./fixtures/owned-process.mjs", import.meta.url),
);
function child(mode) {
  return spawn(process.execPath, [childFile, mode], {
    env: { WP13_FINAL: "1" },
    shell: false,
    stdio: ["ignore", "pipe", "pipe"],
  });
}
test("owned nonzero child is a failure observation, not any-case success", async () => {
  const process = child("exit");
  const code = await new Promise((resolve) => process.once("close", resolve));
  assert.equal(code, 7);
});
test("occupied6575 is refused; cleanup touches only this test's owned child", async () => {
  const process = child("port");
  try {
    await deadline(
      new Promise((resolve, reject) => {
        process.once("error", reject);
        process.stdout.once("data", resolve);
        process.once("exit", () =>
          reject(
            Error(
              "Owned port adversary could not bind; do not reuse an ambient server",
            ),
          ),
        );
      }),
      3000,
      "E_ADVERSARY_READY",
    );
    await assert.rejects(refuseOccupiedPort(), /E_PORT_6575_OCCUPIED/);
  } finally {
    await stopOwned(process);
  }
});
test("owned-child cleanup is bounded and unresolved cleanup debt rejects", async () => {
  const process = child("wait");
  const result = await stopOwned(process);
  assert.equal(result.forced, false);
  await assert.rejects(
    deadline(new Promise(() => {}), 5, "E_CHILD_CLEANUP_DEBT"),
    /E_CHILD_CLEANUP_DEBT/,
  );
});
test("empty/truncated/stale/wrong-variant reports cannot pass", () => {
  for (const report of [
    {},
    { schema: "wp13-family-observations-v1", completed: false },
    {
      schema: "wp13-family-observations-v1",
      status: "observed",
      completed: true,
      inputSHA256: "wrong",
      cases: [],
    },
  ])
    assert.throws(() =>
      validateReport(
        report,
        { family: "next", variant: "ordinary" },
        "actual-input",
      ),
    );
  assert.throws(
    () =>
      validateReport(
        {
          schema: "wp13-family-observations-v1",
          status: "observed",
          completed: true,
          inputSHA256: "actual-input",
          variant: "ordinary",
          browserVersion: "123.0.0",
        },
        { variant: "rsc-negative" },
        "actual-input",
      ),
    /E_RUNTIME_REPORT_BINDING/,
  );
  const attempt = { family: "next", variant: "ordinary" };
  const poison = {
    schema: "wp13-family-observations-v1",
    ...attempt,
    browserVersion: "123.0.0",
    inputSHA256: "actual-input",
    status: "observed",
    completed: true,
    serverStarted: true,
    serverExited: true,
    cleanupDebt: null,
    primaryFailure: null,
    truncated: false,
    unexpectedErrors: 0,
    unexpectedNetwork: 0,
    cases: [],
  };
  assert.throws(
    () => validateReport(poison, attempt, "actual-input"),
    /E_RUNTIME_EMPTY_OR_DUPLICATE_CASES/,
  );
  for (const wrong of [
    { cleanupDebt: "E_BROWSER_CLEANUP_DEBT" },
    { truncated: true },
    { unexpectedErrors: 1 },
    { serverExited: false },
  ])
    assert.throws(
      () => validateReport({ ...poison, ...wrong }, attempt, "actual-input"),
      /E_RUNTIME_FAILURE_OR_CLEANUP_DEBT/,
    );
});
test("output escape and missing selected runtime entry are never a built application", () => {
  assert.throws(
    () =>
      verifyBuild(
        "/outside",
        {
          candidate: "a",
          key: "next-ordinary",
          profile: "ordinary",
          port: 6575,
          reuseExistingServer: false,
          outputRoots: ["../escape"],
          output: {},
        },
        {
          family: "next",
          key: "next-ordinary",
          profile: "ordinary",
          request: { candidate: "a" },
        },
      ),
    /E_RUNTIME_OUTPUT_ROOTS/,
  );
});
test("arbitrary500/build/type errors do not prove a genuine RSC rejection", () => {
  for (const log of [
    "Error: unrelated500",
    "TS2322: incorrect props",
    "Error: Functions cannot be passed",
    "Error: Functions cannot be passed onUnexpectedAction\nTypeError: unrelated",
  ])
    assert.equal(genuineRsc(500, log), false);
  assert.equal(
    genuineRsc(200, "Error: Functions cannot be passed onUnexpectedAction"),
    false,
  );
});
test("no phase/native/browser approval and attempted output overwrite remain guarded source", () => {
  assert.throws(() => runFamily({ phase: "prepare" }), /E_RUNTIME_PHASE/);
  assert.throws(
    () =>
      nativeInputs(
        { key: "next-ordinary", approval: { receipts: {} } },
        "/not-an-approved-consumer",
      ),
    /E_UNAPPROVED_RECEIPT/,
  );
  assert.throws(
    () =>
      receipt(
        { approval: { receipts: {} } },
        "browser-inputs-next-ordinary.json",
      ),
    /E_UNAPPROVED_RECEIPT/,
  );
  const stat = fs.statfsSync("/tmp/opencode");
  assert(stat.bavail * stat.bsize >= 134217728);
  const target = fs.mkdtempSync("/tmp/opencode/wp13-runtime-adversary-");
  fs.mkdirSync(path.join(target, "wp13-runtime"));
  assert.throws(
    () => freshRuntimeOutput(target),
    /E_RUNTIME_ATTEMPT_OVERWRITE/,
  );
  const runtime = fs.readFileSync(
    new URL("../wp13/lib/runtime.mjs", import.meta.url),
    "utf8",
  );
  for (const code of [
    "E_HOLD_RUNTIME_PLAN_SELECTION",
    "E_HOLD_OWNED_BROWSER_SELECTION",
    "E_RUNTIME_ATTEMPT_OVERWRITE",
    "E_RUNTIME_EXPLICIT_PROFILE_NOT_VERIFIED",
  ])
    assert(runtime.includes(code));
  const host = fs.readFileSync(
    new URL("../wp13/fixtures/start-host.mjs", import.meta.url),
    "utf8",
  );
  assert.match(host, /entry\.fetch\(request\)/);
  assert.match(host, /duplex:\s*"half"/);
  assert(!host.includes("as unknown"));
  assert.equal(path.basename(childFile), "owned-process.mjs");
});
test("public Node Request bridge preserves actual POST bytes/method and refuses other origins/methods", async () => {
  const incoming = Readable.from([Buffer.from("public-synthetic-body")]);
  incoming.method = "POST";
  incoming.headers = { "content-type": "text/plain" };
  const abort = new AbortController();
  const request = toRequest(
    incoming,
    new URL("http://127.0.0.1:6575/"),
    abort.signal,
  );
  assert.equal(request.method, "POST");
  assert.equal(await request.text(), "public-synthetic-body");
  assert.throws(
    () =>
      toRequest(
        { method: "GET", headers: {} },
        new URL("https://outside.invalid/"),
        abort.signal,
      ),
    /E_HOST_REQUEST/,
  );
  assert.throws(
    () =>
      toRequest(
        { method: "DELETE" },
        new URL("http://127.0.0.1:6575/"),
        abort.signal,
      ),
    /E_HOST_REQUEST/,
  );
});
