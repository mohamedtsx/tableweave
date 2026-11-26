import "./styles.css";
import type { ReactNode } from "react";
import { StrictMode, Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { CombinedWorkbench } from "../fixtures/combined.js";
import type { BuilderExample } from "../fixtures/data.js";
import type { OptionTransportMode } from "../fixtures/ports.js";
import type { FixtureApi } from "../fixtures/workbench.js";

const params = new URLSearchParams(location.search);
document.documentElement.classList.toggle("dark", params.has("dark"));
document.documentElement.dir = params.has("rtl") ? "rtl" : "ltr";
document.documentElement.lang = params.has("rtl") ? "ar-EG" : "en-US";
declare global {
  interface Window {
    wp07?: FixtureApi;
    wp07Second?: FixtureApi;
  }
}
function ready(api: FixtureApi | null) {
  if (api) window.wp07 = api;
  else delete window.wp07;
}
function readySecond(api: FixtureApi | null) {
  if (api) window.wp07Second = api;
  else delete window.wp07Second;
}
const never = new Promise<never>(() => {});
function Gate({
  suspend,
  children,
}: {
  readonly suspend: boolean;
  readonly children: ReactNode;
}) {
  if (suspend) throw never;
  return children;
}
const examples: readonly BuilderExample[] = [
  "none",
  "repeated",
  "crossAny",
  "entities",
  "families",
];
const requestedExample = params.get("example");
const example = examples.find((entry) => entry === requestedExample) ?? "none";
const modes: readonly OptionTransportMode[] = [
  "manual",
  "ready",
  "empty",
  "fail-once",
];
const mode =
  modes.find((entry) => entry === params.get("transport")) ?? "manual";
function App() {
  const [suspend, setSuspend] = useState(false);
  const [mounted, setMounted] = useState(true);
  const first = (
    <CombinedWorkbench
      label="First synthetic table"
      embedded={params.has("twins")}
      controlled={params.has("controlled")}
      asyncOptions={params.has("async")}
      optionTransport={mode}
      initialBuilder={example}
      initialIndependent={params.has("independent")}
      locale={params.has("rtl") ? "ar-EG" : "en-US"}
      onReady={ready}
    />
  );
  return (
    <>
      <nav className="wp07-lifecycle" aria-label="Fixture lifecycle controls">
        <button type="button" onClick={() => setSuspend(true)}>
          Commit same-scope Suspense hide
        </button>
        <button type="button" onClick={() => setSuspend(false)}>
          Reveal same-scope workbench
        </button>
        <button type="button" onClick={() => setMounted((value) => !value)}>
          {mounted ? "Unmount workbench" : "Mount workbench"}
        </button>
      </nav>
      <Suspense
        fallback={
          <p data-testid="suspense-fallback" role="status">
            Workbench is suspended.
          </p>
        }
      >
        {mounted ? (
          <Gate suspend={suspend}>
            {params.has("twins") ? (
              <main aria-label="Independent synthetic tables">
                {first}
                <CombinedWorkbench
                  label="Second synthetic table"
                  embedded
                  initialScope="scope-b"
                  asyncOptions={params.has("async")}
                  optionTransport={mode}
                  initialBuilder={example}
                  onReady={readySecond}
                />
              </main>
            ) : (
              first
            )}
          </Gate>
        ) : (
          <p data-testid="unmounted">Workbench unmounted.</p>
        )}
      </Suspense>
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing synthetic fixture root");
createRoot(root).render(
  params.has("nostrict") ? (
    <App />
  ) : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
);
