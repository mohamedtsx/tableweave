import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("exact declaration-only compatibility repair", () => {
  it("keeps exact Start Vite repairs limited to reviewed genuine declarations", async () => {
    const patches = [
      [
        "patches/@tanstack__start-server-core@1.169.40.patch",
        ["dist/esm/session.d.ts"],
      ],
      [
        "patches/@tanstack__start-plugin-core@1.171.50.patch",
        ["dist/esm/schema.d.ts", "dist/esm/vite/schema.d.ts"],
      ],
    ] as const;
    const lock = await readFile("pnpm-lock.yaml", "utf8");
    for (const [file, paths] of patches) {
      const text = await readFile(file, "utf8");
      expect(
        [...text.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)].map(
          (match) => match[1],
        ),
      ).toEqual(paths);
      expect(text).not.toMatch(/deleted file mode|new file mode/);
      expect(lock).toContain(
        `hash: ${createHash("sha256").update(text).digest("hex")}`,
      );
      if (file.includes("plugin-core"))
        expect(
          text.match(/\+.*import\('@tanstack\/router-plugin\/vite'\)/g),
        ).toHaveLength(5);
    }
    const workspace = await readFile("pnpm-workspace.yaml", "utf8");
    expect(workspace).toContain("'@standard-schema/spec': '1.1.0'");
    expect(workspace).toContain("cookie-es: '3.1.1'");
    expect(workspace).not.toMatch(/allowUnusedPatches|ignorePatchFailures/);
  });
  it("narrows calendar type references to the same genuine scoped declarations", async () => {
    const text = await readFile("patches/@heroui__react@3.2.8.patch", "utf8");
    expect(
      [...text.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)].map(
        (match) => match[1],
      ),
    ).toEqual([
      "dist/components/calendar/index.d.ts",
      "dist/components/list-box/index.d.ts",
      "dist/components/range-calendar/index.d.ts",
    ]);
    const additions = text.split("\n").filter((line) => line.startsWith("+"));
    expect(
      additions.filter((line) =>
        line.includes('import("../calendar-year-picker")'),
      ),
    ).toHaveLength(12);
    expect(
      text.match(/^\+\/\/ Tableweave compatibility modification:/gm),
    ).toHaveLength(3);
    expect(text).not.toMatch(/deleted file mode|new file mode/);
    expect(await readFile("pnpm-lock.yaml", "utf8")).toContain(
      `hash: ${createHash("sha256").update(text).digest("hex")}`,
    );
  });
  it("patches only the two reviewed declarations, not runtime or package exports", async () => {
    const patch = await readFile(
      "patches/react-aria-components@1.22.1.patch",
      "utf8",
    );
    expect(
      [...patch.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)].map((match) => [
        match[1],
        match[2],
      ]),
    ).toEqual([
      ["dist/types/src/Group.d.ts", "dist/types/src/Group.d.ts"],
      ["dist/types/src/OverlayArrow.d.ts", "dist/types/src/OverlayArrow.d.ts"],
    ]);
    expect(patch).not.toMatch(/deleted file mode|new file mode/);
    expect(
      patch.match(/^\+\/\/ Tableweave compatibility modification:/gm),
    ).toHaveLength(2);
    const lock = await readFile("pnpm-lock.yaml", "utf8");
    const hash = createHash("sha256").update(patch).digest("hex");
    expect(lock).toContain(`hash: ${hash}`);
    const workspace = await readFile("pnpm-workspace.yaml", "utf8");
    expect(workspace).toContain(
      "react-aria-components@1.22.1: patches/react-aria-components@1.22.1.patch",
    );
    expect(workspace).not.toMatch(/allowUnusedPatches|ignorePatchFailures/);
  });
});
