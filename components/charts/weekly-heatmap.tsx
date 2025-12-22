"use client";

import { useMemo } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";

import type { HourlyHeatmapCell } from "@/lib/analytics";

type WeeklyDistanceHeatmapProps = {
  cells: HourlyHeatmapCell[];
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toHeatmapData(cells: HourlyHeatmapCell[]) {
  // Pre-fill a 24 x 7 matrix of zeros so all hours and weekdays are present
  const matrix: number[][] = Array.from({ length: 24 }, () =>
    Array.from({ length: 7 }, () => 0),
  );

  for (const cell of cells) {
    if (
      cell.hour >= 0 &&
      cell.hour < 24 &&
      cell.weekday >= 0 &&
      cell.weekday < 7
    ) {
      matrix[cell.hour][cell.weekday] += cell.distanceKm;
    }
  }

  // Rows: hours (0–23), Columns: weekdays (Sun–Sat)
  return matrix.map((row, hour) => ({
    id: `${hour}:00`,
    data: row.map((distanceKm, weekday) => ({
      x: weekdayLabels[weekday],
      y: Number(distanceKm.toFixed(2)),
    })),
  }));
}

export function WeeklyDistanceHeatmap({ cells }: WeeklyDistanceHeatmapProps) {
  const data = useMemo(() => toHeatmapData(cells), [cells]);

  if (!data.length) return null;

  return (
    <div style={{ height: 350 }}>
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 20, right: 10, bottom: 45, left: 50 }}
        valueFormat={(value) => `${value} km`}
        axisTop={null}
        axisRight={null}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        colors={{
          type: "sequential",
          scheme: "greens",
        }}
        emptyColor="#1f2937"
        inactiveOpacity={0.4}
        borderWidth={1}
        borderColor="#020617"
        labelTextColor="#000000"
        label={() => ""}
        legends={[
          {
            anchor: "bottom",
            translateX: 0,
            translateY: 30,
            length: 200,
            thickness: 10,
            direction: "row",
            tickPosition: "after",
            tickSize: 3,
            tickSpacing: 4,
            tickOverlap: false,
            title: "Distance (km) →",
            titleAlign: "start",
            titleOffset: 4,
          },
        ]}
        tooltip={({ cell }) => {
          const { serieId, formattedValue } = cell;
          return (
            <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
              <div className="font-medium">{serieId}</div>
              <div className="font-mono">{formattedValue}</div>
            </div>
          );
        }}
      />
    </div>
  );
}

