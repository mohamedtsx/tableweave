import * as scenarios from "./scenarios.js";
import { uncontrolled } from "./host.js";
import { nativeReentry } from "./native-scenarios.js";
const api = { ...scenarios, uncontrolled, nativeReentry };
declare global {
  interface Window {
    fenceDomains: typeof api;
  }
}
window.fenceDomains = api;
