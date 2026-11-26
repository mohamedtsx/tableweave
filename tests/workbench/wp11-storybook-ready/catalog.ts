import { readFileSync } from "node:fs";

// Source-derived expectations only; catalog-check observes actual HTTP discovery.
export const legacyIds = [
  "foundation-workspace--smoke",
  "controls-public-composition--normal-and-selection",
  "controls-public-composition--retained-request",
  "controls-public-composition--controlled-rejection",
  "controls-public-composition--single-rtl",
  "controls-real-filter-composition--builder-and-selection",
  "controls-real-filter-composition--tabs-and-date",
  "controls-real-filter-composition--controlled-search",
  "controls-real-filter-composition--membership-rtl",
  "filters-tools--field-ownership",
  "filters-tools--builder-all-any",
  "filters-tools--operator-families",
  "filters-tools--invalid-draft",
  "filters-tools--async-options",
  "filters-tools--builder-clear",
  "filters-tools--controlled",
  "filters-tools--narrow",
  "filters-tools--rtl",
  "filters-tools--selection-slot",
  "filters-tools--independent-tables",
] as const;
const sceneMap = readFileSync(
  new URL("../../../apps/storybook/src/workbench/scenes.md", import.meta.url),
  "utf8",
);
const wp11Ids = [
  ...new Set(
    sceneMap.match(
      /wp11-(?:configurations|filters|recovery|details|reordering)--[a-z-]+/g,
    ),
  ),
];
if (wp11Ids.length !== 33 || new Set(legacyIds).size !== 20) {
  throw new Error("Review changed source catalog before browser execution");
}
export const expectedIds = [...wp11Ids, ...legacyIds].sort();
