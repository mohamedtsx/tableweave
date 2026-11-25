// FINAL ONLY. Real built Start fetch handler; never invoked by LIGHT.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import entry from "../../../apps/example-start-facade/dist/server/server.js";
const assets = new URL(
  "../../../apps/example-start-facade/dist/client/",
  import.meta.url,
);
const server = createServer(async (incoming, outgoing) => {
  const controller = new AbortController();
  outgoing.once("close", () => {
    if (!outgoing.writableEnded) controller.abort();
  });
  const url = new URL(incoming.url ?? "/", "http://127.0.0.1:6573");
  try {
    const asset = url.pathname.replace(/^\/_build\//, "/");
    if (/^\/assets\/[A-Za-z0-9_.-]+\.(?:js|css|map|woff2?)$/.test(asset)) {
      const bytes = await readFile(
        fileURLToPath(new URL(asset.slice(1), assets)),
      );
      outgoing.writeHead(200, {
        "Content-Type": asset.endsWith(".js")
          ? "text/javascript"
          : asset.endsWith(".css")
            ? "text/css"
            : "application/octet-stream",
      });
      outgoing.end(bytes);
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
      signal: controller.signal,
      ...(!["GET", "HEAD"].includes(incoming.method ?? "GET")
        ? { body: Readable.toWeb(incoming), duplex: "half" }
        : {}),
    });
    const response = await entry.fetch(request);
    if (controller.signal.aborted) {
      await response.body?.cancel();
      return;
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    if (!response.body) outgoing.end();
    else {
      const body = Readable.fromWeb(response.body);
      body.on("error", () => outgoing.destroy());
      body.pipe(outgoing);
    }
  } catch {
    if (!outgoing.destroyed && !controller.signal.aborted) {
      if (!outgoing.headersSent)
        outgoing.writeHead(500, { "Cache-Control": "private, no-store" });
      outgoing.end("Synthetic request unavailable.");
    }
  }
});
server.listen(6573, "127.0.0.1");
