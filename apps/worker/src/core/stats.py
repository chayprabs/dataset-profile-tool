from __future__ import annotations

import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlretrieve

import pyarrow.ipc as pa_ipc
from fastavro import reader as avro_reader

from core.anomalies import detect_anomalies
from core.duckdb_session import duckdb_session
from core.pii import detect_pii_flags
from core.schema import infer_json_schema
from models import (
    BooleanStats,
    ColumnProfile,
    DateStats,
    NumericStats,
    ProfileResponse,
    SourceSummary,
    StringStats,
    TopValue,
)
from settings import settings

FORMAT_ALIASES = {
    ".csv": "csv",
    ".tsv": "tsv",
    ".json": "json",
    ".jsonl": "jsonl",
    ".parquet": "parquet",
    ".arrow": "arrow",
    ".ipc": "arrow",
    ".avro": "avro",
    ".sqlite": "sqlite",
    ".db": "sqlite",
}

HISTOGRAM_BUCKETS = 8

DUCKDB_TYPE_MAP = {
    "BIGINT": "int",
    "INTEGER": "int",
    "SMALLINT": "int",
    "UBIGINT": "int",
    "UINTEGER": "int",
    "DOUBLE": "float",
    "FLOAT": "float",
    "DECIMAL": "float",
    "VARCHAR": "string",
    "BOOLEAN": "bool",
    "DATE": "date",
    "TIMESTAMP": "timestamp",
    "TIMESTAMP WITH TIME ZONE": "timestamp",
    "BLOB": "binary",
}


@dataclass
class PreparedSource:
    path: Path
    format: str
    size_bytes: int
    warnings: list[str]


def profile_dataset(
    path: Path,
    format_hint: str | None = None,
    sample_size: int = 20,
    sample_mode: str = "head",
) -> ProfileResponse:
    prepared = prepare_source(path, format_hint)
    job_id = str(uuid.uuid4())
    temp_root = settings.temp_root / job_id
    with duckdb_session(temp_root) as connection:
        sources = materialize_sources(connection, prepared, temp_root)
        sample_rows: list[dict[str, Any]] = []
        all_columns: list[ColumnProfile] = []
        row_count = 0
        warnings = list(prepared.warnings)
        for source in sources:
            if source.arrow_table is not None:
                connection.register("dataprofile_arrow_source", source.arrow_table)
                source_query = "SELECT * FROM dataprofile_arrow_source"
            else:
                source_query = source.query
            connection.execute(f"CREATE OR REPLACE TEMP VIEW active_source AS {source_query}")
            row_count += connection.execute("SELECT COUNT(*) FROM active_source").fetchone()[0]
            if not sample_rows:
                sample_rows = fetch_sample_rows(connection, sample_size, sample_mode)
            all_columns.extend(profile_columns(connection, source.column_prefix))
            if source.warning:
                warnings.append(source.warning)
            if source.arrow_table is not None:
                connection.unregister("dataprofile_arrow_source")

    schema = infer_json_schema(all_columns)
    return ProfileResponse(
        jobId=job_id,
        source=SourceSummary(
            format=prepared.format,
            sizeBytes=prepared.size_bytes,
            rowCount=row_count,
            sha256=sha256_file(prepared.path),
        ),
        columns=all_columns,
        schema=schema,
        warnings=warnings,
        sampleRows=sample_rows,
    )


@dataclass
class MaterializedSource:
    query: str
    column_prefix: str | None = None
    warning: str | None = None
    arrow_table: Any | None = None


def prepare_source(path: Path, format_hint: str | None = None) -> PreparedSource:
    detected_format = format_hint or detect_format(path)
    warnings: list[str] = []
    working_path = path
    if detected_format == "avro":
        working_path = convert_avro_to_jsonl(path)
        warnings.append("Avro source converted to JSONL for DuckDB profiling.")
    return PreparedSource(
        path=working_path,
        format=detected_format,
        size_bytes=path.stat().st_size,
        warnings=warnings,
    )


def prepare_url_source(url: str, working_dir: Path, format_hint: str | None = None) -> PreparedSource:
    parsed = urlparse(url)
    suffix = Path(parsed.path).suffix or ".csv"
    working_dir.mkdir(parents=True, exist_ok=True)
    destination = working_dir / f"download{suffix}"
    urlretrieve(url, destination)
    return prepare_source(destination, format_hint)


def detect_format(path: Path) -> str:
    if path.suffix.lower() in FORMAT_ALIASES:
        return FORMAT_ALIASES[path.suffix.lower()]
    raise ValueError(f"Unsupported format for {path.name}")


def convert_avro_to_jsonl(path: Path) -> Path:
    output_path = path.with_suffix(".jsonl")
    with path.open("rb") as input_handle, output_path.open("w", encoding="utf-8") as output_handle:
        for record in avro_reader(input_handle):
            output_handle.write(json.dumps(record, default=str))
            output_handle.write("\n")
    return output_path


def materialize_sources(connection, prepared: PreparedSource, temp_root: Path) -> list[MaterializedSource]:
    path_sql = sql_string(prepared.path)
    if prepared.format == "csv":
        return [MaterializedSource(query=f"SELECT * FROM read_csv_auto({path_sql}, sample_size=-1, header=true)")]
    if prepared.format == "tsv":
        return [
            MaterializedSource(
                query=f"SELECT * FROM read_csv_auto({path_sql}, sample_size=-1, header=true, delim='\t')"
            )
        ]
    if prepared.format in {"json", "jsonl", "avro"}:
        return [MaterializedSource(query=f"SELECT * FROM read_json_auto({path_sql})")]
    if prepared.format == "parquet":
        return [MaterializedSource(query=f"SELECT * FROM read_parquet({path_sql})")]
    if prepared.format == "arrow":
        with pa_ipc.open_file(prepared.path) as arrow_file:
            return [MaterializedSource(query="SELECT 1", arrow_table=arrow_file.read_all())]
    if prepared.format == "sqlite":
        tables = list_sqlite_tables(prepared.path)
        sources: list[MaterializedSource] = []
        for table_name in tables:
            sources.append(
                MaterializedSource(
                    query=f"SELECT * FROM sqlite_scan({path_sql}, {sql_string(table_name)})",
                    column_prefix=f"{table_name}.",
                    warning=f"SQLite table profiled: {table_name}",
                )
            )
        return sources
    raise ValueError(f"Format {prepared.format} is not supported yet")


def list_sqlite_tables(path: Path) -> list[str]:
    with sqlite3.connect(path) as connection:
        rows = connection.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
    return [row[0] for row in rows]


def profile_columns(connection, column_prefix: str | None = None) -> list[ColumnProfile]:
    described_columns = connection.execute("DESCRIBE SELECT * FROM active_source").fetchall()
    row_count = connection.execute("SELECT COUNT(*) FROM active_source").fetchone()[0] or 0
    profiles: list[ColumnProfile] = []
    for name, duckdb_type, *_ in described_columns:
        quoted = quote_identifier(name)
        null_count = connection.execute(
            f"SELECT COUNT(*) FROM active_source WHERE {quoted} IS NULL"
        ).fetchone()[0]
        unique_count = connection.execute(
            f"SELECT COUNT(DISTINCT {quoted}) FROM active_source WHERE {quoted} IS NOT NULL"
        ).fetchone()[0]
        top_rows = connection.execute(
            f"""
            SELECT CAST({quoted} AS VARCHAR) AS value, COUNT(*) AS count
            FROM active_source
            WHERE {quoted} IS NOT NULL
            GROUP BY 1
            ORDER BY count DESC, value ASC
            LIMIT 10
            """
        ).fetchall()
        sample_values = [
            row[0]
            for row in connection.execute(
                f"SELECT {quoted} FROM active_source WHERE {quoted} IS NOT NULL LIMIT 200"
            ).fetchall()
        ]
        inferred_type = detect_column_type(duckdb_type, sample_values)
        column_name = f"{column_prefix or ''}{name}"
        pii_flags = detect_pii_flags(column_name, sample_values[:50])
        anomalies = detect_anomalies(column_name, sample_values[:50])

        profile = ColumnProfile(
            name=column_name,
            inferredType=inferred_type,
            nullable=null_count > 0,
            nullCount=int(null_count),
            nullPct=round(percent(null_count, row_count), 4),
            uniqueCount=int(unique_count),
            uniquePct=round(percent(unique_count, row_count), 4),
            topValues=[TopValue(value=value, count=count) for value, count in top_rows],
            format=pick_format(pii_flags),
            piiFlags=pii_flags,
            anomalies=anomalies,
            confidence=round(min(1.0, 0.55 + (0.45 * len(sample_values) / max(1, row_count or 1))), 4),
        )

        if inferred_type in {"int", "float"}:
            profile.numeric = build_numeric_stats(connection, quoted)
        elif inferred_type == "string" or inferred_type == "mixed":
            profile.string = build_string_stats(sample_values)
        elif inferred_type in {"date", "timestamp", "datetime"}:
            profile.date = build_date_stats(connection, quoted)
        elif inferred_type == "bool":
            profile.boolean = build_boolean_stats(connection, quoted)

        profiles.append(profile)
    return profiles


def build_numeric_stats(connection, quoted: str) -> NumericStats:
    min_value, max_value, mean_value, stddev_value = connection.execute(
        f"SELECT MIN({quoted}), MAX({quoted}), AVG({quoted}), STDDEV_POP({quoted}) FROM active_source"
    ).fetchone()
    p25, p50, p75, p95, p99 = connection.execute(
        f"SELECT quantile_cont({quoted}, [0.25, 0.5, 0.75, 0.95, 0.99]) FROM active_source WHERE {quoted} IS NOT NULL"
    ).fetchone()[0]
    histogram = build_histogram(connection, quoted, min_value, max_value)
    return NumericStats(
        min=float(min_value) if min_value is not None else None,
        max=float(max_value) if max_value is not None else None,
        mean=float(mean_value) if mean_value is not None else None,
        p25=float(p25) if p25 is not None else None,
        p50=float(p50) if p50 is not None else None,
        p75=float(p75) if p75 is not None else None,
        p95=float(p95) if p95 is not None else None,
        p99=float(p99) if p99 is not None else None,
        stddev=float(stddev_value) if stddev_value is not None else None,
        histogram=histogram,
    )


def build_histogram(connection, quoted: str, min_value: float | None, max_value: float | None) -> list[int]:
    if min_value is None or max_value is None:
        return [0] * HISTOGRAM_BUCKETS
    if min_value == max_value:
        count = connection.execute(
            f"SELECT COUNT(*) FROM active_source WHERE {quoted} IS NOT NULL"
        ).fetchone()[0]
        return [int(count)] + ([0] * (HISTOGRAM_BUCKETS - 1))
    span = float(max_value) - float(min_value)
    bins = connection.execute(
        f"""
        WITH bucketed AS (
          SELECT LEAST(
            {HISTOGRAM_BUCKETS - 1},
            CAST(FLOOR(((CAST({quoted} AS DOUBLE) - {float(min_value)}) / {span}) * {HISTOGRAM_BUCKETS}) AS BIGINT)
          ) AS bucket
          FROM active_source
          WHERE {quoted} IS NOT NULL
        )
        SELECT bucket, COUNT(*) AS count
        FROM bucketed
        GROUP BY bucket
        ORDER BY bucket
        """
    ).fetchall()
    counts_by_bucket = {int(bucket): int(count) for bucket, count in bins}
    return [counts_by_bucket.get(bucket_index, 0) for bucket_index in range(HISTOGRAM_BUCKETS)]


def build_string_stats(sample_values: list[Any]) -> StringStats:
    values = [str(value) for value in sample_values if value is not None]
    if not values:
        return StringStats()
    char_classes = {
        "lower": sum(char.islower() for value in values for char in value),
        "upper": sum(char.isupper() for value in values for char in value),
        "digit": sum(char.isdigit() for value in values for char in value),
        "punct": sum((not char.isalnum() and not char.isspace()) for value in values for char in value),
    }
    lengths = [len(value) for value in values]
    return StringStats(minLen=min(lengths), maxLen=max(lengths), charClasses=char_classes)


def build_date_stats(connection, quoted: str) -> DateStats:
    min_value, max_value = connection.execute(
        f"SELECT MIN({quoted}), MAX({quoted}) FROM active_source WHERE {quoted} IS NOT NULL"
    ).fetchone()
    return DateStats(
        min=str(min_value) if min_value is not None else None,
        max=str(max_value) if max_value is not None else None,
        pattern="iso-8601",
    )


def build_boolean_stats(connection, quoted: str) -> BooleanStats:
    true_count, false_count = connection.execute(
        f"""
        SELECT
          COUNT(*) FILTER (WHERE {quoted} IS TRUE),
          COUNT(*) FILTER (WHERE {quoted} IS FALSE)
        FROM active_source
        """
    ).fetchone()
    return BooleanStats(trueCount=int(true_count), falseCount=int(false_count))


def fetch_sample_rows(connection, sample_size: int, sample_mode: str) -> list[dict[str, Any]]:
    if sample_mode == "tail":
        query = f"SELECT * FROM active_source ORDER BY ALL DESC LIMIT {sample_size}"
    elif sample_mode == "random":
        query = f"SELECT * FROM active_source USING SAMPLE {sample_size} ROWS"
    else:
        query = f"SELECT * FROM active_source LIMIT {sample_size}"
    cursor = connection.execute(query)
    columns = [description[0] for description in cursor.description]
    return [dict(zip(columns, row, strict=False)) for row in cursor.fetchall()]


def detect_column_type(duckdb_type: str, sample_values: list[Any]) -> str:
    normalized_duckdb_type = duckdb_type.upper()
    mapped = next(
        (value for key, value in DUCKDB_TYPE_MAP.items() if normalized_duckdb_type.startswith(key)),
        "string",
    )
    observed = {
        classify_value(value)
        for value in sample_values[:50]
        if value is not None and classify_value(value) != "string"
    }
    if mapped == "string" and len(observed) > 1:
        return "mixed"
    return mapped


def classify_value(value: Any) -> str:
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, int):
        return "int"
    if isinstance(value, float):
        return "float"
    text = str(value)
    if text.isdigit():
        return "int"
    try:
        float(text)
        return "float"
    except ValueError:
        pass
    if text.lower() in {"true", "false"}:
        return "bool"
    if "T" in text and ":" in text:
        return "timestamp"
    if text.count("-") == 2 and len(text) >= 8:
        return "date"
    return "string"


def pick_format(flags: list[str]) -> str | None:
    for candidate in ("email", "credit_card", "iban", "phone", "uuid", "uri", "date-time"):
        if candidate in flags:
            return candidate
    return None


def percent(value: int, total: int) -> float:
    if total == 0:
        return 0.0
    return (float(value) / float(total)) * 100.0


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def sql_string(value: Path | str) -> str:
    return "'" + str(value).replace("\\", "/").replace("'", "''") + "'"
