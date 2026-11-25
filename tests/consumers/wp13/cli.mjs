import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  demand,
  object,
  receipt,
  verifyMap,
  record,
  capacity,
  tree,
} from "./lib/receipts.mjs";
import { load, revalidate, local } from "./lib/boundary.mjs";
import { generate, producerInputs } from "./lib/generation.mjs";
import { inspect, bundle } from "./lib/inspect.mjs";
import {
  prepare,
  install,
  installed,
  verifyProfile,
} from "./lib/installer.mjs";
import { checkTypes } from "./lib/types.mjs";
import * as vite from "./families/vite.mjs";
import * as next from "./families/next.mjs";
import * as start from "./families/start.mjs";
import {
  parseStorageArguments,
  storageProvenance,
} from "./lib/storage-roots.mjs";

export async function main(args, final) {
  const layout = parseStorageArguments(args);
  const ctx = load(args[1], args[3], args[5], args[7], final, layout);
  revalidate(ctx);
  capacity(ctx.run);
  const toolingRoot = path.resolve(
      fileURLToPath(new URL("../../../", import.meta.url)),
    ),
    tooling = receipt(ctx, "tooling-inputs.json");
  for (const file of Object.keys(object(tooling)))
    demand(
      /^tests\/consumers\/wp13\//.test(file) && !file.includes("/evidence/"),
      "E_TOOLING_INPUT_PATH",
    );
  for (const file of [
    "cli.mjs",
    "matrix.json",
    "protocol.json",
    "lib/boundary.mjs",
    "lib/storage-roots.mjs",
    "lib/archive.mjs",
    "lib/generation.mjs",
    "lib/installer.mjs",
    "lib/inspect.mjs",
    "lib/types.mjs",
    "lib/receipts.mjs",
  ])
    demand(
      Object.hasOwn(tooling, `tests/consumers/wp13/${file}`),
      "E_TOOLING_INPUT_MISSING",
    );
  verifyMap(toolingRoot, tooling);
  verifyMap(ctx.producer, tooling);
  const toolingRuntime = receipt(ctx, "tooling-runtime-inputs.json");
  for (const file of [
    "node_modules/typescript/package.json",
    "node_modules/typescript/lib/typescript.js",
  ])
    demand(
      Object.hasOwn(
        toolingRuntime,
        path.relative(toolingRoot, local(toolingRoot, file)),
      ),
      "E_TOOLING_COMPILER_RUNTIME_INPUT",
    );
  for (const file of Object.keys(object(toolingRuntime)))
    demand(file.startsWith("node_modules/"), "E_TOOLING_RUNTIME_PATH");
  verifyMap(toolingRoot, toolingRuntime);
  for (const file of Object.keys(
    tree(path.join(toolingRoot, "tests/consumers/wp13")),
  ))
    if (!file.startsWith("evidence/"))
      demand(
        Object.hasOwn(tooling, `tests/consumers/wp13/${file}`),
        "E_INCOMPLETE_TOOLING_MAP",
      );
  producerInputs(ctx);
  const family =
    ctx.family === "next"
      ? next
      : ctx.family === "start"
        ? start
        : ctx.family.startsWith("vite-")
          ? vite
          : null;
  let result;
  try {
    if (ctx.phase === "generate") result = generate(ctx);
    else if (ctx.phase === "inspect") result = inspect(ctx);
    else if (ctx.phase === "prepare") result = prepare(ctx, family?.stage);
    else if (ctx.phase === "install") result = install(ctx);
    else if (ctx.phase === "types") result = checkTypes(ctx);
    else if (ctx.phase === "bundle") result = bundle(ctx);
    else if (ctx.phase === "profile-verify") result = verifyProfile(ctx);
    else {
      demand(family !== null, "E_FAMILY_PHASE_NOT_APPLICABLE");
      installed(ctx);
      result =
        ctx.phase === "family-build" ? family.build(ctx) : family.runtime(ctx);
    }
    verifyMap(toolingRoot, tooling);
    verifyMap(ctx.producer, tooling);
    revalidate(ctx);
    verifyMap(toolingRoot, toolingRuntime);
    producerInputs(ctx);
    record(ctx.run, `phase-${ctx.phase}-${ctx.key}.json`, {
      ...storageProvenance(ctx),
      phase: ctx.phase,
      candidate: ctx.request.candidate,
      result,
      approval: "main-selected-local-files-not-cryptographic-authorization",
      completeWP13: false,
      G02: "blocked",
    });
    return result;
  } catch (error) {
    try {
      revalidate(ctx);
      record(ctx.run, `failure-${ctx.phase}-${ctx.key}.json`, {
        ...storageProvenance(ctx),
        phase: ctx.phase,
        candidate: ctx.request.candidate,
        error: error instanceof Error ? error.message : "E_UNKNOWN",
        status: "failed-or-held-not-passed",
        noFallback: true,
      });
    } catch (guardError) {
      throw new AggregateError(
        [error, guardError],
        "E_PRIMARY_FAILURE_AND_UNSAFE_FAILURE_RECEIPT",
      );
    }
    throw error;
  }
}
function failureText(error) {
  const message = error instanceof Error ? error.message : "E_UNKNOWN";
  return error instanceof AggregateError
    ? `${message}: ${error.errors.map(failureText).join(" | ")}`
    : message;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main(process.argv.slice(2), process.env.WP13_FINAL === "1")
    .then((value) => console.log(JSON.stringify(value)))
    .catch((error) => {
      console.error(failureText(error));
      process.exitCode = 1;
    });
}
