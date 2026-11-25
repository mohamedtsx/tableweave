// FINAL ONLY. Built output adapter, not an alternative application or fake SDK.
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
function requireFact(value, code) {
  if (!value) throw Error(code);
}
function builtFile(root, file, files) {
  requireFact(
    typeof file === "string" &&
      file.split("/").every((part) => part && part !== "." && part !== "..") &&
      !file.includes("\\") &&
      Object.hasOwn(files, file),
    "E_HOST_UNSELECTED_ASSET",
  );
  const target = path.join(root, file);
  requireFact(
    fs.realpathSync(target) === target && fs.statSync(target).isFile(),
    "E_HOST_LINK",
  );
  const bytes = fs.readFileSync(target),
    expected = files[file];
  requireFact(
    bytes.length === expected.size && sha(bytes) === expected.sha256,
    "E_HOST_BUILT_DRIFT",
  );
  return bytes;
}
export function toRequest(incoming, url, signal) {
  requireFact(
    url.origin === "http://127.0.0.1:6575" &&
      ["GET", "HEAD", "POST"].includes(incoming.method),
    "E_HOST_REQUEST",
  );
  const headers = new Headers();
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (Array.isArray(value))
      for (const item of value) headers.append(name, item);
    else if (value !== undefined) headers.set(name, value);
  }
  return new Request(url, {
    method: incoming.method,
    headers,
    signal,
    ...(!["GET", "HEAD"].includes(incoming.method)
      ? { body: Readable.toWeb(incoming), duplex: "half" }
      : {}),
  });
}
export async function serveBuilt() {
  requireFact(
    process.env.WP13_RUNTIME_FINAL === "1" &&
      process.env.WP13_HOST_FINAL === "1",
    "E_HOST_FINAL_REQUIRED",
  );
  const root = path.dirname(fileURLToPath(import.meta.url));
  const attempt = JSON.parse(
    fs.readFileSync(path.join(root, "wp13-runtime/attempt.json")),
  );
  requireFact(
    ["start", "vite-headless", "vite-styled"].includes(attempt.family),
    "E_HOST_FAMILY",
  );
  let entry;
  if (attempt.family === "start") {
    builtFile(root, "dist/server/server.js", attempt.buildFiles);
    entry = (
      await import(pathToFileURL(path.join(root, "dist/server/server.js")).href)
    ).default;
    requireFact(
      entry && typeof entry.fetch === "function",
      "E_START_PUBLIC_BUILT_FETCH_CONTRACT_REQUIRED",
    );
  }
  const server = createServer(async (incoming, outgoing) => {
    const abort = new AbortController();
    incoming.once("aborted", () => abort.abort());
    outgoing.once("close", () => {
      if (!outgoing.writableEnded) abort.abort();
    });
    try {
      requireFact(incoming.headers.host === "127.0.0.1:6575", "E_HOST_ORIGIN");
      const url = new URL(incoming.url ?? "/", "http://127.0.0.1:6575");
      requireFact(
        url.origin === "http://127.0.0.1:6575" &&
          ["GET", "HEAD", "POST"].includes(incoming.method),
        "E_HOST_REQUEST",
      );
      if (attempt.family !== "start") {
        requireFact(
          ["GET", "HEAD"].includes(incoming.method),
          "E_STATIC_METHOD",
        );
        const pathname = decodeURIComponent(url.pathname);
        const name =
          pathname === "/"
            ? attempt.family === "vite-headless"
              ? "headless.html"
              : "index.html"
            : pathname.slice(1);
        const file = `wp13-family-build/${name}`;
        requireFact(
          /\.(?:html|js|css|svg|png|woff2?)$/.test(name),
          "E_STATIC_ASSET_TYPE",
        );
        const bytes = builtFile(root, file, attempt.buildFiles);
        outgoing.writeHead(200, {
          "Content-Type": name.endsWith(".html")
            ? "text/html; charset=utf-8"
            : name.endsWith(".js")
              ? "text/javascript"
              : name.endsWith(".css")
                ? "text/css"
                : "application/octet-stream",
          "Cache-Control": "no-store",
        });
        outgoing.end(incoming.method === "HEAD" ? undefined : bytes);
        return;
      }
      // Same current public entry.fetch(Request) protocol as the read-only WP11
      // production-host pattern. No casts, private handler or source imports.
      const asset = url.pathname.replace(/^\/_build\//, "/");
      if (/^\/assets\/[A-Za-z0-9_.-]+\.(?:js|css|map|woff2?)$/.test(asset)) {
        const bytes = builtFile(
          root,
          `dist/client${asset}`,
          attempt.buildFiles,
        );
        outgoing.writeHead(200, {
          "Content-Type": asset.endsWith(".js")
            ? "text/javascript"
            : asset.endsWith(".css")
              ? "text/css"
              : "application/octet-stream",
        });
        outgoing.end(incoming.method === "HEAD" ? undefined : bytes);
        return;
      }
      const request = toRequest(incoming, url, abort.signal);
      const response = await entry.fetch(request);
      if (abort.signal.aborted) {
        await response.body?.cancel();
        return;
      }
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      if (!response.body) outgoing.end();
      else {
        const stream = Readable.fromWeb(response.body);
        outgoing.once("close", () => {
          if (!outgoing.writableEnded) stream.destroy();
        });
        stream.once("error", () => outgoing.destroy());
        stream.pipe(outgoing);
      }
    } catch {
      if (!outgoing.destroyed && !abort.signal.aborted) {
        if (!outgoing.headersSent)
          outgoing.writeHead(500, { "Cache-Control": "no-store" });
        outgoing.end("E_BUILT_HOST_REQUEST_FAILED");
      }
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(6575, "127.0.0.1", resolve);
  });
  const stop = () => {
    server.close();
    server.closeAllConnections();
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  process.stdout.write("WP13_BUILT_HOST_READY\n");
  return server;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  serveBuilt().catch(() => {
    process.stderr.write("E_BUILT_HOST_START_FAILED\n");
    process.exitCode = 1;
  });
