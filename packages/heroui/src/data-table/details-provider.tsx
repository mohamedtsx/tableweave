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
  useSyncExternalStore,
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
  const joinVersion = useSyncExternalStore(
    binding.subscribeJoin,
    binding.getJoinSnapshot,
    binding.getJoinSnapshot,
  );
  useLayoutEffect(() => {
    if (binding.getJoinSnapshot() !== joinVersion) return;
    let actual: DetailsCommitLease<S, T>;
    try {
      actual = binding.connect();
    } catch {
      return;
    }
    lease.current = actual;
    return () => {
      lease.current = null;
      binding.disconnect(actual);
    };
  }, [binding, joinVersion]);
  useLayoutEffect(() => {
    if (binding.getJoinSnapshot() !== joinVersion) return;
    const actual = lease.current;
    if (!actual) return;
    try {
      binding.configure(actual, table, options);
    } catch {
      /* Unknown/revoked/candidate configuration is neutral. */
    }
  }, [binding, table, options, joinVersion]);
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
/** Neutral nonsensitive presentation metadata, never row/dataset/scope/detail copy. */
export const englishDetailsRegionLabel = "Record details region";
export const arabicDetailsRegionLabel = "منطقة تفاصيل السجل";

export interface RecordDetailsProps<S extends QuerySchema, T extends object> {
  readonly accessory: DetailsAccessory<S, T>;
  /** Available before layout/while denied. No permission; never put private values here. */
  readonly neutralLabel?: string;
}
function invalidNeutralMetadata(): never {
  throw new TypeError("Invalid record details neutral metadata.");
}
function recordDetailsOwnData(input: unknown, key: string): unknown {
  try {
    if (!input || typeof input !== "object") return invalidNeutralMetadata();
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Object.hasOwn(descriptor, "value"))
      return invalidNeutralMetadata();
    return descriptor.value;
  } catch {
    return invalidNeutralMetadata();
  }
}
function captureNeutralLabel(input: object): string {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(input, "neutralLabel");
    if (!descriptor) {
      if (Reflect.has(input, "neutralLabel")) return invalidNeutralMetadata();
      return englishDetailsRegionLabel;
    }
    if (!Object.hasOwn(descriptor, "value")) return invalidNeutralMetadata();
    const value: unknown = descriptor.value;
    if (typeof value !== "string" || !value.trim())
      return invalidNeutralMetadata();
    return value;
  } catch {
    return invalidNeutralMetadata();
  }
}
/** One actual shell, driven by a genuine bound producer, with no accepted-state mirror. */
export function RecordDetails<S extends QuerySchema, T extends object>(
  props: RecordDetailsProps<S, T>,
) {
  const accessory = recordDetailsOwnData(
    props,
    "accessory",
  ) as DetailsAccessory<S, T>;
  const binding = getDetailsBinding(accessory);
  const joinVersion = useSyncExternalStore(
    binding.subscribeJoin,
    binding.getJoinSnapshot,
    binding.getJoinSnapshot,
  );
  // Exact accessory provenance comes first; neutral metadata cannot authorize body work.
  const neutralLabel = captureNeutralLabel(props);
  const session = useBoundDetailsSession(accessory);
  const direction = useContext(DirectionContext);
  const neutral = useRef<HTMLElement>(null),
    wasOpen = useRef(false),
    needsNeutral = useRef(false);
  const [shellToken] = useState(() => Object.freeze({}));
  useLayoutEffect(() => {
    if (binding.getJoinSnapshot() !== joinVersion) return;
    try {
      binding.claimShell(shellToken);
    } catch {
      /* Exactly one live shell. */
    }
    return () => binding.releaseShell(shellToken);
  }, [binding, shellToken, joinVersion]);
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
    if (!binding.canFocusNeutral(shellToken)) return;
    const active = node.ownerDocument.activeElement;
    if (
      (!binding.cell.getSnapshot().actor ||
        binding.controller.getSnapshot().details.rowId === null) &&
      (!active || active === node.ownerDocument.body || !active.isConnected)
    )
      node.focus({ preventScroll: true });
    needsNeutral.current = false;
  }, [binding, session, shellToken]);
  return (
    <>
      <section ref={neutral} tabIndex={-1} aria-label={neutralLabel} />
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
