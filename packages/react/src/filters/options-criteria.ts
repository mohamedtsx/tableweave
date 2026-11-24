import type { QuerySchema, ScalarId } from "../contracts/types.js";
import type {
  CriteriaAuthority,
  CriteriaOrigin,
} from "../controller/criteria.js";
import {
  getCriteriaAuthorityOrigin,
  requireCriteriaAuthority,
} from "../controller/criteria.js";
import type {
  CriteriaPublication,
  CriteriaPublicationEvent,
  CriteriaPublicationParticipant,
} from "../controller/criteria-publication.js";
import { getCriteriaPublicationBinding } from "../controller/criteria-publication.js";
import type {
  BuilderFieldId,
  OptionSource,
  OptionSourceContext,
} from "./editor-types.js";
import {
  getOptionCriteriaCapability,
  optionCriteriaUnavailable as deny,
} from "./options-criteria-core.js";

export { OptionCriteriaError } from "./options-criteria-core.js";

/** Consumed own data only; aliases share one descriptor capture per operation. */
class Capture {
  private readonly values = new WeakMap<object, Map<string, unknown>>();
  constructor(private readonly check: () => void) {}

  data(input: unknown, name: string): unknown {
    if (input === null || typeof input !== "object") return deny();
    let values = this.values.get(input);
    if (!values) {
      values = new Map();
      this.values.set(input, values);
    }
    if (!values.has(name)) {
      let descriptor: PropertyDescriptor | undefined;
      try {
        descriptor = Object.getOwnPropertyDescriptor(input, name);
      } finally {
        this.check();
      }
      if (!descriptor || !Object.hasOwn(descriptor, "value")) return deny();
      values.set(name, descriptor.value);
    }
    return values.get(name);
  }
}

function sameContext(
  a: CriteriaOrigin<QuerySchema>["context"],
  b: CriteriaOrigin<QuerySchema>["context"],
): boolean {
  return (
    a.definitionKey === b.definitionKey &&
    a.scopeKey === b.scopeKey &&
    a.access === b.access
  );
}

/** Explicit lifecycle registration, never source acquisition or implicit reset. */
export function registerOptionCriteriaSource<
  S extends QuerySchema,
  Id extends ScalarId,
>(
  input: Readonly<{
    publication: CriteriaPublication<S>;
    criteria: CriteriaAuthority<NoInfer<S>>;
    fieldId: BuilderFieldId<NoInfer<S>>;
    source: OptionSource<Id>;
  }>,
): () => void {
  try {
    const initial = new Capture(() => {});
    const source = initial.data(input, "source");
    const capability = getOptionCriteriaCapability(source);
    if (!capability) return deny();
    const criteria = initial.data(input, "criteria") as CriteriaAuthority<S>;
    const publication = initial.data(
      input,
      "publication",
    ) as CriteriaPublication<S>;
    const binding = getCriteriaPublicationBinding(criteria);
    if (
      !binding ||
      binding.publication !== publication ||
      getCriteriaAuthorityOrigin(criteria) !== binding.origin
    )
      return deny();
    const origin = binding.origin;
    const readSnapshot = initial.data(publication, "getSnapshot");
    if (typeof readSnapshot !== "function") return deny();
    const current = () => {
      const before = Reflect.apply(readSnapshot, publication, []);
      requireCriteriaAuthority(criteria, origin);
      if (Reflect.apply(readSnapshot, publication, []) !== before)
        return deny();
    };
    current();
    const capture = new Capture(current);
    const fieldId = capture.data(input, "fieldId");
    if (typeof fieldId !== "string" || !fieldId) return deny();
    const schema = capture.data(origin.definition, "schema");
    const fields = capture.data(schema, "fields");
    const field = capture.data(fields, fieldId);
    if (capture.data(field, "owner") !== "builder") return deny();
    const register = capture.data(publication, "registerParticipant");
    const getSnapshot = readSnapshot;
    const getDefinition = capture.data(origin.controller, "getDefinition");
    const isDisposed = capture.data(origin.controller, "isDisposed");
    if (
      typeof register !== "function" ||
      typeof getSnapshot !== "function" ||
      typeof getDefinition !== "function" ||
      typeof isDisposed !== "function"
    )
      return deny();
    current();
    const expected = Object.freeze({ ...origin.context, fieldId });
    const claim = capability.reserve(expected, current);
    let ticket: object | null = null;
    let purged: CriteriaPublicationEvent<S> | null = null;
    let cleanup: CriteriaPublicationEvent<S> | null = null;
    const ownedEvent = (event: CriteriaPublicationEvent<S>) => {
      const previous = event.previous;
      if (
        event.controller !== origin.controller ||
        event.definition !== origin.definition ||
        !previous ||
        previous.controller !== origin.controller ||
        previous.definition !== origin.definition ||
        previous.epoch !== origin.epoch ||
        !sameContext(previous.expected, origin.context) ||
        !sameContext(previous.actual, origin.context)
      )
        return deny();
    };
    const participant: CriteriaPublicationParticipant<S> = Object.freeze({
      purge(event: CriteriaPublicationEvent<S>): undefined {
        ownedEvent(event);
        if (
          purged &&
          (purged.kind !== event.kind || purged.previous !== event.previous)
        )
          return deny();
        purged ??= event;
        ticket ??= claim.purge();
        return undefined;
      },
      cleanup(event: CriteriaPublicationEvent<S>): undefined {
        ownedEvent(event);
        if (
          !ticket ||
          !purged ||
          purged.kind !== event.kind ||
          purged.previous !== event.previous
        )
          return deny();
        if (cleanup && cleanup.next !== event.next) return deny();
        cleanup ??= event;
        const next = cleanup.next;
        let context: OptionSourceContext | null = null;
        if (next) {
          if (
            next.controller !== origin.controller ||
            next.definition !== origin.definition
          )
            return deny();
          context = Object.freeze({
            ...next.expected,
            fieldId,
            access:
              next.expected.access &&
              next.actual.access &&
              sameContext(next.expected, next.actual),
          });
        }
        // Lifecycle cleanup must run WHILE criteria are denied. This checks the
        // exact operation, not the old authority's intentionally denied require().
        const snapshot = Reflect.apply(getSnapshot, publication, []);
        const lifecycle = () => {
          if (
            Reflect.apply(getSnapshot, publication, []) !== snapshot ||
            Reflect.apply(isDisposed, origin.controller, []) !== false ||
            Reflect.apply(getDefinition, origin.controller, []) !==
              origin.definition
          )
            return deny();
          if (Reflect.apply(getSnapshot, publication, []) !== snapshot)
            return deny();
        };
        lifecycle();
        claim.cleanup(ticket, cleanup.kind, context, lifecycle);
        return undefined;
      },
    });
    let release: (() => void) | null = null;
    try {
      current();
      release = Reflect.apply(register, publication, [
        criteria,
        participant,
      ]) as () => void;
      current();
      claim.activate(current);
      current();
    } catch {
      if (release) release();
      claim.rollback(); // only an unpublished reservation can be rolled back
      return deny();
    }
    // No late lookup of latest props/origin/P; the real release retains debt.
    return release;
  } catch {
    return deny();
  }
}
