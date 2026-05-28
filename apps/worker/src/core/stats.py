from __future__ import annotations

from collections import Counter
import hashlib
import json
import sqlite3
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal
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
EXACT_TOP_VALUES_MAX_UNIQUE = 1000
EXACT_TOP_VALUES_MAX_UNIQUE_PCT = 25.0
APPROX_UNIQUE_COUNT_SIZE_BYTES = 512 * 1024 * 1024
ProfileMode = Literal["full", "drift"]

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
    profile_mode: ProfileMode = "full",
    source_sha256: str | None = None,
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
        use_approx_unique_counts = should_use_approx_unique_counts(prepared, profile_mode)
        if use_approx_unique_counts:
            warnings.append("Approximate unique counts enabled for large Parquet sources to keep profile latency within budget.")
        for source in sources:
            if source.arrow_table is not None:
                connection.register("dataprofile_arrow_source", source.arrow_table)
                source_query = "SELECT * FROM dataprofile_arrow_source"
            else:
                source_query = source.query
            connection.execute("DROP TABLE IF EXISTS active_source")
            connection.execute(f"CREATE OR REPLACE TEMP TABLE active_source AS {source_query}")
            source_row_count = connection.execute("SELECT COUNT(*) FROM active_source").fetchone()[0]
            row_count += source_row_count
            if profile_mode == "full" and not sample_rows:
                sample_rows = fetch_sample_rows(connection, sample_size, sample_mode)
            all_columns.extend(
                profile_columns(
                    connection,
                    source_row_count,
                    source.column_prefix,
                    profile_mode,
                    use_approx_unique_counts,
                )
            )
            if source.warning:
                warnings.append(source.warning)
            if source.arrow_table is not None:
                connection.unregister("dataprofile_arrow_source")
        connection.execute("DROP TABLE IF EXISTS active_source")

    schema = infer_json_schema(all_columns) if profile_mode == "full" else {"type": "object", "properties": {}}
    return ProfileResponse(
        jobId=job_id,
        source=SourceSummary(
            format=prepared.format,
            sizeBytes=prepared.size_bytes,
            rowCount=row_count,
            sha256=source_sha256 or sha256_file(prepared.path),
        ),
        columns=all_columns,
        schema=schema,
        warnings=warnings,
        sampleRows=sample_rows if profile_mode == "full" else [],
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


def profile_columns(
    connection,
    row_count: int,
    column_prefix: str | None = None,
    profile_mode: ProfileMode = "full",
    use_approx_unique_counts: bool = False,
) -> list[ColumnProfile]:
    described_columns = connection.execute("DESCRIBE SELECT * FROM active_source").fetchall()
    sample_rows = fetch_analysis_rows(connection, 200 if profile_mode == "full" else 64)
    counts_by_column = collect_column_counts(
        connection,
        described_columns,
        sample_rows,
        profile_mode,
        use_approx_unique_counts,
    )
    profiles: list[ColumnProfile] = []
    for name, duckdb_type, *_ in described_columns:
        quoted = quote_identifier(name)
        summary = counts_by_column[name]
        null_count = summary["nullCount"]
        unique_count = summary["uniqueCount"]
        sample_values = [row.get(name) for row in sample_rows if row.get(name) is not None]
        top_rows = (
            build_top_values(connection, quoted, sample_values, unique_count, row_count)
            if profile_mode == "full"
            else []
        )
        inferred_type = detect_column_type(duckdb_type, sample_values)
        column_name = f"{column_prefix or ''}{name}"
        pii_flags = detect_pii_flags(column_name, sample_values[:50])
        anomalies = detect_anomalies(column_name, sample_values[:50]) if profile_mode == "full" else []

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
            profile.numeric = build_numeric_stats(connection, quoted, profile_mode)
        elif profile_mode == "full" and (inferred_type == "string" or inferred_type == "mixed"):
            profile.string = build_string_stats(sample_values)
        elif profile_mode == "full" and inferred_type in {"date", "timestamp", "datetime"}:
            profile.date = build_date_stats(connection, quoted)
        elif profile_mode == "full" and inferred_type == "bool":
            profile.boolean = build_boolean_stats(connection, quoted)

        profiles.append(profile)
    return profiles


def fetch_analysis_rows(connection, limit: int) -> list[dict[str, Any]]:
    cursor = connection.execute(f"SELECT * FROM active_source LIMIT {limit}")
    columns = [description[0] for description in cursor.description]
    return [dict(zip(columns, row, strict=False)) for row in cursor.fetchall()]


def collect_column_counts(
    connection,
    described_columns: list[tuple[Any, ...]],
    sample_rows: list[dict[str, Any]],
    profile_mode: ProfileMode,
    use_approx_unique_counts: bool,
) -> dict[str, dict[str, int]]:
    if not described_columns:
        return {}
    projections: list[str] = []
    deferred_unique_counts: dict[str, int] = {}
    for name, *_ in described_columns:
        quoted = quote_identifier(name)
        safe_name = safe_alias(name)
        projections.append(
            f'COUNT(*) FILTER (WHERE {quoted} IS NULL) AS "{safe_name}__null_count"'
        )
    for name, duckdb_type, *_ in described_columns:
        if profile_mode == "full":
            projections.append(build_unique_count_projection(name, duckdb_type, sample_rows, use_approx_unique_counts))
            continue

        sample_unique_count = count_sample_uniques(sample_rows, name)
        if should_collect_exact_unique_count(name, duckdb_type, sample_unique_count):
            projections.append(build_unique_count_projection(name, duckdb_type, sample_rows, False))
        else:
            deferred_unique_counts[name] = max(sample_unique_count, 51)

    row = connection.execute(f"SELECT {', '.join(projections)} FROM active_source").fetchone()
    columns = [description[0] for description in connection.description]
    values = dict(zip(columns, row, strict=False))
    counts_by_column: dict[str, dict[str, int]] = {}
    for name, *_ in described_columns:
        safe_name = safe_alias(name)
        counts_by_column[name] = {
            "nullCount": int(values[f"{safe_name}__null_count"]),
            "uniqueCount": int(values.get(f"{safe_name}__unique_count", deferred_unique_counts.get(name, 0))),
        }
    return counts_by_column


def build_top_values(
    connection,
    quoted: str,
    sample_values: list[Any],
    unique_count: int,
    row_count: int,
) -> list[tuple[str, int]]:
    unique_pct = percent(unique_count, row_count)
    should_use_exact = unique_count <= EXACT_TOP_VALUES_MAX_UNIQUE or unique_pct <= EXACT_TOP_VALUES_MAX_UNIQUE_PCT
    if should_use_exact:
        return connection.execute(
            f"""
            SELECT CAST({quoted} AS VARCHAR) AS value, COUNT(*) AS count
            FROM active_source
            WHERE {quoted} IS NOT NULL
            GROUP BY 1
            ORDER BY count DESC, value ASC
            LIMIT 10
            """
        ).fetchall()

    counts = Counter(str(value) for value in sample_values[:200] if value is not None)
    return sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:10]


def build_numeric_stats(connection, quoted: str, profile_mode: ProfileMode) -> NumericStats:
    min_value, max_value = connection.execute(
        f"SELECT MIN({quoted}), MAX({quoted}) FROM active_source WHERE {quoted} IS NOT NULL"
    ).fetchone()
    if profile_mode == "drift":
        return NumericStats(
            min=float(min_value) if min_value is not None else None,
            max=float(max_value) if max_value is not None else None,
            mean=None,
            p25=None,
            p50=None,
            p75=None,
            p95=None,
            p99=None,
            stddev=None,
            histogram=[0] * HISTOGRAM_BUCKETS,
        )

    mean_value, stddev_value = connection.execute(
        f"SELECT AVG({quoted}), STDDEV_POP({quoted}) FROM active_source WHERE {quoted} IS NOT NULL"
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


def supports_cardinality_drift(duckdb_type: str) -> bool:
    return detect_type_from_duckdb(duckdb_type) in {"string", "bool"}


def should_use_approx_unique_counts(prepared: PreparedSource, profile_mode: ProfileMode) -> bool:
    return profile_mode == "full" and prepared.format == "parquet" and prepared.size_bytes >= APPROX_UNIQUE_COUNT_SIZE_BYTES


def build_unique_count_projection(
    name: str,
    duckdb_type: str,
    sample_rows: list[dict[str, Any]],
    use_approx_unique_counts: bool,
) -> str:
    quoted = quote_identifier(name)
    safe_name = safe_alias(name)
    if use_approx_unique_counts and should_use_approx_unique_count(name, duckdb_type, sample_rows):
        return f'APPROX_COUNT_DISTINCT({quoted}) FILTER (WHERE {quoted} IS NOT NULL) AS "{safe_name}__unique_count"'
    return f'COUNT(DISTINCT {quoted}) FILTER (WHERE {quoted} IS NOT NULL) AS "{safe_name}__unique_count"'


def should_use_approx_unique_count(column_name: str, duckdb_type: str, sample_rows: list[dict[str, Any]]) -> bool:
    if detect_type_from_duckdb(duckdb_type) == "bool":
        return False
    if is_identifier_column_name(column_name):
        return True
    return count_sample_uniques(sample_rows, column_name) > 50


def should_collect_exact_unique_count(column_name: str, duckdb_type: str, sample_unique_count: int) -> bool:
    if not supports_cardinality_drift(duckdb_type):
        return False
    if is_identifier_column_name(column_name):
        return False
    return sample_unique_count <= 50


def count_sample_uniques(sample_rows: list[dict[str, Any]], column_name: str) -> int:
    return len({row[column_name] for row in sample_rows if row.get(column_name) is not None})


def is_identifier_column_name(column_name: str) -> bool:
    normalized_name = column_name.lower()
    return normalized_name == "id" or normalized_name.endswith("_id")


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
    mapped = detect_type_from_duckdb(duckdb_type)
    observed = {
        classify_value(value)
        for value in sample_values[:50]
        if value is not None and classify_value(value) != "string"
    }
    if mapped == "string" and len(observed) > 1:
        return "mixed"
    return mapped


def detect_type_from_duckdb(duckdb_type: str) -> str:
    normalized_duckdb_type = duckdb_type.upper()
    return next(
        (value for key, value in DUCKDB_TYPE_MAP.items() if normalized_duckdb_type.startswith(key)),
        "string",
    )


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


def safe_alias(value: str) -> str:
    return value.replace('"', "").replace(".", "_").replace(" ", "_")
