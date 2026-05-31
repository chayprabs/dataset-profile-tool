from __future__ import annotations

from models import ColumnProfile

STANDARD_FORMATS = {"email", "uri", "uuid", "date-time", "date"}

TYPE_MAP = {
    "int": "integer",
    "float": "number",
    "string": "string",
    "bool": "boolean",
    "date": "string",
    "datetime": "string",
    "timestamp": "string",
    "binary": "string",
    "mixed": ["string", "number", "boolean"],
}


def infer_json_schema(columns: list[ColumnProfile]) -> dict:
    properties: dict[str, dict] = {}
    required: list[str] = []

    for column in columns:
        schema_type = TYPE_MAP[column.inferredType]
        normalized_examples = [normalize_schema_value(column, value.value) for value in column.topValues[:3]]
        property_schema: dict = {
            "type": schema_type,
            "title": column.name,
            "examples": normalized_examples,
            "x-confidence": round(column.confidence, 4),
        }
        if column.numeric:
            if column.numeric.min is not None:
                property_schema["minimum"] = column.numeric.min
            if column.numeric.max is not None:
                property_schema["maximum"] = column.numeric.max
        if column.string:
            property_schema["minLength"] = column.string.minLen
            property_schema["maxLength"] = column.string.maxLen
        if column.inferredType in {"date", "datetime", "timestamp"}:
            property_schema["format"] = "date-time" if column.inferredType != "date" else "date"
        if column.format:
            if column.format in STANDARD_FORMATS:
                property_schema["format"] = column.format
            else:
                property_schema["x-dataprofile-formatHint"] = column.format
        if column.piiFlags:
            property_schema["x-dataprofile-piiFlags"] = column.piiFlags
        if (
            column.uniqueCount
            and column.uniqueCount <= 10
            and len(column.topValues) == column.uniqueCount
            and column.inferredType not in {"date", "datetime", "timestamp"}
        ):
            property_schema["enum"] = [normalize_schema_value(column, value.value) for value in column.topValues]
        if column.nullable:
            property_schema["type"] = (
                [*property_schema["type"], "null"]
                if isinstance(property_schema["type"], list)
                else [property_schema["type"], "null"]
            )
        else:
            required.append(column.name)
        properties[column.name] = property_schema

    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": properties,
        "required": required,
        "additionalProperties": False,
    }


def normalize_schema_value(column: ColumnProfile, value: object) -> object:
    if value is None:
        return None
    if column.inferredType == "int":
        return int(value)
    if column.inferredType == "float":
        return float(value)
    if column.inferredType == "bool":
        if isinstance(value, bool):
            return value
        return str(value).strip().lower() == "true"
    if column.inferredType in {"date", "datetime", "timestamp"}:
        return normalize_datetime_like(str(value))
    return value


def normalize_datetime_like(value: str) -> str:
    if " " in value and "T" not in value:
        date_part, time_part = value.split(" ", 1)
        return f"{date_part}T{time_part}"
    return value
