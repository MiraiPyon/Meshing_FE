import type { Loop } from "../types";
import { polygonArea } from "./measurements";

export const ensureOrientation = (points: Loop, clockwise: boolean) => {
  const area = polygonArea(points);
  if (clockwise ? area < 0 : area > 0) {
    return [...points];
  }

  return [...points].reverse();
};
