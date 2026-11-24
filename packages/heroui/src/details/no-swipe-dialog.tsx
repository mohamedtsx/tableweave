"use client";

import { Drawer } from "@heroui/react/drawer";
import type { ComponentProps } from "react";

type DialogProps = ComponentProps<typeof Drawer.Dialog>;
// Pinned HeroUI 3.2.8 spreads these public DOM handlers AFTER its drag handlers.
// Do not cancel/bubble-stop pointer events: child press/selection/scroll survives.
const noDrag = {
  onPointerDown: () => {},
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerCancel: () => {},
  onGotPointerCapture: () => {},
  onLostPointerCapture: () => {},
} satisfies Pick<
  DialogProps,
  | "onPointerDown"
  | "onPointerMove"
  | "onPointerUp"
  | "onPointerCancel"
  | "onGotPointerCapture"
  | "onLostPointerCapture"
>;

/** Private compatibility adapter, not a public vendor-prop wrapper. */
export function NoSwipeDialog(props: DialogProps) {
  return (
    <Drawer.Dialog
      {...props}
      {...noDrag}
      style={{ ...props.style, touchAction: "auto" }}
    />
  );
}
