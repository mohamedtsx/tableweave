import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import entry from "./dist/server/server.js";

// Local production-artifact acceptance host, not deployment infrastructure.
// Explicit response-close cancellation reaches the actual Start fetch handler.
const client = new URL("./dist/client/", import.meta.url);
const server = createServer(async (incoming, outgoing) => {
  const abort = new AbortController();
  outgoing.once("close", () => {
    if (!outgoing.writableEnded) abort.abort();
  });
  const origin = `http://127.0.0.1:${process.env.PORT ?? "6013"}`;
  const url = new URL(incoming.url ?? "/", origin);
  try {
    if (/^\/assets\/[a-zA-Z0-9_.-]+$/.test(url.pathname)) {
      const bytes = await readFile(
        fileURLToPath(new URL(url.pathname.slice(1), client)),
      );
      outgoing.writeHead(200, {
        "Content-Type": url.pathname.endsWith(".js")
          ? "text/javascript"
          : "text/css",
      });
      outgoing.end(bytes);
      return;
    }
    if (url.pathname === "/favicon.ico") {
      outgoing.writeHead(204);
      outgoing.end();
      return;
    }
    const headers = new Headers();
    for (const [name, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value))
        for (const item of value) headers.append(name, item);
      else if (value !== undefined) headers.set(name, value);
    }
    const request = new Request(url, {
      method: incoming.method,
      headers,
      signal: abort.signal,
      ...(incoming.method !== "GET" && incoming.method !== "HEAD"
        ? { body: Readable.toWeb(incoming), duplex: "half" }
        : {}),
    });
    const response = await entry.fetch(request);
    if (abort.signal.aborted) return;
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      const stream = Readable.fromWeb(response.body);
      stream.on("error", () => outgoing.destroy());
      stream.pipe(outgoing);
    } else outgoing.end();
  } catch {
    if (abort.signal.aborted || outgoing.destroyed) return;
    if (!outgoing.headersSent)
      outgoing.writeHead(500, {
        "Content-Type": "text/plain",
        "Cache-Control": "private, no-store",
      });
    outgoing.end("Synthetic application request failed.");
  }
});
server.listen(Number(process.env.PORT ?? 6013), "127.0.0.1");
