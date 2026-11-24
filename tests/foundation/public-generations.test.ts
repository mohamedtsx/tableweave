import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { rootDigests } from "../controls/filter-composition/roots.mjs";
import {
  CURRENT_PUBLIC_GENERATION,
  getPublicGeneration,
  selectPublicGeneration,
} from "./public-generations.mjs";

const digest = (text: string) =>
  createHash("sha256").update(text).digest("hex");

it.each(["original", "fc01"])(
  "committed %s preimage has the immutable canonical count/digest",
  async (label) => {
    const bytes = await readFile(
      new URL(`./fixtures/public-generations/${label}.json`, import.meta.url),
      "utf8",
    );
    const map: Record<string, string> = JSON.parse(bytes);
    const approved = getPublicGeneration(label);
    expect(Object.keys(map)).toHaveLength(approved.outputCount);
    expect(Object.keys(map)).toEqual(
      Object.keys(map).sort((a, b) => a.localeCompare(b)),
    );
    expect(`${JSON.stringify(map, null, 2)}\n`).toBe(bytes);
    expect(digest(bytes)).toBe(approved.outputSha256);
    const mutated = {
      ...map,
      "packages/react/dist/unreviewed.js": "0".repeat(64),
    };
    expect(digest(`${JSON.stringify(mutated, null, 2)}\n`)).not.toBe(
      approved.outputSha256,
    );
    expect(
      await readFile(
        new URL(`./fixtures/public-generations/${label}.json`, import.meta.url),
        "utf8",
      ),
    ).toBe(bytes);
    expect(Object.isFrozen(approved)).toBe(true);
    expect(Reflect.set(approved, "outputCount", 199)).toBe(false);
    expect(getPublicGeneration(label)).toBe(approved);
  },
);

it.each([
  "",
  "unknown",
  "__proto__",
  "constructor",
  "toString",
  "../fc01",
  "wp09-final-1",
])("unknown/prototype label %j cannot select approval", (label) =>
  expect(() => getPublicGeneration(label)).toThrow(),
);

it("captures literal current selection independently of later caller mutation", () => {
  const args = ["types"];
  const environment = { FILTER_CONTROLS_GENERATION: "fc01" };
  const selected = selectPublicGeneration(args, environment);
  args.push("--generation", "original");
  environment.FILTER_CONTROLS_GENERATION = "original";
  expect(CURRENT_PUBLIC_GENERATION).toBe("fc01");
  expect(selected).toEqual({
    generation: "fc01",
    selection: "current",
    mode: "types",
    ...getPublicGeneration("fc01"),
  });
  expect(Object.isFrozen(selected)).toBe(true);
});

it.each(["original", "fc01"])(
  "explicit %s replay is registered, not caller approval",
  (label) => {
    expect(selectPublicGeneration(["--generation", label], {})).toEqual({
      generation: label,
      selection: "explicit-replay",
      mode: "browser",
      ...getPublicGeneration(label),
    });
  },
);

it.each([
  ["bad-mode"],
  ["types", "extra"],
  ["--unknown"],
  ["--generation"],
  ["--generation", ""],
  ["--generation", "unknown"],
  ["--generation", "fc01", "--generation", "fc01"],
  ["types", "--generation", "fc01", "browser"],
  ["--generation=fc01"],
  ["--generation", "../fc01"],
])("strict selector rejects %j", (...args) => {
  expect(() => selectPublicGeneration(args, {})).toThrow();
});

it.each([
  { FILTER_CONTROLS_GENERATION: "original" },
  { FILTER_CONTROLS_GENERATION: "unknown" },
  { FILTER_CONTROLS_GENERATION: "" },
  { FILTER_CONTROLS_PUBLIC_SHA256: "0".repeat(64) },
  { FILTER_CONTROLS_PUBLIC_SHA256: "" },
])("ambient metadata cannot override the default: %j", (environment) => {
  expect(() => selectPublicGeneration([], environment)).toThrow();
});

it("packed parent/focus share one frozen module selection, not later ambient metadata", () => {
  // Selection-only child: imports the helper but NEVER calls packing or focus work.
  const environment = { ...process.env };
  delete environment.FILTER_CONTROLS_GENERATION;
  delete environment.FILTER_CONTROLS_PUBLIC_SHA256;
  const result = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `
    import assert from "node:assert/strict";
    const {packedPublicGeneration:a}=await import("./tests/foundation/packed-focus-handoff.mjs");
    process.env.FILTER_CONTROLS_GENERATION="original";
    process.env.FILTER_CONTROLS_PUBLIC_SHA256="0".repeat(64);
    const {packedPublicGeneration:b}=await import("./tests/foundation/packed-focus-handoff.mjs");
    assert.equal(a,b); assert.equal(a.generation,"fc01"); assert.equal(a.outputCount,180);
    assert.equal(a.outputSha256,"de82ce232f3021a754b1e30df780eac27cd358604766cde4110cc922bf25f095");
    assert(Object.isFrozen(a));
  `,
    ],
    {
      cwd: fileURLToPath(new URL("../../", import.meta.url)),
      encoding: "utf8",
      env: environment,
    },
  );
  expect(result.status, result.stdout + result.stderr).toBe(0);
});

it("actual workspace outputs must match CURRENT (open blocker until reviewed registration)", () => {
  // Intentionally reads actual workspace outputs, NOT the historical fixture.
  // Missing dist or a new unregistered generation MUST fail this default test.
  const current = Object.fromEntries(
    Object.entries(rootDigests()).filter(([path]) =>
      /^packages\/(?:react|heroui)\/dist\//.test(path),
    ),
  );
  const approved = getPublicGeneration(CURRENT_PUBLIC_GENERATION);
  expect(
    Object.keys(current),
    "Actual output differs from reviewed CURRENT",
  ).toHaveLength(approved.outputCount);
  expect(digest(`${JSON.stringify(current, null, 2)}\n`)).toBe(
    approved.outputSha256,
  );
});
