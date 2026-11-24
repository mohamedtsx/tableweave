import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { createFixture } from "./fixture.js";
import "./styles.css";

const { App, api } = createFixture(false, "a");
window.fixture = api;
const root = document.getElementById("root");
if (root)
  hydrateRoot(
    root,
    <StrictMode>
      <App />
    </StrictMode>,
    {
      onRecoverableError(error) {
        console.error(error);
      },
    },
  );
