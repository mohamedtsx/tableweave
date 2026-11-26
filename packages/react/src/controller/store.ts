import { getQueryIdentity } from "../contracts/identity.js";
import { freeze } from "../contracts/json.js";
import type { QuerySchema } from "../contracts/types.js";
import { isQueryCommand, reduceTableState } from "./reducer.js";
import type {
  ControllerDefinitionInput,
  ControllerOptions,
  MutationResult,
  StateGroup,
  StateProposal,
  StateTransition,
  TableController,
  TableState,
} from "./types.js";
import {
  createTableState,
  defineController,
  same,
  selectionState,
  stateFail,
  withStateErrors,
} from "./validation.js";

function createController<S extends QuerySchema>(
  input: ControllerDefinitionInput<S>,
  options: ControllerOptions<S>,
): TableController<S> {
  const { registry, now, validateState, onRequest, onCommit, onQueryChange } =
    options;
  const controlled = new Set(options.controlled ?? []);
  const groups: readonly StateGroup[] = [
    "query",
    "selection",
    "columns",
    "details",
  ];
  if (
    [...controlled].some((group) => !groups.includes(group)) ||
    controlled.size !== (options.controlled?.length ?? 0) ||
    (controlled.size && typeof onRequest !== "function") ||
    typeof now !== "function" ||
    (validateState !== undefined && typeof validateState !== "function") ||
    (onCommit !== undefined && typeof onCommit !== "function") ||
    (onQueryChange !== undefined && typeof onQueryChange !== "function")
  )
    stateFail("state.ownership");
  const definition = defineController(input, registry);
  const clock = () => {
    try {
      const value = now();
      if (
        !Number.isFinite(value) ||
        !Number.isFinite(new Date(value).getTime())
      )
        stateFail("state.invalid");
      return value;
    } catch {
      return stateFail("state.invalid");
    }
  };
  const context = (value: number) => ({
    now: value,
    ...(registry ? { registry } : {}),
  });
  const validate = (candidate: TableState<S>) => {
    const result: unknown = validateState?.(candidate);
    if (result !== undefined) {
      // A void callback can be assigned an async function in TypeScript. Such
      // validation cannot authorize a synchronous transition; observe rejection
      // without logging raw application errors or deferring accepted intent.
      if (
        result !== null &&
        (typeof result === "object" || typeof result === "function") &&
        "then" in result
      )
        void Promise.resolve(result).catch(() => undefined);
      stateFail("state.invalid");
    }
  };
  let state = createTableState(definition, options.initial, context(clock()));
  validate(state);
  const serverState = state;
  const listeners = new Set<{ notify: () => void }>();
  let pending: StateProposal<S> | null = null;
  let sequence = 0;
  let disposed = false;
  let busy = false;
  const mutate = <T>(action: () => T): T => {
    if (disposed) stateFail("state.disposed");
    if (busy) stateFail("state.reentrant");
    busy = true;
    try {
      return withStateErrors(action);
    } finally {
      busy = false;
    }
  };
  const currentProposal = (proposal: StateProposal<S>) => {
    if (pending !== proposal || proposal.baseRevision !== state.revision)
      stateFail("state.stale");
  };
  const commit = (transition: StateTransition<S>): MutationResult<S> => {
    pending = null;
    if (transition.state === state || !transition.changedGroups.length)
      return { status: "noop" };
    state = transition.state;
    let notificationFailures = 0;
    const notify = (callback: () => void) => {
      try {
        callback();
      } catch {
        notificationFailures++;
      }
    };
    if (transition.queryChanged && onQueryChange)
      notify(() => onQueryChange(state.query, transition));
    if (onCommit) notify(() => onCommit(transition));
    for (const listener of [...listeners])
      if (listeners.has(listener)) notify(listener.notify);
    return { status: "committed", transition, notificationFailures };
  };
  return Object.freeze({
    getDefinition: () => definition,
    getSnapshot: () => state,
    getServerSnapshot: () => serverState,
    isDisposed: () => disposed,
    subscribe(listener: () => void) {
      if (disposed) stateFail("state.disposed");
      if (typeof listener !== "function") stateFail("state.invalid");
      const subscription = { notify: listener };
      listeners.add(subscription);
      return () => {
        listeners.delete(subscription);
      };
    },
    dispatch: (command) =>
      mutate(() => {
        const transition = reduceTableState(
          definition,
          state,
          command,
          context(isQueryCommand(command.type) ? clock() : state.evaluatedAt),
        );
        if (transition.state === state) return { status: "noop" };
        validate(transition.state);
        if (transition.changedGroups.some((group) => controlled.has(group))) {
          pending = freeze({
            id: ++sequence,
            baseRevision: state.revision,
            transition,
          });
          try {
            onRequest?.(pending);
          } catch {
            pending = null;
            return { status: "rejected", code: "callback" };
          }
          return { status: "proposed", proposal: pending };
        }
        return commit(transition);
      }),
    accept: (proposal, override) =>
      mutate(() => {
        currentProposal(proposal);
        let transition = proposal.transition;
        if (
          transition.changedGroups.includes("query") &&
          getQueryIdentity(
            definition.schema,
            transition.state.query,
            context(clock()),
          ) !== transition.state.queryIdentity
        ) {
          pending = null;
          stateFail("state.stale");
        }
        if (override !== undefined) {
          if (
            !controlled.has("selection") ||
            Object.keys(override).length !== 1 ||
            !Object.hasOwn(override, "selection")
          )
            stateFail("state.ownership");
          let selection = selectionState(definition, override.selection);
          if (same(selection, state.selection)) selection = state.selection;
          const changedGroups = groups.filter((group) =>
            group === "query"
              ? transition.changedGroups.includes("query")
              : transition.state[group] !== state[group] &&
                group !== "selection",
          );
          if (selection !== state.selection) changedGroups.push("selection");
          transition = freeze({
            ...transition,
            changedGroups,
            state: { ...transition.state, selection },
          });
        }
        validate(transition.state);
        return commit(transition);
      }),
    reject: (proposal) =>
      mutate(() => {
        currentProposal(proposal);
        pending = null;
      }),
    dispose: () => {
      if (disposed) return;
      mutate(() => {
        disposed = true;
        pending = null;
        listeners.clear();
      });
    },
  } satisfies TableController<S>);
}

function replaceDefinition<S extends QuerySchema, Next extends QuerySchema>(
  previous: TableController<S>,
  definition: ControllerDefinitionInput<Next>,
  options: ControllerOptions<Next>,
): TableController<Next> {
  if (previous.isDisposed()) stateFail("state.disposed");
  const old = previous.getDefinition().schema;
  if (
    !same(old, definition.schema) &&
    old.id === definition.schema.id &&
    old.version === definition.schema.version
  )
    stateFail("state.definition");
  const next = createTableController(definition, options);
  previous.dispose();
  return next;
}
export function createTableController<S extends QuerySchema>(
  definition: ControllerDefinitionInput<S>,
  options: ControllerOptions<S>,
): TableController<S> {
  return withStateErrors(() => createController(definition, options));
}
export function replaceTableDefinition<
  S extends QuerySchema,
  Next extends QuerySchema,
>(
  previous: TableController<S>,
  definition: ControllerDefinitionInput<Next>,
  options: ControllerOptions<Next>,
): TableController<Next> {
  return withStateErrors(() =>
    replaceDefinition(previous, definition, options),
  );
}
