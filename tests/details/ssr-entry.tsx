import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { createFixture } from "./fixture.js";

/** Source-level actual React DOM SSR fixture, not framework or tarball proof. */
export function renderInitialDetails() {
  const { App } = createFixture(false, "a");
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
