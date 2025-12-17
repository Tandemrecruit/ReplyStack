"""Example automation script."""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path


def main() -> int:
    """
    Run the example automation task which writes a UTC timestamp to a file.

    Writes a line in the form "Ran at <ISO8601 UTC timestamp>Z" to the file specified by the `--output` command-line option (defaults to "automation-output.txt").

    Returns:
        exit_code (int): Process exit code (0 on success).
    """
    parser = argparse.ArgumentParser(description="Example automation task.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("automation-output.txt"),
        help="File to write a timestamp into.",
    )
    args = parser.parse_args()

    # Use timezone-aware UTC timestamp for consistency
    timestamp = dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    args.output.write_text(f"Ran at {timestamp}\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

