import { describe, expect, it } from "vitest";
import {
  createControlsAuthority,
  getControlsAuthorityOwner,
} from "../../../packages/react/src/presentation/index.js";
import { context, fixture } from "./fixtures.js";

function owned() {
  const source = fixture();
  source.client();
  let reads = 0;
  const authority = createControlsAuthority({
    definition: source.definition,
    controller: source.controller,
    queryIdentity: source.controller.getSnapshot().queryIdentity,
    context,
    mode: "client",
    readCommitted() {
      reads += 1;
      return source.readCommitted();
    },
  });
  return { ...source, authority, reads: () => reads };
}

describe("genuine controls authority owner proof", () => {
  it("returns exact immutable factory ownership without reading current ports", () => {
    const source = owned();
    const before = source.reads();
    const owner = getControlsAuthorityOwner(source.authority);
    expect(owner?.controller).toBe(source.controller);
    expect(owner?.definition).toBe(source.definition);
    expect(Object.isFrozen(owner)).toBe(true);
    expect(getControlsAuthorityOwner(source.authority)).toBe(owner);
    expect(source.reads()).toBe(before);
  });

  it("does not confuse identical query/schema values with controller ownership", () => {
    const a = owned();
    const b = owned();
    expect(a.controller.getSnapshot().query).toEqual(
      b.controller.getSnapshot().query,
    );
    expect(a.controller.getSnapshot().definitionIdentity).toBe(
      b.controller.getSnapshot().definitionIdentity,
    );
    const owner = getControlsAuthorityOwner(a.authority);
    expect(owner?.controller).not.toBe(b.controller);
    expect(owner?.definition).not.toBe(b.definition);
    expect(Reflect.set(owner as object, "controller", b.controller)).toBe(
      false,
    );
    expect(owner?.controller).toBe(a.controller);
  });

  it("rejects copied, inherited and proxy authorities without invoking getters", () => {
    const source = owned();
    expect(getControlsAuthorityOwner({ ...source.authority })).toBeNull();
    expect(
      getControlsAuthorityOwner(Object.create(source.authority)),
    ).toBeNull();
    let reads = 0;
    const proxy = new Proxy(source.authority, {
      get() {
        reads += 1;
        throw new Error("Synthetic accessor must not run");
      },
    });
    expect(getControlsAuthorityOwner(proxy)).toBeNull();
    expect(reads).toBe(0);
  });
});
