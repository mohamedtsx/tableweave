import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

// Read-only real main-built assets, never a Storybook/package build command.
const supplied = process.env.FILTER_CONTROLS_STORYBOOK_DIR;
if (!supplied)
  throw new Error(
    "Main must supply FILTER_CONTROLS_STORYBOOK_DIR after its actual Storybook build",
  );
const root = realpathSync(resolve(supplied));
if (!existsSync(resolve(root, "index.json")))
  throw new Error("A real indexed Storybook build is required");
const mime = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://127.0.0.1").pathname,
    );
    const path = realpathSync(
      resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`),
    );
    if (!path.startsWith(`${root}${sep}`) || !statSync(path).isFile())
      throw new Error("Not a built asset");
    response.setHeader(
      "Content-Type",
      mime[extname(path)] ?? "application/octet-stream",
    );
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(6499, "127.0.0.1");
