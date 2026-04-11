import type { Loop, Point } from "../types";

export const pointInPolygon = (point: Point, polygon: Loop) => {
  let inside = false;

  for (
    let index = 0, previous = polygon.length - 1;
    index < polygon.length;
    previous = index++
  ) {
    const xi = polygon[index].x;
    const yi = polygon[index].y;
    const xj = polygon[previous].x;
    const yj = polygon[previous].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-6) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};
