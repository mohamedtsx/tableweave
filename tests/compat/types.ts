import type { GroupProps, OverlayArrowProps } from "react-aria-components";

// Real public declarations, with the two exact workspace fixes; no ambient shim.
export const omitted: GroupProps = {};
export const group: GroupProps = {
  id: "synthetic-group",
  "aria-describedby": "synthetic-help",
  "aria-label": "Synthetic controls",
  slot: "synthetic-slot",
  children: "Controls",
  style: { opacity: 1 },
  className: ({ isDisabled }) => (isDisabled ? "disabled" : "enabled"),
  onHoverStart: (event) => {
    const kind: "hoverstart" | "hoverend" = event.type;
    void kind;
  },
};
export const arrow: OverlayArrowProps = {
  id: "synthetic-arrow",
  children: "Arrow",
  className: ({ placement }) => placement ?? "unplaced",
};
// Aria remains the authoritative stricter owner of these optional keys.
// @ts-expect-error Omission differs from explicit undefined for Aria DOMProps.
export const undefinedId: GroupProps = { id: undefined };
// @ts-expect-error Omission differs from explicit undefined for Aria labeling.
export const undefinedDescription: GroupProps = {
  "aria-describedby": undefined,
};
// @ts-expect-error Aria DOM IDs are strings, not numeric record IDs.
export const numericArrow: OverlayArrowProps = { id: 1 };
// @ts-expect-error OverlayArrow retains the authoritative exact-optional DOM ID.
export const undefinedArrow: OverlayArrowProps = { id: undefined };
