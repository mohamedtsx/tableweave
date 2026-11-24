import { getFilterIdentity, getQueryIdentity } from "../contracts/identity.js";
import { canonicalJson, freeze, validId } from "../contracts/json.js";
import { normalizeQuery } from "../contracts/query.js";
import type { QuerySchema } from "../contracts/types.js";
import { invertRule } from "../filters/inverse.js";
import type {
  ControllerDefinition,
  StateGroup,
  StateTransition,
  TableCommand,
  TableState,
  TransitionContext,
} from "./types.js";
import {
  columnState,
  detailsState,
  ids,
  same,
  selectionState,
  stateFail,
  update,
  withStateErrors,
} from "./validation.js";

export function isQueryCommand(
  type: TableCommand<QuerySchema>["type"],
): boolean {
  if (typeof type !== "string") stateFail("state.command");
  return (
    !type.startsWith("selection.") &&
    !type.startsWith("columns.") &&
    !type.startsWith("details.")
  );
}
function reduceState<S extends QuerySchema>(
  definition: ControllerDefinition<S>,
  previous: TableState<S>,
  command: TableCommand<S>,
  context: TransitionContext,
): StateTransition<S> {
  if (previous.definitionIdentity !== canonicalJson(definition))
    stateFail("state.definition");
  if (!Number.isSafeInteger(previous.revision) || previous.revision < 0)
    stateFail("state.invalid");
  let query = previous.query;
  let selection = previous.selection;
  let columns = previous.columns;
  let details = previous.details;
  let candidate: unknown = query;
  const ruleIndex = (id: string) => {
    const index = query.builder.rules.findIndex((rule) => rule.id === id);
    if (index < 0) stateFail("state.rule");
    return index;
  };
  switch (command.type) {
    case "builder.commit": {
      const index = query.builder.rules.findIndex(
        (rule) => rule.id === command.rule.id,
      );
      const rules = [...query.builder.rules];
      if (index < 0) rules.push(command.rule);
      else rules[index] = command.rule;
      candidate = { ...query, builder: { ...query.builder, rules } };
      break;
    }
    case "builder.duplicate": {
      const rule = query.builder.rules[ruleIndex(command.ruleId)];
      if (
        !validId(command.newRuleId) ||
        query.builder.rules.some((item) => item.id === command.newRuleId)
      )
        stateFail("state.rule");
      candidate = {
        ...query,
        builder: {
          ...query.builder,
          rules: [...query.builder.rules, { ...rule, id: command.newRuleId }],
        },
      };
      break;
    }
    case "builder.negate": {
      const index = ruleIndex(command.ruleId);
      const rule = query.builder.rules[index];
      if (!rule) stateFail("state.rule");
      const inverted = invertRule(definition.schema, rule, {
        locale: query.locale,
        timeZone: query.timeZone,
        ...(context.registry ? { registry: context.registry } : {}),
        ...(Object.hasOwn(command, "replacement")
          ? { replacement: command.replacement }
          : {}),
      });
      const rules = [...query.builder.rules];
      candidate = {
        ...query,
        builder: {
          ...query.builder,
          rules: rules.map((item, i) => (i === index ? inverted : item)),
        },
      };
      break;
    }
    case "builder.remove":
      ruleIndex(command.ruleId);
      candidate = {
        ...query,
        builder: {
          ...query.builder,
          rules: query.builder.rules.filter(
            (rule) => rule.id !== command.ruleId,
          ),
        },
      };
      break;
    case "builder.join":
      candidate = {
        ...query,
        builder: { ...query.builder, join: command.join },
      };
      break;
    case "builder.clear":
      candidate = { ...query, builder: { ...query.builder, rules: [] } };
      break;
    case "search.commit":
      candidate = { ...query, search: command.search };
      break;
    case "tabs.change":
      candidate = { ...query, tabId: command.tabId };
      break;
    case "date.commit":
      candidate = { ...query, date: command.date };
      break;
    case "query.context":
      candidate = {
        ...query,
        locale: command.locale,
        timeZone: command.timeZone,
      };
      break;
    case "query.replace":
      candidate = update(command.update, query);
      break;
    case "sorting.change":
      candidate = { ...query, sorting: update(command.update, query.sorting) };
      break;
    case "pagination.change":
      if (definition.schema.pagination.enabled === false)
        stateFail("state.capability");
      candidate = {
        ...query,
        pagination: update(command.update, query.pagination),
      };
      break;
    case "pagination.clamp": {
      if (definition.schema.pagination.enabled === false)
        stateFail("state.capability");
      if (command.queryIdentity !== previous.queryIdentity)
        stateFail("state.stale");
      if (!Number.isSafeInteger(command.pageCount) || command.pageCount < 0)
        stateFail("state.invalid");
      candidate = {
        ...query,
        pagination: {
          ...query.pagination,
          pageIndex: Math.min(
            query.pagination.pageIndex,
            Math.max(0, command.pageCount - 1),
          ),
        },
      };
      break;
    }
    case "clock.tick":
      break;
    case "selection.change":
      if (!definition.selection) stateFail("state.capability");
      selection = selectionState(definition, update(command.update, selection));
      break;
    case "selection.cancel":
      selection = selectionState(definition, {});
      break;
    case "selection.page": {
      if (!definition.selection) stateFail("state.capability");
      if (command.queryIdentity !== previous.queryIdentity)
        stateFail("state.stale");
      const page = new Set(ids(command.pageIds));
      const eligible = ids(command.eligibleIds);
      if (
        typeof command.selected !== "boolean" ||
        eligible.some((id) => !page.has(id))
      )
        stateFail("state.invalid");
      const next = Object.assign(
        Object.create(null) as Record<string, boolean>,
        selection,
      );
      for (const id of eligible) {
        if (command.selected) next[id] = true;
        else delete next[id];
      }
      selection = selectionState(definition, next);
      break;
    }
    case "columns.visibility":
      columns = columnState(
        definition,
        { ...columns, visibility: update(command.update, columns.visibility) },
        columns,
      );
      break;
    case "columns.order":
      columns = columnState(
        definition,
        { ...columns, order: update(command.update, columns.order) },
        columns,
      );
      break;
    case "details.change":
      details = detailsState(definition, update(command.update, details));
      break;
    default:
      stateFail("state.command");
  }
  let filterIdentity = previous.filterIdentity;
  let queryIdentity = previous.queryIdentity;
  let evaluatedAt = previous.evaluatedAt;
  if (isQueryCommand(command.type)) {
    query = normalizeQuery(definition.schema, candidate, context);
    filterIdentity = getFilterIdentity(definition.schema, query, context);
    const filtering = filterIdentity !== previous.filterIdentity;
    const tabScope = query.tabId !== previous.query.tabId;
    if (
      filtering ||
      !same(query.sorting, previous.query.sorting) ||
      query.pagination.pageSize !== previous.query.pagination.pageSize
    )
      query = normalizeQuery(
        definition.schema,
        { ...query, pagination: { ...query.pagination, pageIndex: 0 } },
        context,
      );
    if (filtering || tabScope) selection = selectionState(definition, {});
    queryIdentity = getQueryIdentity(definition.schema, query, context);
    evaluatedAt = context.now;
  }
  if (same(query, previous.query)) query = previous.query;
  if (same(selection, previous.selection)) selection = previous.selection;
  if (same(columns, previous.columns)) columns = previous.columns;
  if (same(details, previous.details)) details = previous.details;
  const changedGroups: StateGroup[] = [];
  if (
    query !== previous.query ||
    queryIdentity !== previous.queryIdentity ||
    filterIdentity !== previous.filterIdentity
  )
    changedGroups.push("query");
  if (selection !== previous.selection) changedGroups.push("selection");
  if (columns !== previous.columns) changedGroups.push("columns");
  if (details !== previous.details) changedGroups.push("details");
  if (changedGroups.length && previous.revision === Number.MAX_SAFE_INTEGER)
    stateFail("state.invalid");
  const state = changedGroups.length
    ? freeze({
        definitionIdentity: previous.definitionIdentity,
        revision: previous.revision + 1,
        query,
        selection,
        columns,
        details,
        filterIdentity,
        queryIdentity,
        evaluatedAt,
      })
    : previous;
  return freeze({
    state,
    reason: command.type,
    changedGroups,
    queryChanged: queryIdentity !== previous.queryIdentity,
    filterChanged: filterIdentity !== previous.filterIdentity,
  });
}
export function reduceTableState<S extends QuerySchema>(
  definition: ControllerDefinition<S>,
  previous: TableState<S>,
  command: TableCommand<S>,
  context: TransitionContext,
): StateTransition<S> {
  return withStateErrors(() =>
    reduceState(definition, previous, command, context),
  );
}
