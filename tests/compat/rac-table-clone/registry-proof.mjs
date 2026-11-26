// Network-enabled byte proof, not an installer or vendor runtime execution.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assetsRoot, fixture, hash, own, run, snapshot } from "./fixtures.mjs";

async function main() {
  const profile = JSON.parse(
    readFileSync(join(assetsRoot, "profile.json"), "utf8"),
  );
  const metadataResponse = await fetch(
    "https://registry.npmjs.org/react-aria-components/1.22.1",
    { redirect: "error", signal: AbortSignal.timeout(30_000) },
  );
  assert.equal(metadataResponse.status, 200);
  const metadata = await metadataResponse.json();
  assert.equal(metadata.name, profile.upstream.name);
  assert.equal(metadata.version, profile.upstream.version);
  for (const key of ["tarball", "integrity", "shasum"])
    assert.equal(metadata.dist[key], profile.upstream[key]);
  const response = await fetch(profile.upstream.tarball, {
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200);
  // The archive buffer stays in memory. tar receives it through stdin; no tgz is saved.
  const archive = Buffer.from(await response.arrayBuffer());
  assert.equal(
    `sha512-${createHash("sha512").update(archive).digest("base64")}`,
    profile.upstream.integrity,
  );
  assert.equal(
    createHash("sha1").update(archive).digest("hex"),
    profile.upstream.shasum,
  );
  const members = spawnSync("tar", ["-tzf", "-"], {
    input: archive,
    encoding: "utf8",
    maxBuffer: 10_000_000,
  });
  assert.equal(members.status, 0);
  assert.equal(
    members.stdout
      .split("\n")
      .some((name) => /(?:^|\/)NOTICE(?:\.[^/]*)?$/i.test(name)),
    false,
  );
  const f = fixture({ realDescriptor: true });
  try {
    const installedFrom = fileURLToPath(
      new URL("../../../apps/storybook/package.json", import.meta.url),
    );
    const installed = dirname(
      createRequire(installedFrom).resolve(
        "react-aria-components/package.json",
      ),
    );
    const baseline = {},
      originals = {},
      mapBaseline = {},
      installedHashes = {};
    const installedProfiles = new Set();
    for (const path of [
      "package.json",
      ...profile.files.flatMap((entry) => [entry.path, `${entry.path}.map`]),
    ]) {
      const extracted = spawnSync("tar", ["-xOzf", "-", `package/${path}`], {
        input: archive,
        maxBuffer: 10_000_000,
      });
      assert.equal(extracted.status, 0);
      mkdirSync(dirname(join(f.vendor, path)), { recursive: true });
      writeFileSync(join(f.vendor, path), extracted.stdout);
      if (path.endsWith(".map")) {
        mapBaseline[path] = hash(extracted.stdout);
      } else if (path !== "package.json") {
        const entry = profile.files.find((value) => value.path === path);
        assert.equal(hash(extracted.stdout), entry.beforeSha256);
        const installedHash = hash(readFileSync(join(installed, path)));
        assert(
          installedHash === entry.beforeSha256 ||
            installedHash === entry.afterSha256,
          "installed runtime must equal an exact original or reviewed profile",
        );
        installedHashes[path] = installedHash;
        installedProfiles.add(
          installedHash === entry.beforeSha256 ? "unpatched" : "reviewed-clone",
        );
        baseline[path] = entry.beforeSha256;
        originals[path] = extracted.stdout.toString("utf8");
      }
    }
    assert.equal(
      installedProfiles.size,
      1,
      "mixed runtime formats are unsupported",
    );
    const unpatched = run(f);
    assert.equal(unpatched.status, 1);
    assert.equal(
      unpatched.stderr,
      "Tableweave RAC clone candidate profile verification failed: E_VENDOR.\n",
    );
    const patch = readFileSync(join(f.assets, "runtime.patch"), "utf8");
    assert.deepEqual(
      [...patch.matchAll(/^diff --git a\/(\S+) b\/(\S+)$/gm)].map((match) => [
        match[1],
        match[2],
      ]),
      profile.files.map((file) => [file.path, file.path]),
    );
    const applied = spawnSync(
      "patch",
      ["--batch", "--fuzz=0", "-p1", "-i", join(f.assets, "runtime.patch")],
      { cwd: f.vendor, encoding: "utf8" },
    );
    assert.equal(applied.status, 0);
    const after = {};
    for (const entry of profile.files) {
      const bytes = readFileSync(join(f.vendor, entry.path));
      assert.equal(hash(bytes), entry.afterSha256);
      const text = bytes.toString("utf8");
      const anchor = "        collection.head = this.head;\n";
      const addition =
        "        // Tableweave candidate compatibility modification (react-aria-components 1.22.1):\n        // Preserve the actual header-cache invalidation state when cloning.\n        collection.columnsDirty = this.columnsDirty;\n";
      const annotation = `//# sourceMappingURL=${entry.path.split("/").at(-1)}.map\n`;
      const original = originals[entry.path];
      assert.equal(original.split(anchor).length, 2);
      assert.equal(original.endsWith(annotation), true);
      assert.equal(
        text,
        original
          .replace(anchor, anchor + addition)
          .slice(0, -annotation.length),
        "only the exact insertion and terminal annotation removal are permitted",
      );
      assert.equal(
        text.includes("Tableweave candidate compatibility modification"),
        true,
      );
      assert.equal(
        text.includes("collection.columnsDirty = this.columnsDirty;"),
        true,
      );
      assert.equal(text.includes("node.key === parent.lastChildKey"), false);
      assert.equal(text.includes("sourceMappingURL="), false);
      after[entry.path] = hash(bytes);
    }
    for (const [path, digest] of Object.entries(mapBaseline))
      assert.equal(hash(readFileSync(join(f.vendor, path))), digest);
    const beforeVerify = snapshot(f.temp),
      verified = run(f);
    assert.equal(verified.status, 0);
    assert.deepEqual(
      snapshot(f.temp),
      beforeVerify,
      "actual-byte verification is read-only",
    );
    const eachUnpatchedFormatRejected = [];
    for (const entry of profile.files) {
      const path = join(f.vendor, entry.path),
        patched = readFileSync(path);
      writeFileSync(path, originals[entry.path]);
      const rejected = run(f);
      assert.equal(rejected.status, 1);
      assert.equal(rejected.stdout, "");
      assert.equal(
        rejected.stderr,
        "Tableweave RAC clone candidate profile verification failed: E_VENDOR.\n",
      );
      writeFileSync(path, patched);
      eachUnpatchedFormatRejected.push(entry.format);
    }
    assert.deepEqual(
      readFileSync(join(assetsRoot, "LICENSE-APACHE-2.0")),
      readFileSync(
        fileURLToPath(
          new URL("../../../patches/LICENSE-APACHE-2.0", import.meta.url),
        ),
      ),
    );
    const result = {
      registry: profile.upstream,
      archiveBytes: archive.length,
      baseline,
      after,
      retainedUnchangedMaps: mapBaseline,
      patchSha256: hash(readFileSync(join(assetsRoot, "runtime.patch"))),
      installedRuntimeProfile: [...installedProfiles][0],
      installedRuntimeHashes: installedHashes,
      registryThreeRuntimeFilesEqualPinnedOriginals: true,
      patchCommand: "patch --batch --fuzz=0 -p1",
      unpatchedRejected: "E_VENDOR",
      eachUnpatchedFormatRejected,
      patchedByteVerifier: "pass",
      vendorRuntimeExecuted: false,
      installationClaimed: false,
      unchangedVerifierInputs: true,
      upstreamNoticePresent: false,
    };
    mkdirSync(join(own, ".artifacts"), { recursive: true });
    writeFileSync(
      join(own, ".artifacts/registry-proof.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    process.stdout.write(
      "Registry integrity, exact installed profile, three-format patch application and read-only byte verification passed.\n",
    );
  } finally {
    f.cleanup();
  }
}
main().catch(() => {
  process.stderr.write("Registry and patch byte proof failed.\n");
  process.exitCode = 1;
});
