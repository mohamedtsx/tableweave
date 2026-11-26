import { defaultOperatorRegistry } from "@tableweave/react/filters";
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  CriteriaCommitCell,
  CriteriaLocalCell,
  CriteriaMountLease,
  CriteriaToolTarget,
} from "../../packages/heroui/src/filters/criteria-commit.js";
import { createCriteriaCommitCell } from "../../packages/heroui/src/filters/criteria-commit.js";
import type { fixture, S } from "./fixtures.js";
import { required } from "./fixtures.js";

export interface HostProps {
  readonly controller: ReturnType<typeof fixture>["app"]["C"];
  readonly target: CriteriaToolTarget<S>;
  readonly opaqueProps: unknown;
}
/** Harness only, not an exported hook or actual raw-tool adoption. Neither host
 * render nor a provider render guard inspects opaqueProps or target payload. */
export function Host(props: HostProps) {
  const [owned] = useState(() => {
    const cell = createCriteriaCommitCell("builder", props.controller);
    return { cell, text: cell.createLocal("text") };
  });
  const lease = useRef<CriteriaMountLease<"builder", S> | null>(null);
  useLayoutEffect(() => {
    const mounted = owned.cell.connect();
    lease.current = mounted;
    return () => {
      owned.cell.disconnect(mounted);
      if (lease.current === mounted) lease.current = null;
    };
  }, [owned]);
  // Host is intentionally not a revision subscriber. No per-config cleanup.
  useLayoutEffect(() => {
    if (!lease.current) return;
    try {
      owned.cell.commit(lease.current, props.target, props.opaqueProps);
    } catch {
      /* Invalid COMMIT already retired local readiness; render no old props. */
    }
  });
  return <StableChild cell={owned.cell} text={owned.text} />;
}

function StableChild({
  cell,
  text,
}: {
  cell: CriteriaCommitCell<"builder", S>;
  text: CriteriaLocalCell<"builder", S, string>;
}) {
  const revision = useSyncExternalStore(
    cell.subscribe,
    cell.getSnapshot,
    cell.getSnapshot,
  );
  if (!revision.actor) return null;
  const actor = revision.actor;
  let committed: ReturnType<typeof cell.require>;
  try {
    committed = cell.require(actor);
  } catch {
    return null;
  }
  const field = committed.ports.fields.amount;
  if (!field?.renderEditor) return null;
  const raw = text.read(actor) ?? "";
  const editor = field.renderEditor({
    fieldId: "amount",
    field: committed.origin.definition.schema.fields.amount,
    operator: required(defaultOperatorRegistry.get("number.eq")),
    value: raw,
    acceptedRule: undefined,
    validation: { status: "incomplete", issues: [] },
    locale: "en-US",
    timeZone: "UTC",
    evaluatedAt: 0,
    isDisabled: false,
    onChange(value) {
      cell.require(actor);
      text.write(actor, value === undefined ? "" : String(value));
      cell.require(actor);
    },
  });
  cell.require(actor); // Rendering a captured app port can revoke the actual domain.
  return editor;
}
