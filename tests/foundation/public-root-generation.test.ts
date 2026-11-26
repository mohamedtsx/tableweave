import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";
import { getPublicGeneration } from "./public-generations.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const helpers = "tests/controls/filter-composition";

async function fixture(label = "fc01") {
  const parent =
    process.env.TABLEWEAVE_TMPDIR ??
    (process.env.CI ? tmpdir() : "/tmp/opencode");
  const directory = await mkdtemp(join(parent, "tableweave-root-generation-"));
  const own = join(directory, helpers);
  await mkdir(own, { recursive: true });
  await mkdir(join(directory, "tests/foundation"), { recursive: true });
  await copyFile(
    join(root, "tests/foundation/public-generations.mjs"),
    join(directory, "tests/foundation/public-generations.mjs"),
  );
  for (const file of ["verify-public-roots.mjs", "generation.mjs"])
    await copyFile(join(root, helpers, file), join(own, file));
  await writeFile(
    join(own, "roots.mjs"),
    `import { readFileSync } from "node:fs";
export const own = ${JSON.stringify(own)};
export const workspace = ${JSON.stringify(directory)};
export const rootDigests = () => JSON.parse(readFileSync(new URL("./inputs.json", import.meta.url), "utf8"));
`,
  );
  // Historical regressions must not assume every future workspace emits fc01.
  const outputs: Record<string, string> = JSON.parse(
    await readFile(
      join(root, `tests/foundation/fixtures/public-generations/${label}.json`),
      "utf8",
    ),
  );
  const inputs = join(own, "inputs.json");
  const historical = join(
    directory,
    "tests/controls/integration/.artifacts/roots-before.json",
  );
  const run = (extra: Record<string, string> = {}) =>
    spawnSync(process.execPath, [join(own, "verify-public-roots.mjs")], {
      cwd: directory,
      encoding: "utf8",
      env: {
        ...process.env,
        FILTER_CONTROLS_GENERATION: label,
        FILTER_CONTROLS_PUBLIC_SHA256: getPublicGeneration(label).outputSha256,
        FILTER_CONTROLS_RUN: "clean-checkout",
        ...extra,
      },
    });
  await writeFile(inputs, JSON.stringify(outputs));
  return { own, outputs, inputs, historical, run };
}

it("verifies the committed generation without a historical ignored manifest", async () => {
  const setup = await fixture();
  expect(Object.keys(setup.outputs)).toHaveLength(180);
  const result = setup.run();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  const published = JSON.parse(
    await readFile(
      join(
        setup.own,
        ".artifacts/fc01/clean-checkout/public-roots-verified.json",
      ),
      "utf8",
    ),
  );
  expect(published).toEqual(setup.outputs);
});

it.each(["original", "fc01"])(
  "replays committed %s roots without consulting today's workspace output",
  async (label) => {
    const setup = await fixture(label);
    expect(setup.run().status).toBe(0);
    const other = label === "original" ? "fc01" : "original";
    expect(
      setup.run({
        FILTER_CONTROLS_GENERATION: other,
        FILTER_CONTROLS_PUBLIC_SHA256: getPublicGeneration(other).outputSha256,
      }).status,
    ).not.toBe(0);
  },
);

it.each(["original", "fc01"])(
  "rejects new same-count bytes under historical %s even with caller/hash/history poison",
  async (label) => {
    const setup = await fixture(label);
    const declaration = Object.keys(setup.outputs).find((file) =>
      file.endsWith(".d.ts"),
    );
    if (!declaration) throw new Error("Missing historical declaration");
    setup.outputs[declaration] = "1".repeat(64);
    await writeFile(setup.inputs, JSON.stringify(setup.outputs));
    await mkdir(join(setup.historical, ".."), { recursive: true });
    await writeFile(setup.historical, JSON.stringify(setup.outputs));
    expect(setup.run().status).not.toBe(0);
    expect(
      setup.run({ FILTER_CONTROLS_PUBLIC_SHA256: "1".repeat(64) }).status,
    ).not.toBe(0);
  },
);

it.each(["mixed", "shuffled", "swapped", "nonhex", "absolute", "separator"])(
  "rejects historical map corruption: %s",
  async (mutation) => {
    const setup = await fixture();
    const entries = Object.entries(setup.outputs);
    const first = entries[0];
    const second = entries[1];
    if (!first || !second) throw new Error("Historical fixture is incomplete");
    if (mutation === "mixed") {
      const original: Record<string, string> = JSON.parse(
        await readFile(
          join(
            root,
            "tests/foundation/fixtures/public-generations/original.json",
          ),
          "utf8",
        ),
      );
      Object.assign(setup.outputs, original);
    }
    if (mutation === "swapped") {
      setup.outputs[first[0]] = second[1];
      setup.outputs[second[0]] = first[1];
    }
    if (mutation === "nonhex") setup.outputs[first[0]] = "not-a-sha";
    if (mutation === "absolute" || mutation === "separator") {
      delete setup.outputs[first[0]];
      setup.outputs[
        mutation === "absolute"
          ? `/${first[0]}`
          : first[0].replaceAll("/", "\\")
      ] = first[1];
    }
    await writeFile(
      setup.inputs,
      JSON.stringify(
        mutation === "shuffled"
          ? Object.fromEntries(entries.reverse())
          : setup.outputs,
      ),
    );
    expect(setup.run().status).not.toBe(0);
  },
);

it("ignores poisoned historical evidence instead of using it as authority", async () => {
  const setup = await fixture();
  await mkdir(join(setup.historical, ".."), { recursive: true });
  await writeFile(setup.historical, "not a manifest\n");
  const result = setup.run();
  expect(result.status, result.stdout + result.stderr).toBe(0);
  expect(await readFile(setup.historical, "utf8")).toBe("not a manifest\n");
});

it.each(["changed", "missing", "renamed", "extra"])(
  "rejects %s output even with a matching forged historical snapshot",
  async (mutation) => {
    const setup = await fixture();
    const file = Object.keys(setup.outputs)[0];
    if (!file) throw new Error("Missing real emitted output");
    if (mutation === "changed") setup.outputs[file] = "0".repeat(64);
    if (mutation === "missing" || mutation === "renamed") {
      const hash = setup.outputs[file];
      delete setup.outputs[file];
      if (mutation === "renamed" && hash)
        setup.outputs[`${file}.renamed`] = hash;
    }
    if (mutation === "extra")
      setup.outputs["packages/react/dist/unreviewed.js"] = "0".repeat(64);
    await writeFile(setup.inputs, JSON.stringify(setup.outputs));
    await mkdir(join(setup.historical, ".."), { recursive: true });
    await writeFile(
      setup.historical,
      `${JSON.stringify(setup.outputs, null, 2)}\n`,
    );
    const result = setup.run();
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("180-output handoff no longer matches");
  },
);

it.each([
  { FILTER_CONTROLS_GENERATION: "unknown" },
  { FILTER_CONTROLS_RUN: "../../overwrite" },
  { FILTER_CONTROLS_GENERATION: "original" },
])("rejects an invalid or mismatched generation/run: %j", async (extra) => {
  const setup = await fixture();
  expect(setup.run(extra).status).not.toBe(0);
});
