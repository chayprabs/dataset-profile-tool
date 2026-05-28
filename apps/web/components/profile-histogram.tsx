"use client";

import { scaleBand, scaleLinear } from "@visx/scale";
import { Bar } from "@visx/shape";

export function ProfileHistogram({ values }: { values: number[] }) {
  const width = 280;
  const height = 120;
  const chartHeight = height - 20;
  const maxValue = Math.max(...values, 1);
  const xScale = scaleBand<number>({
    domain: values.map((_, index) => index),
    range: [0, width],
    padding: 0.18
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxValue],
    range: [chartHeight, 0],
    nice: true
  });

  return (
    <svg
      aria-label="Histogram"
      className="h-auto w-full"
      viewBox={`0 0 ${width} ${height}`}
    >
      {values.map((value, index) => {
        const x = xScale(index) ?? 0;
        const barWidth = xScale.bandwidth();
        const barHeight = chartHeight - yScale(value);
        return (
          <Bar
            key={`hist-${index}`}
            fill={index % 2 === 0 ? "#0e5f4f" : "#d59644"}
            height={barHeight}
            rx={8}
            width={barWidth}
            x={x}
            y={chartHeight - barHeight}
          />
        );
      })}
      <line stroke="#d8d0c4" strokeWidth="1" x1="0" x2={width} y1={chartHeight} y2={chartHeight} />
      <text fill="#171717" fontSize="10" x="0" y={height - 2}>
        low
      </text>
      <text fill="#171717" fontSize="10" textAnchor="end" x={width} y={height - 2}>
        high
      </text>
    </svg>
  );
}
