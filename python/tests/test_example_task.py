from __future__ import annotations

import subprocess
from pathlib import Path


def test_example_task_writes_file(tmp_path: Path):
    output_file = tmp_path / "out.txt"
    result = subprocess.run(
        ["python", "-m", "python.automation.example_task", "--output", str(output_file)],
        check=True,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert output_file.exists()
    content = output_file.read_text(encoding="utf-8")
    assert "Ran at" in content


