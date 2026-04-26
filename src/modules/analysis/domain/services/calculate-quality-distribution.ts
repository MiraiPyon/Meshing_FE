import type { ErrorBar } from "../types";
import type { MeshElement } from "../../../meshing/domain/types";

export function calculateQualityDistribution(value: number | MeshElement[]): ErrorBar[] {
  if (Array.isArray(value)) {
    const buckets = [
      { count: 0, max: Number.POSITIVE_INFINITY, min: 35, size: "35+" },
      { count: 0, max: 35, min: 25, size: "25-35" },
      { count: 0, max: 25, min: 20.7, size: "20.7-25" },
      { count: 0, max: 20.7, min: Number.NEGATIVE_INFINITY, size: "<20.7" },
    ];

    value.forEach((element) => {
      const bucket = buckets.find(
        ({ max, min }) => element.minAngle >= min && element.minAngle < max,
      );
      if (bucket) {
        bucket.count += 1;
      }
    });

    return buckets.map(({ count, size }) => ({ count, size }));
  }

  return [
    { count: Math.max(1, Math.round(value * 0.12)), size: "0.05" },
    { count: Math.max(1, Math.round(value * 0.2)), size: "0.10" },
    { count: Math.max(1, Math.round(value * 0.3)), size: "0.20" },
    { count: Math.max(1, Math.round(value * 0.22)), size: "0.30" },
    { count: Math.max(1, Math.round(value * 0.16)), size: "0.50" },
  ];
}
