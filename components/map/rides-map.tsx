"use client";

import { useMemo, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import L from "leaflet";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";

import type { RideSegment } from "@/lib/analytics";

type RidesMapProps = {
  segments: RideSegment[];
};

// Fix for default marker icons in Next.js
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// Create custom icons for start and end points (smaller size)
const startIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  popupAnchor: [1, -25],
  shadowSize: [30, 30],
});

const endIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [18, 30],
  iconAnchor: [9, 30],
  popupAnchor: [1, -25],
  shadowSize: [30, 30],
});

function computeBounds(segments: RideSegment[]): LatLngBoundsExpression | undefined {
  if (!segments.length) return undefined;

  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  for (const s of segments) {
    minLat = Math.min(minLat, s.startLat, s.endLat);
    maxLat = Math.max(maxLat, s.startLat, s.endLat);
    minLng = Math.min(minLng, s.startLng, s.endLng);
    maxLng = Math.max(maxLng, s.startLng, s.endLng);
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

// Component to handle map bounds updates
function MapBounds({ bounds }: { bounds: LatLngBoundsExpression | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, bounds]);

  return null;
}

// Interpolate arc between two points using Bezier curve (similar to reference code)
function interpolateArc(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  n: number = 20,
  height: number = 0.1,
): LatLngTuple[] {
  // Convert latitude and longitude from degrees to radians
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const rLat1 = toRad(lat1);
  const rLng1 = toRad(lng1);
  const rLat2 = toRad(lat2);
  const rLng2 = toRad(lng2);

  // Compute the midpoint
  const midLat = (rLat1 + rLat2) / 2;
  const midLng = (rLng1 + rLng2) / 2;

  // Control point height adjustment
  const dLat = rLat2 - rLat1;
  const dLng = rLng2 - rLng1;
  const factor = 0.75 + Math.random() * 0.5; // 0.75 to 1.25

  // Determine height direction based on longitude difference
  const heightDirection = Math.sign(dLng);
  const ctrlLat = midLat + heightDirection * height * dLng * factor;
  const ctrlLng = midLng - heightDirection * height * dLat * factor;

  // Generate points along the Bezier curve
  const points: LatLngTuple[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const curveLat = (1 - t) ** 2 * rLat1 + 2 * (1 - t) * t * ctrlLat + t ** 2 * rLat2;
    const curveLng = (1 - t) ** 2 * rLng1 + 2 * (1 - t) * t * ctrlLng + t ** 2 * rLng2;
    points.push([toDeg(curveLat), toDeg(curveLng)]);
  }

  return points;
}

export function RidesMap({ segments }: RidesMapProps) {
  const bounds = useMemo(() => computeBounds(segments), [segments]);
  const center = useMemo(() => {
    if (!bounds || !Array.isArray(bounds) || bounds.length !== 2) {
      return [51.05, 13.74] as LatLngTuple; // rough default (Dresden)
    }
    const [[minLat, minLng], [maxLat, maxLng]] = bounds as [[number, number], [number, number]];
    return [((minLat + maxLat) / 2), ((minLng + maxLng) / 2)] as LatLngTuple;
  }, [bounds]);

  // Collect all unique start and end points with their counts
  const { startPoints, endPoints } = useMemo(() => {
    const startMap = new Map<string, { lat: number; lng: number; count: number; segments: RideSegment[] }>();
    const endMap = new Map<string, { lat: number; lng: number; count: number; segments: RideSegment[] }>();

    for (const segment of segments) {
      const startKey = `${segment.startLat.toFixed(6)},${segment.startLng.toFixed(6)}`;
      const endKey = `${segment.endLat.toFixed(6)},${segment.endLng.toFixed(6)}`;

      const startEntry = startMap.get(startKey) || { lat: segment.startLat, lng: segment.startLng, count: 0, segments: [] };
      startEntry.count += 1;
      startEntry.segments.push(segment);
      startMap.set(startKey, startEntry);

      const endEntry = endMap.get(endKey) || { lat: segment.endLat, lng: segment.endLng, count: 0, segments: [] };
      endEntry.count += 1;
      endEntry.segments.push(segment);
      endMap.set(endKey, endEntry);
    }

    return { startPoints: startMap, endPoints: endMap };
  }, [segments]);

  if (!segments.length) return null;

  return (
    <div className="h-[600px] w-full overflow-hidden rounded-lg border bg-muted/30">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBounds bounds={bounds} />
        {segments.map((segment) => {
          const arcPoints = interpolateArc(
            segment.startLat,
            segment.startLng,
            segment.endLat,
            segment.endLng,
            20,
            0.1,
          );
          return (
            <Polyline
              key={`arc-${segment.id}`}
              positions={arcPoints}
              pathOptions={{
                color: "#3b82f6",
                weight: 2,
                opacity: 0.6,
              }}
            />
          );
        })}
        {Array.from(startPoints.entries()).map(([key, point]) => (
          <Marker
            key={`start-${key}`}
            position={[point.lat, point.lng] as LatLngTuple}
            icon={startIcon}
            draggable={false}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-green-700">Start Point</div>
                <div className="text-xs text-muted-foreground">
                  {point.count} {point.count === 1 ? "ride" : "rides"} started here
                </div>
                <div className="mt-1 text-xs font-mono">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {Array.from(endPoints.entries()).map(([key, point]) => (
          <Marker
            key={`end-${key}`}
            position={[point.lat, point.lng] as LatLngTuple}
            icon={endIcon}
            draggable={false}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold text-red-700">End Point</div>
                <div className="text-xs text-muted-foreground">
                  {point.count} {point.count === 1 ? "ride" : "rides"} ended here
                </div>
                <div className="mt-1 text-xs font-mono">
                  {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

