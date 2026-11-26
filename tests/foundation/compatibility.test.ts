import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("exact declaration-only compatibility repair", () => {
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
