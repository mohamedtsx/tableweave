import { createFileRoute, useRouter } from "@tanstack/react-router";
import { loadAuthorizedBootstrap } from "../rows/bootstrap";
import { AuthorizationBoundary } from "../rows/session";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    loadAuthorizedBootstrap(context.queryClient, context.authorization),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: Demo,
  errorComponent: AuthorizationError,
});
function AuthorizationError() {
  const router = useRouter();
  return (
    <div data-testid="authorization-error">
      <p>Application request unavailable.</p>
      <button
        type="button"
        onClick={() => {
          void router.invalidate();
        }}
      >
        Recheck authorization
      </button>
    </div>
  );
}
function Demo() {
  const { bootstrap, canary } = Route.useLoaderData();
  const { queryClient, authorization } = Route.useRouteContext();
  return (
    <AuthorizationBoundary
      bootstrap={bootstrap}
      canary={canary}
      queryClient={queryClient}
      authorization={authorization}
    />
  );
}
