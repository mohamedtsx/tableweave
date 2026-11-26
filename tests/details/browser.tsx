import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createFixture,
  type FixtureApi,
  type FixtureDetailsOptions,
} from "./fixture.js";
import "./styles.css";

declare global {
  interface Window {
    fixture: FixtureApi;
    detailsProbe: { accessReads: number; sourceReads: number };
    detailsOptionsTransform?: (
      options: FixtureDetailsOptions,
    ) => FixtureDetailsOptions;
    callbackProbe: { reads: number; deny: number; allow: number };
    callbackAudit: {
      receivers: boolean[];
      oldObserver: number;
      newObserver: number;
      getterCalls: number;
    };
    originalGenerationRead: FixtureApi["privatePort"] extends () => infer P
      ? P extends { read: infer R }
        ? R
        : never
      : never;
    nextGenerationAuthority: import("../../packages/heroui/src/details/types.js").DetailsAuthority;
  }
}
const params = new URLSearchParams(location.search);
const { App, api } = createFixture(
  params.has("controlled"),
  params.get("initial"),
);
window.fixture = api;
const root = document.getElementById("root");
if (root && params.has("normal")) createRoot(root).render(<App />);
else if (root)
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
