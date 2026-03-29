import type { Point } from "../../modules/geometry/domain/types";

export function screenToCanvasPoint(
  point: Point,
  width: number,
  height: number,
  zoomLevel: number,
): Point {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    x: Math.round(centerX + (point.x - centerX) / zoomLevel),
    y: Math.round(centerY + (point.y - centerY) / zoomLevel),
  };
}
