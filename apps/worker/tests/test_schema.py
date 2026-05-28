from core.schema import infer_json_schema
from models import ColumnProfile, TopValue


def test_infer_json_schema_builds_draft_2020_document():
    schema = infer_json_schema(
        [
            ColumnProfile(
                name="email",
                inferredType="string",
                nullable=False,
                nullCount=0,
                nullPct=0,
                uniqueCount=2,
                uniquePct=100,
                topValues=[TopValue(value="a@example.com", count=1), TopValue(value="b@example.com", count=1)],
                piiFlags=["email"],
                format="email",
                anomalies=[],
                confidence=0.98,
            )
        ]
    )
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert schema["properties"]["email"]["format"] == "email"
    assert schema["properties"]["email"]["x-confidence"] == 0.98
