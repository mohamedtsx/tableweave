import assert from "node:assert/strict";

export const classes = [
  ".tw-data-table",
  ".tw-data-table__external",
  ".tw-data-table__toolbar",
  ".tw-data-table__collection",
  ".tw-data-table__state",
  ".tw-data-table__notice",
  ".tw-data-table__footer",
];
const bounds = { "min-inline-size": "0", "max-inline-size": "100%" };
const flex = {
  display: "flex",
  "flex-wrap": "wrap",
  "align-items": "center",
  gap: "0.5rem",
};
const metadata = {
  color: "var(--muted)",
  "font-size": "0.75rem",
  "line-height": "1.5",
  "overflow-wrap": "anywhere",
};
const expected = {
  ".tw-data-table": {
    display: "grid",
    "grid-template-columns": "minmax(0, 1fr)",
    gap: "1rem",
    ...bounds,
    color: "var(--foreground)",
    "font-family": "inherit",
  },
  ".tw-data-table__external": {
    ...bounds,
    ...flex,
    "justify-content": "space-between",
  },
  ".tw-data-table__toolbar": { ...bounds, ...flex },
  ".tw-data-table__collection": bounds,
  ".tw-data-table__state": {
    ...bounds,
    ...metadata,
    display: "grid",
    "justify-items": "start",
    gap: "0.5rem",
    "padding-block": "1rem",
  },
  ".tw-data-table__notice": { ...bounds, ...metadata },
  ".tw-data-table__footer": {
    ...bounds,
    ...flex,
    "justify-content": "space-between",
  },
  ".tw-data-table:focus-visible": {
    outline: "2px solid var(--focus)",
    "outline-offset": "2px",
  },
  ".tw-data-table[hidden]": { display: "none" },
  ".tw-data-table [hidden]": { display: "none" },
};
const ordered = (object) =>
  Object.fromEntries(
    Object.entries(object).sort(([a], [b]) => a.localeCompare(b)),
  );

/** Restricted flat-rule inventory, NOT a general CSS parser or cascade simulator.
 * Biome's installed CSS parser is the independent syntax check. This inventory
 * deliberately rejects every construct outside this small reviewed stylesheet.
 */
export function inspectCss(text) {
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, "").trim();
  assert(
    stripped.startsWith("@layer tableweave {"),
    "Use only the established tableweave layer",
  );
  assert(stripped.endsWith("}"), "Missing layer close");
  const body = stripped.slice("@layer tableweave {".length, -1).trim();
  assert(
    !/[@!#"'\\]/.test(body),
    "No imports/at-rules/assets/fonts/important/escaped selectors or color literals",
  );
  const selectors = {},
    blocks = [],
    tokenNames = new Set();
  let consumed = 0;
  for (const match of body.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    assert(
      !body.slice(consumed, match.index).trim(),
      "Unsupported or nested CSS structure",
    );
    consumed = match.index + match[0].length;
    const names = match[1]
      .trim()
      .split(",")
      .map((name) => name.trim().replace(/\s+/g, " "));
    const declarations = {};
    for (const part of match[2].split(";")) {
      if (!part.trim()) continue;
      const declaration = /^\s*([a-z-]+)\s*:\s*([^:;{}]+?)\s*$/.exec(part);
      assert(declaration, "Unsupported declaration syntax");
      const [, property, value] = declaration;
      assert(
        !Object.hasOwn(declarations, property),
        "No duplicate declarations",
      );
      declarations[property] = value;
      for (const token of value.matchAll(/var\((--[a-z-]+)\)/g))
        tokenNames.add(token[1]);
    }
    for (const name of names) {
      assert(Object.hasOwn(expected, name), `Unallocated selector: ${name}`);
      selectors[name] ??= {};
      for (const [property, value] of Object.entries(declarations)) {
        assert(
          !Object.hasOwn(selectors[name], property),
          `Duplicate ${name}/${property}`,
        );
        selectors[name][property] = value;
      }
    }
    blocks.push({ selectors: names, declarations });
  }
  assert(!body.slice(consumed).trim(), "Unconsumed/unsupported CSS syntax");
  const normalize = (map) =>
    ordered(
      Object.fromEntries(
        Object.entries(map).map(([key, value]) => [key, ordered(value)]),
      ),
    );
  assert.deepEqual(
    normalize(selectors),
    normalize(expected),
    "Exact scoped layout contract; no vendor/row/column/card/scroll/visibility overrides",
  );
  assert.deepEqual([...tokenNames].sort(), [
    "--focus",
    "--foreground",
    "--muted",
  ]);
  return {
    layer: "tableweave",
    classes,
    ruleBlocks: blocks.length,
    selectorCount: Object.keys(selectors).length,
    declarationsInBlocks: blocks.reduce(
      (count, block) => count + Object.keys(block.declarations).length,
      0,
    ),
    tokens: [...tokenNames].sort(),
    selectors,
    limits:
      "Restricted text structure after independent Biome syntax parsing. No computed CSS, cascade/layout/hidden visibility/scroll count/geometry/AT/contrast proof.",
  };
}
