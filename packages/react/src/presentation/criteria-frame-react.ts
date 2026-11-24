import type { RowData } from "@tanstack/react-table";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import type { QuerySchema } from "../contracts/types.js";
import {
  type CriteriaCommittedFrame,
  type CriteriaFramePair,
  type CriteriaFrames,
  type CriteriaReactInput,
  type CriteriaReactReceipt,
  type CriteriaSourceAuthority,
  type CriteriaSourceMetadata,
  captureCriteriaReactInput,
  getCriteriaFramesOwner,
  requireCriteriaSource,
  requireCriteriaTool,
  safeCriteriaFrameError,
  sameCriteriaSourceMetadata,
} from "./criteria-frame.js";

export type CriteriaFrameReactInput<
  S extends QuerySchema,
  T extends RowData,
> = CriteriaReactInput<S, T>;
export type CriteriaFrameReactResult<S extends QuerySchema, T extends RowData> =
  | Readonly<{
      phase: "source";
      sourceAuthority: CriteriaSourceAuthority<S>;
      metadata: CriteriaSourceMetadata<S>;
      frame: null;
      pair: null;
    }>
  | Readonly<{
      phase: "frame";
      sourceAuthority: CriteriaSourceAuthority<S>;
      metadata: CriteriaSourceMetadata<S>;
      frame: CriteriaCommittedFrame<S, T>;
      pair: CriteriaFramePair<S, T>;
    }>
  | null;

function equalKey(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}
function release(fn: (() => void) | null): void {
  try {
    fn?.();
  } catch {
    /* Local release cannot restore readiness or dispose app owners. */
  }
}

/** Allocation is inert. Candidate input is never retained or inspected here. */
function createStore<S extends QuerySchema, T extends RowData>(
  candidate: CriteriaFrames<S, T>,
) {
  const owner = getCriteriaFramesOwner(candidate);
  const frames = owner ? candidate : null;
  const listeners = new Set<() => void>();
  let lease: object | null = null,
    active = false,
    invalidOwner = false,
    working = false;
  let current: CriteriaFrameReactResult<S, T> = null;
  let authority: CriteriaSourceAuthority<S> | null = null;
  let cleanupAuthority: CriteriaSourceAuthority<S> | null = null;
  let frame: CriteriaCommittedFrame<S, T> | null = null,
    pair: CriteriaFramePair<S, T> | null = null;
  let previous: CriteriaReactReceipt | null = null;
  let releases: (() => void)[] = [],
    subscribedResource: object | null | undefined;
  let readSubscribed: (() => unknown) | null = null;
  const serverSnapshot: Readonly<{ result: CriteriaFrameReactResult<S, T> }> =
    Object.freeze({ result: null });
  let snapshot = serverSnapshot,
    versions: readonly unknown[] = [];

  function read(): CriteriaFrameReactResult<S, T> {
    if (!active || invalidOwner || !frames || !authority) {
      current = null;
      return current;
    }
    try {
      const metadata = requireCriteriaSource(authority, frames);
      const displayable = metadata.mode === "client" || metadata.hasSnapshot;
      let actualFrame: CriteriaCommittedFrame<S, T> | null = null;
      if (displayable && frame && pair) {
        requireCriteriaTool(pair.tool, frames);
        actualFrame = frame;
      }
      if (
        current &&
        current.sourceAuthority === authority &&
        current.frame === actualFrame &&
        current.pair === (actualFrame ? pair : null) &&
        sameCriteriaSourceMetadata(current.metadata, metadata)
      )
        return current;
      current =
        actualFrame && pair
          ? Object.freeze({
              phase: "frame",
              sourceAuthority: authority,
              metadata,
              frame: actualFrame,
              pair,
            })
          : Object.freeze({
              phase: "source",
              sourceAuthority: authority,
              metadata,
              frame: null,
              pair: null,
            });
      return current;
    } catch {
      current = null;
      return current;
    }
  }
  function getSnapshot(): Readonly<{ result: CriteriaFrameReactResult<S, T> }> {
    let result = read();
    let nextVersions: readonly unknown[] = [];
    try {
      if (active && owner && frames && authority)
        nextVersions = [
          owner.controller.getSnapshot(),
          owner.publication.getSnapshot().version,
          frames.getSnapshot().version,
          result ? readSubscribed?.() : null,
        ];
    } catch {
      current = null;
      result = null;
    }
    if (snapshot.result !== result || !equalKey(versions, nextVersions)) {
      versions = nextVersions;
      snapshot = Object.freeze({ result });
    }
    return snapshot;
  }
  function emit(): void {
    if (working) return;
    const before = snapshot,
      after = getSnapshot();
    if (before === after) return;
    for (const listener of [...listeners]) {
      if (!listeners.has(listener)) continue;
      try {
        listener();
      } catch {
        /* one observer cannot grant permission */
      }
    }
  }
  function unsubscribe(): void {
    const old = releases;
    releases = [];
    subscribedResource = undefined;
    readSubscribed = null;
    for (const fn of old) release(fn);
  }
  function clear(): void {
    unsubscribe();
    const oldFrame = frame,
      oldSource = cleanupAuthority;
    frame = null;
    pair = null;
    authority = null;
    cleanupAuthority = null;
    previous = null;
    current = null;
    if (frames && oldFrame) release(() => frames.disconnect(oldFrame));
    if (frames && oldSource) release(() => frames.disconnectSource(oldSource));
  }
  function subscribePorts(source: object | null): void {
    if (!frames || !owner || !cleanupAuthority || subscribedResource === source)
      return;
    unsubscribe();
    const added: (() => void)[] = [];
    const check = () => {
      if (!active || invalidOwner || !cleanupAuthority)
        throw safeCriteriaFrameError();
      requireCriteriaSource(cleanupAuthority, frames);
    };
    const call = (target: object, argument: unknown) => {
      check();
      let field: PropertyDescriptor | undefined;
      try {
        field = Object.getOwnPropertyDescriptor(target, "subscribe");
      } finally {
        check();
      }
      if (
        !field ||
        !Object.hasOwn(field, "value") ||
        typeof field.value !== "function"
      )
        throw safeCriteriaFrameError();
      let result: unknown;
      try {
        result = Reflect.apply(field.value, target, [argument]);
      } finally {
        if (typeof result === "function") added.push(result as () => void);
        check();
      }
      if (typeof result !== "function") throw safeCriteriaFrameError();
    };
    try {
      call(owner.controller, emit);
      call(owner.publication, {
        notify() {
          emit();
          return undefined;
        },
      });
      call(frames, {
        notify() {
          emit();
          return undefined;
        },
      });
      if (source) call(source, emit);
      if (source) {
        let field: PropertyDescriptor | undefined;
        try {
          field = Object.getOwnPropertyDescriptor(source, "getSnapshot");
        } finally {
          check();
        }
        if (
          !field ||
          !Object.hasOwn(field, "value") ||
          typeof field.value !== "function"
        )
          throw safeCriteriaFrameError();
        const fn = field.value;
        readSubscribed = () => {
          check();
          try {
            return Reflect.apply(fn, source, []);
          } finally {
            check();
          }
        };
      }
      check();
      releases = added;
      subscribedResource = source;
    } catch (error) {
      for (const fn of added) release(fn);
      throw error;
    }
  }
  return {
    frames,
    getSnapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    connect() {
      const token = Object.freeze({});
      lease = token;
      active = true;
      return () => {
        if (lease !== token) return;
        lease = null;
        active = false;
        working = true;
        try {
          clear();
        } finally {
          working = false;
        }
        for (const listener of [...listeners]) {
          try {
            listener();
          } catch {
            /* cleanup metadata only */
          }
        }
      };
    },
    commit(
      actualOwner: CriteriaFrames<S, T>,
      input: CriteriaFrameReactInput<S, T>,
    ) {
      if (!active || working) return;
      const token = lease;
      working = true;
      try {
        if (!frames || frames !== actualOwner || invalidOwner) {
          invalidOwner = true;
          clear();
          return;
        }
        const captured = captureCriteriaReactInput(frames, input, previous);
        const next = frames.commitSource(captured.input);
        cleanupAuthority = next;
        const metadata = requireCriteriaSource(next, frames),
          source = captured.subscriptionSource;
        if (metadata.mode !== captured.mode || lease !== token || !active)
          throw safeCriteriaFrameError();
        // Keep the public capability identity for same-domain refresh; it still
        // freshly follows the current cell. Cleanup always uses the newest receipt.
        if (!authority) authority = next;
        else {
          try {
            requireCriteriaSource(authority, frames);
          } catch {
            authority = next;
          }
        }
        if (!captured.native) {
          if (frame) frames.disconnect(frame);
          frame = null;
          pair = null;
        } else if (
          !frame ||
          !pair ||
          !previous ||
          !equalKey(previous.key, captured.key)
        ) {
          const nextFrame = frames.commit(frames.prepare(captured.native));
          frame = nextFrame;
          pair = frames.issue(nextFrame);
        }
        requireCriteriaSource(next, frames);
        if (pair) requireCriteriaTool(pair.tool, frames);
        if (lease !== token || !active) throw safeCriteriaFrameError();
        previous = captured.receipt;
        subscribePorts(source);
        // A stale receipt must not clear the new source; it is intentionally not
        // released on same-source refresh. The owner holds only its newest cell.
      } catch {
        clear();
      } finally {
        working = false;
        emit();
      }
    },
  };
}

/** Commit-only, one genuine owner's boundary. No candidate ref writes in render. */
export function useCriteriaFrame<S extends QuerySchema, T extends RowData>(
  frames: CriteriaFrames<S, T>,
  input: CriteriaFrameReactInput<NoInfer<S>, NoInfer<T>>,
): CriteriaFrameReactResult<S, T> {
  const [store] = useState(() => createStore(frames));
  const result = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  useLayoutEffect(() => store.connect(), [store]);
  useLayoutEffect(() => {
    store.commit(frames, input);
  });
  return store.frames === frames ? result.result : null;
}
