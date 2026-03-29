import type { Loop, Point } from "../types";

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export const polygonArea = (points: Loop) => {
  if (points.length < 3) {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    total += current.x * next.y - next.x * current.y;
  }

  return total / 2;
};
