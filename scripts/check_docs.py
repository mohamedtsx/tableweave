#!/usr/bin/env python3
"""Check this repository's Markdown without installing dependencies.

Supports the inline/reference links and ATX headings used here, excludes code
blocks/spans, and never fetches URLs. Not a complete CommonMark/HTML parser or a
semantic PRD validator. Optional --source-dir compares captured Notion payloads.
"""

from __future__ import annotations

import argparse
from collections import Counter, deque
import hashlib
import html
import os
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {".git", ".repo", "node_modules", ".venv", "dist", "__pycache__"}
INVENTORIES = (
    ("FR", "product/features.md", r"^## (FR-\d{2})\b", 1, 16),
    ("D", "product/decisions.md", r"^\| (D-\d{2}) \|", 1, 40),
    ("ADR", "docs/adr/README.md", r"^\| (ADR-\d{2}) \|", 1, 10),
    ("G", "docs/engineering/feasibility.md", r"^## (G-\d{2})\b", 1, 5),
    ("F", "docs/design/handoff.md", r"^\| (F-\d{2}) \|", 1, 22),
    ("AC", "product/acceptance.md", r"^## (AC-\d{2})\b", 1, 29),
    ("WP", "docs/planning/work-packets.md", r"^## (WP-\d{2})\b", 0, 15),
)


def without_code(text: str) -> str:
    """Blank code while preserving line numbers."""
    result = []
    fence_char = ""
    fence_size = 0
    for line in text.splitlines(keepends=True):
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if fence_char:
            result.append("\n" if line.endswith("\n") else "")
            if marker and marker[1][0] == fence_char:
                if len(marker[1]) >= fence_size and not marker[2].strip():
                    fence_char = ""
            continue
        if marker:
            fence_char, fence_size = marker[1][0], len(marker[1])
            result.append("\n" if line.endswith("\n") else "")
        else:
            result.append(line)
    return re.sub(r"(`+)([^`\n]*?)\1", lambda m: " " * len(m[0]), "".join(result))


def heading_slug(heading: str) -> str:
    heading = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", heading)
    heading = html.unescape(re.sub(r"<[^>]*>", "", heading))
    heading = re.sub(r"[^\w\s-]", "", heading.lower()).strip()
    return re.sub(r"\s", "-", heading)


def anchors(text: str) -> set[str]:
    # Preserve inline-code heading text: remove fences but not inline spans here.
    heading_text = []
    fenced = False
    char = ""
    size = 0
    for line in text.splitlines():
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if marker and not fenced:
            fenced, char, size = True, marker[1][0], len(marker[1])
            continue
        if fenced:
            if marker and marker[1][0] == char and len(marker[1]) >= size and not marker[2].strip():
                fenced = False
            continue
        heading_text.append(line)
    body = "\n".join(heading_text)
    counts: Counter[str] = Counter()
    found = set(re.findall(r'<a\s+(?:id|name)=["\x27]([^"\x27]+)', body))
    for match in re.finditer(r"^ {0,3}#{1,6}\s+(.+?)(?:\s+#+\s*)?$", body, re.M):
        slug = heading_slug(match[1])
        suffix = f"-{counts[slug]}" if counts[slug] else ""
        found.add(slug + suffix)
        counts[slug] += 1
    return found


def extract_links(text: str) -> list[tuple[str, int]]:
    body = without_code(text)
    definitions = {}
    for match in re.finditer(r"^ {0,3}\[([^\]\n]+)\]:\s*<?([^\s>]+)>?", body, re.M):
        definitions[match[1].casefold()] = match[2]
    links = []
    for match in re.finditer(r"!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)", body):
        links.append((match[1].strip("<>"), body.count("\n", 0, match.start()) + 1))
    for match in re.finditer(r"!?\[([^\]\n]+)\]\[([^\]\n]*)\]", body):
        key = (match[2] or match[1]).casefold()
        # An unresolved explicit reference is a defect, not an external URL.
        links.append((definitions.get(key, f"__missing_reference__/{key}"),
                      body.count("\n", 0, match.start()) + 1))
    return links


def markdown_files(root: Path) -> list[Path]:
    files = []
    for directory, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED)
        files.extend(Path(directory) / name for name in sorted(names) if name.endswith(".md"))
    return sorted(files)


def check_inventory(text: str, prefix: str, pattern: str, start: int, end: int) -> list[str]:
    actual = Counter(re.findall(pattern, text, re.M))
    expected = {f"{prefix}-{number:02}" for number in range(start, end + 1)}
    errors = []
    if set(actual) != expected:
        errors.append(f"missing={sorted(expected - set(actual))}, unexpected={sorted(set(actual) - expected)}")
    repeated = sorted(key for key, count in actual.items() if count != 1)
    if repeated:
        errors.append(f"non-unique definitions={repeated}")
    return errors


def check_sources(directory: Path, texts: dict[Path, str]) -> list[str]:
    errors = []
    manifest = texts[ROOT / "docs/reference/source-manifest.md"]
    sources = {}
    for name, section_count in (("prd", 17), ("hld", 21)):
        path = directory / f"{name}.md"
        if not path.is_file():
            errors.append(f"source payload missing: {path}")
            continue
        raw = path.read_text(encoding="utf-8")
        if "<content>\n" not in raw or "\n</content>" not in raw:
            errors.append(f"source payload lacks content delimiters: {path}")
            continue
        content = raw.split("<content>\n", 1)[1].rsplit("\n</content>", 1)[0]
        fingerprint = hashlib.sha256(content.encode("utf-8")).hexdigest()
        expected_hash = re.search(rf"^\| {name.upper()} \| `([a-f0-9]{{64}})`", manifest, re.M)
        if not expected_hash or fingerprint != expected_hash[1]:
            errors.append(f"{name}: intake fingerprint differs from manifest")
        headings = re.findall(r"^## (\d+)\. ", content, re.M)
        if headings != [str(n) for n in range(1, section_count + 1)]:
            errors.append(f"{name}: numbered section inventory differs")
        sources[name] = content
    for prefix, _, _, start, end in INVENTORIES[:5]:
        source = sources.get("prd" if prefix in {"FR", "D"} else "hld")
        if source is None:
            continue
        actual = set(re.findall(rf"(?<![\w-]){prefix}-\d{{2}}\b", source))
        expected = {f"{prefix}-{n:02}" for n in range(start, end + 1)}
        if actual != expected:
            errors.append(f"source {prefix} IDs differ: {sorted(actual ^ expected)}")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, help="Optional directory containing raw prd.md and hld.md Notion payloads")
    args = parser.parse_args(argv)
    files = markdown_files(ROOT)
    texts = {path: path.read_text(encoding="utf-8") for path in files}
    targets = {path: anchors(text) for path, text in texts.items()}
    graph: dict[Path, set[Path]] = {path: set() for path in files}
    errors = []
    checked_links = 0
    external_links = 0

    for path, text in texts.items():
        for number, line in enumerate(text.splitlines(), 1):
            if line.rstrip() != line:
                errors.append(f"{path.relative_to(ROOT)}:{number}: trailing whitespace")
        if not text.endswith("\n"):
            errors.append(f"{path.relative_to(ROOT)}: missing final newline")
        for destination, line in extract_links(text):
            parsed = urlsplit(destination)
            if parsed.scheme or parsed.netloc:
                external_links += 1
                continue
            checked_links += 1
            target = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            where = f"{path.relative_to(ROOT)}:{line}"
            if not target.is_relative_to(ROOT):
                errors.append(f"{where}: link escapes workspace: {destination}")
            elif ".repo" in target.relative_to(ROOT).parts:
                errors.append(f"{where}: documentation depends on local-only reference: {destination}")
            elif not target.exists():
                errors.append(f"{where}: missing target: {destination}")
            elif parsed.fragment and target.suffix == ".md" and unquote(parsed.fragment) not in targets.get(target, set()):
                errors.append(f"{where}: missing heading: {destination}")
            if target in graph:
                graph[path].add(target)

    for prefix, name, pattern, start, end in INVENTORIES:
        owner = ROOT / name
        if owner not in texts:
            errors.append(f"missing canonical inventory owner: {name}")
            continue
        errors.extend(f"{name}: {error}" for error in check_inventory(texts[owner], prefix, pattern, start, end))
    traceability = texts.get(ROOT / "product/traceability.md", "")
    errors.extend(f"traceability: {error}" for error in check_inventory(traceability, "FR", r"^\| (FR-\d{2}) \|", 1, 16))

    skills = sorted(path for path in files if path.name == "SKILL.md" and ".agents" in path.parts)
    if len(skills) != 5:
        errors.append(f"expected five repository skills, found {len(skills)}; reconcile discovery/index if scope changed")
    for path in skills:
        match = re.match(r"\A---\n(.*?)\n---\n", texts[path], re.S)
        fields = dict(re.findall(r"^(name|description):\s*(.+)$", match[1], re.M)) if match else {}
        if fields.get("name") != path.parent.name or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", fields.get("name", "")):
            errors.append(f"{path.relative_to(ROOT)}: skill name/frontmatter mismatch")
        if not fields.get("description", "").strip():
            errors.append(f"{path.relative_to(ROOT)}: missing skill description")
        if any((parent / "SKILL.md").exists() for parent in path.parents if parent != path.parent and parent.is_relative_to(ROOT)):
            errors.append(f"{path.relative_to(ROOT)}: nested beneath another skill")

    visited = set()
    queue = deque(ROOT / name for name in ("README.md", "AGENTS.md", "PROJECT.md"))
    while queue:
        path = queue.popleft()
        if path in visited:
            continue
        visited.add(path)
        queue.extend(graph.get(path, set()) - visited)
    errors.extend(f"unreachable Markdown from entrypoints: {path.relative_to(ROOT)}" for path in files if path not in visited)

    if args.source_dir:
        errors.extend(check_sources(args.source_dir, texts))
    print(f"Markdown: {len(files)}; local links/fragments: {checked_links}; external links skipped: {external_links}; skills: {len(skills)}")
    print("Inventories: FR=16 D=40 ADR=10 G=5 F=22 AC=29 WP=16; one FR traceability row each")
    print("Captured-source fingerprint/ID/section comparison: " + ("requested" if args.source_dir else "not requested"))
    if errors:
        for error in errors:
            print(f"ERROR {error}", file=sys.stderr)
        print(f"FAIL: {len(errors)} finding(s)")
        return 1
    print("PASS: structural documentation checks (not semantic or runtime acceptance)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
