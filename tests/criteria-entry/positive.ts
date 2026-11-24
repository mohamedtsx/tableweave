import {
  type CriteriaAuthority,
  type CriteriaAuthorityOptions,
  type CriteriaCurrent,
  type CriteriaOrigin,
  type CriteriaPublication,
  type CriteriaPublicationBeginResult,
  type CriteriaPublicationBinding,
  type CriteriaPublicationCancelResult,
  type CriteriaPublicationCompleteResult,
  type CriteriaPublicationDisposeResult,
  type CriteriaPublicationEvent,
  type CriteriaPublicationFailure,
  type CriteriaPublicationNext,
  type CriteriaPublicationObserver,
  type CriteriaPublicationOptions,
  type CriteriaPublicationParticipant,
  type CriteriaPublicationRetirementPort,
  type CriteriaPublicationSnapshot,
  type CriteriaPublicationTicket,
  createCriteriaAuthority,
  createCriteriaPublication,
  getCriteriaAuthorityOrigin,
  getCriteriaPublicationBinding,
  requireCriteriaAuthority,
} from "@tableweave/react/criteria";
import type { QuerySchema } from "../../packages/react/src/contracts/types.js";
import type {
  ControllerDefinition,
  TableController,
} from "../../packages/react/src/controller/types.js";

/** Compile-only external app inputs, never a fake controller/reader/bootstrap. */
export function captureExternal<S extends QuerySchema>(
  controller: TableController<S>,
  definition: ControllerDefinition<NoInfer<S>>,
  origin: CriteriaOrigin<S>,
  readCurrent: () => CriteriaCurrent<NoInfer<S>>,
  retirement: CriteriaPublicationRetirementPort<NoInfer<S>>,
) {
  const options: CriteriaAuthorityOptions<S> = { origin, readCurrent };
  const authority: CriteriaAuthority<S> = createCriteriaAuthority(options);
  const publicationOptions: CriteriaPublicationOptions<S> = {
    controller,
    definition,
    retirement,
  };
  const publication: CriteriaPublication<S> =
    createCriteriaPublication(publicationOptions);
  const binding: CriteriaPublicationBinding<S> | null =
    getCriteriaPublicationBinding(authority);
  const captured: CriteriaOrigin<S> | null =
    getCriteriaAuthorityOrigin(authority);
  const next: CriteriaPublicationNext<S> = {
    controller,
    definition,
    expected: origin.context,
    actual: origin.context,
  };
  const snapshot: CriteriaPublicationSnapshot<S> = publication.getSnapshot();
  return { publication, authority, binding, captured, next, snapshot };
}

/** Never invoked by implementation light checks; app must supply actual receipts,
 * participants and bootstrap/retirement evidence before these operations. */
export function externalOperations<S extends QuerySchema>(
  publication: CriteriaPublication<S>,
  next: CriteriaPublicationNext<NoInfer<S>>,
  authority: CriteriaAuthority<S>,
  actualOrigin: CriteriaOrigin<NoInfer<S>>,
  ticket: CriteriaPublicationTicket<S>,
  participant: CriteriaPublicationParticipant<S>,
  observer: CriteriaPublicationObserver,
  event: CriteriaPublicationEvent<S>,
) {
  const begin: CriteriaPublicationBeginResult<S> = publication.begin(next);
  const complete: CriteriaPublicationCompleteResult<S> =
    publication.complete(ticket);
  const cancel: CriteriaPublicationCancelResult<S> = publication.cancel(ticket);
  const dispose: CriteriaPublicationDisposeResult<S> = publication.dispose();
  const failure: CriteriaPublicationFailure | null = begin.snapshot.failure;
  const requireOrigin: CriteriaOrigin<S> = requireCriteriaAuthority(
    authority,
    actualOrigin,
  );
  return {
    begin,
    complete,
    cancel,
    dispose,
    failure,
    event,
    requireOrigin,
    release: publication.registerParticipant(authority, participant),
    unsubscribe: publication.subscribe(observer),
  };
}
