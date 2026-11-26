import { spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { archiveRoot, confinedRequire } from "./archive-stage.mjs";
import { own } from "./public-roots.mjs";

const root = archiveRoot();
const declared = confinedRequire(root);
const cli = realpathSync(
  join(dirname(declared("vite/package.json")), "bin/vite.js"),
);
if (!cli.startsWith(`${root}${sep}`))
  throw new Error(
    "Archive Vite runtime must be installed inside the staged consumer",
  );
const result = spawnSync(
  process.execPath,
  [
    cli,
    "--config",
    join(own, "archive.vite.config.ts"),
    "--host",
    "127.0.0.1",
    "--port",
    "6483",
    "--strictPort",
  ],
  { cwd: root, stdio: "inherit", env: process.env },
);
process.exit(result.status ?? 1);
