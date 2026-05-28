from __future__ import annotations

import re
from typing import Iterable

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9][0-9\-\s\(\)]{7,}$")
SSN_RE = re.compile(r"^\d{3}-\d{2}-\d{4}$")
IBAN_RE = re.compile(r"^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$")
UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
URI_RE = re.compile(r"^https?://")
DATE_TIME_RE = re.compile(r"^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}")

NAME_HINTS = {
    "email": "email",
    "phone": "phone",
    "ssn": "ssn",
    "dob": "dob",
    "iban": "iban",
    "card": "credit_card",
    "addr": "address_hint",
}


def passes_luhn(value: str) -> bool:
    digits = [int(char) for char in value if char.isdigit()]
    if len(digits) < 13:
        return False
    checksum = 0
    parity = len(digits) % 2
    for index, digit in enumerate(digits):
        if index % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit
    return checksum % 10 == 0


def detect_pii_flags(column_name: str, values: Iterable[object]) -> list[str]:
    flags: set[str] = set()
    normalized_name = column_name.lower()
    for hint, flag in NAME_HINTS.items():
        if hint in normalized_name:
            flags.add(flag)

    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if not text:
            continue
        if EMAIL_RE.match(text):
            flags.add("email")
        if PHONE_RE.match(text):
            flags.add("phone")
        if SSN_RE.match(text):
            flags.add("ssn")
        if IBAN_RE.match(text):
            flags.add("iban")
        if UUID_RE.match(text):
            flags.add("uuid")
        if URI_RE.match(text):
            flags.add("uri")
        if DATE_TIME_RE.match(text):
            flags.add("date-time")
        digits = "".join(char for char in text if char.isdigit())
        if len(digits) == 16:
            flags.add("generic_16_digit")
            if passes_luhn(text):
                flags.add("credit_card")
    return sorted(flags)
