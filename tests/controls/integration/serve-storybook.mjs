import { createReadStream, existsSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { workspace } from "./public-roots.mjs";

// Read-only main-produced build. This script never builds a package or Storybook.
const directory = realpathSync(
  process.env.CONTROLS_STORYBOOK_DIR ??
    join(workspace, "apps/storybook/storybook-static"),
);
if (!existsSync(join(directory, "index.json")))
  throw new Error("A real indexed Storybook build is required");
const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url ?? "/", "http://127.0.0.1").pathname,
    );
    const file = realpathSync(
      resolve(directory, `.${pathname === "/" ? "/index.html" : pathname}`),
    );
    if (!file.startsWith(`${directory}${sep}`) || !statSync(file).isFile())
      throw new Error("Not a build file");
    response.setHeader(
      "Content-Type",
      types[extname(file)] ?? "application/octet-stream",
    );
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}).listen(6483, "127.0.0.1");
