import type { ErrorBar } from "../types";

export function calculateQualityDistribution(value: number): ErrorBar[] {
  return [
    { count: Math.max(1, Math.round(value * 0.12)), size: "0.05" },
    { count: Math.max(1, Math.round(value * 0.2)), size: "0.10" },
    { count: Math.max(1, Math.round(value * 0.3)), size: "0.20" },
    { count: Math.max(1, Math.round(value * 0.22)), size: "0.30" },
    { count: Math.max(1, Math.round(value * 0.16)), size: "0.50" },
  ];
}
