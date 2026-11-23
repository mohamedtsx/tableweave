import { readFile, realpath } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = await realpath("apps/storybook/storybook-static");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://localhost").pathname,
    );
    const path = await realpath(
      resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`),
    );
    if (!path.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const data = await readFile(path);
    response
      .writeHead(200, {
        "Content-Type": mime[extname(path)] ?? "application/octet-stream",
      })
      .end(data);
  } catch {
    response.writeHead(404).end();
  }
}).listen(6007, "127.0.0.1");
