import type { QuerySchema } from "../contracts/types.js";
import { observePromise } from "../reordering/capture.js";
import {
  assertTableController,
  assertTableDefinition,
} from "../table/definition.js";
import type { TableDefinition } from "../table/types.js";
import type { NativeControllerOptions } from "../tanstack/types.js";
import {
  AdmissionCapture,
  type AdmissionCallbacks,
  createAdmission,
  deny,
} from "./admission.js";
import type {
  ReorderControllerOptions,
  ReorderControllerResult,
} from "./types.js";

export function createReorderController<
  S extends QuerySchema,
  T extends object,
>(
  definition: TableDefinition<S, T>,
  options: ReorderControllerOptions<NoInfer<S>, NoInfer<T>>,
): ReorderControllerResult<S, T> {
  // Exact D proof precedes any alleged config/method read, including Proxy traps.
  assertTableDefinition(definition);
  const capture = new AdmissionCapture();
  const fields = capture.data(options, [
    "controller",
    "instanceId",
    "readCurrent",
    "isRowMovable",
  ]);
  const instanceId = fields.get("instanceId"),
    readCurrent = fields.get("readCurrent"),
    movable = fields.get("isRowMovable");
  if (
    typeof instanceId !== "string" ||
    instanceId.length === 0 ||
    instanceId.length > 1_048_576 ||
    typeof readCurrent !== "function" ||
    (fields.has("isRowMovable") && typeof movable !== "function")
  )
    return deny();
  const controller = capture.data(fields.get("controller"), [
    "initial",
    "controlled",
    "now",
    "validateState",
    "validateCommand",
    "onRequest",
    "onCommit",
    "onQueryChange",
  ]);
  const initial = capture.data(controller.get("initial"), [
    "query",
    "selection",
    "columns",
    "details",
  ]);
  if (!initial.has("query")) return deny();
  const config = Object.fromEntries(controller);
  config.initial = Object.fromEntries(initial);
  const callbacks: Record<string, (...args: never[]) => unknown> = {};
  for (const key of [
    "now",
    "validateState",
    "validateCommand",
    "onRequest",
    "onCommit",
    "onQueryChange",
  ]) {
    const value = controller.get(key);
    if (controller.has(key)) {
      if (typeof value !== "function") return deny();
      callbacks[key] = value as (...args: never[]) => unknown;
    }
  }
  const now = callbacks.now;
  if (!now) return deny();
  if (controller.has("controlled")) {
    const raw = controller.get("controlled");
    if (
      !Array.isArray(raw) ||
      capture.call(() => Object.getPrototypeOf(raw)) !== Array.prototype
    )
      return deny();
    const values = capture.call(() =>
      Object.getOwnPropertyDescriptors(raw),
    ) as unknown as Record<string, PropertyDescriptor>;
    const length = values.length?.value;
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > 4 ||
      capture.call(() => Reflect.ownKeys(values)).length !== length + 1
    )
      return deny();
    const copied: string[] = [];
    for (let index = 0; index < length; index++) {
      const item = values[String(index)];
      if (
        !item?.enumerable ||
        !Object.hasOwn(item, "value") ||
        !["query", "columns", "selection", "details"].includes(item.value)
      )
        return deny();
      copied.push(item.value);
    }
    config.controlled = copied;
  }
  const cell = createAdmission(
    definition,
    instanceId,
    readCurrent as (...args: never[]) => unknown,
    options,
    movable as ((...args: never[]) => unknown) | undefined,
    callbacks as AdmissionCallbacks,
  );
  const actual = definition.createController({
    ...config,
    now() {
      const value = Reflect.apply(now, undefined, []);
      observePromise(value);
      return value as number;
    },
    ...cell.composed,
  } as NativeControllerOptions<S>);
  assertTableController(definition, actual);
  cell.bind(actual);
  return Object.freeze({ controller: actual, admission: cell.admission });
}
