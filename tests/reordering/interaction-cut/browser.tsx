import * as scenarios from "./scenarios.js";
declare global {
  interface Window {
    interactionCut: typeof scenarios;
  }
}
window.interactionCut = scenarios;
