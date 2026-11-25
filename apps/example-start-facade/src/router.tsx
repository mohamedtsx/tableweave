import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";
import { createBootstrapSession } from "./application/bootstrap-session.js";
import { reader } from "./application/transport.js";
import type { Bootstrap } from "./application/types.js";

function freshDocumentOnRestore(event: PageTransitionEvent) {
  if (event.persisted) window.location.reload();
}
export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  const realm = typeof document === "undefined" ? "server" : "client";
  const session = createBootstrapSession(queryClient, reader, realm);
  const router = createRouter({
    routeTree,
    context: { queryClient, session },
    defaultPreload: false,
    defaultPreloadStaleTime: 0,
    dehydrate: () => session.serialize(),
    hydrate: (data: { bootstrap: Bootstrap | null }) => {
      session.prepareHydration(data.bootstrap);
    },
  });
  // Register our parent close before SQ appends its own Query teardown. Preserve
  // existing attachers; neither callback ends a stream before SDK onCleanup.
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
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" &&
        session.shouldDehydrate(query.state.data),
    },
    hydrateOptions: {
      defaultOptions: { deserializeData: session.deserializeData },
    },
  });
  const sdkHydrate = router.options.hydrate;
  router.update({
    context: { session, queryClient },
    hydrate: async (data) => {
      try {
        await sdkHydrate?.(data);
        session.adoptHydration();
      } catch (error) {
        session.retire("Hydration input was rejected; source remains closed.");
        throw error;
      }
    },
  });
  session.addRemover(
    router.subscribe("onBeforeNavigate", (event) => {
      if (event.pathChanged) session.retire("Leaving the application domain.");
    }),
  );
  if (realm === "client") {
    const pagehide = (event: PageTransitionEvent) => {
      if (event.persisted)
        window.addEventListener("pageshow", freshDocumentOnRestore, {
          once: true,
        });
      session.dispose();
    };
    window.addEventListener("pagehide", pagehide);
    session.addRemover(() => window.removeEventListener("pagehide", pagehide));
    import.meta.hot?.dispose(() => {
      session.dispose();
    });
  }
  return router;
}
