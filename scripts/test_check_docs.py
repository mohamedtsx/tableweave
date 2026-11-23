#!/usr/bin/env python3
"""Regression probes for documentation tooling, not Tableweave runtime tests."""

from contextlib import redirect_stderr, redirect_stdout
import hashlib
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import check_docs


TEMP_ROOT = "/tmp/opencode" if Path("/tmp/opencode").is_dir() else None


class ParserTests(unittest.TestCase):
    def test_headings_preserve_code_and_duplicate_suffixes(self):
        self.assertEqual(
            check_docs.anchors("# Hello, `table`!\n## Hello, `table`!\n"),
            {"hello-table", "hello-table-1"},
        )

    def test_fenced_examples_do_not_create_headings_or_links(self):
        text = "~~~md\n# Fake\n[x](missing.md)\n~~~\n# Real\n[x](real.md)\n"
        self.assertEqual(check_docs.anchors(text), {"real"})
        self.assertEqual(check_docs.extract_links(text), [("real.md", 6)])

    def test_inline_code_is_not_a_link(self):
        self.assertEqual(check_docs.extract_links("`[x](missing.md)`\n"), [])

    def test_explicit_reference_links_and_missing_references(self):
        text = "[Text][ref]\n[Unknown][absent]\n[ref]: page.md#heading\n"
        self.assertEqual(
            check_docs.extract_links(text),
            [("page.md#heading", 1), ("__missing_reference__/absent", 2)],
        )

    def test_inventory_rejects_missing_and_duplicate_ids(self):
        errors = check_docs.check_inventory(
            "## FR-01 One\n## FR-01 Duplicate\n", "FR", r"^## (FR-\d{2})\b", 1, 2
        )
        self.assertTrue(any("missing=" in error for error in errors))
        self.assertTrue(any("non-unique" in error for error in errors))


class WorkspaceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="tableweave-docs-test-", dir=TEMP_ROOT)
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "repo"
        self.root.mkdir()
        for path in check_docs.markdown_files(check_docs.ROOT):
            target = self.root / path.relative_to(check_docs.ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")

    def append(self, name, content):
        path = self.root / name
        path.write_text(path.read_text(encoding="utf-8") + content, encoding="utf-8")

    def run_check(self):
        output = io.StringIO()
        with patch.object(check_docs, "ROOT", self.root), redirect_stdout(output), redirect_stderr(output):
            result = check_docs.main([])
        return result, output.getvalue()

    def assert_failure(self, phrase):
        result, output = self.run_check()
        self.assertEqual(result, 1, output)
        self.assertIn(phrase, output)

    def test_current_documentation_passes(self):
        result, output = self.run_check()
        self.assertEqual(result, 0, output)

    def test_missing_target_fails(self):
        self.append("README.md", "\n[Broken](missing.md)\n")
        self.assert_failure("missing target: missing.md")

    def test_missing_fragment_fails(self):
        self.append("README.md", "\n[Broken](PROJECT.md#nonexistent-heading)\n")
        self.assert_failure("missing heading: PROJECT.md#nonexistent-heading")

    def test_unreachable_document_fails(self):
        (self.root / "orphan.md").write_text("# Orphan\n", encoding="utf-8")
        self.assert_failure("unreachable Markdown from entrypoints: orphan.md")

    def test_generated_runtime_artifacts_are_not_documentation_inputs(self):
        for directory in (".artifacts", "storybook-static", "test-results", "playwright-report"):
            path = self.root / directory / "nested" / "generated.md"
            path.parent.mkdir(parents=True)
            path.write_text("# Generated\n[Broken](absent.md)\n", encoding="utf-8")
        result, output = self.run_check()
        self.assertEqual(result, 0, output)

    def test_bad_skill_name_fails(self):
        path = self.root / ".agents/skills/tableweave-docs-maintenance/SKILL.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace("name: tableweave-docs-maintenance", "name: wrong"),
            encoding="utf-8",
        )
        self.assert_failure("skill name/frontmatter mismatch")

    def test_duplicate_source_definition_fails(self):
        self.append("product/features.md", "\n## FR-01 Duplicate\n")
        self.assert_failure("non-unique definitions=['FR-01']")

    def test_trailing_whitespace_fails_even_on_untracked_docs(self):
        self.append("README.md", "\nTrailing space \n")
        self.assert_failure("trailing whitespace")

    def test_workspace_escape_fails(self):
        self.append("README.md", "\n[Outside](../outside.md)\n")
        self.assert_failure("link escapes workspace")

    def test_reference_dependency_fails(self):
        self.append("README.md", "\n[Local only](.repo/Gamila/AGENTS.md)\n")
        self.assert_failure("documentation depends on local-only reference")


class SourceTests(unittest.TestCase):
    def test_synthetic_source_identity_and_tamper_detection(self):
        with tempfile.TemporaryDirectory(prefix="tableweave-source-test-", dir=TEMP_ROOT) as directory:
            root = Path(directory)
            manifest = []
            for name, sections, prefixes in (
                ("prd", 17, (("FR", 16), ("D", 40))),
                ("hld", 21, (("ADR", 10), ("G", 5), ("F", 22))),
            ):
                content = "\n".join(f"## {n}. Section" for n in range(1, sections + 1))
                content += "\n" + " ".join(
                    f"{prefix}-{n:02}" for prefix, end in prefixes for n in range(1, end + 1)
                )
                fingerprint = hashlib.sha256(content.encode("utf-8")).hexdigest()
                manifest.append(f"| {name.upper()} | `{fingerprint}` |")
                (root / f"{name}.md").write_text(f"<content>\n{content}\n</content>\n", encoding="utf-8")
            texts = {check_docs.ROOT / "docs/reference/source-manifest.md": "\n".join(manifest)}
            self.assertEqual(check_docs.check_sources(root, texts), [])
            path = root / "prd.md"
            path.write_text(path.read_text(encoding="utf-8").replace("Section", "Changed", 1), encoding="utf-8")
            self.assertIn("prd: intake fingerprint differs from manifest", check_docs.check_sources(root, texts))

    def test_missing_source_files_are_reported(self):
        with tempfile.TemporaryDirectory(prefix="tableweave-source-test-", dir=TEMP_ROOT) as directory:
            texts = {check_docs.ROOT / "docs/reference/source-manifest.md": ""}
            self.assertEqual(len(check_docs.check_sources(Path(directory), texts)), 2)


if __name__ == "__main__":
    unittest.main()
