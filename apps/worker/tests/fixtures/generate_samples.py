from __future__ import annotations

import json
import sqlite3
from pathlib import Path

import duckdb
from fastavro import parse_schema, writer

ROOT = Path(__file__).resolve().parents[4]
SAMPLES_DIR = ROOT / "apps" / "web" / "public" / "samples"


BASE_ROWS = [
    {
        "customer_id": 1001,
        "customer_email": "devika@example.com",
        "tier": "gold",
        "spend": 120.5,
    },
    {
        "customer_id": 1002,
        "customer_email": "aman@example.com",
        "tier": "silver",
        "spend": 42.0,
    },
    {
        "customer_id": 1003,
        "customer_email": "ria@example.com",
        "tier": "bronze",
        "spend": 13.99,
    },
]


def main() -> None:
    SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
    source_csv = SAMPLES_DIR / "ecommerce-events.csv"
    write_parquet(source_csv)
    write_sqlite()
    write_avro()


def write_parquet(source_csv: Path) -> None:
    destination = SAMPLES_DIR / "nyc-taxi-sample.parquet"
    with duckdb.connect() as connection:
        connection.execute(
            f"COPY (SELECT * FROM read_csv_auto('{source_csv.as_posix()}', header=true)) TO '{destination.as_posix()}' (FORMAT PARQUET)"
        )


def write_sqlite() -> None:
    destination = SAMPLES_DIR / "chinook.sqlite"
    with sqlite3.connect(destination) as connection:
        connection.execute("DROP TABLE IF EXISTS customers")
        connection.execute(
            """
            CREATE TABLE customers (
                customer_id INTEGER,
                customer_email TEXT,
                tier TEXT,
                spend REAL
            )
            """
        )
        connection.executemany(
            "INSERT INTO customers (customer_id, customer_email, tier, spend) VALUES (:customer_id, :customer_email, :tier, :spend)",
            BASE_ROWS,
        )
        connection.commit()


def write_avro() -> None:
    destination = SAMPLES_DIR / "users.avro"
    schema = parse_schema(
        {
            "type": "record",
            "name": "Customer",
            "fields": [
                {"name": "customer_id", "type": "long"},
                {"name": "customer_email", "type": "string"},
                {"name": "tier", "type": "string"},
                {"name": "spend", "type": "double"},
            ],
        }
    )
    with destination.open("wb") as handle:
        writer(handle, schema, BASE_ROWS)


if __name__ == "__main__":
    main()
