from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


ProfileType = Literal[
    "int",
    "float",
    "string",
    "bool",
    "date",
    "datetime",
    "timestamp",
    "binary",
    "mixed",
]

ProfileFormat = Literal[
    "csv",
    "tsv",
    "json",
    "jsonl",
    "parquet",
    "arrow",
    "avro",
    "sqlite",
]


class TopValue(BaseModel):
    value: Any
    count: int


class NumericStats(BaseModel):
    min: float | None
    max: float | None
    mean: float | None
    p25: float | None
    p50: float | None
    p75: float | None
    p95: float | None
    p99: float | None
    stddev: float | None
    histogram: list[int]


class StringStats(BaseModel):
    minLen: int = 0
    maxLen: int = 0
    charClasses: dict[str, int] = Field(default_factory=dict)


class DateStats(BaseModel):
    min: str | None = None
    max: str | None = None
    pattern: str | None = None


class BooleanStats(BaseModel):
    trueCount: int
    falseCount: int


class ColumnProfile(BaseModel):
    name: str
    inferredType: ProfileType
    nullable: bool
    nullCount: int
    nullPct: float
    uniqueCount: int
    uniquePct: float
    topValues: list[TopValue]
    format: str | None = None
    numeric: NumericStats | None = None
    string: StringStats | None = None
    date: DateStats | None = None
    boolean: BooleanStats | None = None
    piiFlags: list[str] = Field(default_factory=list)
    anomalies: list[str] = Field(default_factory=list)
    confidence: float = 0.0


class SourceSummary(BaseModel):
    format: ProfileFormat
    sizeBytes: int
    rowCount: int
    sha256: str


class ProfileResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    jobId: str
    source: SourceSummary
    columns: list[ColumnProfile]
    schemaDocument: dict[str, Any] = Field(alias="schema", serialization_alias="schema")
    warnings: list[str]
    sampleRows: list[dict[str, Any]] = Field(default_factory=list)


class DriftChange(BaseModel):
    kind: Literal["added", "removed", "type", "range", "cardinality"]
    column: str
    severity: Literal["additive", "compatible", "breaking"]
    message: str
    before: Any | None = None
    after: Any | None = None
    patchHint: dict[str, Any] | None = None


class DriftResponse(BaseModel):
    added: list[str]
    removed: list[str]
    typeChanges: list[DriftChange]
    rangeChanges: list[DriftChange]
    cardinalityChanges: list[DriftChange]
    changes: list[DriftChange]


class ShareCreateRequest(BaseModel):
    kind: Literal["profile", "drift"]
    payload: dict[str, Any]


class ShareCreateResponse(BaseModel):
    token: str
    kind: Literal["profile", "drift"]
    expiresAt: str


class ShareFetchResponse(BaseModel):
    token: str
    kind: Literal["profile", "drift"]
    payload: dict[str, Any]
    expiresAt: str
