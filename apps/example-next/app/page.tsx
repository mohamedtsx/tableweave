import ClientDataTableBoundary from "./ClientDataTableBoundary.js";
import { buildInitialPayload } from "../lib/server-contract.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ compare?: string }>;
}) {
  const compare = (await searchParams).compare === "1";
  return (
    <main className="example-shell">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-muted">
            Tableweave / Next App Router
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Public table example
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            A server builds plain initial inputs; a client boundary owns the
            real table lifecycle. Framework and hydration verification is still
            deferred.
          </p>
        </div>
        <a className="example-link" href={compare ? "/" : "/?compare=1"}>
          {compare ? "Show one example" : "Compare independent examples"}
        </a>
      </header>
      <div className="space-y-8">
        <ClientDataTableBoundary initial={buildInitialPayload("primary")} />
        {compare ? (
          <ClientDataTableBoundary
            initial={buildInitialPayload("comparison")}
          />
        ) : null}
      </div>
    </main>
  );
}
