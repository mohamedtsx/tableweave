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
  captureCriteriaSourceFrameInput,
  getCriteriaFramesOwner,
  requireCriteriaCommittedFrame,
  requireCriteriaSource,
  requireCriteriaTool,
  safeCriteriaFrameError,
  sameCriteriaSourceMetadata,
} from "./criteria-frame.js";
import type { ControlsPresentation } from "./types.js";

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

/** Private facade result: projection is issued only by the actual layout route. */
export type CriteriaSourceFrameReactResult<
  S extends QuerySchema,
  T extends RowData,
> =
  | (NonNullable<CriteriaFrameReactResult<S, T>> &
      Readonly<{
        presentation: ControlsPresentation<S, T> | null;
        clientInputCount: number | null;
      }>)
  | Readonly<{
      phase: "unavailable";
      sourceAuthority: null;
      metadata: null;
      frame: null;
      pair: null;
      presentation: null;
      clientInputCount: null;
    }>
  | null;
const unavailableFacade = Object.freeze({
  phase: "unavailable" as const,
  sourceAuthority: null,
  metadata: null,
  frame: null,
  pair: null,
  presentation: null,
  clientInputCount: null,
});
interface StoreSnapshot<S extends QuerySchema, T extends RowData> {
  readonly result: CriteriaFrameReactResult<S, T>;
  readonly facade: CriteriaSourceFrameReactResult<S, T>;
}
const neutralSnapshot = Object.freeze({ result: null, facade: null });
const neutralRead = () => neutralSnapshot;
const neutralSubscribe = (_listener: () => void) => () => {};

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
  candidate: CriteriaFrames<S, T> | null,
  derive = false,
) {
  const owner = candidate ? getCriteriaFramesOwner(candidate) : null;
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
  let attempted = false;
  let projection: ControlsPresentation<S, T> | null = null;
  let clientInputCount: number | null = null;
  let releases: (() => void)[] = [],
    subscribedResource: object | null | undefined;
  let readSubscribed: (() => unknown) | null = null;
  const serverSnapshot: StoreSnapshot<S, T> = neutralSnapshot;
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
        if (derive) requireCriteriaCommittedFrame(frame, frames);
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
  function getSnapshot(): StoreSnapshot<S, T> {
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
    if (
      snapshot.result !== result ||
      !equalKey(versions, nextVersions) ||
      (derive && !result && attempted && snapshot.facade !== unavailableFacade)
    ) {
      versions = nextVersions;
      const facade =
        derive && result && (result.phase === "source" || projection)
          ? Object.freeze({
              ...result,
              presentation: result.phase === "frame" ? projection : null,
              clientInputCount,
            })
          : derive && attempted
            ? unavailableFacade
            : null;
      snapshot = Object.freeze({ result, facade });
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
    projection = null;
    clientInputCount = null;
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
        attempted = false;
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
      actualOwner: CriteriaFrames<S, T> | null,
      input: CriteriaFrameReactInput<S, T>,
    ) {
      if (!active || working) return;
      const token = lease;
      working = true;
      attempted = true;
      try {
        if (!frames || frames !== actualOwner || invalidOwner) {
          invalidOwner = true;
          clear();
          return;
        }
        const captured = derive
          ? captureCriteriaSourceFrameInput(frames, input, previous)
          : captureCriteriaReactInput(frames, input, previous);
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
          projection = null;
        } else if (
          !frame ||
          !pair ||
          !previous ||
          !equalKey(previous.key, captured.key)
        ) {
          const nextFrame = frames.commit(frames.prepare(captured.native));
          frame = nextFrame;
          pair = frames.issue(nextFrame);
          if (derive) {
            const version = frames.getSnapshot().version;
            const accepted = owner?.controller.getSnapshot();
            requireCriteriaSource(next, frames);
            requireCriteriaTool(pair.tool, frames);
            const resource = captured.subscriptionSource;
            const readSource = resource?.getSnapshot;
            const readVersion = () => {
              requireCriteriaSource(next, frames);
              try {
                return readSource && resource
                  ? Reflect.apply(readSource, resource, [])
                  : null;
              } finally {
                requireCriteriaSource(next, frames);
              }
            };
            const sourceVersion = readVersion();
            const controls = pair.controls,
              readControls = controls.read;
            let value: ControlsPresentation<S, T>;
            try {
              value = Reflect.apply(readControls, controls, []);
            } finally {
              requireCriteriaTool(pair.tool, frames);
              requireCriteriaSource(next, frames);
            }
            const afterSource = readVersion();
            if (afterSource !== sourceVersion) throw safeCriteriaFrameError();
            if (
              !owner ||
              frames.getSnapshot().version !== version ||
              owner.controller.getSnapshot() !== accepted ||
              frame.view.state !== accepted
            )
              throw safeCriteriaFrameError();
            projection = value;
          }
        }
        requireCriteriaSource(next, frames);
        if (pair) requireCriteriaTool(pair.tool, frames);
        if (lease !== token || !active) throw safeCriteriaFrameError();
        previous = captured.receipt;
        clientInputCount = captured.clientInputCount;
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
  const selected = store.frames === frames;
  const result = useSyncExternalStore(
    selected ? store.subscribe : neutralSubscribe,
    selected ? store.getSnapshot : neutralRead,
    selected ? store.getServerSnapshot : neutralRead,
  );
  useLayoutEffect(() => store.connect(), [store]);
  useLayoutEffect(() => {
    store.commit(frames, input);
  });
  return selected ? result.result : null;
}

/** Library-private facade route, not an application derivation callback or flag. */
export function useCriteriaSourceFrame<
  S extends QuerySchema,
  T extends RowData,
>(
  frames: CriteriaFrames<S, T> | null,
  input: CriteriaFrameReactInput<NoInfer<S>, NoInfer<T>>,
): CriteriaSourceFrameReactResult<S, T> {
  const [store] = useState(() => createStore(frames, true));
  const selected = store.frames === frames;
  const snapshot = useSyncExternalStore(
    selected ? store.subscribe : neutralSubscribe,
    selected ? store.getSnapshot : neutralRead,
    selected ? store.getServerSnapshot : neutralRead,
  );
  useLayoutEffect(() => store.connect(), [store]);
  useLayoutEffect(() => {
    store.commit(frames, input);
  });
  return selected ? snapshot.facade : null;
}
