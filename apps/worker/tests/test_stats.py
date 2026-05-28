from pathlib import Path

from core.stats import detect_format


def test_detect_format_supports_all_required_suffixes():
    fixtures = {
        "sample.csv": "csv",
        "sample.tsv": "tsv",
        "sample.json": "json",
        "sample.jsonl": "jsonl",
        "sample.parquet": "parquet",
        "sample.arrow": "arrow",
        "sample.avro": "avro",
        "sample.sqlite": "sqlite",
    }
    for name, expected in fixtures.items():
        assert detect_format(Path(name)) == expected
