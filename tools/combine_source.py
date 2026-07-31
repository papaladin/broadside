#!/usr/bin/env python3
"""
export_project.py

Place this script inside:

project/
├── tools/
│   └── export_project.py

It generates two files in the project root:

1. root_codebase.txt
   - Only .js, .jsx and .html files
   - Only files located directly in the project root
   - No recursion

2. full_project_export.txt
   - Recursive
   - Includes .js, .jsx, .html and .md
   - Root files are exported first
   - Then each subfolder recursively
   - Supports configurable exclusions
"""

from pathlib import Path

# --------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent.parent

ROOT_OUTPUT = ROOT / "root_codebase.txt"
FULL_OUTPUT = ROOT / "full_project_export.txt"

# --------------------------------------------------------------------
# Configuration
# --------------------------------------------------------------------

ROOT_EXTENSIONS = {
    ".js",
    ".jsx",
    ".html",
}

FULL_EXTENSIONS = {
    ".js",
    ".jsx",
    ".html",
    ".md",
}

EXCLUDED_DIRS = {
    ".github",
    ".gitignore",
    ".vscode",
    "feedbacks",

}

# Exact filenames (case-insensitive)
EXCLUDED_FILES = {
    "license.md",
    "licence.md",
    "package-lock.json",
    "Archive.zip"
    "_config.yml"
}

# Exclude filenames starting with these
EXCLUDED_NAME_STARTS = {
    "task",
}

# Exclude filenames containing these strings
EXCLUDED_NAME_CONTAINS = {
    "task",
}

# Exclude any path containing these fragments
EXCLUDED_PATH_CONTAINS = {
    "/archive/",
    "/backup/",
    "/generated/",
}

# --------------------------------------------------------------------


def is_excluded(path: Path):
    """Return True if a file should be excluded."""

    # Skip excluded directories
    if any(part in EXCLUDED_DIRS for part in path.parts):
        return True

    name = path.name.lower()

    # Exact filename exclusions
    if name in EXCLUDED_FILES:
        return True

    # Starts-with exclusions
    if any(name.startswith(prefix) for prefix in EXCLUDED_NAME_STARTS):
        return True

    # Contains exclusions
    if any(text in name for text in EXCLUDED_NAME_CONTAINS):
        return True

    # Path fragment exclusions
    normalized = "/" + str(path.relative_to(ROOT)).replace("\\", "/").lower()

    if any(fragment.lower() in normalized for fragment in EXCLUDED_PATH_CONTAINS):
        return True

    return False


def write_export(output_file, files, title):
    """Create a fresh export file."""

    # Delete previous export if it exists
    if output_file.exists():
        output_file.unlink()

    with output_file.open("w", encoding="utf-8", newline="\n") as out:

        out.write("=" * 80 + "\n")
        out.write(title + "\n")
        out.write("=" * 80 + "\n\n")

        out.write("STRUCTURE\n")
        out.write("---------\n")
        out.write("1. FILE LIST\n")
        out.write("   Relative paths of every exported file.\n\n")

        out.write("2. FILE CONTENTS\n")
        out.write("   Each file is wrapped with:\n")
        out.write("       ===== START FILE: relative/path =====\n")
        out.write("       ===== END FILE: relative/path =====\n\n")

        # -------------------------------------------------------------

        out.write("=" * 80 + "\n")
        out.write("FILE LIST\n")
        out.write("=" * 80 + "\n\n")

        for file in files:
            out.write(f"{file.relative_to(ROOT)}\n")

        # -------------------------------------------------------------

        out.write("\n")
        out.write("=" * 80 + "\n")
        out.write("FILE CONTENTS\n")
        out.write("=" * 80 + "\n\n")

        for file in files:

            rel = file.relative_to(ROOT)

            out.write("=" * 80 + "\n")
            out.write(f"===== START FILE: {rel} =====\n")
            out.write("=" * 80 + "\n\n")

            try:
                content = file.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                content = file.read_text(
                    encoding="utf-8",
                    errors="replace"
                )

            out.write(content)

            if not content.endswith("\n"):
                out.write("\n")

            out.write("\n")
            out.write("=" * 80 + "\n")
            out.write(f"===== END FILE: {rel} =====\n")
            out.write("=" * 80 + "\n\n")


def export_root():
    """Export only root-level JS/JSX/HTML files."""

    files = []

    for item in ROOT.iterdir():

        if not item.is_file():
            continue

        if item.suffix.lower() not in ROOT_EXTENSIONS:
            continue

        if is_excluded(item):
            continue

        files.append(item)

    files.sort(key=lambda p: p.name.lower())

    write_export(
        ROOT_OUTPUT,
        files,
        "ROOT CODEBASE EXPORT"
    )

    return len(files)


def export_full():
    """Export the full project.

    Order:
        1. Root files
        2. Each top-level folder recursively
    """

    files = []

    # --------------------------------------------------------
    # Root files first
    # --------------------------------------------------------

    root_files = []

    for item in ROOT.iterdir():

        if not item.is_file():
            continue

        if item.suffix.lower() not in FULL_EXTENSIONS:
            continue

        if is_excluded(item):
            continue

        root_files.append(item)

    root_files.sort(key=lambda p: p.name.lower())

    files.extend(root_files)

    # --------------------------------------------------------
    # Then top-level folders
    # --------------------------------------------------------

    folders = sorted(
        [d for d in ROOT.iterdir() if d.is_dir()],
        key=lambda d: d.name.lower()
    )

    for folder in folders:

        if folder.name in EXCLUDED_DIRS:
            continue

        folder_files = []

        for ext in FULL_EXTENSIONS:

            for file in folder.rglob(f"*{ext}"):

                if is_excluded(file):
                    continue

                folder_files.append(file)

        folder_files.sort(
            key=lambda p: str(p.relative_to(ROOT)).lower()
        )

        files.extend(folder_files)

    write_export(
        FULL_OUTPUT,
        files,
        "FULL PROJECT EXPORT"
    )

    return len(files)


def main():

    print("Exporting project...\n")

    root_count = export_root()
    full_count = export_full()

    print(f"✓ Root export created ({root_count} files)")
    print(f"  {ROOT_OUTPUT}")

    print()

    print(f"✓ Full export created ({full_count} files)")
    print(f"  {FULL_OUTPUT}")


if __name__ == "__main__":
    main()