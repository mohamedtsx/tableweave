import type * as headless from "@tableweave/react";
import type * as contracts from "@tableweave/react/contracts";
import type * as filters from "@tableweave/react/filters";

// Entries resolve to emitted declarations, but must not invent feature APIs.
type Empty<T> = keyof T extends never ? true : false;
export const entriesAreScaffolds: [
  Empty<typeof headless>,
  Empty<typeof contracts>,
  Empty<typeof filters>,
] = [true, true, true];

// @ts-expect-error Proposed schema APIs must not be faked by bootstrap.
import { defineQuerySchema } from "@tableweave/react/contracts";
// @ts-expect-error Internal source paths are not public exports.
import "@tableweave/react/src/contracts/index.js";

void defineQuerySchema;
