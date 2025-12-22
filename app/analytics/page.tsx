"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeeklyDistanceHeatmap } from "@/components/charts/weekly-heatmap";
import { DistanceHistogram } from "@/components/charts/distance-histogram";
import {
  computeDistanceHistogram,
  computeHourlyHeatmap,
  computeMonthlyStats,
  computeSummaryStats,
  extractRentalRides,
  extractRideSegments,
  type ListAccountItem,
} from "@/lib/analytics";

const LIST_URL = "https://api.nextbike.net/api/v1.1/list.json";
const API_KEY = "rXXqTgQZUPZ89lzB";

type ListUser = {
  id: number;
  email: string;
  screen_name: string;
};

type ListResponse = {
  server_time: number;
  user: ListUser;
  account?: {
    items?: ListAccountItem[];
  };
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ListResponse | null>(null);

  const RidesMap = useMemo(
    () =>
      dynamic(() => import("@/components/map/rides-map").then((m) => m.RidesMap), {
        loading: () => <p className="text-sm text-muted-foreground">Loading map...</p>,
        ssr: false,
      }),
    [],
  );
  

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const stored = typeof window !== "undefined"
          ? window.sessionStorage.getItem("nextbike_session")
          : null;

        if (!stored) {
          setError("No active session found. Please log in again.");
          return;
        }

        const session = JSON.parse(stored) as { user?: { loginkey?: string } };
        const loginkey = session.user?.loginkey;

        if (!loginkey) {
          setError("No login key found in session. Please log in again.");
          return;
        }

        const response = await axios.get<ListResponse>(LIST_URL, {
          params: {
            apikey: API_KEY,
            loginkey,
            limit: 10000000000,
          },
        });

        if (!cancelled) {
          setData(response.data);
        }
      } catch (err) {
        const message =
          axios.isAxiosError(err) && err.response
            ? `Failed to load rides: ${err.response.status} ${err.response.statusText}`
            : "Failed to load rides. Please try again.";
        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const user = data?.user;
  const rentalRides = extractRentalRides(data?.account?.items);
  const summary = computeSummaryStats(rentalRides);
  const monthly = computeMonthlyStats(rentalRides);
  const { cells: heatmapCells } = computeHourlyHeatmap(rentalRides);
  const distanceBins = computeDistanceHistogram(rentalRides);
  const rideSegments = extractRideSegments(data?.account?.items);

  const formatKm = (value: number) => `${value.toFixed(1)} km`;
  const formatMinutes = (value: number) => {
    const totalMinutes = Math.round(value);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    return `${hours} h ${minutes} min`;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted px-4 py-6">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-lg font-semibold">
            {user?.screen_name ?? "Nextbike Analytics"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {user ? (
              <>
                User ID: <span className="font-mono">{user.id}</span> · Email:{" "}
                <span className="font-mono break-all">{user.email}</span>
              </>
            ) : (
              "Loading user information…"
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.sessionStorage.removeItem("nextbike_session");
            }
            router.push("/");
          }}
        >
          Log out
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Rides overview</CardTitle>
            <CardDescription>
              All rides downloaded from Nextbike. The metrics below are based on completed rentals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {loading && <p>Loading rides…</p>}
            {!loading && error && (
              <p className="text-destructive">{error}</p>
            )}
            {!loading && !error && (
              <>
                <p>
                  Loaded{" "}
                  <span className="font-mono">{summary.totalRides}</span>{" "}
                  rides.
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total rides
                    </div>
                    <div className="text-lg font-semibold font-mono">
                      {summary.totalRides}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total ride distance
                    </div>
                    <div className="text-lg font-semibold font-mono">
                      {formatKm(summary.totalDistanceKm)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Total ride time
                    </div>
                    <div className="text-lg font-semibold font-mono">
                      {formatMinutes(summary.totalDurationMinutes)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Avg distance per ride day
                    </div>
                    <div className="text-lg font-semibold font-mono">
                      {formatKm(summary.avgDistancePerRideDayKm)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Avg trips per ride day
                    </div>
                    <div className="text-lg font-semibold font-mono">
                      {summary.avgTripsPerRideDay.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Avg time ridden on ride day
                    </div>
                    <div className="text-lg font-semibold font-mono">
                      {formatMinutes(summary.avgDurationPerRideDayMinutes)}
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!loading && !error && monthly.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly breakdown</CardTitle>
              <CardDescription>
                Totals and ride-day averages per calendar month (only months with riding activity are shown).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto text-sm">
              <table className="w-full border-collapse text-left">
                <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4 text-right">Rides</th>
                    <th className="py-2 pr-4 text-right">Distance</th>
                    <th className="py-2 pr-4 text-right">Ride time</th>
                    <th className="py-2 pr-4 text-right">Avg dist / ride day</th>
                    <th className="py-2 pr-0 text-right">Avg time / ride day</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((m) => (
                    <tr key={m.monthKey} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono">{m.monthKey}</td>
                      <td className="py-2 pr-4 text-right font-mono">{m.totalRides}</td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {formatKm(m.totalDistanceKm)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {formatMinutes(m.totalDurationMinutes)}
                      </td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {formatKm(m.avgDistancePerRideDayKm)}
                      </td>
                      <td className="py-2 pr-0 text-right font-mono">
                        {formatMinutes(m.avgDurationPerRideDayMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {!loading && !error && heatmapCells.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly hourly distance heatmap</CardTitle>
              <CardDescription>
                Rows show hours (0-23), columns show weekdays. Hover over cells to see distance in kilometers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <WeeklyDistanceHeatmap cells={heatmapCells} />
            </CardContent>
          </Card>
        )}

        {!loading && !error && distanceBins.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trip length distribution</CardTitle>
              <CardDescription>
                Number of trips by distance bucket (in kilometers).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <DistanceHistogram bins={distanceBins} />
            </CardContent>
          </Card>
        )}

        {!loading && !error && rideSegments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rides map</CardTitle>
              <CardDescription>
                Interactive map showing start points (green) and end points (red) of all rides.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RidesMap segments={rideSegments} />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}


