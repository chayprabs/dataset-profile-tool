from core.anomalies import detect_anomalies


def test_detect_anomalies_flags_expected_patterns():
    anomalies = detect_anomalies(
        "customer_id",
        [
            "0012",
            "2026-05-01",
            "05/02/2026",
            "n\u0303",
            "NA",
            "a93f1c4428d6cce13f34ea6d5233d4a2",
        ],
    )
    assert "leading_zero_numeric_string" in anomalies
    assert "mixed_date_formats" in anomalies
    assert "unicode_normalization_mismatch" in anomalies
    assert "suspicious_null_tokens" in anomalies
