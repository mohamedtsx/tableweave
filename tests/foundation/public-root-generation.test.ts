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
import { rootDigests } from "../controls/filter-composition/roots.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const helpers = "tests/controls/filter-composition";

async function fixture() {
  const parent =
    process.env.TABLEWEAVE_TMPDIR ??
    (process.env.CI ? tmpdir() : "/tmp/opencode");
  const directory = await mkdtemp(join(parent, "tableweave-root-generation-"));
  const own = join(directory, helpers);
  await mkdir(own, { recursive: true });
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
  const outputs = Object.fromEntries(
    Object.entries(rootDigests()).filter(([file]) =>
      /^packages\/(?:react|heroui)\/dist\//.test(file),
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
        FILTER_CONTROLS_GENERATION: "fc01",
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
