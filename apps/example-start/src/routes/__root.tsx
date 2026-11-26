import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import type { AuthorizationSession } from "../rows/authorization-session";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  authorization: AuthorizationSession;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tableweave synthetic Start integration" },
    ],
  }),
  component: () => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <StrictMode>
          <Outlet />
        </StrictMode>
        <Scripts />
      </body>
    </html>
  ),
});
