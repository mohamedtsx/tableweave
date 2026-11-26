"use client";

import type { DataTableModel } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { BoundDetailsShell } from "../details/details-shell.js";
import type {
  DetailsAccessory,
  DetailsAccessoryOptions,
  DetailsCommitLease,
} from "../details/types.js";
import { useBoundDetailsSession } from "../details/use-details-session.js";
import {
  createDetailsAccessory,
  getDetailsBinding,
} from "./details-binding.js";

const DetailsContext = createContext<object | null>(null);
const DirectionContext = createContext<"ltr" | "rtl">("ltr");
export function useDetailsAccessory<S extends QuerySchema, T extends object>(
  table: DataTableModel<S, T>,
  options: DetailsAccessoryOptions<NoInfer<S>, NoInfer<T>>,
): DetailsAccessory<S, T> {
  const [accessory] = useState(() => createDetailsAccessory(table));
  const binding = getDetailsBinding(accessory),
    lease = useRef<DetailsCommitLease<S, T> | null>(null);
  useLayoutEffect(() => {
    const actual = binding.connect();
    lease.current = actual;
    return () => {
      lease.current = null;
      binding.disconnect(actual);
    };
  }, [binding]);
  useLayoutEffect(() => {
    const actual = lease.current;
    if (!actual) return;
    try {
      binding.configure(actual, table, options);
    } catch {
      /* Unknown/revoked/candidate configuration is neutral. */
    }
  }, [binding, table, options]);
  return accessory;
}
export function DetailsProvider<S extends QuerySchema, T extends object>({
  accessory,
  children,
  direction = "ltr",
}: {
  readonly accessory: DetailsAccessory<S, T>;
  readonly children: ReactNode;
  readonly direction?: "ltr" | "rtl";
}) {
  getDetailsBinding(accessory);
  return (
    <DirectionContext.Provider value={direction}>
      <DetailsContext.Provider value={accessory}>
        {children}
      </DetailsContext.Provider>
    </DirectionContext.Provider>
  );
}
export function useDetailsContext<
  S extends QuerySchema,
  T extends object,
>(): DetailsAccessory<S, T> {
  const value = useContext(DetailsContext);
  if (!value) throw new Error("DetailsTrigger requires its details provider.");
  const accessory = value as DetailsAccessory<S, T>;
  getDetailsBinding(accessory);
  return accessory;
}
/** One actual shell, driven by a genuine bound producer, with no accepted-state mirror. */
export function RecordDetails<S extends QuerySchema, T extends object>({
  accessory,
}: {
  readonly accessory: DetailsAccessory<S, T>;
}) {
  const binding = getDetailsBinding(accessory),
    session = useBoundDetailsSession(accessory);
  const direction = useContext(DirectionContext);
  const neutral = useRef<HTMLElement>(null),
    wasOpen = useRef(false),
    needsNeutral = useRef(false);
  const [shellToken] = useState(() => Object.freeze({}));
  useLayoutEffect(() => {
    try {
      binding.claimShell(shellToken);
    } catch {
      /* Exactly one live shell. */
    }
    return () => binding.releaseShell(shellToken);
  }, [binding, shellToken]);
  const actor = binding.getSnapshot().actor;
  useLayoutEffect(() => {
    if (actor && !session.isOpen) binding.scheduleFocus(actor, neutral.current);
  }, [binding, actor, session.isOpen]);
  useEffect(() => {
    if (wasOpen.current && !session.isOpen) needsNeutral.current = true;
    wasOpen.current = session.isOpen;
    const node = neutral.current;
    if (
      !needsNeutral.current ||
      session.isOpen ||
      binding.focusPending() ||
      !node?.isConnected
    )
      return;
    const active = node.ownerDocument.activeElement;
    if (
      (!binding.cell.getSnapshot().actor ||
        binding.controller.getSnapshot().details.rowId === null) &&
      (!active || active === node.ownerDocument.body || !active.isConnected)
    )
      node.focus({ preventScroll: true });
    needsNeutral.current = false;
  }, [binding, session]);
  return (
    <>
      <section ref={neutral} tabIndex={-1} aria-label="Record details region" />
      {actor ? (
        <BoundDetailsShell
          accessory={accessory}
          actor={actor}
          session={session}
          token={shellToken}
          direction={direction}
        />
      ) : null}
    </>
  );
}
