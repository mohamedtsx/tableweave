import { createFileRoute, useRouter } from "@tanstack/react-router";
export const Route = createFileRoute("/away")({ component: Away });
function Away() {
  const router = useRouter();
  return (
    <main>
      <h1>Outside the table application</h1>
      <p>The previous source is retired, not merely hidden.</p>
      <button
        type="button"
        onClick={() => {
          void router.navigate({ to: "/" });
        }}
      >
        Request a fresh source
      </button>
    </main>
  );
}
