import { renderToString } from "react-dom/server";
import { expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { createRecipeOwner } from "../../../apps/example-start/src/recipes/wp11/table-owner.js";
import { TableRecipe } from "../../../apps/example-start/src/recipes/wp11/TableRecipe.js";
import { HeadlessExample } from "../../../apps/examples/vite/headless.js";
import { transactions } from "../../../apps/examples/shared/records.js";
import {
  createQuery,
  parseQuery,
  canonicalJson,
} from "@tableweave/react/contracts";
import {
  transactionSchema,
  exampleOperators,
} from "../../../apps/examples/shared/schemas.js";
it("headless SSR stays neutral before actual DOM commit", () => {
  const html = renderToString(<HeadlessExample />);
  expect(html).toContain("Unstyled headless example");
  expect(html).not.toContain("Transfer note 01");
  expect(html).not.toContain('scope="row"');
  expect(html).not.toContain("stylesheet");
});
it("wire query and synthetic records cross JSON without native models or access grants", () => {
  const query = createQuery(transactionSchema, {
    locale: "en-US",
    timeZone: "UTC",
  });
  const serialized = JSON.stringify({ query, records: transactions });
  const parsed = JSON.parse(serialized);
  expect(
    canonicalJson(
      parseQuery(transactionSchema, parsed.query, {
        registry: exampleOperators,
      }),
    ),
  ).toBe(canonicalJson(query));
  expect(parsed.records[0]).toMatchObject({
    id: "tx-001",
    amount: 0,
    reference: null,
  });
  expect(serialized).not.toContain("publication");
});
it("unmounted Start recipe is neutral; same-owner preload/connect reuse fresh Query data", async () => {
  const queryClient = new QueryClient(),
    otherClient = new QueryClient();
  let reads = 0;
  const owner = createRecipeOwner({
    queryClient,
    namespace: "request-a",
    context: {
      definitionKey: "example-transactions",
      scopeKey: "scope-a",
      access: true,
    },
    read: async (_input, signal) => {
      signal.throwIfAborted();
      reads++;
      return {
        source: "fresh",
        records: transactions.slice(0, 10),
        page: { kind: "known", total: transactions.length },
        emptyKind: "dataset",
        receivedAt: "2026-11-25T12:00:00Z",
      };
    },
  });
  await owner.preload();
  const html = renderToString(<TableRecipe owner={owner} />);
  expect(html).not.toContain("Transfer note 01");
  expect(otherClient.getQueryCache().getAll()).toHaveLength(0);
  const stop = owner.connect();
  try {
    await expect
      .poll(() => owner.resource.getSnapshot().snapshot?.records.length)
      .toBe(10);
    expect(reads).toBe(1);
  } finally {
    stop();
    owner.dispose();
    queryClient.clear();
    otherClient.clear();
  }
});
