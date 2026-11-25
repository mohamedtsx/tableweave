import {
  beginControlsRequest,
  getControlsRequestBinding,
} from "../../../packages/react/src/presentation/binding.js";
import { createResourceAdapter } from "../../../packages/react/src/resource/adapter.js";
import type { DataTableOptions } from "../../../packages/react/src/table/types.js";
import type { TableState } from "../../../packages/react/src/controller/types.js";
import {
  fixture,
  records,
  required,
  type Item,
  type S,
} from "../admission/fixtures.js";

export type ExtentFixtureMode =
  | "disabled-client"
  | "disabled-server-complete"
  | "paged-client"
  | "paged-server-complete-denial";

/** App-owned actual helper C/P plus real bound resource. No permitting substitute. */
export function extentApplication(mode: ExtentFixtureMode) {
  const disabled = mode.startsWith("disabled-");
  const remote = mode.includes("server-complete");
  const f = fixture(true, false, disabled);
  let values: readonly Item[] = records.concat(
    Array.from({ length: 8 }, (_, index) => ({
      id: `extent-${index}`,
      amount: index + 4,
    })),
  );
  const resource = createResourceAdapter<Item, TableState<S>["query"]>(
    f.context,
  );
  const disconnect = resource.connect();
  let sequence = 0;
  let request = remote ? start() : null;
  function start() {
    const next = beginControlsRequest(f.D.native, f.C, resource, {
      ...f.context,
      queryKey: f.C.getSnapshot().queryIdentity,
      requestKey: `extent-synthetic-${++sequence}`,
      ...(disabled ? { extent: { kind: "complete" as const } } : {}),
    });
    return required(next);
  }
  function succeed() {
    if (!request) return;
    resource.succeed(request.request, {
      // Paged server-complete is a producer-denial case, not an enabling fixture.
      records: disabled ? values : values.slice(0, 10),
      source: "fresh",
      page: { kind: "known", total: values.length },
      emptyKind: "unknown",
      receivedAt: "2026-11-25T12:00:00Z",
    });
  }
  succeed();
  return {
    f,
    mode,
    options(): DataTableOptions<S, Item> {
      const original = f.options();
      if (!remote)
        return {
          ...original,
          source: { mode: "client", context: f.context, records: values },
        };
      const binding = request
        ? getControlsRequestBinding(f.D.native, f.C, resource, request.request)
        : null;
      return {
        ...original,
        source: {
          mode: "server-complete",
          resource,
          view: resource.getSnapshot(),
          bindings: { request: binding, snapshot: binding },
        },
      };
    },
    /** Real app source/order publication outside render, not an acknowledgement stub. */
    publishAuthoritativeOrder() {
      const one = required(values.find((row) => row.id === "one"));
      const remainder = values.filter((row) => row.id !== "one");
      values = [required(remainder[0]), one, ...remainder.slice(1)];
      const previous = f.metadata();
      f.setMetadata({
        ...previous,
        sourceVersion: previous.sourceVersion + 1,
        revision: `source-${previous.sourceVersion + 1}`,
        baseRevision: `source-${previous.sourceVersion + 1}`,
      });
      if (remote) {
        request = start();
        succeed();
      }
    },
    dispose() {
      disconnect();
      resource.dispose();
      f.dispose();
    },
  };
}
