const EARTH_RADIUS_KM = 6371;

export type ListAccountItem = {
  id: number;
  node: string;
  start_time?: number;
  end_time?: number;
  start_place_lat?: number;
  start_place_lng?: number;
  end_place_lat?: number;
  end_place_lng?: number;
  distance?: number;
  distance_estimated?: number;
};

export type RentalRide = {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  realDistanceKm: number;
  dayKey: string;
};

export type SummaryStats = {
  totalRides: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  avgDistancePerRideDayKm: number;
  avgTripsPerRideDay: number;
  avgDurationPerRideDayMinutes: number;
};

export type MonthlyStats = SummaryStats & {
  monthKey: string;
};

export type HourlyHeatmapCell = {
  weekday: number; // 0=Sunday, 6=Saturday (JS)
  hour: number; // 0-23
  distanceKm: number;
};

export type DistanceBucket = {
  label: string;
  minKm: number;
  maxKm: number | null; // null = open-ended
};

export type DistanceHistogramBin = {
  bucketLabel: string;
  count: number;
};

export type RideSegment = {
  id: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startTime: Date;
  endTime: Date;
  distanceKm: number;
};

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function extractRentalRides(items: ListAccountItem[] | undefined | null): RentalRide[] {
  if (!items) return [];

  const rides: RentalRide[] = [];

  for (const item of items) {
    if (item.node !== "rental") continue;
    if (!item.start_time || !item.end_time) continue;

    const startTime = new Date(item.start_time * 1000);
    const endTime = new Date(item.end_time * 1000);
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / 60000;

    // skip very short rentals (< 1 minute), like in the reference code
    if (durationMinutes < 1) continue;

    const baseMeters =
      (typeof item.distance === "number" ? item.distance : 0) ||
      (typeof item.distance_estimated === "number" ? item.distance_estimated : 0);

    let realDistanceKm = 0;
    if (baseMeters > 0) {
      realDistanceKm = baseMeters / 1000;
    } else if (
      typeof item.start_place_lat === "number" &&
      typeof item.start_place_lng === "number" &&
      typeof item.end_place_lat === "number" &&
      typeof item.end_place_lng === "number"
    ) {
      realDistanceKm = haversineKm(
        item.start_place_lat,
        item.start_place_lng,
        item.end_place_lat,
        item.end_place_lng,
      );
    }

    const dayKey = startTime.toISOString().slice(0, 10); // YYYY-MM-DD

    rides.push({
      startTime,
      endTime,
      durationMinutes,
      realDistanceKm,
      dayKey,
    });
  }

  return rides;
}

export function computeSummaryStats(rides: RentalRide[]): SummaryStats {
  if (!rides.length) {
    return {
      totalRides: 0,
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      avgDistancePerRideDayKm: 0,
      avgTripsPerRideDay: 0,
      avgDurationPerRideDayMinutes: 0,
    };
  }

  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;

  const perDay: Record<
    string,
    { distanceKm: number; durationMinutes: number; trips: number }
  > = {};

  for (const ride of rides) {
    totalDistanceKm += ride.realDistanceKm;
    totalDurationMinutes += ride.durationMinutes;

    const bucket = perDay[ride.dayKey] ?? {
      distanceKm: 0,
      durationMinutes: 0,
      trips: 0,
    };
    bucket.distanceKm += ride.realDistanceKm;
    bucket.durationMinutes += ride.durationMinutes;
    bucket.trips += 1;
    perDay[ride.dayKey] = bucket;
  }

  const rideDays = Object.values(perDay).filter((d) => d.trips > 0);
  const rideDayCount = rideDays.length || 1;

  const sumDistanceOnRideDays = rideDays.reduce(
    (acc, d) => acc + d.distanceKm,
    0,
  );
  const sumDurationOnRideDays = rideDays.reduce(
    (acc, d) => acc + d.durationMinutes,
    0,
  );

  return {
    totalRides: rides.length,
    totalDistanceKm,
    totalDurationMinutes,
    avgDistancePerRideDayKm: sumDistanceOnRideDays / rideDayCount,
    avgTripsPerRideDay: rides.length / rideDayCount,
    avgDurationPerRideDayMinutes: sumDurationOnRideDays / rideDayCount,
  };
}

export function computeMonthlyStats(rides: RentalRide[]): MonthlyStats[] {
  if (!rides.length) return [];

  const byMonth: Record<string, RentalRide[]> = {};

  for (const ride of rides) {
    const monthKey = `${ride.startTime.getFullYear()}-${String(
      ride.startTime.getMonth() + 1,
    ).padStart(2, "0")}`; // YYYY-MM
    (byMonth[monthKey] ??= []).push(ride);
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([monthKey, monthRides]) => ({
      monthKey,
      ...computeSummaryStats(monthRides),
    }));
}

export function computeHourlyHeatmap(rides: RentalRide[]): {
  cells: HourlyHeatmapCell[];
  maxDistanceKm: number;
} {
  if (!rides.length) {
    return { cells: [], maxDistanceKm: 0 };
  }

  const buckets: Record<string, HourlyHeatmapCell> = {};

  for (const ride of rides) {
    const weekday = ride.startTime.getDay(); // 0-6
    const hour = ride.startTime.getHours(); // 0-23
    const key = `${weekday}-${hour}`;

    const cell =
      buckets[key] ??
      {
        weekday,
        hour,
        distanceKm: 0,
      };

    cell.distanceKm += ride.realDistanceKm;
    buckets[key] = cell;
  }

  const cells = Object.values(buckets);
  const maxDistanceKm = cells.reduce(
    (max, c) => (c.distanceKm > max ? c.distanceKm : max),
    0,
  );

  return { cells, maxDistanceKm };
}

const DEFAULT_DISTANCE_BUCKETS: DistanceBucket[] = [
  { label: "< 1 km", minKm: 0, maxKm: 1 },
  { label: "1–2 km", minKm: 1, maxKm: 2 },
  { label: "2–3 km", minKm: 2, maxKm: 3 },
  { label: "3–5 km", minKm: 3, maxKm: 5 },
  { label: "5–10 km", minKm: 5, maxKm: 10 },
  { label: "10–20 km", minKm: 10, maxKm: 20 },
  { label: "≥ 20 km", minKm: 20, maxKm: null },
];

export function computeDistanceHistogram(
  rides: RentalRide[],
  buckets: DistanceBucket[] = DEFAULT_DISTANCE_BUCKETS,
): DistanceHistogramBin[] {
  if (!rides.length) return [];

  const counts: Record<string, number> = {};
  for (const bucket of buckets) {
    counts[bucket.label] = 0;
  }

  for (const ride of rides) {
    const distance = ride.realDistanceKm;
    const bucket = buckets.find((b) => {
      const withinMin = distance >= b.minKm;
      const withinMax = b.maxKm == null ? true : distance < b.maxKm;
      return withinMin && withinMax;
    });
    if (bucket) {
      counts[bucket.label] += 1;
    }
  }

  return buckets
    .map((b) => ({
      bucketLabel: b.label,
      count: counts[b.label] ?? 0,
    }))
    .filter((bin) => bin.count > 0);
}

export function extractRideSegments(
  items: ListAccountItem[] | undefined | null,
): RideSegment[] {
  if (!items) return [];

  const segments: RideSegment[] = [];

  for (const item of items) {
    if (item.node !== "rental") continue;
    if (
      typeof item.start_place_lat !== "number" ||
      typeof item.start_place_lng !== "number" ||
      typeof item.end_place_lat !== "number" ||
      typeof item.end_place_lng !== "number"
    ) {
      continue;
    }

    const baseMeters =
      (typeof item.distance === "number" ? item.distance : 0) ||
      (typeof item.distance_estimated === "number" ? item.distance_estimated : 0);

    let distanceKm = 0;
    if (baseMeters > 0) {
      distanceKm = baseMeters / 1000;
    } else {
      distanceKm = haversineKm(
        item.start_place_lat,
        item.start_place_lng,
        item.end_place_lat,
        item.end_place_lng,
      );
    }

    segments.push({
      id: item.id,
      startLat: item.start_place_lat,
      startLng: item.start_place_lng,
      endLat: item.end_place_lat,
      endLng: item.end_place_lng,
      startTime: item.start_time ? new Date(item.start_time * 1000) : new Date(),
      endTime: item.end_time ? new Date(item.end_time * 1000) : new Date(),
      distanceKm,
    });
  }

  return segments;
}


