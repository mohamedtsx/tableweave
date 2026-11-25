import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const base = "b3cc5a7";
const own = "packages/heroui/src/table/reordering-controls.tsx";
function original(path) {
  const result = spawnSync("git", ["show", `${base}:${path}`]);
  assert.equal(result.status, 0, result.stderr.toString());
  return result.stdout;
}
const before = original(own).toString();
const old = `<span id={\`\${generated}-reason\`} hidden={!disabled}>
          {reason}
        </span>`;
const replacement = `<span id={\`\${generated}-reason\`}>{reason}</span>`;
assert.equal(before.split(old).length, 2);
assert.equal(await readFile(own, "utf8"), before.replace(old, replacement));
const source = JSON.parse(
  await readFile("tests/reordering/pretoken-renderer/source155-after.json"),
);
let protectedCount = 0;
for (const [path, entry] of Object.entries(source)) {
  if (path === own) continue;
  assert.equal(
    createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
    entry.sha256,
    path,
  );
  protectedCount++;
}
assert.equal(protectedCount, 154);
console.log(
  "Exact one-span visibility correction;154 protected sources unchanged. Source-only, not generated ARIA/browser/AT proof.",
);
