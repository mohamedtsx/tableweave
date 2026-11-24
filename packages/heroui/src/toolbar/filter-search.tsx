"use client";

import { SearchField } from "@heroui/react/search-field";
import type { StateProposal } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { FilterToolMessages, FilterToolProps } from "./filter-shared.js";
import {
  filterToolMessages,
  observeMutation,
  useFilterOwner,
} from "./filter-shared.js";

export interface FilterSearchMessages extends FilterToolMessages {
  readonly label: string;
  readonly placeholder: string;
  readonly clearLabel: string;
  readonly cancelled: string;
  readonly invalidValue: string;
}
export interface FilterSearchProps<S extends QuerySchema>
  extends FilterToolProps<S> {
  readonly messages?: Partial<FilterSearchMessages>;
}
const defaults: FilterSearchMessages = {
  ...filterToolMessages,
  label: "Search records",
  placeholder: "Search…",
  clearLabel: "Clear search",
  cancelled: "Search edit cancelled.",
  invalidValue: "Enter a valid search query.",
};
interface SearchDraft {
  readonly owner: object;
  readonly text: string;
  readonly sequence: number;
  readonly base: string;
}

export function FilterSearch<S extends QuerySchema>(
  props: FilterSearchProps<S>,
) {
  const messages = { ...defaults, ...props.messages };
  const { controller } = props;
  const { state, owner, active, isCurrent } = useFilterOwner(props);
  const schema = controller.getDefinition().schema;
  const configured = Object.values(schema.fields).some(
    (field) => field.owner === "search",
  );
  const debounce = schema.search?.debounceMs ?? 300;
  const [draft, setDraft] = useState<SearchDraft | null>(null);
  const [notice, setNotice] = useState<{ owner: object; text: string } | null>(
    null,
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequence = useRef(0);
  const composing = useRef(false);
  const currentDraft = useRef<SearchDraft | null>(null);
  // This is an identity receipt, not a mirror of the controller's pending state:
  // reject() deliberately has no notification and may already have resolved it.
  const submission = useRef<{
    owner: object;
    sequence: number;
    proposal: StateProposal<S>;
  } | null>(null);
  const cancelTimer = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const submit = useCallback(
    (candidate: SearchDraft) => {
      cancelTimer();
      if (
        !isCurrent() ||
        !configured ||
        composing.current ||
        candidate.owner !== owner ||
        candidate.sequence !== sequence.current ||
        candidate.base !== controller.getSnapshot().query.search
      )
        return;
      try {
        const result = controller.dispatch({
          type: "search.commit",
          search: candidate.text,
        });
        if (result.status === "proposed") {
          submission.current = {
            owner,
            sequence: candidate.sequence,
            proposal: result.proposal,
          };
        }
        if (result.status === "rejected") {
          setNotice({ owner, text: messages.failed });
        } else {
          currentDraft.current = null;
          setDraft(null);
          setNotice({
            owner,
            text: result.status === "proposed" ? messages.submitted : "",
          });
        }
        observeMutation(props.onMutation, result);
      } catch {
        setNotice({ owner, text: messages.invalidValue });
      }
    },
    [
      cancelTimer,
      isCurrent,
      configured,
      owner,
      controller,
      messages.failed,
      messages.submitted,
      messages.invalidValue,
      props.onMutation,
    ],
  );
  const committedSubmit = useRef(submit);
  useLayoutEffect(() => {
    committedSubmit.current = submit;
  }, [submit]);
  const schedule = useCallback(
    (candidate: SearchDraft) => {
      cancelTimer();
      if (!composing.current)
        timer.current = setTimeout(
          () => committedSubmit.current(candidate),
          debounce,
        );
    },
    [cancelTimer, debounce],
  );
  useLayoutEffect(() => {
    const pending = currentDraft.current;
    if (!active || (pending !== null && pending.owner !== owner)) {
      currentDraft.current = null;
      submission.current = null;
      composing.current = false;
      sequence.current += 1;
      setDraft(null);
      setNotice(null);
    }
    if (submission.current?.owner !== owner) submission.current = null;
    // Suspense disconnects layout effects without unmounting the owner. Retain
    // the surviving draft's sequence and restart its debounce on reveal.
    if (active && pending?.owner === owner) schedule(pending);
    return cancelTimer;
  }, [owner, active, cancelTimer, schedule]);
  useEffect(() => {
    // StrictMode can replay passive cleanup after Suspense reveal while retaining
    // React state. Cancel work, but do not strand that surviving draft by clearing
    // its ref or sequence. A true unmount discards this hook instance altogether.
    return cancelTimer;
  }, [cancelTimer]);
  useLayoutEffect(() => {
    const pending = currentDraft.current;
    if (!pending || pending.owner !== owner) return;
    if (pending.base === state.query.search) return;
    cancelTimer();
    const receipt = submission.current;
    // Controller acceptance publishes the exact proposal query object, including
    // when controlled selection is overridden. Independently normalized external
    // commands cannot reuse that identity, even if their search text is equal.
    const olderAcceptance =
      receipt?.owner === owner &&
      receipt.sequence < pending.sequence &&
      state.revision >= receipt.proposal.transition.state.revision &&
      state.query === receipt.proposal.transition.state.query;
    if (olderAcceptance) {
      const next = { ...pending, base: state.query.search };
      currentDraft.current = next;
      setDraft(next);
      schedule(next);
    } else {
      sequence.current += 1;
      currentDraft.current = null;
      setDraft(null);
    }
    submission.current = null;
  }, [owner, state.query, state.revision, cancelTimer, schedule]);

  function edit(text: string) {
    if (!isCurrent()) return;
    const next = {
      owner,
      text,
      sequence: ++sequence.current,
      base: controller.getSnapshot().query.search,
    };
    currentDraft.current = next;
    setDraft(next);
    setNotice(null);
    schedule(next);
  }
  function cancel() {
    cancelTimer();
    sequence.current += 1;
    currentDraft.current = null;
    composing.current = false;
    setDraft(null);
    setNotice({ owner, text: messages.cancelled });
  }
  function clear() {
    // RAC calls onChange('') before onClear. Invalidate that scheduled callback.
    cancelTimer();
    composing.current = false;
    const next = {
      owner,
      text: "",
      sequence: ++sequence.current,
      base: controller.getSnapshot().query.search,
    };
    currentDraft.current = next;
    setDraft(next);
    submit(next);
  }
  const visibleDraft = draft?.owner === owner && active ? draft : null;
  const text = active ? (visibleDraft?.text ?? state.query.search) : "";
  return (
    <div className={`tw-filter-search ${props.className ?? ""}`}>
      <SearchField
        aria-label={messages.label}
        value={text}
        onChange={edit}
        onClear={clear}
        onSubmit={() => {
          const pending = currentDraft.current;
          if (pending) submit(pending);
        }}
        isDisabled={!active || !configured}
        variant="secondary"
      >
        <SearchField.Group>
          <SearchField.SearchIcon aria-hidden="true" />
          <SearchField.Input
            placeholder={messages.placeholder}
            onCompositionStart={() => {
              composing.current = true;
              cancelTimer();
            }}
            onCompositionEnd={(event) => {
              composing.current = false;
              edit(event.currentTarget.value);
            }}
            onKeyDownCapture={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                cancel();
              } else if (
                event.key === "Enter" &&
                (composing.current || event.nativeEvent.isComposing)
              ) {
                event.stopPropagation();
              }
            }}
          />
          <SearchField.ClearButton aria-label={messages.clearLabel} />
        </SearchField.Group>
      </SearchField>
      {!configured ? <p role="alert">{messages.invalidConfiguration}</p> : null}
      {!active ? <p role="status">{messages.unavailable}</p> : null}
      <span className="tw-filter-status" role="status">
        {notice?.owner === owner && active ? notice.text : ""}
      </span>
    </div>
  );
}
