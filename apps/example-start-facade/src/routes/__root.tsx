import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { StrictMode } from "react";
import type { BootstrapSession } from "../application/bootstrap-session.js";
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  session: BootstrapSession;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tableweave public synthetic Start facade" },
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
