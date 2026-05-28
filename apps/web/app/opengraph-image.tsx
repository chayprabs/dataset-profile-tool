import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "radial-gradient(circle at top left, rgba(233,188,120,0.44), transparent 28%), radial-gradient(circle at top right, rgba(24,79,67,0.24), transparent 34%), linear-gradient(180deg, #f5f0e6 0%, #ece4d6 100%)",
          color: "#1c201d",
          display: "flex",
          fontFamily: "Georgia, serif",
          height: "100%",
          padding: "56px",
          width: "100%"
        }}
      >
        <div
          style={{
            border: "1px solid rgba(28,32,29,0.1)",
            borderRadius: "36px",
            display: "flex",
            flex: 1,
            justifyContent: "space-between",
            overflow: "hidden",
            padding: "44px",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "22px",
              maxWidth: "660px"
            }}
          >
            <div
              style={{
                color: "#184f43",
                fontFamily: "monospace",
                fontSize: 22,
                letterSpacing: "0.42em",
                textTransform: "uppercase"
              }}
            >
              DataProfile
            </div>
            <div
              style={{
                fontSize: 78,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 0.95
              }}
            >
              Fast dataset profiling with a calmer review surface.
            </div>
            <div
              style={{
                color: "rgba(28,32,29,0.72)",
                fontSize: 28,
                lineHeight: 1.4
              }}
            >
              CSV, TSV, JSON, JSONL, Parquet, Arrow, Avro, and SQLite profiling with schema inference,
              drift detection, anomaly hints, and exportable reports.
            </div>
          </div>
          <div
            style={{
              alignSelf: "stretch",
              background: "rgba(255,255,255,0.82)",
              border: "1px solid rgba(28,32,29,0.1)",
              borderRadius: "30px",
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              minWidth: "320px",
              padding: "28px",
              width: "320px"
            }}
          >
            <div
              style={{
                color: "#184f43",
                fontFamily: "monospace",
                fontSize: 18,
                letterSpacing: "0.24em",
                textTransform: "uppercase"
              }}
            >
              Outputs
            </div>
            {[
              "Profile reports",
              "Draft 2020-12 schema",
              "Week-over-week drift",
              "PII-safe sample review"
            ].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.94)",
                  border: "1px solid rgba(28,32,29,0.1)",
                  borderRadius: "22px",
                  display: "flex",
                  fontSize: 24,
                  padding: "18px 20px"
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
