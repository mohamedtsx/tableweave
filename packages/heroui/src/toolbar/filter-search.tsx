"use client";

import { SearchField } from "@heroui/react/search-field";
import type { StateProposal, TableState } from "@tableweave/react";
import type { QuerySchema } from "@tableweave/react/contracts";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  CriteriaActor,
  CriteriaCommitCell,
  CriteriaLocalCell,
  CriteriaWorkHandle,
} from "../filters/criteria-commit.js";
import type {
  CriteriaToolbarStore,
  ToolbarCommitted,
} from "./criteria-tool-host.js";
import {
  CriteriaToolbarNeutral,
  CriteriaToolHost,
  useCriteriaToolbarVersion,
} from "./criteria-tool-host.js";
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
  return (
    <CriteriaToolHost<"search", S, CriteriaSearchLocal<S>, FilterSearchProps<S>>
      kind="search"
      input={props}
      createLocal={createCriteriaSearchLocal}
      Legacy={LegacyFilterSearch}
      Surface={CriteriaSearchSurface}
    />
  );
}

function LegacyFilterSearch<S extends QuerySchema>(
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

interface CriteriaSearchDraft {
  readonly text: string;
  readonly sequence: number;
  readonly base: string;
  readonly deadline: number | null;
}
interface SearchReceipt<S extends QuerySchema> {
  readonly sequence: number;
  readonly proposal: StateProposal<S>;
}
interface SearchSession {
  readonly locale: string;
  readonly timeZone: string;
}
interface SearchWork<S extends QuerySchema> {
  readonly actor: CriteriaActor<"search", S>;
  readonly sequence: number;
  readonly deadline: number;
  readonly handle: CriteriaWorkHandle<"search", S>;
}
export interface CriteriaSearchLocal<S extends QuerySchema> {
  readonly session: CriteriaLocalCell<"search", S, SearchSession>;
  readonly draft: CriteriaLocalCell<"search", S, CriteriaSearchDraft>;
  readonly notice: CriteriaLocalCell<"search", S, string>;
  readonly ime: CriteriaLocalCell<"search", S, boolean>;
  readonly sequence: CriteriaLocalCell<"search", S, number>;
  readonly submission: CriteriaLocalCell<"search", S, SearchReceipt<S>>;
  readonly work: CriteriaLocalCell<"search", S, SearchWork<S>>;
}
export function createCriteriaSearchLocal<S extends QuerySchema>(
  cell: CriteriaCommitCell<"search", S>,
): CriteriaSearchLocal<S> {
  return Object.freeze({
    session: cell.createLocal<SearchSession>("session"),
    draft: cell.createLocal<CriteriaSearchDraft>("draft"),
    notice: cell.createLocal("notice"),
    ime: cell.createLocal("ime"),
    sequence: cell.createLocal<number>("session"),
    submission: cell.createLocal<SearchReceipt<S>>("receipt"),
    work: cell.createLocal<SearchWork<S>>("session"),
  });
}
type SearchStore<S extends QuerySchema> = CriteriaToolbarStore<
  "search",
  S,
  CriteriaSearchLocal<S>
>;
type SearchFrame<S extends QuerySchema> = ToolbarCommitted<
  "search",
  S,
  CriteriaSearchLocal<S>
>;
function searchLive<S extends QuerySchema>(frame: SearchFrame<S>) {
  frame.cell.require(frame.actor);
  const controller = frame.origin.controller;
  const definition = controller.getDefinition(),
    state = controller.getSnapshot();
  frame.cell.require(frame.actor);
  if (definition !== frame.origin.definition)
    throw new Error("Criteria search unavailable.");
  const configured = Object.values(definition.schema.fields).some(
    (field) => field.owner === "search",
  );
  return {
    state,
    configured,
    debounce: definition.schema.search?.debounceMs ?? 300,
  };
}
function searchMessages<S extends QuerySchema>(
  frame: SearchFrame<S>,
): FilterSearchMessages {
  frame.cell.require(frame.actor);
  const messages = { ...defaults, ...frame.ports.messages };
  frame.cell.require(frame.actor);
  return messages;
}
function cancelSearchWork<S extends QuerySchema>(frame: SearchFrame<S>) {
  const work = frame.local.work.read(frame.actor);
  if (work) {
    frame.cell.cancelWork(frame.actor, work.handle);
    frame.local.work.clear(frame.actor);
  }
}
function nextSearchSequence<S extends QuerySchema>(frame: SearchFrame<S>) {
  const sequence = (frame.local.sequence.read(frame.actor) ?? 0) + 1;
  frame.local.sequence.write(frame.actor, sequence);
  return sequence;
}
function resetSearchEdit<S extends QuerySchema>(frame: SearchFrame<S>) {
  cancelSearchWork(frame);
  nextSearchSequence(frame);
  frame.local.draft.clear(frame.actor);
  frame.local.ime.clear(frame.actor);
  frame.local.submission.clear(frame.actor);
  frame.local.notice.clear(frame.actor);
}
function isOlderSearchAcceptance<S extends QuerySchema>(
  receipt: SearchReceipt<S> | null,
  pending: CriteriaSearchDraft,
  state: TableState<S>,
): boolean {
  return (
    receipt !== null &&
    receipt.sequence < pending.sequence &&
    state.revision >= receipt.proposal.transition.state.revision &&
    state.query === receipt.proposal.transition.state.query
  );
}
/** Original accepted-TEXT baseline and exact original-proposal query/revision
 * receipt, not queryIdentity/revision-only matching or pending-state mirroring. */
function reconcileSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
) {
  const frame = store.require(actor),
    { state, debounce } = searchLive(frame);
  const session = frame.local.session.read(actor);
  if (
    !session ||
    session.locale !== state.query.locale ||
    session.timeZone !== state.query.timeZone
  ) {
    if (session) resetSearchEdit(frame);
    frame.local.session.write(actor, {
      locale: state.query.locale,
      timeZone: state.query.timeZone,
    });
  }
  const pending = frame.local.draft.read(actor);
  if (frame.disabled) {
    if (
      pending ||
      frame.local.submission.read(actor) ||
      frame.local.ime.read(actor) ||
      frame.local.notice.read(actor)
    )
      resetSearchEdit(frame);
    return;
  }
  if (!pending || pending.base === state.query.search) return;
  cancelSearchWork(frame);
  const receipt = frame.local.submission.read(actor);
  const olderAcceptance = isOlderSearchAcceptance(receipt, pending, state);
  if (olderAcceptance)
    frame.local.draft.write(actor, {
      ...pending,
      base: state.query.search,
      deadline: Date.now() + debounce,
    });
  else {
    nextSearchSequence(frame);
    frame.local.draft.clear(actor);
  }
  frame.local.submission.clear(actor);
}
function armSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
) {
  const frame = store.require(actor),
    live = searchLive(frame),
    pending = frame.local.draft.read(actor);
  const session = frame.local.session.read(actor);
  if (
    !session ||
    session.locale !== live.state.query.locale ||
    session.timeZone !== live.state.query.timeZone ||
    frame.disabled ||
    !live.configured ||
    frame.local.ime.read(actor) ||
    !pending ||
    pending.deadline === null ||
    pending.base !== live.state.query.search ||
    pending.sequence !== frame.local.sequence.read(actor)
  )
    return;
  const prior = frame.local.work.read(actor);
  if (
    prior?.actor === actor &&
    prior.sequence === pending.sequence &&
    prior.deadline === pending.deadline
  )
    return;
  cancelSearchWork(frame);
  const handle = frame.cell.timeout(
    actor,
    Math.max(0, pending.deadline - Date.now()),
    () => {
      submitSearch(store, actor, pending);
      return undefined;
    },
  );
  frame.local.work.write(actor, {
    actor,
    sequence: pending.sequence,
    deadline: pending.deadline,
    handle,
  });
}
function submitSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
  candidate: CriteriaSearchDraft,
) {
  try {
    const frame = store.require(actor);
    cancelSearchWork(frame);
    reconcileSearch(store, actor);
    const live = searchLive(frame);
    if (
      frame.disabled ||
      !live.configured ||
      frame.local.ime.read(actor) ||
      candidate.sequence !== frame.local.sequence.read(actor) ||
      candidate.base !== live.state.query.search
    )
      return;
    frame.local.draft.write(actor, { ...candidate, deadline: null });
    // Final live baseline after all local writes, immediately before dispatch.
    store.require(actor);
    if (
      searchLive(frame).state.query.search !== candidate.base ||
      frame.local.sequence.read(actor) !== candidate.sequence ||
      frame.local.ime.read(actor)
    )
      return;
    const result = frame.origin.controller.dispatch({
      type: "search.commit",
      search: candidate.text,
    });
    store.require(actor);
    searchLive(frame);
    if (result.status === "proposed")
      frame.local.submission.write(actor, {
        sequence: candidate.sequence,
        proposal: result.proposal,
      });
    if (frame.local.sequence.read(actor) === candidate.sequence) {
      if (result.status !== "rejected") frame.local.draft.clear(actor);
      const messages = searchMessages(frame);
      frame.local.notice.write(
        actor,
        result.status === "proposed"
          ? messages.submitted
          : result.status === "rejected"
            ? messages.failed
            : "",
      );
    }
    store.require(actor);
    const beforeObserver = searchLive(frame).state.query.search;
    observeMutation(frame.ports.onMutation, result);
    store.require(actor);
    const afterObserver = searchLive(frame).state.query.search;
    if (
      beforeObserver !== afterObserver ||
      frame.local.draft.read(actor)?.base !== afterObserver
    )
      reconcileSearch(store, actor);
    armSearch(store, actor);
  } catch {
    // A stale actor never writes B or reads B's messages after callback reentry.
    try {
      const frame = store.require(actor);
      if (frame.local.sequence.read(actor) === candidate.sequence)
        frame.local.notice.write(actor, searchMessages(frame).invalidValue);
    } catch {
      /* Denied, no fallback. */
    }
  }
}
function editSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
  text: string,
) {
  try {
    reconcileSearch(store, actor);
    const frame = store.require(actor),
      live = searchLive(frame);
    if (frame.disabled || !live.configured) return;
    cancelSearchWork(frame);
    const pending: CriteriaSearchDraft = {
      text,
      sequence: nextSearchSequence(frame),
      base: live.state.query.search,
      deadline: frame.local.ime.read(actor) ? null : Date.now() + live.debounce,
    };
    frame.local.draft.write(actor, pending);
    frame.local.notice.clear(actor);
    armSearch(store, actor);
  } catch {
    /* Fixed neutral denial; no callback or stale latest refs. */
  }
}
function cancelSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
) {
  try {
    reconcileSearch(store, actor);
    const frame = store.require(actor);
    if (frame.disabled) return;
    cancelSearchWork(frame);
    nextSearchSequence(frame);
    frame.local.draft.clear(actor);
    frame.local.ime.clear(actor);
    frame.local.notice.write(actor, searchMessages(frame).cancelled);
  } catch {
    /* Denied. */
  }
}
function clearSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
) {
  try {
    reconcileSearch(store, actor);
    const frame = store.require(actor),
      live = searchLive(frame);
    if (frame.disabled || !live.configured) return;
    cancelSearchWork(frame);
    frame.local.ime.clear(actor);
    const pending: CriteriaSearchDraft = {
      text: "",
      sequence: nextSearchSequence(frame),
      base: live.state.query.search,
      deadline: null,
    };
    frame.local.draft.write(actor, pending);
    submitSearch(store, actor, pending);
  } catch {
    /* Denied. */
  }
}
function compositionSearch<S extends QuerySchema>(
  store: SearchStore<S>,
  actor: CriteriaActor<"search", S>,
  composing: boolean,
  text?: string,
) {
  try {
    reconcileSearch(store, actor);
    const frame = store.require(actor);
    if (frame.disabled) return;
    frame.local.ime.write(actor, composing);
    cancelSearchWork(frame);
    if (composing) {
      const pending = frame.local.draft.read(actor);
      if (pending)
        frame.local.draft.write(actor, { ...pending, deadline: null });
    } else if (text !== undefined) editSearch(store, actor, text);
  } catch {
    /* Denied. */
  }
}
/** Private test/adoption operations; no package-root export or alternative grant. */
export const criteriaSearch = Object.freeze({
  edit: editSearch,
  cancel: cancelSearch,
  clear: clearSearch,
  composition: compositionSearch,
  reconcile: reconcileSearch,
  arm: armSearch,
  submit<S extends QuerySchema>(
    store: SearchStore<S>,
    actor: CriteriaActor<"search", S>,
  ) {
    try {
      const frame = store.require(actor),
        pending = frame.local.draft.read(actor);
      if (pending) submitSearch(store, actor, pending);
    } catch {
      /* Denied. */
    }
  },
});

function CriteriaSearchSurface<S extends QuerySchema>({
  store,
}: {
  readonly store: SearchStore<S>;
}) {
  const version = useCriteriaToolbarVersion(store),
    frame = store.read(),
    actor = frame?.actor;
  useLayoutEffect(() => {
    if (!actor || store.getSnapshot() !== version) return;
    try {
      reconcileSearch(store, actor);
      armSearch(store, actor);
    } catch {
      /* Real reset/stale actor. */
    }
  }, [store, actor, version]);
  if (!frame || !actor) return <CriteriaToolbarNeutral kind="search" />;
  try {
    const { state, configured } = searchLive(frame),
      messages = searchMessages(frame);
    const pending = frame.local.draft.read(actor),
      active = !frame.disabled;
    const session = frame.local.session.read(actor);
    const eligible =
      session !== null &&
      session.locale === state.query.locale &&
      session.timeZone === state.query.timeZone &&
      pending !== null &&
      (pending.base === state.query.search ||
        isOlderSearchAcceptance(
          frame.local.submission.read(actor),
          pending,
          state,
        ));
    const text = active
      ? eligible && pending
        ? pending.text
        : state.query.search
      : "";
    const notice = active ? (frame.local.notice.read(actor) ?? "") : "";
    const output = (
      <div className={`tw-filter-search ${frame.className}`}>
        <SearchField
          aria-label={messages.label}
          value={text}
          onChange={(value) => editSearch(store, actor, value)}
          onClear={() => clearSearch(store, actor)}
          onSubmit={() => criteriaSearch.submit(store, actor)}
          isDisabled={!active || !configured}
          variant="secondary"
        >
          <SearchField.Group>
            <SearchField.SearchIcon aria-hidden="true" />
            <SearchField.Input
              placeholder={messages.placeholder}
              onCompositionStart={() => compositionSearch(store, actor, true)}
              onCompositionEnd={(event) => {
                try {
                  store.require(actor);
                  const value = event.currentTarget.value;
                  store.require(actor);
                  compositionSearch(store, actor, false, value);
                } catch {
                  /* Saved A cannot read B's live input. */
                }
              }}
              onKeyDownCapture={(event) => {
                try {
                  const current = store.require(actor);
                  if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    cancelSearch(store, actor);
                  } else if (
                    event.key === "Enter" &&
                    (current.local.ime.read(actor) ||
                      event.nativeEvent.isComposing)
                  )
                    event.stopPropagation();
                } catch {
                  event.stopPropagation();
                }
              }}
            />
            <SearchField.ClearButton aria-label={messages.clearLabel} />
          </SearchField.Group>
        </SearchField>
        {!configured ? (
          <p role="alert">{messages.invalidConfiguration}</p>
        ) : null}
        {!active ? <p role="status">{messages.unavailable}</p> : null}
        <span className="tw-filter-status" role="status">
          {notice}
        </span>
      </div>
    );
    frame.cell.require(actor);
    return output;
  } catch {
    return <CriteriaToolbarNeutral kind="search" />;
  }
}
