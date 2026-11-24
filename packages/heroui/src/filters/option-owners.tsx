"use client";

import type { ResourceContext } from "@tableweave/react";
import type { QuerySchema, ScalarId } from "@tableweave/react/contracts";
import type { OptionSourceView } from "@tableweave/react/filters";
import {
  getBuilderFields,
  projectOptionSourceView,
} from "@tableweave/react/filters";
import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { FilterBuilderProps, FilterOptionPort } from "./types.js";

const OptionViews = createContext<
  ReadonlyMap<string, OptionSourceView<ScalarId>>
>(new Map());
export function useBuilderOptionViews() {
  return useContext(OptionViews);
}

export function scalarIds(value: unknown): ScalarId[] {
  if (typeof value === "number" && Number.isFinite(value)) return [value];
  if (typeof value === "string" && value !== "") return [value];
  if (!Array.isArray(value)) return [];
  return value.flatMap((id: unknown) =>
    (typeof id === "string" && id !== "") ||
    (typeof id === "number" && Number.isFinite(id))
      ? [id]
      : [],
  );
}

/** Field-wide accepted membership is a union, not concatenated per-rule IDs. */
export function acceptedOptionIds(
  rules: readonly { readonly field: string; readonly value?: unknown }[],
  fieldId: string,
): ScalarId[] {
  return [
    ...new Set<ScalarId>(
      rules
        .filter((rule) => rule.field === fieldId)
        .flatMap((rule) => scalarIds(rule.value)),
    ),
  ];
}

function OptionOwner({
  fieldId,
  port,
  expected,
  ids,
  invalidationKey,
  children,
}: {
  readonly fieldId: string;
  readonly port: FilterOptionPort;
  readonly expected: ResourceContext;
  readonly ids: readonly ScalarId[];
  readonly invalidationKey: string | number;
  readonly children: ReactNode;
}) {
  const parents = useBuilderOptionViews();
  const source = port.source;
  const raw = useSyncExternalStore<OptionSourceView<ScalarId>>(
    source.subscribe,
    source.getSnapshot,
    source.getServerSnapshot,
  );
  const [epoch, setEpoch] = useState(invalidationKey);
  const { definitionKey, scopeKey, access } = expected;
  const context = useMemo(
    () => ({ definitionKey, scopeKey, access, fieldId }),
    [definitionKey, scopeKey, access, fieldId],
  );
  // This lifetime is outside picker visibility and passive, including StrictMode.
  useEffect(() => source.connect(), [source]);
  const committed = useRef<{
    readonly source: typeof source;
    readonly context: typeof context;
  } | null>(null);
  useEffect(() => {
    const current = source.getSnapshot().context;
    const previous =
      committed.current?.source === source ? committed.current.context : null;
    const restored =
      previous?.access === false &&
      previous.definitionKey === definitionKey &&
      previous.scopeKey === scopeKey &&
      previous.fieldId === fieldId;
    if (
      current.access ||
      !access ||
      current.definitionKey !== definitionKey ||
      current.scopeKey !== scopeKey ||
      current.fieldId !== fieldId ||
      restored
    )
      source.setContext(context);
    committed.current = { source, context };
  }, [source, context, definitionKey, scopeKey, access, fieldId]);
  useEffect(() => {
    if (epoch !== invalidationKey) {
      source.clear("reset");
      setEpoch(invalidationKey);
    }
  }, [source, epoch, invalidationKey]);
  useEffect(() => {
    if (port.idType === "number")
      port.source.setSelectedIds(
        context,
        ids.filter((id): id is number => typeof id === "number"),
      );
    else if (port.idType === "string")
      port.source.setSelectedIds(
        context,
        ids.filter((id): id is string => typeof id === "string"),
      );
    else port.source.setSelectedIds(context, ids);
  }, [port, context, ids]);
  // Pure render masking precedes cleanup. An unchanged allowed prop cannot
  // restore a terminal failure; restoration needs an explicit prop transition.
  const projected = projectOptionSourceView<ScalarId>(
    raw,
    epoch === invalidationKey ? context : { ...context, access: false },
    ids,
  );
  const views = new Map(parents);
  views.set(fieldId, projected);
  return <OptionViews.Provider value={views}>{children}</OptionViews.Provider>;
}

export function OptionOwners<S extends QuerySchema>({
  props,
  rules,
  children,
}: {
  readonly props: FilterBuilderProps<S>;
  readonly rules: readonly {
    readonly field: string;
    readonly value?: unknown;
  }[];
  readonly children: ReactNode;
}) {
  let result = children;
  for (const entry of [
    ...getBuilderFields(props.controller.getDefinition().schema),
  ].reverse()) {
    const port = props.fields[entry.id]?.asyncOptions;
    if (!port) continue;
    const ids = acceptedOptionIds(rules, entry.id);
    result = (
      <OptionOwner
        key={entry.id}
        fieldId={entry.id}
        port={port}
        expected={props.expectedResourceContext}
        ids={ids}
        invalidationKey={props.invalidationKey}
      >
        {result}
      </OptionOwner>
    );
  }
  return result;
}
