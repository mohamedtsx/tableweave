import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useRef, useState, useTransition } from "react";
import { loadAuthorizedBootstrap } from "../rows/bootstrap";
import { AuthorizationBoundary } from "../rows/session";

// Synthetic acceptance fixture for abandoned/committed authorization renders.
export const Route = createFileRoute("/lifecycle")({
  loader: ({ context }) =>
    loadAuthorizedBootstrap(context.queryClient, context.authorization),
  headers: () => ({ "Cache-Control": "private, no-store" }),
  component: Lifecycle,
});
type Authorized = Awaited<ReturnType<typeof loadAuthorizedBootstrap>>;
interface Gate {
  readonly data: Authorized;
  readonly check: () => void;
  readonly release: () => void;
}
function gateFor(data: Authorized): Gate {
  let opened = false;
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = () => {
      opened = true;
      resolve();
    };
  });
  return {
    data,
    release: () => release(),
    check: () => {
      if (!opened) throw promise;
    },
  };
}
function Lifecycle() {
  const initial = Route.useLoaderData();
  const { queryClient, authorization } = Route.useRouteContext();
  const [candidate, setCandidate] = useState<
    Authorized & { readonly beforeCommit?: () => void }
  >(initial);
  const prepared = useRef<Gate | null>(null);
  const [pending, transition] = useTransition();
  return (
    <>
      <p>Synthetic concurrent-render acceptance fixture.</p>
      <output data-testid="transition-pending">
        {pending ? "pending" : "settled"}
      </output>
      <button
        type="button"
        onClick={() => {
          void loadAuthorizedBootstrap(
            queryClient,
            authorization,
            "alternate",
          ).then((data) => transition(() => setCandidate(data)));
        }}
      >
        Commit alternate definition
      </button>
      <button
        type="button"
        onClick={() => {
          void loadAuthorizedBootstrap(queryClient, authorization).then(
            (data) => {
              const gate = gateFor(data);
              prepared.current = gate;
              transition(() =>
                setCandidate({ ...data, beforeCommit: gate.check }),
              );
            },
          );
        }}
      >
        Prepare suspended authorization
      </button>
      <button
        type="button"
        onClick={() => {
          const gate = prepared.current;
          setCandidate(initial);
          queueMicrotask(() => gate?.release());
        }}
      >
        Discard authorization render
      </button>
      <button
        type="button"
        onClick={() => {
          const gate = prepared.current;
          if (!gate) return;
          gate.release();
          transition(() => setCandidate(gate.data));
        }}
      >
        Commit prepared authorization
      </button>
      <Suspense fallback={<p>Authorization render suspended.</p>}>
        <AuthorizationBoundary
          {...candidate}
          queryClient={queryClient}
          authorization={authorization}
        />
      </Suspense>
    </>
  );
}
