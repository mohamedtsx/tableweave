import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
} from "node:fs";
import { join, parse, resolve } from "node:path";

export const ownedRoot =
  "/mnt/data/Projects/tableweave-final-verification-cand001/wp13-run-cand001/storybook-ready";
export const browserExecutable =
  "/home/mohamed/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell";
const browserHash =
  "24eb0a14de64ab0c9c2e283a5512ca817db64af8fd853cdb4d818f19a8e23b9b";

/** Reject symlinks in every existing directory component, not just the leaf. */
export function assertDirectoryChain(directory) {
  if (resolve(directory) !== directory)
    throw new Error("Noncanonical directory");
  let current = parse(directory).root;
  for (const part of directory
    .slice(current.length)
    .split("/")
    .filter(Boolean)) {
    current = join(current, part);
    const info = lstatSync(current);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new Error(`Not a real directory: ${current}`);
    }
  }
  if (realpathSync(directory) !== directory) {
    throw new Error("Directory realpath mismatch");
  }
  return directory;
}

export function checkedBuildDirectory(value) {
  if (
    typeof value !== "string" ||
    !/^build-(?!000)[0-9]{3}\/static$/.test(
      value.slice(ownedRoot.length + 1),
    ) ||
    !value.startsWith(`${ownedRoot}/`)
  ) {
    throw new Error(
      "TABLEWEAVE_STORYBOOK_BUILD_DIR must be OWN/build-NNN/static",
    );
  }
  assertDirectoryChain(value);
  for (const name of ["index.html", "iframe.html", "index.json"]) {
    const file = join(value, name);
    const info = lstatSync(file);
    if (info.isSymbolicLink() || !info.isFile()) {
      throw new Error(`Missing regular static entry: ${name}`);
    }
  }
  return value;
}

export function checkedRunDirectory(label) {
  if (typeof label !== "string" || !/^[a-z0-9][a-z0-9-]{0,31}$/.test(label)) {
    throw new Error(
      "TABLEWEAVE_STORYBOOK_RUN requires a fresh bounded run label",
    );
  }
  assertDirectoryChain(ownedRoot);
  return join(ownedRoot, `browser-${label}`);
}

/** Called only by the selected runner; Playwright reloads config in its worker. */
export function reserveRunDirectory(directory) {
  if (process.env.TEST_WORKER_INDEX === undefined) {
    // Exclusive creation BEFORE Playwright can clear its results directory.
    // Even --list consumes a fresh label; never reuse old evidence directories.
    mkdirSync(directory, { mode: 0o700 });
  } else if (!/^[0-9]+$/.test(process.env.TEST_WORKER_INDEX)) {
    throw new Error("Invalid Playwright worker identity");
  }
  assertDirectoryChain(directory);
}

export function verifyBrowser() {
  assertDirectoryChain(parse(browserExecutable).dir);
  const before = lstatSync(browserExecutable);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    (before.mode & 0o7777) !== 0o755 ||
    before.size !== 216255824 ||
    realpathSync(browserExecutable) !== browserExecutable
  ) {
    throw new Error("Pinned headless-shell metadata mismatch; no fallback");
  }
  const descriptor = openSync(
    browserExecutable,
    constants.O_RDONLY | constants.O_NOFOLLOW,
  );
  try {
    const opened = fstatSync(descriptor);
    if (opened.ino !== before.ino || opened.dev !== before.dev) {
      throw new Error("Pinned browser changed during inspection");
    }
    const hash = createHash("sha256");
    const buffer = Buffer.alloc(1024 * 1024);
    let count = readSync(descriptor, buffer, 0, buffer.length, null);
    while (count > 0) {
      hash.update(buffer.subarray(0, count));
      count = readSync(descriptor, buffer, 0, buffer.length, null);
    }
    if (hash.digest("hex") !== browserHash) {
      throw new Error("Pinned browser SHA256 mismatch; no fallback");
    }
  } finally {
    closeSync(descriptor);
  }
  return browserExecutable;
}
