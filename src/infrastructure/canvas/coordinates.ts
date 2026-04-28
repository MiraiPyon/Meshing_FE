import type { Point } from "../../modules/geometry/domain/types";

export function screenToCanvasPoint(
  point: Point,
  width: number,
  height: number,
  zoomLevel: number,
  panOffset: Point = { x: 0, y: 0 },
): Point {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    x: Math.round(centerX + (point.x - centerX - panOffset.x) / zoomLevel),
    y: Math.round(centerY + (point.y - centerY - panOffset.y) / zoomLevel),
  };
}
