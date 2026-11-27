import { createRoot } from "react-dom/client";
import {
  type CompositionOwner,
  FilterControlsComposition,
} from "../../../apps/storybook/src/controls/FilterControlsComposition.js";
import "./fixture.css";

declare global {
  interface Window {
    filterControls: Record<string, CompositionOwner>;
  }
}
window.filterControls = {};
const params = new URLSearchParams(location.search);
const register = (id: string) => (owner: CompositionOwner | null) => {
  if (owner) window.filterControls[id] = owner;
  else delete window.filterControls[id];
};
const first = register("first");
const second = register("second");
const locale = params.has("rtl") ? "ar-EG" : "en-US";
const dark = params.has("dark");
document.documentElement.lang = locale;
document.documentElement.dir = params.has("rtl") ? "rtl" : "ltr";
document.documentElement.classList.toggle("dark", dark);
document.documentElement.dataset.theme = dark ? "dark" : "light";
const props = {
  locale,
  dark,
  controlled: params.has("controlled"),
  initialRule: params.has("rule"),
};
createRoot(document.getElementById("root") as HTMLElement).render(
  <main>
    <h1>Real filter and table control composition</h1>
    <FilterControlsComposition {...props} id="first" onReady={first} />
    {params.has("pair") ? (
      <FilterControlsComposition {...props} id="second" onReady={second} />
    ) : null}
  </main>,
);
