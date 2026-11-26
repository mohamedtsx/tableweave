import type { QueryClient } from "@tanstack/react-query";
import { AuthorizationLostError } from "./authorization";
import {
  type AuthorizationSession,
  SupersededAuthorizationError,
} from "./authorization-session";
import { getBootstrap, getCanary } from "./functions";
import { rowsOptions } from "./options";
import { alternateDefinitionKey } from "./schema";

export async function loadAuthorizedBootstrap(
  queryClient: QueryClient,
  authorization: AuthorizationSession,
  presentation: "default" | "alternate" = "default",
) {
  const request = authorization.begin();
  try {
    const outcome = await getBootstrap();
    if (outcome.kind === "access-lost") {
      throw new AuthorizationLostError();
    }
    authorization.assertLatest(request);
    // The fixture's second application presentation uses the SAME server schema
    // and permissions. It is not a backend authorization override or runtime flag.
    const configured =
      presentation === "alternate"
        ? { ...outcome.bootstrap, definitionKey: alternateDefinitionKey }
        : outcome.bootstrap;
    const grant = authorization.prepare(request, configured);
    const bootstrap = {
      ...configured,
      authorizationId: grant.id,
      query: authorization.queryFor(grant) ?? configured.query,
    };
    // Same-key isolation canary must be re-read after browser identity changes.
    await queryClient.cancelQueries({
      queryKey: ["request-canary"],
      exact: true,
    });
    const canary = await queryClient.query({
      queryKey: ["request-canary"],
      queryFn: async () => {
        const outcome = await getCanary();
        if (outcome.kind === "access-lost") throw new AuthorizationLostError();
        return { ...outcome.canary, authorizationId: grant.id };
      },
      staleTime: 0,
    });
    authorization.assertLatest(request);
    if (canary.scopeKey !== bootstrap.scopeKey)
      throw new AuthorizationLostError();
    const options = rowsOptions(
      {
        scopeKey: bootstrap.scopeKey,
        clock: bootstrap.clock,
        query: bootstrap.query,
        requestKey: "rows-v1",
        mode: "normal",
      },
      grant,
    );
    // A new grant has a distinct cache partition; same-grant revalidation retains
    // the accepted query and lets the shared freshness policy avoid duplicate reads.
    await queryClient.query(options);
    authorization.assertLatest(request);
    return { bootstrap, canary: canary.value };
  } catch (error) {
    if (error instanceof AuthorizationLostError && !authorization.deny(request))
      throw new SupersededAuthorizationError();
    throw error;
  }
}
