import { extentHarness } from "./harness.js";

const api = {
  client: extentHarness("disabled-client"),
  complete: extentHarness("disabled-server-complete"),
  paged: extentHarness("paged-client"),
  pagedRemoteDenial: extentHarness("paged-server-complete-denial"),
};
declare global {
  interface Window {
    unpagedExtent: typeof api;
  }
}
window.unpagedExtent = api;
