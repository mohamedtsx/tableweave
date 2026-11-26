import {
  createRootRouteWithContext,
  createRouter,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { QueryClient } from "@tanstack/react-query";
import type { BootstrapSession } from "../../../apps/example-start-facade/src/application/bootstrap-session.js";
import type { Bootstrap } from "../../../apps/example-start-facade/src/application/types.js";
/** SDK TYPE probe only, never invoked; does NOT replace generated route assembly. */
export function sdkContract(
  queryClient: QueryClient,
  session: BootstrapSession,
) {
  const route = createRootRouteWithContext<{
    session: BootstrapSession;
    queryClient: QueryClient;
  }>()({});
  const router = createRouter({
    routeTree: route.addChildren([]),
    context: { session, queryClient },
    dehydrate: () => session.serialize(),
    hydrate: (value: { bootstrap: Bootstrap | null }) => {
      session.prepareHydration(value.bootstrap);
    },
  });
  router.serverSsrLifecycle = {
    ...router.serverSsrLifecycle,
    onServerSsrAttach: [
      ...(router.serverSsrLifecycle?.onServerSsrAttach ?? []),
      (ssr) =>
        ssr.onCleanup(() => {
          session.dispose();
        }),
    ],
  };
  setupRouterSsrQueryIntegration({
    router,
    queryClient,
    hydrateOptions: {
      defaultOptions: { deserializeData: session.deserializeData },
    },
  });
  const hydrate = router.options.hydrate;
  router.update({
    context: { session, queryClient },
    hydrate: async (data) => {
      await hydrate?.(data);
      session.adoptHydration();
    },
  });
  return router.subscribe("onBeforeNavigate", (event) => {
    if (event.pathChanged) session.retire();
  });
}
