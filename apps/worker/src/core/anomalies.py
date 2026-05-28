from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from typing import Iterable

NULL_TOKENS = {"na", "n/a", "?", "-", "null"}
HEX_LIKE_RE = re.compile(r"^[0-9a-f]{24,}$", re.IGNORECASE)


def shannon_entropy(value: str) -> float:
    if not value:
        return 0.0
    counts = Counter(value)
    length = len(value)
    return -sum((count / length) * math.log2(count / length) for count in counts.values())


def detect_anomalies(column_name: str, values: Iterable[object]) -> list[str]:
    normalized = [str(value) for value in values if value not in (None, "")]
    anomalies: list[str] = []

    numeric_like = [value for value in normalized if value.isdigit()]
    if numeric_like and any(value.startswith("0") and len(value) > 1 for value in numeric_like):
        anomalies.append("leading_zero_numeric_string")

    date_separators = {
        next((char for char in value if char in "-/."), None) for value in normalized if any(char.isdigit() for char in value)
    }
    if len({separator for separator in date_separators if separator is not None}) > 1:
        anomalies.append("mixed_date_formats")

    if any(unicodedata.normalize("NFC", value) != value for value in normalized):
        anomalies.append("unicode_normalization_mismatch")

    if normalized and (
        sum(shannon_entropy(value) > 3.8 for value in normalized) >= max(2, len(normalized) // 3)
        or any(HEX_LIKE_RE.match(value) for value in normalized)
    ):
        anomalies.append("high_entropy_strings")

    if any(value.strip().lower() in NULL_TOKENS for value in normalized):
        anomalies.append("suspicious_null_tokens")

    if "id" in column_name.lower() and any("-" in value for value in normalized):
        anomalies.append("mixed_identifier_shapes")

    return anomalies
