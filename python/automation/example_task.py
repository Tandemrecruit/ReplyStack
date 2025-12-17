"""Example automation script."""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Example automation task.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("automation-output.txt"),
        help="File to write a timestamp into.",
    )
    args = parser.parse_args()

    timestamp = dt.datetime.utcnow().isoformat() + "Z"
    args.output.write_text(f"Ran at {timestamp}\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


