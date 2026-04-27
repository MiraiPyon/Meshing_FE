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

export function canvasToScreenPoint(
  point: Point,
  width: number,
  height: number,
  zoomLevel: number,
  panOffset: Point = { x: 0, y: 0 },
): Point {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    x: centerX + panOffset.x + (point.x - centerX) * zoomLevel,
    y: centerY + panOffset.y + (point.y - centerY) * zoomLevel,
  };
}
