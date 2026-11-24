import { StrictMode, useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { getDetailsSessionOwner } from "../../packages/heroui/src/details/session-identity.js";
import type {
  DetailsOptions,
  DetailsSession,
} from "../../packages/heroui/src/details/types.js";
import { useDetailsSession } from "../../packages/heroui/src/details/use-details-session.js";
import { fixture, type Item, type Schema } from "./fixtures.js";

function runScenario() {
  const a = fixture();
  const b = fixture();
  const sessions: DetailsSession<Schema, Item>[] = [];
  const committed: DetailsSession<Schema, Item>[] = [];
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  function View({ options }: { options: DetailsOptions<Schema, Item> }) {
    const session = useDetailsSession(options);
    sessions.push(session);
    useLayoutEffect(() => {
      committed.push(session);
    });
    return <output>{session.context?.record?.title ?? "none"}</output>;
  }
  function render(options: DetailsOptions<Schema, Item>, twin = false) {
    flushSync(() => {
      root.render(
        <StrictMode>
          <View key="one" options={options} />
          {twin ? <View key="two" options={options} /> : null}
        </StrictMode>,
      );
    });
  }
  const last = () => {
    const value = committed.at(-1);
    if (!value) throw new Error("Actual hook did not commit");
    return value;
  };
  const ownerOf = (session: DetailsSession<Schema, Item>) => {
    const owner = getDetailsSessionOwner(session);
    if (!owner) throw new Error("Actual hook session not issued");
    return owner;
  };
  render(a.options);
  const first = last();
  const owner = ownerOf(first);
  const originalMethods = [first.requestOpen, first.requestClose, first.retry];
  const countersBeforeLookup = { ...a.calls };
  const copied = { ...first };
  const transparent = new Proxy(first, {});
  let traps = 0;
  const hostile = new Proxy(first, {
    get() {
      traps++;
      throw new Error("Must not access proxy");
    },
    getOwnPropertyDescriptor() {
      traps++;
      throw new Error("Must not reflect proxy");
    },
    getPrototypeOf() {
      traps++;
      throw new Error("Must not inspect proxy prototype");
    },
  });
  const lookupResults = {
    exactDescriptor: getDetailsSessionOwner(first) === owner,
    copyDenied: getDetailsSessionOwner(copied) === null,
    transparentDenied: getDetailsSessionOwner(transparent) === null,
    hostileDenied: getDetailsSessionOwner(hostile) === null,
    traps,
    privateCallsUnchanged:
      JSON.stringify(a.calls) === JSON.stringify(countersBeforeLookup),
    ownerFrozen: Object.isFrozen(owner),
    mountFrozen: Object.isFrozen(owner.mount),
    sessionNotFrozen: !Object.isFrozen(first),
    exactController: owner.controller === a.controller,
    exactRecord: first.context?.record === a.record,
    noFabricatedRow: first.context?.row === undefined,
    exactFieldArrays:
      first.context?.visibleFieldIds === a.options.visibleFieldIds &&
      first.context?.hiddenFieldIds === a.options.hiddenFieldIds,
    keys: Object.keys(first),
    mode: owner.mode,
  };
  render(a.options);
  const rerender = last();
  const rerenderOwner = ownerOf(rerender);
  const strictStable = committed
    .filter((session) => session !== first)
    .every((session) => ownerOf(session).mount === owner.mount);
  const sameMount = rerenderOwner.mount === owner.mount;
  render(a.options, true);
  const twin = last();
  const twinDistinct = ownerOf(twin).mount !== owner.mount;
  render(b.options);
  const swapped = last();
  const swappedOwner = ownerOf(swapped);
  const swap = {
    currentController: swappedOwner.controller === b.controller,
    oldControllerPinned: ownerOf(first).controller === a.controller,
    sameMount: swappedOwner.mount === owner.mount,
  };
  flushSync(() => root.render(null));
  const oldStillIssued = getDetailsSessionOwner(first) === owner;
  render(a.options);
  const remounted = last();
  const remountDistinct = ownerOf(remounted).mount !== owner.mount;
  const history = {
    freshViewOnRerender: rerender !== first,
    sameMount,
    strictStable,
    twinDistinct,
    swap,
    oldStillIssued,
    remountDistinct,
    methodsNotReplacedByLookup:
      first.requestOpen === originalMethods[0] &&
      first.requestClose === originalMethods[1] &&
      first.retry === originalMethods[2],
    everyReturnedViewIssued: sessions.every(
      (session) => getDetailsSessionOwner(session) !== null,
    ),
  };
  flushSync(() => root.unmount());
  element.remove();
  a.controller.dispose();
  b.controller.dispose();
  return { lookupResults, history };
}

declare global {
  interface Window {
    detailsIdentity: { run: typeof runScenario };
  }
}
window.detailsIdentity = { run: runScenario };
