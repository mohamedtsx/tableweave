import { createFileRoute } from "@tanstack/react-router";
import {
  bootstrapReader,
  privateResponse,
  readRows,
  statsReader,
  validateRead,
} from "../rows/reader.server";

export const Route = createFileRoute("/api/probe")({
  server: {
    handlers: {
      GET: () => {
        privateResponse();
        const outcome = bootstrapReader();
        if (outcome.kind === "access-lost")
          return Response.json(
            { code: "request-rejected" },
            { status: 403, headers: { "Cache-Control": "private, no-store" } },
          );
        return Response.json(
          { bootstrap: outcome.bootstrap, stats: statsReader() },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (origin && origin !== new URL(request.url).origin)
          return new Response("Request rejected.", { status: 403 });
        try {
          const input = validateRead(await request.json());
          const outcome = await readRows(input, request.signal);
          if (outcome.kind === "access-lost")
            return Response.json(
              { code: "request-rejected" },
              {
                status: 400,
                headers: { "Cache-Control": "private, no-store" },
              },
            );
          return Response.json(outcome.result, {
            headers: { "Cache-Control": "private, no-store" },
          });
        } catch {
          return Response.json(
            { code: "request-rejected" },
            { status: 400, headers: { "Cache-Control": "private, no-store" } },
          );
        }
      },
    },
  },
});
