import { createFileRoute, useRouter } from "@tanstack/react-router";
import { initialDataset } from "../application/transport.js";
import { TablePage } from "../table/TablePage.js";
export const Route = createFileRoute("/")({
  loader: ({ context, abortController, preload }) =>
    context.session.load(
      context.session.requestedDataset() ?? initialDataset(),
      abortController.signal,
      preload,
    ),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: Page,
  errorComponent: Failure,
});
function Page() {
  const receipt = Route.useLoaderData(),
    { session } = Route.useRouteContext(),
    router = useRouter();
  return (
    <TablePage
      session={session}
      receipt={receipt}
      recheck={(selected) => {
        session.selectDataset(selected);
        void router.invalidate();
      }}
      away={() => {
        void router.navigate({ to: "/away" });
      }}
    />
  );
}
function Failure() {
  const { session } = Route.useRouteContext(),
    router = useRouter();
  return (
    <main>
      <h1>Synthetic application unavailable</h1>
      <p>No source grant is inferred from an error response.</p>
      <button
        type="button"
        onClick={() => {
          if (session.retire()) void router.invalidate();
        }}
      >
        Recheck source
      </button>
      <button
        type="button"
        onClick={() => {
          void router.navigate({ to: "/away" });
        }}
      >
        Leave application route
      </button>
    </main>
  );
}
