import {
  createOptionSource,
  type FilterOption,
  type OptionRequest,
  type OptionSourceContext,
} from "@tableweave/react/filters";
import type { ScalarId } from "@tableweave/react/contracts";

/** No timers/endpoints. A UI-issued exact token is settled by the app's buttons. */
export function createExampleOptions<Id extends ScalarId>(
  context: OptionSourceContext,
  choices: readonly FilterOption<Id>[],
) {
  const source = createOptionSource<Id>(context);
  let pending: OptionRequest | null = null;
  let mode: "manual" | "ready" | "fail-once" | "empty" = "manual";
  function respond(empty = false) {
    const token = pending;
    if (!token || token !== source.getSnapshot().request) return false;
    const options = empty
      ? []
      : choices.filter((choice) =>
          choice.label
            .toLocaleLowerCase("en-US")
            .includes(token.term.toLocaleLowerCase("en-US")),
        );
    return source.succeed(token, { options, hasMore: false });
  }
  return {
    source,
    onRequest(request: OptionRequest) {
      pending = request;
      if (mode === "fail-once") {
        mode = "ready";
        source.fail(request, "unavailable");
      } else if (mode === "ready" || mode === "empty")
        respond(mode === "empty");
    },
    setMode(next: typeof mode) {
      mode = next;
    },
    nextPageKey() {
      return null;
    },
    respond,
    fail() {
      const token = pending;
      return token ? source.fail(token, "unavailable") : false;
    },
    clear() {
      pending = null;
      source.clear();
    },
    revoke() {
      pending = null;
      source.setContext({ ...context, access: false });
    },
  };
}
