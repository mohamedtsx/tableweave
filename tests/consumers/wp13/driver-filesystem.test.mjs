import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";
import { gzipSync } from "node:zlib";
import {
  external,
  local,
  noProjectAncestors,
  safeId,
  approvedInput,
} from "./lib/boundary.mjs";
import {
  capacity,
  fileRecord,
  object,
  relative,
  regular,
  verifyMap,
  write,
} from "./lib/receipts.mjs";
import { parseArchive, packageArchive } from "./lib/archive.mjs";
import { validateLedger, diagnostics } from "./lib/types.mjs";
import { main } from "./cli.mjs";

if (process.env.WP13_FINAL !== "1")
  throw new Error("FINAL-ONLY adversaries; not a LIGHT/unit pass");
// ALL constructed markers/packages below are explicitly adversarial filesystem
// data, NOT a positive producer, application grant, tarball consumer or CI result.
function fixture() {
  capacity("/tmp/opencode");
  return fs.mkdtempSync("/tmp/opencode/wp13-adversary-");
}
function tar(items) {
  const chunks = [];
  for (const item of items) {
    const bytes = Buffer.from(item.bytes ?? "{}"),
      header = Buffer.alloc(512);
    header.write(item.name);
    header.write(`${(item.mode ?? 0o644).toString(8).padStart(7, "0")}\0`, 100);
    for (const offset of [108, 116]) header.write("0000000\0", offset);
    header.write(`${bytes.length.toString(8).padStart(11, "0")}\0`, 124);
    header.write("00000000000\0", 136);
    header.fill(32, 148, 156);
    header[156] = (item.type ?? "0").charCodeAt(0);
    header.write("ustar\0", 257);
    header.write("00", 263);
    const sum = header.reduce((a, b) => a + b, 0);
    header.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
    chunks.push(
      header,
      bytes,
      Buffer.alloc((512 - (bytes.length % 512)) % 512),
    );
  }
  return Buffer.concat([...chunks, Buffer.alloc(1024)]);
}
const member = { name: "package/package.json", bytes: '{"adversary":true}' };

test("path grammar rejects traversal, absolute, credential and separator paths", () => {
  for (const value of [
    "../secret",
    "/tmp/secret",
    "a/../x",
    "a//b",
    "a\\b",
    "a/.env",
    "a/x.key",
    "a\0b",
  ])
    assert.throws(() => relative(value));
  for (const value of ["--generation", "../fc01", ""])
    assert.throws(() => safeId(value));
});
test("worktree and symlink targets are refused without modifying the sentinel", () => {
  const root = fixture();
  write(root, ".git", "gitdir: /adversarial/not-a-real-worktree\n");
  assert.throws(() => external(root), /E_WORKTREE_TARGET/);
  const link = `${root}-link`;
  fs.symlinkSync(root, link, "dir");
  assert.throws(() => external(link));
  assert.throws(() => external(link, true));
  assert.equal(
    regular(root, ".git").toString(),
    "gitdir: /adversarial/not-a-real-worktree\n",
  );
});
test("dangling symlinks and existing targets are not fresh", () => {
  const root = fixture(),
    link = `${root}-dangling`;
  fs.symlinkSync(`${root}/missing`, link, "dir");
  assert.throws(() => external(link, true));
  assert.throws(() => external(root, true));
});
test("real owned ancestor markers are rejected without touching shared parent config", () => {
  const root = fixture();
  write(root, "package.json", "{}\n");
  assert.throws(() => noProjectAncestors([root]), /E_ANCESTOR_PROJECT_CONFIG/);
  const child = path.join(root, "child");
  fs.mkdirSync(child);
  assert.throws(() => external(child, true), /E_EXTERNAL_TARGET/);
});
test("local compiler/runtime symlink cannot borrow a sibling installation", () => {
  const root = fixture(),
    borrowed = fixture();
  write(borrowed, "compiler.js", "// adversary\n");
  fs.mkdirSync(path.join(root, "node_modules"));
  fs.symlinkSync(borrowed, path.join(root, "node_modules/borrowed"), "dir");
  assert.throws(
    () => local(root, "node_modules/borrowed/compiler.js"),
    /E_BORROWED_RESOLUTION/,
  );
});
test("regular no-follow reads and exclusive writes reject substituted paths/overwrites", () => {
  const root = fixture();
  write(root, "sentinel", "original");
  assert.throws(() => write(root, "sentinel", "changed"));
  fs.symlinkSync("sentinel", path.join(root, "alias"));
  assert.throws(() => regular(root, "alias"));
  assert.equal(regular(root, "sentinel").toString(), "original");
});
test("empty evidence and shared-profile hardlink mutation cannot pass byte verification", () => {
  const root = fixture(),
    other = fixture();
  write(root, "vendor.js", "before");
  const map = { "vendor.js": fileRecord(root, "vendor.js") };
  assert.throws(() => verifyMap(root, {}), /E_EMPTY_MAP/);
  fs.linkSync(path.join(root, "vendor.js"), path.join(other, "vendor.js"));
  fs.writeFileSync(path.join(other, "vendor.js"), "after");
  assert.throws(() => verifyMap(root, map), /E_INPUT_DRIFT/);
});
test("replaced configuration/owner markers and archive hash poison remain failures", () => {
  const root = fixture();
  write(root, "owner.json", '{"run":"adversary-only"}\n');
  write(root, "pnpm-workspace.yaml", "packages: []\n");
  write(root, ".npmrc", "ignore-scripts=true\n");
  const map = Object.fromEntries(
    ["owner.json", "pnpm-workspace.yaml", ".npmrc"].map((file) => [
      file,
      fileRecord(root, file),
    ]),
  );
  fs.writeFileSync(path.join(root, ".npmrc"), "ignore-scripts=false\n");
  assert.throws(() => verifyMap(root, map), /E_INPUT_DRIFT/);
  write(root, "archive.tgz", "explicitly-not-an-archive");
  assert.throws(
    () =>
      approvedInput(root, "archive.tgz", { size: 24, sha256: "0".repeat(64) }),
    /E_SELECTED_INPUT_BYTES/,
  );
});
test("JSON prototype/accessor metadata is not an approval substitute", () => {
  assert.throws(() => object(JSON.parse('{"__proto__":true}')));
  const hostile = {};
  Object.defineProperty(hostile, "value", {
    enumerable: true,
    get() {
      throw Error("must not read");
    },
  });
  assert.throws(() => object(hostile), /E_OBJECT_ACCESSOR/);
});
test("tiny parser vector is not a packed producer; footer/truncation/checksum corruption fails", () => {
  const raw = tar([member]);
  assert.equal(parseArchive(gzipSync(raw)).size, 1);
  const bad = Buffer.from(raw);
  bad[0] ^= 1;
  assert.throws(() => parseArchive(gzipSync(bad)), /E_TAR_CHECKSUM/);
  assert.throws(
    () => parseArchive(gzipSync(raw.subarray(0, 512))),
    /E_TAR_TRUNCATION_PADDING|E_TAR_INCOMPLETE/,
  );
  assert.throws(
    () => parseArchive(gzipSync(raw.subarray(0, raw.length - 512))),
    /E_TAR_FOOTER/,
  );
  assert.throws(() => parseArchive(Buffer.from("not gzip")));
});
test("unsafe tar names, duplicate and file/parent collisions are denied before extraction", () => {
  for (const name of [
    "package/../escape",
    "/absolute",
    "package\\escape",
    "package//x",
    "package/./x",
  ])
    assert.throws(() => parseArchive(gzipSync(tar([member, { name }]))));
  assert.throws(
    () => parseArchive(gzipSync(tar([member, member]))),
    /E_TAR_DUPLICATE/,
  );
  assert.throws(
    () =>
      parseArchive(
        gzipSync(
          tar([
            member,
            { name: "package/leaf" },
            { name: "package/leaf/child" },
          ]),
        ),
      ),
    /E_TAR_PARENT_COLLISION/,
  );
});
test("links/devices/PAX and unsafe archive modes do not use a tar extraction fallback", () => {
  for (const type of ["1", "2", "3", "4", "6", "x", "g", "L"])
    assert.throws(() =>
      parseArchive(gzipSync(tar([member, { name: "package/hostile", type }]))),
    );
  assert.throws(
    () => parseArchive(gzipSync(tar([{ ...member, mode: 0o4644 }]))),
    /E_TAR_MODE/,
  );
});
test("missing/empty exports and misleading package identity cannot become real archive evidence", () => {
  assert.throws(
    () => packageArchive(gzipSync(tar([member])), "@tableweave/react"),
    /E_ARCHIVE_MANIFEST/,
  );
  const manifest = {
    name: "@tableweave/react",
    private: true,
    type: "module",
    license: "UNLICENSED",
    exports: {},
  };
  assert.throws(
    () =>
      packageArchive(
        gzipSync(tar([{ ...member, bytes: JSON.stringify(manifest) }])),
        manifest.name,
      ),
    /E_EMPTY_ARCHIVE_EXPORTS/,
  );
});
test("empty, unknown and incidental dependency diagnostic ledgers fail closed", () => {
  const ledger = JSON.parse(
    fs.readFileSync(new URL("./fixtures/diagnostics.json", import.meta.url)),
  );
  assert.throws(() => validateLedger({ ...ledger, cases: [] }), /E_EMPTY/);
  const item = ledger.cases[0];
  for (const code of [999999, 2307])
    assert.throws(
      () =>
        validateLedger({
          ...ledger,
          cases: [{ ...item, diagnostics: [{ code, line: 1, column: 1 }] }],
        }),
      /E_DIAGNOSTIC_EXPECTATION/,
    );
  assert.throws(
    () => diagnostics("/outside/file.ts(1,1): error TS2322: denied", fixture()),
    /E_EXTERNAL_DIAGNOSTIC/,
  );
});
test("historical generation/caller hash argv cannot choose an approved candidate", async () => {
  await assert.rejects(
    main(["--generation", "fc01", "--sha", "caller"], true),
    /E_EXPLICIT_ARGUMENTS/,
  );
  await assert.rejects(main([], false), /E_EXPLICIT_ARGUMENTS/);
});
