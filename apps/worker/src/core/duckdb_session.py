from __future__ import annotations

from contextlib import contextmanager
from pathlib import Path

import duckdb

EXTENSIONS = ("httpfs", "parquet", "sqlite_scanner", "json")
_extensions_installed = False


def ensure_extensions_installed() -> None:
    global _extensions_installed
    if _extensions_installed:
        return
    connection = duckdb.connect(database=":memory:")
    try:
        for extension in EXTENSIONS:
            connection.execute(f"INSTALL {extension}")
            connection.execute(f"LOAD {extension}")
    finally:
        connection.close()
    _extensions_installed = True


@contextmanager
def duckdb_session(temp_root: Path):
    temp_root.mkdir(parents=True, exist_ok=True)
    connection = duckdb.connect(database=":memory:")
    connection.execute(f"SET temp_directory='{temp_root.as_posix()}'")
    ensure_extensions_installed()
    for extension in EXTENSIONS:
        connection.execute(f"LOAD {extension}")
    try:
        yield connection
    finally:
        connection.close()
