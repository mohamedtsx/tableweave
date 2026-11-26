/** Constructed locally only from the typed server authorization outcome. */
export class AuthorizationLostError extends Error {
  readonly code = "access-lost";
  constructor() {
    super("Access to these records is unavailable.");
    this.name = "AuthorizationLostError";
  }
}
