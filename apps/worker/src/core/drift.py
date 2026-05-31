from __future__ import annotations

from models import ColumnProfile, DriftChange, DriftResponse, ProfileResponse


def diff_profiles(before: ProfileResponse, after: ProfileResponse) -> DriftResponse:
    before_columns = {column.name: column for column in before.columns}
    after_columns = {column.name: column for column in after.columns}

    added = sorted(set(after_columns) - set(before_columns))
    removed = sorted(set(before_columns) - set(after_columns))
    type_changes: list[DriftChange] = []
    range_changes: list[DriftChange] = []
    cardinality_changes: list[DriftChange] = []

    for column_name in sorted(set(before_columns) & set(after_columns)):
        before_column = before_columns[column_name]
        after_column = after_columns[column_name]
        if before_column.inferredType != after_column.inferredType:
            severity = classify_type_severity(before_column.inferredType, after_column.inferredType)
            type_changes.append(
                DriftChange(
                    kind="type",
                    column=column_name,
                    severity=severity,
                    message=f"{column_name} changed type from {before_column.inferredType} to {after_column.inferredType}",
                    before=before_column.inferredType,
                    after=after_column.inferredType,
                    patchHint={
                        "op": "replace",
                        "path": f"/properties/{column_name}/type",
                        "value": before_column.inferredType,
                    },
                )
            )
        if before_column.numeric and after_column.numeric and not is_identifier_like(column_name, before_column, after_column):
            if before_column.numeric.max != after_column.numeric.max:
                severity = "additive" if (after_column.numeric.max or 0) >= (before_column.numeric.max or 0) else "breaking"
                range_changes.append(
                    DriftChange(
                        kind="range",
                        column=column_name,
                        severity=severity,
                        message=f"{column_name} max changed",
                        before=before_column.numeric.max,
                        after=after_column.numeric.max,
                    )
                )
        if before_column.uniqueCount != after_column.uniqueCount and should_flag_cardinality_change(
            column_name, before_column, after_column
        ):
            delta = after_column.uniqueCount - before_column.uniqueCount
            severity = "additive" if delta >= 0 else "breaking"
            cardinality_changes.append(
                DriftChange(
                    kind="cardinality",
                    column=column_name,
                    severity=severity,
                    message=f"{column_name} unique count changed by {delta}",
                    before=before_column.uniqueCount,
                    after=after_column.uniqueCount,
                )
            )

    added_changes = [
        DriftChange(
            kind="added",
            column=column_name,
            severity="additive",
            message=f"{column_name} added",
            after=export_column_snapshot(after_columns[column_name]),
        )
        for column_name in added
    ]
    removed_changes = [
        DriftChange(
            kind="removed",
            column=column_name,
            severity="breaking",
            message=f"{column_name} removed",
            before=export_column_snapshot(before_columns[column_name]),
            patchHint={"op": "add", "path": f"/properties/{column_name}", "value": before_columns[column_name].inferredType},
        )
        for column_name in removed
    ]

    changes = [*added_changes, *removed_changes, *type_changes, *range_changes, *cardinality_changes]
    return DriftResponse(
        added=added,
        removed=removed,
        typeChanges=type_changes,
        rangeChanges=range_changes,
        cardinalityChanges=cardinality_changes,
        changes=changes,
    )


def classify_type_severity(before_type: str, after_type: str) -> str:
    compatible_pairs = {("int", "float"), ("date", "timestamp")}
    if (before_type, after_type) in compatible_pairs:
        return "compatible"
    if before_type == after_type:
        return "compatible"
    return "breaking"


def is_identifier_like(column_name: str, before_column: ColumnProfile, after_column: ColumnProfile) -> bool:
    normalized_name = column_name.lower()
    if normalized_name == "id" or normalized_name.endswith("_id"):
        return True
    return False


def export_column_snapshot(column: ColumnProfile) -> dict:
    data = column.model_dump(mode="json")
    if data.get("uniquePct", 0) > 100:
        observed = len({str(item.value) for item in column.topValues})
        data["uniqueCount"] = observed
        data["uniquePct"] = min(100.0, round(observed * 100.0 / max(observed + column.nullCount, 1), 4))
    return data


def should_flag_cardinality_change(column_name: str, before_column: ColumnProfile, after_column: ColumnProfile) -> bool:
    if is_identifier_like(column_name, before_column, after_column):
        return False
    if before_column.piiFlags or after_column.piiFlags:
        return False
    if before_column.inferredType not in {"string", "bool"} or after_column.inferredType not in {"string", "bool"}:
        return False
    return max(before_column.uniqueCount, after_column.uniqueCount) <= 50
