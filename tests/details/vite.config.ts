import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { defineConfig } from "vite";

const vendor = createRequire(
  new URL("../../packages/heroui/package.json", import.meta.url),
);
const tailwind = (
  await import(
    /* @vite-ignore */
    vendor.resolve("@tailwindcss/vite", {
      paths: ["/home/mohamed/Desktop/tableweave/apps/storybook"],
    })
  )
).default;

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  cacheDir: fileURLToPath(new URL("./.artifacts/vite", import.meta.url)),
  plugins: [
    tailwind(),
    {
      name: "details-source-ssr-fixture",
      configureServer(server) {
        server.middlewares.use("/ssr.html", async (_req, res, next) => {
          try {
            // Real Node/React DOM SSR. Avoid Vite runner's CJS React alias evaluation;
            // source-only transpilation happens in an isolated child, never vendors.
            const { stdout: body } = await promisify(execFile)(
              process.execPath,
              [fileURLToPath(new URL("./render-ssr.mjs", import.meta.url))],
            );
            const html = await server.transformIndexHtml(
              "/ssr.html",
              `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root">${body}</div><script type="module" src="/hydrate.tsx"></script></body></html>`,
            );
            res.setHeader("Content-Type", "text/html");
            res.end(html);
          } catch (error) {
            next(error);
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      react: dirname(vendor.resolve("react/package.json")),
      "react-dom": dirname(vendor.resolve("react-dom/package.json")),
      "@heroui/react/button": vendor.resolve("@heroui/react/button"),
      "@heroui/react/drawer": vendor.resolve("@heroui/react/drawer"),
      "@heroui/react/popover": vendor.resolve("@heroui/react/popover"),
      "@tableweave/react/contracts": fileURLToPath(
        new URL("../../packages/react/src/contracts/index.ts", import.meta.url),
      ),
      "@tableweave/react": fileURLToPath(
        new URL("../../packages/react/src/index.ts", import.meta.url),
      ),
      "@heroui/styles": dirname(vendor.resolve("@heroui/styles/package.json")),
    },
    dedupe: ["react", "react-dom"],
  },
  server: {
    fs: {
      allow: [
        "/tmp/opencode/tableweave-wp09",
        "/home/mohamed/Desktop/tableweave",
      ],
    },
  },
});
