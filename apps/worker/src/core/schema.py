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
        property_schema: dict = {
            "type": schema_type,
            "title": column.name,
            "examples": [value.value for value in column.topValues[:3]],
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
        if column.uniqueCount and column.uniqueCount <= 10 and len(column.topValues) == column.uniqueCount:
            property_schema["enum"] = [value.value for value in column.topValues]
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
