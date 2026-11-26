import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { expect, it } from "vitest";
import { getPublicGeneration } from "./public-generations.mjs";

// SYNTHETIC harness proof only. Real copied guards/hash comparisons execute;
// root-map I/O and type/browser children are controlled. No browser/server/tsc.
const workspace = fileURLToPath(new URL("../../", import.meta.url));
const filter = "tests/controls/filter-composition";
const focus = "tests/controls/focus-handoff";
const foundation = "tests/foundation";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");

async function fixture(label = "fc01") {
  const directory = await mkdtemp(
    join(
      process.env.TABLEWEAVE_TMPDIR ??
        (process.env.CI ? tmpdir() : "/tmp/opencode"),
      "tableweave-generation-runner-",
    ),
  );
  for (const path of [
    `${foundation}/public-generations.mjs`,
    `${foundation}/filter-controls-browser.mjs`,
    `${filter}/generation.mjs`,
    `${filter}/verify-public-roots.mjs`,
    `${filter}/capture-roots.mjs`,
    `${focus}/capture-generation.mjs`,
    "packages/heroui/src/selection/selection-toolbar.tsx",
  ]) {
    await mkdir(dirname(join(directory, path)), { recursive: true });
    await copyFile(join(workspace, path), join(directory, path));
  }
  const outputs: Record<string, string> = JSON.parse(
    await readFile(
      join(workspace, foundation, `fixtures/public-generations/${label}.json`),
      "utf8",
    ),
  );
  const sources = { "packages/react/src/synthetic.ts": "a".repeat(64) };
  const inputs = {
    "filter-composition": { sources: { ...sources }, outputs: { ...outputs } },
    "focus-handoff": { sources: { ...sources }, outputs: { ...outputs } },
  };
  await writeFile(join(directory, "inputs.json"), JSON.stringify(inputs));
  await writeFile(
    join(directory, filter, "roots.mjs"),
    `import { readFileSync } from "node:fs";
export const own = ${JSON.stringify(join(directory, filter))};
export const workspace = ${JSON.stringify(directory)};
export function rootDigests() {
  const b = JSON.parse(readFileSync(${JSON.stringify(join(directory, "inputs.json"))}, "utf8"))["filter-composition"];
  return Object.fromEntries(Object.entries({...b.sources,...b.outputs}).sort(([a],[b])=>a.localeCompare(b)));
}
`,
  );
  // Replace ONLY snapshot I/O in the copied focus helper. Registry lookup,
  // corrected-source pin, identity and before/current comparisons stay real.
  const focusCode = await readFile(join(workspace, focus, "roots.mjs"), "utf8");
  const start = focusCode.indexOf("export function snapshots() {");
  const end = focusCode.indexOf("export function assertCorrectedSource() {");
  if (start < 0 || end <= start)
    throw new Error("Focus I/O seam changed; review fixture");
  await writeFile(
    join(directory, focus, "roots.mjs"),
    `${focusCode.slice(0, start)}export function snapshots() {
  const b = JSON.parse(readFileSync(${JSON.stringify(join(directory, "inputs.json"))}, "utf8"))["focus-handoff"];
  const sort = entries => Object.fromEntries(Object.entries(entries).sort(([a],[b])=>a.localeCompare(b)));
  const sources = sort(b.sources), outputs = sort(b.outputs);
  return {sources, outputs, publicSha256:digest(JSON.stringify(outputs,null,2)+"\\n"),
    sourcePublicSha256:digest(JSON.stringify(sort({...sources,...outputs}),null,2)+"\\n")};
}
${focusCode.slice(end)}`,
  );
  const storybook = join(directory, "apps/storybook/storybook-static");
  await mkdir(storybook, { recursive: true });
  await writeFile(join(storybook, "index.json"), "{}");
  await writeFile(join(directory, "plan.json"), "{}");
  await writeFile(join(directory, "shim.mjs"), shim);
  const environment = { ...process.env };
  delete environment.FILTER_CONTROLS_GENERATION;
  delete environment.FILTER_CONTROLS_PUBLIC_SHA256;
  delete environment.FILTER_CONTROLS_RUN;
  const run = async (
    args: string[] = [],
    plan: Record<string, unknown> = {},
    extra: Record<string, string> = {},
  ) => {
    await writeFile(join(directory, "plan.json"), JSON.stringify(plan));
    return spawnSync(
      process.execPath,
      [join(directory, foundation, "filter-controls-browser.mjs"), ...args],
      {
        cwd: directory,
        encoding: "utf8",
        env: {
          ...environment,
          NODE_OPTIONS: `--import=${pathToFileURL(join(directory, "shim.mjs")).href}`,
          ...extra,
        },
      },
    );
  };
  const evidence = async () => {
    const root = join(directory, filter, ".artifacts", label);
    const runs = await readdir(root);
    const runName = runs.find((name) => name.startsWith("ordered-"));
    if (!runName) throw new Error("No own ordered evidence");
    return { runName, target: join(root, runName) };
  };
  return { directory, inputs, run, evidence, environment };
}

const shim = `import cp from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
const root=fileURLToPath(new URL("./",import.meta.url));
const original=cp.spawnSync;
const hash=x=>createHash("sha256").update(x).digest("hex");
const sort=x=>Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b)));
const text=x=>JSON.stringify(x,null,2)+"\\n";
const plan=JSON.parse(readFileSync(join(root,"plan.json"),"utf8"));
function rewrite(boundary,run,which) {
 const b=JSON.parse(readFileSync(join(root,"inputs.json"),"utf8"))[boundary];
 const sources=sort(b.sources),outputs=sort(b.outputs);
 const roots={sources,outputs,publicSha256:hash(text(outputs)),sourcePublicSha256:hash(text(sort({...sources,...outputs})))};
 const data=boundary==="focus-handoff"?{generation:"fc01",roots}:sort({...sources,...outputs});
 for(const side of which)writeFileSync(join(root,"tests/controls",boundary,".artifacts/fc01",run,"roots-"+side+".json"),text(data));
}
cp.spawnSync=(executable,args,options)=>{
 const script=args[0]??"";
 const config=args.find(a=>a.endsWith("playwright.config.ts"))??"";
 const stage=executable==="pnpm"?(config.includes("storybook")?"storybook":config.includes("focus-handoff")?"focus":"composition"):
   script.endsWith("check-types.mjs")?(script.includes("focus-handoff")?"focus-types":"composition-types"):null;
 appendFileSync(join(root,"calls.jsonl"),JSON.stringify({executable,args,stage,env: {
 generation:options.env.FILTER_CONTROLS_GENERATION,sha:options.env.FILTER_CONTROLS_PUBLIC_SHA256,
 file:options.env.PLAYWRIGHT_JSON_OUTPUT_FILE,name:options.env.PLAYWRIGHT_JSON_OUTPUT_NAME,dir:options.env.PLAYWRIGHT_JSON_OUTPUT_DIR,
 run:options.env.FILTER_CONTROLS_RUN}})+"\\n");
 if(!stage) {
  const result=original(executable,args,options);
  if(result.status===0 && !args.includes("--before") && plan.afterRewrite && script.includes(plan.afterRewrite.boundary) && /capture-(roots|generation)\\.mjs$/.test(script)) {
   for(const side of plan.afterRewrite.sides)writeFileSync(join(root,"tests/controls",plan.afterRewrite.boundary,".artifacts/fc01",options.env.FILTER_CONTROLS_RUN,"roots-"+side+".json"),"replaced after helper\\n");
  }
  return result;
 }
 if(stage===plan.stage && plan.rebaseBoundary) {
  const path=join(root,"inputs.json"); const inputs=JSON.parse(readFileSync(path,"utf8"));
  if(!plan.identical)inputs[plan.rebaseBoundary].sources["packages/react/src/synthetic.ts"]="9".repeat(64);
  writeFileSync(path,JSON.stringify(inputs));
  if(!plan.driftOnly)rewrite(plan.rebaseBoundary,options.env.FILTER_CONTROLS_RUN,["before","after"]);
 }
 if(executable==="pnpm") {
  const counts={composition:19,storybook:4,focus:10};
  const stats={expected:counts[stage],unexpected:0,skipped:0,flaky:0};
  if(stage===plan.stage && plan.stat) {if(plan.value===null)delete stats[plan.stat];else stats[plan.stat]=plan.value;}
  const destination=options.env.PLAYWRIGHT_JSON_OUTPUT_FILE;
  if(destination!==options.env.PLAYWRIGHT_JSON_OUTPUT_NAME||dirname(destination)!==options.env.PLAYWRIGHT_JSON_OUTPUT_DIR)throw Error("Reporter destination mismatch");
  if(!(stage===plan.stage&&plan.missingJson))writeFileSync(destination,stage===plan.stage&&plan.badJson?"bad-json":JSON.stringify({stats}));
 }
 return {status:stage===plan.stage&&plan.nonzero?1:0,stdout:"synthetic child only",stderr:""};
};
syncBuiltinESMExports();
`;

it.each(["browser", "types"])(
  "synthetic %s runner keeps two initial maps and explicit current identity",
  async (mode) => {
    const f = await fixture();
    const result = await f.run([mode]);
    expect(result.status, result.stdout + result.stderr).toBe(0);
    const { target, runName } = await f.evidence();
    const report = JSON.parse(
      await readFile(join(target, "report.json"), "utf8"),
    );
    expect(report.generation).toBe("fc01");
    expect(report.outputCount).toBe(180);
    expect(report.outputSha256).toBe(getPublicGeneration("fc01").outputSha256);
    expect(report.mode).toBe(mode);
    expect(report.selection).toBe("current");
    const calls = (await readFile(join(f.directory, "calls.jsonl"), "utf8"))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
    expect(
      calls.filter((call) => call.stage).map((call) => call.stage),
    ).toEqual(
      mode === "types"
        ? ["composition-types", "focus-types"]
        : ["composition", "storybook", "focus"],
    );
    for (const boundary of ["filter-composition", "focus-handoff"]) {
      const dir = join(
        f.directory,
        "tests/controls",
        boundary,
        ".artifacts/fc01",
        runName,
      );
      const before = await readFile(join(dir, "roots-before.json"), "utf8");
      expect(await readFile(join(dir, "roots-after.json"), "utf8")).toBe(
        before,
      );
      expect(report.sourceSnapshotSha256[boundary]).toBe(sha(before));
    }
  },
);

it("synthetic browser reports override inherited FILE/NAME/DIR without touching history", async () => {
  const f = await fixture();
  const sentinel = join(f.directory, "historical-report.json");
  await writeFile(sentinel, "historical sentinel\n");
  const result = await f.run(
    [],
    {},
    {
      PLAYWRIGHT_JSON_OUTPUT_FILE: sentinel,
      PLAYWRIGHT_JSON_OUTPUT_NAME: sentinel,
      PLAYWRIGHT_JSON_OUTPUT_DIR: f.directory,
    },
  );
  expect(result.status, result.stderr).toBe(0);
  expect(await readFile(sentinel, "utf8")).toBe("historical sentinel\n");
  const calls = (await readFile(join(f.directory, "calls.jsonl"), "utf8"))
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  const paths = calls.filter((call) => call.stage).map((call) => call.env.file);
  expect(new Set(paths).size).toBe(3);
  const first = await f.evidence();
  const second = await f.run([]);
  expect(second.status, second.stderr).toBe(0);
  const runs = await readdir(dirname(first.target));
  expect(runs.filter((name) => name.startsWith("ordered-")).length).toBe(2);
});

for (const stage of [
  "composition",
  "storybook",
  "focus",
  "composition-types",
  "focus-types",
]) {
  it.each(["filter-composition", "focus-handoff"])(
    `synthetic ${stage}: parent rejects coupled source/before/after rebase of %s`,
    async (boundary) => {
      const f = await fixture();
      const result = await f.run(
        [stage.endsWith("types") ? "types" : "browser"],
        {
          stage,
          rebaseBoundary: boundary,
        },
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("parent-retained initial snapshot");
      const { target } = await f.evidence();
      await expect(readFile(join(target, "report.json"))).rejects.toThrow();
    },
  );
}

for (const boundary of ["filter-composition", "focus-handoff"]) {
  it.each([["before"], ["after"], ["before", "after"]])(
    `synthetic ${boundary}: post-helper replacement of %j cannot redefine the parent`,
    async (...sides) => {
      const f = await fixture();
      const result = await f.run(["types"], {
        afterRewrite: { boundary, sides },
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("parent-retained initial snapshot");
    },
  );
}

for (const stage of ["composition", "storybook", "focus"]) {
  it.each([
    { stat: "expected", value: 0 },
    { stat: "expected", value: 999 },
    { stat: "expected", value: null },
    { stat: "unexpected", value: 1 },
    { stat: "skipped", value: 1 },
    { stat: "flaky", value: 1 },
    { stat: "flaky", value: null },
    { missingJson: true },
    { badJson: true },
    { nonzero: true },
  ])(
    `synthetic ${stage}: rejects failed/missing/incorrect inventory %j`,
    async (plan) => {
      const f = await fixture();
      const result = await f.run([], { ...plan, stage });
      expect(result.status).not.toBe(0);
      const { target } = await f.evidence();
      await expect(readFile(join(target, "report.json"))).rejects.toThrow();
    },
  );
}

it.each(["composition-types", "focus-types"])(
  "synthetic %s failure is not a browser/type pass",
  async (stage) => {
    const f = await fixture();
    expect((await f.run(["types"], { stage, nonzero: true })).status).not.toBe(
      0,
    );
  },
);

it.each([
  ["invalid"],
  ["types", "extra"],
  ["--generation"],
  ["--generation", ""],
  ["--generation", "unknown"],
  ["--generation", "../fc01"],
  ["--generation", "fc01", "--generation", "fc01"],
  ["--skip"],
])("runner rejects %j before evidence writes", async (...args) => {
  const f = await fixture();
  expect((await f.run(args)).status).not.toBe(0);
  await expect(
    readdir(join(f.directory, filter, ".artifacts")),
  ).rejects.toThrow();
});

it.each([
  { FILTER_CONTROLS_GENERATION: "original" },
  { FILTER_CONTROLS_GENERATION: "__proto__" },
  { FILTER_CONTROLS_PUBLIC_SHA256: "0".repeat(64) },
])(
  "runner rejects contradictory environment before writes: %j",
  async (extra) => {
    const f = await fixture();
    expect((await f.run([], {}, extra)).status).not.toBe(0);
    await expect(
      readdir(join(f.directory, filter, ".artifacts")),
    ).rejects.toThrow();
  },
);

it("synthetic explicit registered fc01 replay records its selection scope", async () => {
  const f = await fixture();
  expect((await f.run(["types", "--generation", "fc01"])).status).toBe(0);
  const { target } = await f.evidence();
  expect(
    JSON.parse(await readFile(join(target, "report.json"), "utf8")).selection,
  ).toBe("explicit-replay");
});

it("original guard replay remains valid but corrected focus runtime always refuses original", async () => {
  const f = await fixture("original");
  const result = await f.run(["types", "--generation", "original"]);
  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain(
    "not runnable corrected focus evidence",
  );
});

it("raw default original/flat capture refuses duplicate before and later source drift", async () => {
  const f = await fixture("original");
  const script = join(f.directory, filter, "capture-roots.mjs");
  const run = (args: string[]) =>
    spawnSync(process.execPath, [script, ...args], {
      cwd: f.directory,
      env: f.environment,
      encoding: "utf8",
    });
  expect(run(["--before"]).status).toBe(0);
  const before = join(f.directory, filter, ".artifacts/roots-before.json");
  const initial = await readFile(before, "utf8");
  expect(run(["--before"]).status).not.toBe(0);
  f.inputs["filter-composition"].sources["packages/react/src/synthetic.ts"] =
    "b".repeat(64);
  await writeFile(join(f.directory, "inputs.json"), JSON.stringify(f.inputs));
  expect(run([]).status).not.toBe(0);
  expect(await readFile(before, "utf8")).toBe(initial);
});

it.each(["", "../escape", "a/b", "a\\b", ".", "é", "x".repeat(81)])(
  "raw filter capture rejects unsafe run %j before writes",
  async (run) => {
    const f = await fixture();
    const result = spawnSync(
      process.execPath,
      [join(f.directory, filter, "capture-roots.mjs"), "--before"],
      {
        cwd: f.directory,
        encoding: "utf8",
        env: {
          ...f.environment,
          FILTER_CONTROLS_GENERATION: "fc01",
          FILTER_CONTROLS_RUN: run,
        },
      },
    );
    expect(result.status).not.toBe(0);
    await expect(
      readdir(join(f.directory, filter, ".artifacts")),
    ).rejects.toThrow();
  },
);

it.each(["-safe", "A".repeat(80)])(
  "raw filter safe legacy run %j remains allowed",
  async (run) => {
    const f = await fixture();
    const script = join(f.directory, filter, "capture-roots.mjs");
    const result = spawnSync(process.execPath, [script, "--before"], {
      cwd: f.directory,
      encoding: "utf8",
      env: {
        ...f.environment,
        FILTER_CONTROLS_GENERATION: "fc01",
        FILTER_CONTROLS_RUN: run,
      },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(
      await readFile(
        join(f.directory, filter, ".artifacts/fc01", run, "roots-before.json"),
        "utf8",
      ),
    ).toContain("synthetic.ts");
  },
);

it.each(["safe-unknown", "constructor", "__proto__", ""])(
  "raw focus cannot promote safe/prototype/unknown generation %j",
  async (generation) => {
    const f = await fixture();
    const result = spawnSync(
      process.execPath,
      [join(f.directory, focus, "capture-generation.mjs"), "--before"],
      {
        cwd: f.directory,
        encoding: "utf8",
        env: {
          ...f.environment,
          FILTER_CONTROLS_GENERATION: generation,
          FILTER_CONTROLS_RUN: "safe-run",
        },
      },
    );
    expect(result.status).not.toBe(0);
    await expect(
      readdir(join(f.directory, focus, ".artifacts")),
    ).rejects.toThrow();
  },
);

it.each(["filter-composition", "focus-handoff"])(
  "raw %s missing/corrupt before is not a recapture",
  async (boundary) => {
    const f = await fixture();
    const helper =
      boundary === "filter-composition"
        ? "capture-roots.mjs"
        : "capture-generation.mjs";
    const run = () =>
      spawnSync(
        process.execPath,
        [join(f.directory, "tests/controls", boundary, helper)],
        {
          cwd: f.directory,
          encoding: "utf8",
          env: {
            ...f.environment,
            FILTER_CONTROLS_GENERATION: "fc01",
            FILTER_CONTROLS_RUN: "missing-before",
          },
        },
      );
    expect(run().status).not.toBe(0);
    const dir = join(
      f.directory,
      "tests/controls",
      boundary,
      ".artifacts/fc01/missing-before",
    );
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "roots-before.json"), "not-json\n");
    expect(run().status).not.toBe(0);
    expect(await readFile(join(dir, "roots-before.json"), "utf8")).toBe(
      "not-json\n",
    );
  },
);

it.each(["filter-composition", "focus-handoff"])(
  "synthetic %s identical-byte snapshot rewrite is not drift",
  async (boundary) => {
    const f = await fixture();
    const result = await f.run(["types"], {
      stage: "composition-types",
      rebaseBoundary: boundary,
      identical: true,
    });
    expect(result.status, result.stderr).toBe(0);
  },
);

it.each(["filter-composition", "focus-handoff"])(
  "synthetic %s source-only drift fails without replacing the before map",
  async (boundary) => {
    const f = await fixture();
    const result = await f.run(["types"], {
      stage: "composition-types",
      rebaseBoundary: boundary,
      driftOnly: true,
    });
    expect(result.status).not.toBe(0);
    const { target } = await f.evidence();
    await expect(readFile(join(target, "report.json"))).rejects.toThrow();
  },
);

it.each(["missing", "external"])(
  "synthetic browser refuses %s Storybook directory before helper/child commands",
  async (condition) => {
    const f = await fixture();
    const path = join(f.directory, "apps/storybook/storybook-static");
    await rename(path, join(f.directory, "saved-static"));
    if (condition === "external") {
      const external = await mkdtemp(
        join(dirname(f.directory), "tableweave-storybook-external-"),
      );
      await symlink(external, path, "dir");
    }
    expect((await f.run([])).status).not.toBe(0);
    await expect(readFile(join(f.directory, "calls.jsonl"))).rejects.toThrow();
  },
);

it("synthetic unknown public output fails before before-capture or compiler/browser children", async () => {
  const f = await fixture();
  const path = Object.keys(f.inputs["filter-composition"].outputs)[0];
  if (!path) throw new Error("Missing historical output fixture");
  f.inputs["filter-composition"].outputs[path] = "0".repeat(64);
  await writeFile(join(f.directory, "inputs.json"), JSON.stringify(f.inputs));
  expect((await f.run(["types"])).status).not.toBe(0);
  const calls = (await readFile(join(f.directory, "calls.jsonl"), "utf8"))
    .trim()
    .split("\n");
  expect(calls).toHaveLength(1);
  expect(JSON.parse(calls[0] ?? "{}").args[0]).toContain(
    "verify-public-roots.mjs",
  );
});
