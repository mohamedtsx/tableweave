import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { forbiddenImports, inspectGraph } from "./boundaries.mjs";

const readJson = async (file: string) =>
  JSON.parse(await readFile(file, "utf8"));
const ui = [
  "@heroui/react",
  "@heroui/styles",
  "tailwindcss",
  "react-aria",
  "react-aria-components",
  "@dnd-kit/react",
  "@tableweave/heroui",
];

describe("emitted foundation boundaries (not feature acceptance)", () => {
  it("keeps contracts and filters free of React/UI imports and client directives", async () => {
    for (const entry of ["contracts", "filters"]) {
      const graph = await inspectGraph(
        `packages/react/dist/${entry}/index.js`,
        "packages/react/dist",
      );
      expect(forbiddenImports(graph, ["react", "react-dom", ...ui])).toEqual(
        [],
      );
      expect(graph.files.length).toBeGreaterThan(1);
      expect(
        [...graph.directives.values()].every((value: boolean) => !value),
      ).toBe(true);
      expect([...graph.externals].sort()).toEqual([
        "@internationalized/date",
        "valibot",
      ]);
    }
  });

  it("retains client directives without pulling styled/sortable dependencies into defaults", async () => {
    const exports = await import("../../packages/react/dist/index.js");
    expect(Object.keys(exports).sort()).toEqual(
      [
        "ControllerError",
        "createTableController",
        "createTableState",
        "defineController",
        "reduceTableState",
        "replaceTableDefinition",
        "useTableweaveQuery",
        "useTableweaveSelector",
        "useTableweaveState",
      ].sort(),
    );
    for (const name of ["react", "heroui"]) {
      const path = resolve(`packages/${name}/dist/index.js`);
      const graph = await inspectGraph(path, `packages/${name}/dist`);
      expect(graph.directives.get(path)).toBe(true);
      expect(
        forbiddenImports(
          graph,
          name === "react"
            ? ui
            : ["@dnd-kit/react", "@tableweave/heroui/sortable"],
        ),
      ).toEqual([]);
      expect(
        graph.files.some((file: string) => file.includes("/sortable/")),
      ).toBe(false);
    }
    const sortable = resolve("packages/heroui/dist/sortable/index.js");
    expect(
      (await inspectGraph(sortable, "packages/heroui/dist")).directives.get(
        sortable,
      ),
    ).toBe(true);
  });

  it("exposes only bounded ESM/declaration subpaths and marks actual CSS as side-effectful", async () => {
    const headless = await readJson("packages/react/package.json");
    const styled = await readJson("packages/heroui/package.json");
    expect(Object.keys(headless.exports)).toEqual([
      ".",
      "./contracts",
      "./filters",
    ]);
    expect(Object.keys(styled.exports)).toEqual([
      ".",
      "./sortable",
      "./styles.css",
    ]);
    expect(headless.sideEffects).toBe(false);
    expect(styled.sideEffects).toEqual(["./dist/styles.css"]);
    expect(await readFile("packages/heroui/dist/styles.css", "utf8")).toContain(
      "@layer tableweave;",
    );
    for (const manifest of [headless, styled]) {
      expect(manifest.private).toBe(true);
      expect(manifest.dependencies).toEqual(
        manifest === headless
          ? { "@internationalized/date": "3.12.4", valibot: "1.5.0" }
          : undefined,
      );
      expect(manifest.type).toBe("module");
      for (const entry of Object.values(manifest.exports)) {
        if (typeof entry !== "string") {
          expect(entry).toHaveProperty("types");
          expect(entry).toHaveProperty("import");
          expect(entry).not.toHaveProperty("require");
        }
      }
    }
  });

  it("the graph guard detects a transitive forbidden dependency, not just direct imports", async () => {
    const parent =
      process.env.TABLEWEAVE_TMPDIR ??
      (process.env.CI ? tmpdir() : "/tmp/opencode");
    const dir = await mkdtemp(join(parent, "tableweave-graph-"));
    await writeFile(join(dir, "entry.js"), 'export * from "./child.js";');
    await writeFile(join(dir, "child.js"), 'import("@heroui/react");');
    const graph = await inspectGraph(join(dir, "entry.js"), dir);
    expect(forbiddenImports(graph, ["@heroui/react"])).toEqual([
      "@heroui/react",
    ]);
    await writeFile(join(dir, "entry.js"), 'import("../outside.js");');
    await expect(inspectGraph(join(dir, "entry.js"), dir)).rejects.toThrow(
      "Escaped package",
    );
  });
});
