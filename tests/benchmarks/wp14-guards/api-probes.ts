/** SOURCE-only uninvoked probe of actual pinned public cleanup contracts. */
import type { BrowserContext, CDPSession, Page } from "@playwright/test";
import type { Server } from "node:http";
export function sourceEndProbe(page: Page) {
  return page.evaluate(() => window.wp14?.end());
}
export function contextCloseProbe(context: BrowserContext) {
  const own = context.browser();
  return {
    contextClose: () => context.close(),
    ownedBrowserClose: () => own?.close(),
  };
}
export function traceCloseProbe(cdp: CDPSession) {
  return {
    end: () => cdp.send("Tracing.end"),
    detach: () => cdp.detach(),
    complete: (done: () => void) => cdp.once("Tracing.tracingComplete", done),
  };
}
export function serverCloseProbe(server: Server) {
  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    idle: () => server.closeIdleConnections(),
    ownedConnections: () => server.closeAllConnections(),
  };
}
