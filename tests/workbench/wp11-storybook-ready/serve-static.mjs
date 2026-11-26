import { constants } from "node:fs";
import { lstat, open } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { checkedBuildDirectory } from "./paths.mjs";

const args = process.argv.slice(2);
if (
  args.length !== 4 ||
  args[0] !== "--dir" ||
  args[2] !== "--port" ||
  args[3] !== "6570"
) {
  throw new Error(
    "Usage: serve-static.mjs --dir OWN/build-NNN/static --port 6570",
  );
}
const directory = checkedBuildDirectory(args[1]);
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".wasm", "application/wasm"],
]);

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  let pathname;
  try {
    // Inspect BEFORE URL normalization could erase a traversal segment.
    pathname = decodeURIComponent((request.url ?? "").split("?", 1)[0]);
  } catch {
    response.writeHead(400).end();
    return;
  }
  const parts = pathname.split("/").filter(Boolean);
  if (
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    [...pathname].some(
      (character) =>
        character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
    ) ||
    parts.some((part) => part.startsWith("."))
  ) {
    response.writeHead(403).end();
    return;
  }
  if (parts.length === 0) parts.push("index.html");
  let handle;
  try {
    // Recheck root and every request component; never serve file/directory symlinks.
    checkedBuildDirectory(directory);
    let file = directory;
    for (const [index, part] of parts.entries()) {
      file = join(file, part);
      const info = await lstat(file);
      if (
        info.isSymbolicLink() ||
        (index < parts.length - 1 ? !info.isDirectory() : !info.isFile())
      ) {
        response.writeHead(403).end();
        return;
      }
    }
    handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    const info = await handle.stat();
    if (!info.isFile()) {
      response.writeHead(403).end();
      await handle.close();
      return;
    }
    response.writeHead(200, {
      "Content-Type": types.get(extname(file)) ?? "application/octet-stream",
      "Content-Length": info.size,
    });
    if (request.method === "HEAD") {
      await handle.close();
      response.end();
    } else {
      await pipeline(handle.createReadStream(), response);
    }
  } catch (error) {
    if (handle) await handle.close();
    if (!response.headersSent) {
      const code =
        error && typeof error === "object" && "code" in error ? error.code : "";
      response
        .writeHead(code === "ENOENT" || code === "ENOTDIR" ? 404 : 500)
        .end();
    } else {
      response.destroy();
    }
  }
});
server.on("error", (error) => {
  console.error("Static Storybook server failed:", error.message);
  process.exitCode = 1;
});
server.listen(6570, "127.0.0.1", () => {
  console.log(`Static Storybook: http://127.0.0.1:6570 (${directory})`);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close((error) => {
      if (error) {
        console.error("Static Storybook close failed:", error.message);
        process.exitCode = 1;
      }
    });
    server.closeIdleConnections();
  });
}
