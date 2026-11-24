import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

const privateResponses = createMiddleware({ type: "request" }).server(
  async ({ next }) => {
    // Establish policy before validation/CSRF; also cover their early Responses.
    setResponseHeader("Cache-Control", "private, no-store");
    const result = await next();
    result.response.headers.set("Cache-Control", "private, no-store");
    return result;
  },
);

export const startInstance = createStart(() => ({
  requestMiddleware: [
    privateResponses,
    createCsrfMiddleware({
      filter: (context) => context.handlerType === "serverFn",
    }),
  ],
}));
