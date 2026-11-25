import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export function demand(value, code) {
  if (!value) throw new Error(code);
}
export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export function object(value) {
  demand(
    value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
    "E_OBJECT",
  );
  demand(
    !Object.keys(value).some((key) =>
      ["__proto__", "prototype", "constructor"].includes(key),
    ),
    "E_OBJECT_KEY",
  );
  demand(
    Reflect.ownKeys(value).every(
      (key) =>
        typeof key === "string" &&
        Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value"),
    ),
    "E_OBJECT_ACCESSOR",
  );
  return value;
}
export function present(file) {
  try {
    fs.lstatSync(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
export function relative(value) {
  demand(
    typeof value === "string" &&
      value.length > 0 &&
      !value.includes("\\") &&
      [...value].every((character) => character.charCodeAt(0) >= 32) &&
      !value.startsWith("/") &&
      !value.includes(":"),
    "E_PATH",
  );
  demand(
    value.split("/").every((part) => part && part !== "." && part !== ".."),
    "E_PATH_SEGMENT",
  );
  demand(
    !value.split("/").includes(".repo"),
    "E_READ_ONLY_REFERENCE_OUTSIDE_LEASE",
  );
  demand(
    !value
      .split("/")
      .some((part) =>
        /^\.env(?:\.|$)|\.(?:pem|key)$|^(?:credentials|id_rsa)$/.test(part),
      ),
    "E_CREDENTIAL_SHAPED_PATH",
  );
  return value;
}
export function directory(root) {
  demand(path.isAbsolute(root) && path.resolve(root) === root, "E_ROOT");
  let cursor = path.parse(root).root;
  for (const part of root.slice(cursor.length).split("/").filter(Boolean)) {
    cursor = path.join(cursor, part);
    const s = fs.lstatSync(cursor);
    demand(s.isDirectory() && !s.isSymbolicLink(), "E_DIRECTORY_LINK");
  }
  demand(fs.realpathSync(root) === root, "E_ROOT_REALPATH");
  return root;
}
export function regular(root, name) {
  directory(root);
  relative(name);
  const parts = name.split("/");
  let cursor = root;
  for (const part of parts.slice(0, -1)) {
    cursor = path.join(cursor, part);
    directory(cursor);
  }
  const file = path.join(root, name),
    s = fs.lstatSync(file);
  demand(s.isFile() && !s.isSymbolicLink(), "E_REGULAR");
  const fd = fs.openSync(file, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const before = fs.fstatSync(fd);
    demand(
      before.isFile() && before.ino === s.ino && before.dev === s.dev,
      "E_REPLACED_FILE",
    );
    const bytes = fs.readFileSync(fd),
      after = fs.fstatSync(fd);
    demand(
      before.size === bytes.length &&
        before.size === after.size &&
        before.mtimeMs === after.mtimeMs,
      "E_CHANGED_FILE",
    );
    return bytes;
  } finally {
    fs.closeSync(fd);
  }
}
export function json(root, file) {
  return object(JSON.parse(regular(root, file).toString("utf8")));
}
export function capacity(root) {
  const stat = fs.statfsSync(root);
  demand(
    stat.bavail * stat.bsize >= 128 * 1024 * 1024,
    "E_CAPACITY_NO_CLEANUP_AUTHORITY",
  );
}
export function mkdir(root, name) {
  directory(root);
  relative(name);
  capacity(root);
  let cursor = root;
  for (const part of name.split("/")) {
    cursor = path.join(cursor, part);
    if (!fs.existsSync(cursor)) fs.mkdirSync(cursor);
    directory(cursor);
  }
  return cursor;
}
export function write(root, name, bytes) {
  directory(root);
  relative(name);
  capacity(root);
  const parent = path.posix.dirname(name);
  if (parent !== ".") mkdir(root, parent);
  const file = path.join(root, name);
  const fd = fs.openSync(
    file,
    fs.constants.O_WRONLY |
      fs.constants.O_CREAT |
      fs.constants.O_EXCL |
      fs.constants.O_NOFOLLOW,
    0o600,
  );
  try {
    fs.writeFileSync(fd, bytes);
  } finally {
    fs.closeSync(fd);
  }
  return file;
}
export function record(root, name, value) {
  return write(root, name, `${JSON.stringify(value, null, 2)}\n`);
}
export function fileRecord(root, file) {
  const bytes = regular(root, file),
    s = fs.lstatSync(path.join(root, file));
  return { mode: s.mode & 0o777, size: bytes.length, sha256: digest(bytes) };
}
export function tree(root) {
  directory(root);
  const result = {};
  function visit(prefix) {
    for (const item of fs.readdirSync(path.join(root, prefix), {
      withFileTypes: true,
    })) {
      const file = prefix ? `${prefix}/${item.name}` : item.name;
      relative(file);
      if (item.isDirectory()) visit(file);
      else {
        demand(item.isFile() && !item.isSymbolicLink(), "E_TREE_LINK");
        result[file] = fileRecord(root, file);
      }
    }
  }
  visit("");
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b)),
  );
}
export function verifyMap(root, map) {
  object(map);
  demand(Object.keys(map).length > 0, "E_EMPTY_MAP");
  for (const [file, expected] of Object.entries(map)) {
    relative(file);
    object(expected);
    const actual = fileRecord(root, file);
    demand(
      actual.mode === expected.mode &&
        actual.size === expected.size &&
        actual.sha256 === expected.sha256,
      "E_INPUT_DRIFT",
    );
  }
}
export function receipt(ctx, name) {
  const approved = object(ctx.approval.receipts);
  demand(
    Object.hasOwn(approved, name) && /^[a-z][a-z0-9-]*\.json$/.test(name),
    "E_UNAPPROVED_RECEIPT",
  );
  const bytes = regular(ctx.run, name);
  demand(digest(bytes) === approved[name], "E_RECEIPT_HASH");
  return object(JSON.parse(bytes.toString("utf8")));
}
export function familyInput(ctx, file) {
  demand(
    file === "tsconfig.base.json" ||
      file === "apps/storybook/package.json" ||
      /^apps\/(?:example-next|example-start-facade|examples\/(?:vite|shared|recipes))\//.test(
        file,
      ),
    "E_FAMILY_SOURCE_PATH",
  );
  const selected = object(object(ctx.approval.familyInputs)[ctx.family]);
  demand(Object.hasOwn(selected, file), "E_FAMILY_SOURCE_NOT_SELECTED");
  const actual = fileRecord(ctx.producer, file),
    expected = object(selected[file]);
  demand(
    actual.sha256 === expected.sha256 &&
      actual.size === expected.size &&
      actual.mode === expected.mode,
    "E_FAMILY_SOURCE_DRIFT",
  );
  return regular(ctx.producer, file);
}
export function familyConfig(ctx, text) {
  demand(
    object(ctx.approval.familyConfigSHA256)[ctx.family] === digest(text),
    "E_HOLD_FAMILY_CONFIG_REVIEW",
  );
  return text;
}
export function familyManifest(ctx, file, selectedNames) {
  const manifest = object(JSON.parse(familyInput(ctx, file).toString("utf8")));
  const supplied = object(object(ctx.request.consumers)[ctx.key]).package;
  const actual = { ...manifest.dependencies, ...manifest.devDependencies };
  for (const name of selectedNames ?? Object.keys(manifest.dependencies)) {
    if (name.startsWith("@tableweave/")) continue;
    demand(
      (supplied.dependencies?.[name] ?? supplied.devDependencies?.[name]) ===
        actual[name],
      "E_DECLARING_APP_DEPENDENCY_SELECTION",
    );
  }
}
