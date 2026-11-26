import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Application } from "./application.js";
import "./styles.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing WP-12 application root");
// Fixed initial diagnostic shape, not query persistence or a live-owner rekey.
const grouped = new URLSearchParams(location.search).get("view") === "grouped";
createRoot(root, {
  onRecoverableError() {
    window.dispatchEvent(new Event("wp12-react-error"));
  },
}).render(
  <StrictMode>
    <Application grouped={grouped} />
  </StrictMode>,
);
