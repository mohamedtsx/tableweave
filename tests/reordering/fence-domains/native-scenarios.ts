import {
  releaseReorderUI,
  suspendReorderUI,
} from "../../../packages/react/src/reordering-controller/index.js";
import { host } from "./host.js";
import { nativeFixture } from "./native-fixture.js";
import type { Cleanup } from "./scenarios.js";
export async function nativeReentry(
  kind: Cleanup,
  submitted: boolean,
  event: "settle" | "ack" | "reconcile" = "settle",
) {
  const fixture = nativeFixture(),
    h = host(fixture.owner);
  for (let turn = 0; turn < 6 && !h.ready(); turn++) await Promise.resolve();
  if (!h.ready()) throw new Error("Actual native callback host required");
  try {
    const row = h.f.admission.capture(h.appLease),
      placement = { movedId: "one", beforeId: "three", afterId: "two" };
    const first = submitted ? h.f.admission.begin(row, placement) : null;
    if (submitted && first?.status !== "started")
      throw new Error("Actual pending required");
    let called = false;
    fixture.callbacks.native = () => {
      if (called) return;
      called = true;
      if (kind === "release") releaseReorderUI(h.binding());
      else suspendReorderUI(h.binding());
    };
    const result =
      first?.status !== "started"
        ? h.f.admission.begin(row, placement)
        : event === "reconcile"
          ? h.f.admission.reconcile()
          : event === "ack"
            ? h.f.admission.acknowledge(first.operation, {
                stamp: first.operation.origin,
                disposition: "not-applied",
              })
            : h.f.admission.settle(first.operation, {
                kind: "accepted",
                revision: "native",
              });
    const pending = h.f.admission.getSnapshot().moves.pending;
    return {
      called,
      status: result.status,
      exact: submitted
        ? first?.status === "started" && pending?.operation === first.operation
        : pending === null,
      epoch: h.f.metadata().ownerEpoch,
    };
  } finally {
    h.dispose();
  }
}
