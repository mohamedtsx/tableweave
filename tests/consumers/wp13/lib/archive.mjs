import { gunzipSync } from "node:zlib";
import path from "node:path";
import fs from "node:fs";
import {
  demand,
  digest,
  object,
  relative,
  regular,
  mkdir,
  write,
  record,
  receipt,
  verifyMap,
} from "./receipts.mjs";

export const archiveLimits = Object.freeze({
  compressed: 64 * 1024 * 1024,
  expanded: 256 * 1024 * 1024,
  members: 8192,
});
function octal(bytes) {
  const nul = bytes.indexOf(0);
  if (nul >= 0)
    demand(
      bytes.subarray(nul).every((value) => value === 0 || value === 32),
      "E_TAR_OCTAL_PADDING",
    );
  const text = bytes.toString("ascii").replace(/\0.*$/, "").trim();
  demand(/^[0-7]+$/.test(text), "E_TAR_OCTAL");
  const value = Number.parseInt(text, 8);
  demand(Number.isSafeInteger(value), "E_TAR_INTEGER");
  return value;
}
function field(bytes) {
  const zero = bytes.indexOf(0),
    end = zero < 0 ? bytes.length : zero;
  if (zero >= 0)
    demand(
      bytes.subarray(zero).every((value) => value === 0),
      "E_TAR_FIELD_PADDING",
    );
  const result = bytes.subarray(0, end).toString("utf8");
  demand(/^[A-Za-z0-9._@/+-]*$/.test(result), "E_TAR_NAME_ENCODING");
  return result;
}
export function parseArchive(compressed) {
  demand(
    Buffer.isBuffer(compressed) &&
      compressed.length > 0 &&
      compressed.length <= archiveLimits.compressed,
    "E_GZIP_SIZE",
  );
  const bytes = gunzipSync(compressed, {
    maxOutputLength: archiveLimits.expanded,
  });
  demand(bytes.length % 512 === 0, "E_TAR_ALIGNMENT");
  const members = new Map();
  let offset = 0,
    ended = false;
  while (offset < bytes.length) {
    const header = bytes.subarray(offset, offset + 512);
    if (header.every((value) => value === 0)) {
      demand(
        offset + 1024 <= bytes.length &&
          bytes.subarray(offset).every((value) => value === 0),
        "E_TAR_FOOTER",
      );
      ended = true;
      break;
    }
    demand(members.size < archiveLimits.members, "E_TAR_MEMBER_LIMIT");
    const expected = octal(header.subarray(148, 156));
    let sum = 0;
    for (let index = 0; index < 512; index++)
      sum += index >= 148 && index < 156 ? 32 : header[index];
    demand(sum === expected, "E_TAR_CHECKSUM");
    demand(
      header.subarray(257, 262).toString("ascii") === "ustar" &&
        header[262] === 0,
      "E_TAR_USTAR",
    );
    demand(
      header.subarray(263, 265).toString("ascii") === "00" &&
        header.subarray(500).every((value) => value === 0),
      "E_TAR_VERSION_RESERVED",
    );
    octal(header.subarray(108, 116));
    octal(header.subarray(116, 124));
    octal(header.subarray(136, 148));
    for (const range of [
      [329, 337],
      [337, 345],
    ]) {
      const device = header.subarray(...range);
      demand(
        device.every((value) => value === 0) || octal(device) === 0,
        "E_TAR_DEVICE_FIELD",
      );
    }
    for (const range of [
      [265, 297],
      [297, 329],
    ])
      demand(
        [...header.subarray(...range)].every(
          (value) => value === 0 || (value >= 32 && value < 127),
        ),
        "E_TAR_OWNER_ENCODING",
      );
    const type = header[156],
      mode = octal(header.subarray(100, 108)),
      size = octal(header.subarray(124, 136));
    demand(
      type === 0 || type === 48 || type === 53,
      [120, 103, 76, 75].includes(type)
        ? "E_TAR_EXTENSION_HOLD"
        : "E_TAR_MEMBER_TYPE",
    );
    demand(
      type === 53 ? mode === 0o755 : [0o644, 0o755].includes(mode),
      "E_TAR_MODE",
    );
    demand(field(header.subarray(157, 257)) === "", "E_TAR_LINK");
    const prefix = field(header.subarray(345, 500)),
      leaf = field(header.subarray(0, 100));
    const raw = prefix ? `${prefix}/${leaf}` : leaf;
    const name = type === 53 && raw.endsWith("/") ? raw.slice(0, -1) : raw;
    relative(name);
    demand(
      name === "package" || name.startsWith("package/"),
      "E_TAR_NAMESPACE",
    );
    demand(name !== "package" || type === 53, "E_TAR_ROOT_FILE");
    demand(!members.has(name), "E_TAR_DUPLICATE");
    for (const [other, member] of members) {
      demand(
        !(
          name.toLowerCase().startsWith(`${other.toLowerCase()}/`) &&
          member.type === "file"
        ) &&
          !(
            other.toLowerCase().startsWith(`${name.toLowerCase()}/`) &&
            type !== 53
          ),
        "E_TAR_PARENT_COLLISION",
      );
      demand(
        other.toLowerCase() !== name.toLowerCase(),
        "E_TAR_CASE_COLLISION",
      );
    }
    const start = offset + 512,
      end = start + size,
      next = start + Math.ceil(size / 512) * 512;
    demand(
      end <= bytes.length &&
        next <= bytes.length &&
        bytes.subarray(end, next).every((value) => value === 0),
      "E_TAR_TRUNCATION_PADDING",
    );
    demand(type !== 53 || size === 0, "E_TAR_DIRECTORY_DATA");
    members.set(name, {
      type: type === 53 ? "directory" : "file",
      mode,
      bytes: bytes.subarray(start, end),
    });
    offset = next;
  }
  demand(
    ended &&
      members.size > 0 &&
      members.get("package/package.json")?.type === "file",
    "E_TAR_INCOMPLETE",
  );
  for (const [name, member] of members)
    if (member.type === "directory")
      demand(
        [...members].some(
          ([file, value]) =>
            value.type === "file" && file.startsWith(`${name}/`),
        ),
        "E_TAR_EMPTY_UNREVIEWED_DIRECTORY",
      );
  return members;
}
export function packageArchive(bytes, packageName) {
  const members = parseArchive(bytes);
  const manifest = object(
    JSON.parse(members.get("package/package.json").bytes.toString("utf8")),
  );
  demand(
    manifest.name === packageName &&
      manifest.type === "module" &&
      manifest.private === true &&
      manifest.license === "UNLICENSED",
    "E_ARCHIVE_MANIFEST",
  );
  demand(
    Object.hasOwn(object(manifest.exports), "."),
    "E_EMPTY_ARCHIVE_EXPORTS",
  );
  for (const [name, member] of members) {
    demand(
      !/(?:^|\/)(?:src|tests?|stories|storybook|node_modules|\.repo)(?:\/|\.|$)/.test(
        name,
      ),
      "E_ARCHIVE_PRIVATE_MEMBER",
    );
    if (member.type !== "file") continue;
    demand(
      name === "package/package.json" ||
        name === "package/README.md" ||
        /^package\/dist\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:js|ts|css)$/.test(
          name,
        ) ||
        (packageName === "@tableweave/heroui" &&
          /^package\/compat\/rac-table-clone\/(?:runtime\.patch|profile\.json|verify\.mjs|README\.md|NOTICE-RAC|LICENSE-APACHE-2\.0)$/.test(
            name,
          )),
      "E_ARCHIVE_UNREVIEWED_MEMBER",
    );
    demand(
      !/(?:^|\/)(?:src|tests?|stories|storybook|node_modules|\.repo)(?:\/|\.)/.test(
        name,
      ),
      "E_ARCHIVE_PRIVATE_MEMBER",
    );
  }
  for (const target of Object.values(object(manifest.exports))) {
    const targets =
      typeof target === "string"
        ? [target]
        : [object(target).types, target.import];
    for (const value of targets)
      demand(
        typeof value === "string" &&
          value.startsWith("./dist/") &&
          members.get(`package/${relative(value.slice(2))}`)?.type === "file",
        "E_MISSING_PUBLIC_TARGET",
      );
  }
  return { members, manifest, sha256: digest(bytes) };
}
export function pair(ctx) {
  const generation = receipt(ctx, "generation.json");
  demand(
    generation.candidate === ctx.request.candidate &&
      generation.status === "emitted-and-packed-unapproved" &&
      generation.revision === ctx.request.selectedRevision &&
      generation.inputsSHA256 ===
        digest(regular(ctx.run, "producer-inputs.json")) &&
      generation.checkoutSHA256 ===
        digest(regular(ctx.run, "producer-checkout.json")) &&
      generation.toolchainSHA256 ===
        digest(regular(ctx.run, "toolchain-inputs.json")),
    "E_GENERATION_RECEIPT",
  );
  for (const file of Object.keys(object(generation.output)))
    demand(
      /^packages\/(?:react|heroui)\/dist\//.test(file),
      "E_EMITTED_OUTPUT_PATH",
    );
  verifyMap(ctx.producer, generation.output);
  const result = {};
  for (const name of ["react", "heroui"]) {
    const selected = object(generation.archives[name]);
    relative(selected.file);
    demand(
      selected.file.startsWith(`archives/${name}/`) &&
        selected.file.endsWith(".tgz"),
      "E_ARCHIVE_ORIGIN",
    );
    const bytes = regular(ctx.run, selected.file);
    demand(
      digest(bytes) === selected.sha256 && bytes.length === selected.size,
      "E_ARCHIVE_IDENTITY",
    );
    const parsed = packageArchive(bytes, `@tableweave/${name}`);
    const actual = {};
    for (const [file, member] of parsed.members)
      if (member.type === "file")
        actual[file] = {
          mode: member.mode,
          size: member.bytes.length,
          sha256: digest(member.bytes),
        };
    const expected = object(generation.members[name]);
    demand(
      Object.keys(actual).length === Object.keys(expected).length &&
        Object.keys(actual).every(
          (file) =>
            expected[file]?.sha256 === actual[file].sha256 &&
            expected[file]?.size === actual[file].size &&
            expected[file]?.mode === actual[file].mode,
        ),
      "E_EMIT_ARCHIVE_LINK",
    );
    result[name] = {
      ...parsed,
      file: path.join(ctx.run, selected.file),
      memberMap: actual,
    };
  }
  return result;
}
export function extractPair(ctx) {
  const archives = pair(ctx); // BOTH complete member maps validated before any write.
  demand(
    !fs.existsSync(path.join(ctx.run, "extracted")),
    "E_EXTRACTION_EXISTS",
  );
  mkdir(ctx.run, "extracted");
  for (const name of ["react", "heroui"]) {
    const root = mkdir(ctx.run, `extracted/${name}`);
    for (const [file, member] of archives[name].members)
      if (member.type === "file")
        write(root, file.slice("package/".length), member.bytes);
  }
  record(ctx.run, "archive-inspection.json", {
    candidate: ctx.request.candidate,
    status: "inspected-not-runtime-approved",
    archives: Object.fromEntries(
      Object.entries(archives).map(([name, value]) => [
        name,
        { sha256: value.sha256, members: value.memberMap },
      ]),
    ),
  });
  return archives;
}
