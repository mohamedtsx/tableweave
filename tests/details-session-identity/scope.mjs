import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  readlink,
  writeFile,
} from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const own = "tests/details-session-identity/";
const hook = "packages/heroui/src/details/use-details-session.ts";
const identity = "packages/heroui/src/details/session-identity.ts";
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const encode = (value) => `${JSON.stringify(value, null, 2)}\n`;
export const aggregate = (value) => sha(encode(value));

async function inventory() {
  const entries = [];
  async function walk(relative) {
    for (const entry of await readdir(`${root}${relative}`, {
      withFileTypes: true,
    })) {
      if ([".git", "node_modules", ".repo"].includes(entry.name)) continue;
      const path = `${relative}${entry.name}`;
      if (`${path}/` === own) continue;
      if (entry.isDirectory()) await walk(`${path}/`);
      else {
        const info = await lstat(`${root}${path}`);
        const symbolic = info.isSymbolicLink();
        entries.push([
          path,
          {
            mode: info.mode & 0o777,
            kind: symbolic ? "symlink" : "file",
            sha256: sha(
              symbolic
                ? await readlink(`${root}${path}`)
                : await readFile(`${root}${path}`),
            ),
          },
        ]);
      }
    }
  }
  await walk("");
  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)));
}

const now = await inventory();
const baselineURL = new URL("protected-before.json", import.meta.url);
if (process.argv[2] === "snapshot") {
  // Exclusive creation prevents a changed checkout from blessing its own preimage.
  const protectedFiles = Object.fromEntries(
    Object.entries(now).filter(([path]) => path !== hook),
  );
  const sources = Object.fromEntries(
    Object.entries(protectedFiles).filter(([path]) =>
      /^packages\/(react|heroui)\/src\//.test(path),
    ),
  );
  await writeFile(baselineURL, encode(protectedFiles), { flag: "wx" });
  await writeFile(
    new URL("protected-sources-before.json", import.meta.url),
    encode(sources),
    {
      flag: "wx",
    },
  );
  const before = await readFile(`${root}${hook}`);
  await writeFile(
    new URL("original-hook.before.txt", import.meta.url),
    before,
    { flag: "wx" },
  );
  const summary = {
    base: "e8529b0 (main-supplied; no Git command executed)",
    hook,
    originalHookSha256: sha(before),
    protectedFileCount: Object.keys(protectedFiles).length,
    protectedFilesAggregate: aggregate(protectedFiles),
    protectedSourceCount: Object.keys(sources).length,
    protectedSourcesAggregate: aggregate(sources),
    exclusions: [".git", "node_modules", ".repo", own, hook],
  };
  await writeFile(new URL("baseline.json", import.meta.url), encode(summary), {
    flag: "wx",
  });
  process.stdout.write(encode(summary));
} else {
  const before = JSON.parse(await readFile(baselineURL, "utf8"));
  const changes = Object.entries(before)
    .filter(
      ([path, value]) => JSON.stringify(value) !== JSON.stringify(now[path]),
    )
    .map(([path]) => path);
  const extra = Object.keys(now).filter(
    (path) => !(path in before) && path !== hook && path !== identity,
  );
  const sources = Object.fromEntries(
    Object.entries(before).filter(([path]) =>
      /^packages\/(react|heroui)\/src\//.test(path),
    ),
  );
  const result = {
    protectedFileCount: Object.keys(before).length,
    protectedFilesAggregate: aggregate(before),
    protectedSourceCount: Object.keys(sources).length,
    protectedSourcesAggregate: aggregate(sources),
    changes,
    unexpectedFiles: extra,
  };
  await mkdir(new URL(".artifacts/", import.meta.url), { recursive: true });
  await writeFile(
    new URL(".artifacts/scope.json", import.meta.url),
    encode(result),
  );
  process.stdout.write(encode(result));
  if (changes.length || extra.length) process.exitCode = 1;
}
