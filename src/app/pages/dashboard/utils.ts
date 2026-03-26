import type { ErrorBar, Point, SelectedPoint } from "./types";

export const CLOSE_DISTANCE = 18;
export const POINT_RADIUS = 5;
export const FREEHAND_POINT_SPACING = 10;
export const ERASER_RADIUS = 18;

export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export const polygonArea = (points: Point[]) => {
  if (points.length < 3) return 0;

  let total = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    total += current.x * next.y - next.x * current.y;
  }

  return total / 2;
};

export const ensureOrientation = (points: Point[], clockwise: boolean) => {
  const area = polygonArea(points);
  if (clockwise ? area < 0 : area > 0) {
    return [...points];
  }

  return [...points].reverse();
};

export const pointInPolygon = (point: Point, polygon: Point[]) => {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const xi = polygon[index].x;
    const yi = polygon[index].y;
    const xj = polygon[previous].x;
    const yj = polygon[previous].y;

    const intersects =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi || 1e-6) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};

export const segmentCountToBars = (value: number): ErrorBar[] => [
  { size: "0.05", count: Math.max(1, Math.round(value * 0.12)) },
  { size: "0.10", count: Math.max(1, Math.round(value * 0.2)) },
  { size: "0.20", count: Math.max(1, Math.round(value * 0.3)) },
  { size: "0.30", count: Math.max(1, Math.round(value * 0.22)) },
  { size: "0.50", count: Math.max(1, Math.round(value * 0.16)) },
];

export const getPointLabel = (selection: SelectedPoint) => {
  if (!selection) return "No point selected";
  if (selection.type === "outer") return `Outer boundary point ${selection.index + 1}`;
  return `Hole ${selection.holeIndex + 1}, point ${selection.index + 1}`;
};

export const screenToCanvasPoint = (
  point: Point,
  width: number,
  height: number,
  zoomLevel: number,
): Point => {
  const centerX = width / 2;
  const centerY = height / 2;

  return {
    x: Math.round(centerX + (point.x - centerX) / zoomLevel),
    y: Math.round(centerY + (point.y - centerY) / zoomLevel),
  };
};
