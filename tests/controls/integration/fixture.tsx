import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ControlsExample,
  type ExampleAPI,
} from "../../../apps/storybook/src/controls/ControlsExample.js";
import "./fixture.css";

declare global {
  interface Window {
    controlsIntegration: Record<string, ExampleAPI>;
  }
}
window.controlsIntegration = {};
const params = new URLSearchParams(location.search);
const register = (id: string) => (api: ExampleAPI | null) => {
  if (api) window.controlsIntegration[id] = api;
  else delete window.controlsIntegration[id];
};
const left = register("left"),
  right = register("right");
const rtl = params.has("rtl");
document.documentElement.lang = rtl ? "ar" : "en";
document.documentElement.dir = rtl ? "rtl" : "ltr";
document.documentElement.classList.toggle("dark", params.has("dark"));
document.documentElement.dataset.theme = params.has("dark") ? "dark" : "light";
const options = {
  mode: params.has("client") ? ("client" as const) : ("server" as const),
  controlled: params.has("controlled"),
  single: params.has("single"),
  locale: rtl ? "ar-EG" : "en-US",
  dark: params.has("dark"),
  initialPage: Number(params.get("page") ?? 0),
  correction: params.has("correction"),
};
const example = (
  <main>
    <h1>Public controls integration</h1>
    <ControlsExample {...options} id="left" onReady={left} />
    {params.has("pair") ? (
      <ControlsExample {...options} id="right" onReady={right} />
    ) : null}
  </main>
);
createRoot(document.getElementById("root") as HTMLElement).render(
  params.has("strict") ? <StrictMode>{example}</StrictMode> : example,
);
