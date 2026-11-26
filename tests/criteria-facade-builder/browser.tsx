import { harness } from "./harness.js";
import {
  association,
  coalescing,
  defaults,
  denial,
  foreignOwner,
  invalidationOrigin,
  metadata,
  postBoundary,
  receipts,
  savedDraft,
  supersession,
} from "./probes.js";
import "../../apps/storybook/src/styles.css";

const client = harness(),
  complete = harness(true);
const api = {
  client,
  complete,
  supersession: (kind: Parameters<typeof supersession>[1], throwing: boolean) =>
    supersession(client, kind, throwing),
  coalescing: () => coalescing(client),
  denial: (variant: Parameters<typeof denial>[1]) => denial(client, variant),
  metadata: (name: Parameters<typeof metadata>[1]) => metadata(client, name),
  foreignOwner: () => foreignOwner(client, complete),
  defaults: (server: boolean) => defaults(server ? complete : client),
  receipts: () => receipts(client),
  postBoundary: () => postBoundary(client),
  association: () => association(client),
  savedDraft: () => savedDraft(client),
  invalidationOrigin: () => invalidationOrigin(client),
};
declare global {
  interface Window {
    facadeBuilder: typeof api;
  }
}
window.facadeBuilder = api;
