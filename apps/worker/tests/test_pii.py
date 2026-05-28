from core.pii import detect_pii_flags, passes_luhn


def test_detect_pii_flags_finds_expected_patterns():
    flags = detect_pii_flags(
        "customer_email",
        [
            "devika@example.com",
            "+1 (555) 123-4567",
            "4111111111111111",
            "GB82WEST12345698765432",
            "123-45-6789",
        ],
    )
    assert {"email", "phone", "credit_card", "iban", "ssn"} <= set(flags)


def test_luhn_rejects_invalid_card():
    assert passes_luhn("4111111111111111")
    assert not passes_luhn("4111111111111112")
