import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";

/** Read-only strict regular-file USTAR image, never extract paths into a consumer.
 * Reject links/extensions/duplicates rather than interpreting unsafe archive paths. */
export function archiveFiles(bytes) {
  const tar = gunzipSync(bytes, { maxOutputLength: 64 * 1024 * 1024 }),
    files = new Map();
  const text = (header, offset, length) =>
    header
      .subarray(offset, offset + length)
      .toString("utf8")
      .replace(/\0.*$/s, "");
  const octal = (value) => {
    const input = value.replace(/\0/g, "").trim();
    assert(/^[0-7]+$/.test(input), "Invalid archive numeric field");
    return Number.parseInt(input, 8);
  };
  let offset = 0,
    ended = false;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) {
      assert(
        tar.subarray(offset).every((value) => value === 0),
        "Nonzero archive trailer",
      );
      ended = true;
      break;
    }
    const checksum = octal(text(header, 148, 8));
    assert.equal(
      header.reduce(
        (sum, value, i) => sum + (i >= 148 && i < 156 ? 32 : value),
        0,
      ),
      checksum,
      "Archive checksum mismatch",
    );
    const prefix = text(header, 345, 155),
      name = `${prefix ? `${prefix}/` : ""}${text(header, 0, 100)}`;
    assert(
      name.startsWith("package/") &&
        !name.includes("\\") &&
        !name.includes("\n") &&
        !name.includes("\r"),
      "Invalid archive member path",
    );
    const path = name.slice(8).replace(/\/$/, "");
    assert(
      !path ||
        !path.split("/").some((value) => ["", ".", ".."].includes(value)),
      "Unsafe archive member path",
    );
    const kind = text(header, 156, 1),
      size = octal(text(header, 124, 12));
    assert(
      ["", "0", "5"].includes(kind),
      "Archive links/PAX/GNU extensions are not accepted by this verifier",
    );
    const start = offset + 512;
    assert(start + size <= tar.length, "Truncated archive member");
    if (kind === "5") assert.equal(size, 0);
    else {
      assert(path && !files.has(path), "Empty/duplicate archive file");
      files.set(path, tar.subarray(start, start + size));
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  assert(ended && files.size > 0, "Missing archive end/files");
  return files;
}
