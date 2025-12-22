"use client";

import { ResponsiveBar } from "@nivo/bar";

import type { DistanceHistogramBin } from "@/lib/analytics";

type DistanceHistogramProps = {
  bins: DistanceHistogramBin[];
};

export function DistanceHistogram({ bins }: DistanceHistogramProps) {
  if (!bins.length) return null;

  const data = bins.map((bin) => ({
    bucket: bin.bucketLabel,
    trips: bin.count,
  }));

  return (
    <div style={{ height: 300 }}>
      <ResponsiveBar
        data={data}
        keys={["trips"]}
        indexBy="bucket"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        colors="#3b82f6"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: "Trip length (km)",
          legendPosition: "middle",
          legendOffset: 45,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Number of trips",
          legendPosition: "middle",
          legendOffset: -50,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor="#ffffff"
        tooltip={({ value }) => (
          <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
            <div className="font-mono">{value} trips</div>
          </div>
        )}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: "hsl(var(--gray-500))",
                fontSize: 11,
              },
            },
            legend: {
              text: {
                fill: "hsl(var(--muted-foreground))",
                fontSize: 12,
              },
            },
          },
        }}
      />
    </div>
  );
}

