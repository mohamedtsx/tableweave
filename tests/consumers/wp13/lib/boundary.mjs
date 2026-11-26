import fs from "node:fs";
import path from "node:path";
import {
  storageRoots,
  openStorage,
  storageControl,
  bindStorage,
  storageRevalidate,
  storageExternal,
  selectedRoots,
  consumerStorage,
} from "./storage-roots.mjs";
import {
  demand,
  directory,
  json,
  regular,
  digest,
  object,
  relative,
  present,
} from "./receipts.mjs";

export function safeId(value) {
  demand(
    typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,47}$/.test(value),
    "E_RUN_ID",
  );
  return value;
}
export function noProjectAncestors(parents) {
  for (const parent of parents) {
    directory(parent);
    for (const marker of [
      ".git",
      "package.json",
      "pnpm-workspace.yaml",
      "pnpm-lock.yaml",
      ".npmrc",
      "node_modules",
    ])
      demand(!present(path.join(parent, marker)), "E_ANCESTOR_PROJECT_CONFIG");
  }
}
export function external(location, fresh = false, producer = false, ctx) {
  if (ctx !== undefined && selectedRoots(ctx).namespace !== "/tmp/opencode")
    return storageExternal(ctx, location, fresh, producer);
  demand(
    typeof location === "string" &&
      path.isAbsolute(location) &&
      path.resolve(location) === location &&
      path.dirname(location) === "/tmp/opencode",
    "E_EXTERNAL_TARGET",
  );
  directory("/tmp/opencode");
  noProjectAncestors(["/", "/tmp", "/tmp/opencode"]);
  if (fresh)
    demand(
      !present(location) &&
        !fs.lstatSync(path.dirname(location)).isSymbolicLink(),
      "E_TARGET_EXISTS",
    );
  else {
    directory(location);
    demand(
      producer || !present(path.join(location, ".git")),
      "E_WORKTREE_TARGET",
    );
  }
  return location;
}
export function load(
  runId,
  phase,
  family,
  profile,
  final,
  layout = "legacy-ssd",
) {
  demand(final === true, "E_FINAL_PHASE_REQUIRED");
  safeId(runId);
  demand(
    [
      "generate",
      "inspect",
      "prepare",
      "install",
      "types",
      "bundle",
      "family-build",
      "family-runtime",
      "profile-verify",
    ].includes(phase),
    "E_PHASE",
  );
  demand(
    [
      "headless",
      "styled",
      "vite-headless",
      "vite-styled",
      "next",
      "start",
    ].includes(family),
    "E_FAMILY",
  );
  demand(
    ["ordinary", "rac-runtime", "start-sdk-declarations"].includes(profile),
    "E_PROFILE",
  );
  demand(
    profile === "ordinary" ||
      (profile === "rac-runtime" &&
        ["styled", "vite-styled", "next"].includes(family)) ||
      (profile === "start-sdk-declarations" && family === "start"),
    "E_PROFILE_FAMILY",
  );
  const token = openStorage(runId, layout),
    roots = storageRoots(runId, layout);
  const run = layout === "hdd-v1" ? roots.run : external(roots.run);
  const controls = {};
  function control(name) {
    const bytes =
      layout === "hdd-v1" ? storageControl(token, name) : regular(run, name);
    controls[name] = digest(bytes);
    return bytes;
  }
  const marker = object(JSON.parse(control("owner.json").toString("utf8")));
  demand(
    marker.protocol === "wp13-current-archives-v1" &&
      marker.run === runId &&
      marker.owner === "main",
    "E_MAIN_OWNER_MARKER",
  );
  const approval = object(
      JSON.parse(control("main-approval.json").toString("utf8")),
    ),
    bytes = control("request.json");
  demand(
    approval.run === runId &&
      approval.requestSHA256 === digest(bytes) &&
      Array.isArray(approval.phases) &&
      approval.phases.includes(phase),
    "E_MAIN_PHASE_SELECTION",
  );
  demand(
    approval.status === "main-reviewed-final-selection",
    "E_UNREVIEWED_SELECTION",
  );
  const request = object(JSON.parse(bytes.toString("utf8")));
  demand(
    request.protocol === marker.protocol && request.run === runId,
    "E_PROTOCOL",
  );
  const producer =
    layout === "hdd-v1"
      ? roots.producer
      : external(roots.producer, false, true);
  demand(
    fs.existsSync(path.join(producer, ".git")),
    "E_REAL_CHECKOUT_REQUIRED",
  );
  const tools = layout === "hdd-v1" ? roots.tools : external(roots.tools);
  const producerName = json(producer, "package.json");
  demand(
    producerName.name === "tableweave-workspace" &&
      producerName.packageManager === "pnpm@10.13.1",
    "E_PRODUCER_MANIFEST",
  );
  const ctx = {
    runId,
    run,
    producer,
    tools,
    phase,
    family,
    profile,
    request,
    approval,
    owner: marker,
    key: `${family}-${profile}`,
    controls,
  };
  demand(
    request.candidate === `wp13-candidate-${runId}` &&
      !Object.hasOwn(request, "generation"),
    "E_NO_HISTORICAL_GENERATION_SELECTION",
  );
  return bindStorage(token, ctx);
}
export function revalidate(ctx) {
  storageRevalidate(ctx);
  external(ctx.run, false, false, ctx);
  external(ctx.tools, false, false, ctx);
  external(ctx.producer, false, true, ctx);
  for (const [file, expected] of Object.entries(ctx.controls))
    demand(
      digest(regular(ctx.run, file)) === expected,
      "E_CONTROL_REPLACEMENT",
    );
  for (const file of [
    "package.json",
    "pnpm-workspace.yaml",
    ".npmrc",
    ".pnpmfile.cjs",
    "pnpmfile.cjs",
  ])
    demand(!present(path.join(ctx.run, file)), "E_RUN_CONFIG_HAZARD");
}
export const consumerPath = (ctx) => selectedRoots(ctx).consumers[ctx.key];
export function ownedConsumer(ctx) {
  const root = external(consumerPath(ctx), false, false, ctx);
  consumerStorage(ctx, root);
  demand(!fs.existsSync(path.join(root, ".git")), "E_WORKTREE_CONSUMER");
  const marker = json(root, "wp13-owner.json");
  demand(
    marker.run === ctx.runId &&
      marker.key === ctx.key &&
      marker.protocol === "wp13-current-archives-v1",
    "E_CONSUMER_OWNER",
  );
  return root;
}
export function local(root, file) {
  relative(file);
  const lexical = path.join(root, file),
    actual = fs.realpathSync(lexical);
  demand(
    actual.startsWith(`${directory(root)}/`) && fs.statSync(actual).isFile(),
    "E_BORROWED_RESOLUTION",
  );
  return actual;
}
export function approvedInput(root, file, expected) {
  relative(file);
  object(expected);
  const bytes = regular(root, file);
  demand(
    digest(bytes) === expected.sha256 && bytes.length === expected.size,
    "E_SELECTED_INPUT_BYTES",
  );
  return bytes;
}
