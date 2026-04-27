import { ERASER_RADIUS, POINT_RADIUS } from "../../modules/workspace/application/constants";
import type { Point } from "../../modules/geometry/domain/types";
import type { MeshEdge } from "../../modules/meshing/domain/types";
import type {
  DraftType,
  SelectedPoint,
  Tool,
} from "../../modules/workspace/application/types";

export type DashboardCanvasModel = {
  activeTool: Tool;
  draftStrokes: Point[][];
  draftType: DraftType;
  hasMesh: boolean;
  holeLoops: Point[][];
  meshEdges: MeshEdge[];
  meshNodes: Point[];
  mousePos: Point;
  panOffset: Point;
  outerLoop: Point[];
  selectedPoint: SelectedPoint;
  zoomLevel: number;
};

export function renderDashboardCanvas(
  canvas: HTMLCanvasElement,
  {
    activeTool,
    draftStrokes,
    draftType,
    hasMesh,
    holeLoops,
    meshEdges,
    meshNodes,
    mousePos,
    panOffset,
    outerLoop,
    selectedPoint,
    zoomLevel,
  }: DashboardCanvasModel,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2 + panOffset.x, height / 2 + panOffset.y);
  ctx.scale(zoomLevel, zoomLevel);
  ctx.translate(-width / 2, -height / 2);

  const centerX = width / 2;
  const centerY = height / 2;
  const worldLeft = centerX + (0 - centerX - panOffset.x) / zoomLevel;
  const worldRight = centerX + (width - centerX - panOffset.x) / zoomLevel;
  const worldTop = centerY + (0 - centerY - panOffset.y) / zoomLevel;
  const worldBottom = centerY + (height - centerY - panOffset.y) / zoomLevel;

  const minorGridSpacing = 20;
  const majorGridSpacing = 100;
  const minorStartX = Math.floor(Math.min(worldLeft, worldRight) / minorGridSpacing) * minorGridSpacing;
  const minorEndX = Math.ceil(Math.max(worldLeft, worldRight) / minorGridSpacing) * minorGridSpacing;
  const minorStartY = Math.floor(Math.min(worldTop, worldBottom) / minorGridSpacing) * minorGridSpacing;
  const minorEndY = Math.ceil(Math.max(worldTop, worldBottom) / minorGridSpacing) * minorGridSpacing;

  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1 / zoomLevel;
  for (let x = minorStartX; x <= minorEndX; x += minorGridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, worldTop);
    ctx.lineTo(x, worldBottom);
    ctx.stroke();
  }

  for (let y = minorStartY; y <= minorEndY; y += minorGridSpacing) {
    ctx.beginPath();
    ctx.moveTo(worldLeft, y);
    ctx.lineTo(worldRight, y);
    ctx.stroke();
  }

  const majorStartX = Math.floor(Math.min(worldLeft, worldRight) / majorGridSpacing) * majorGridSpacing;
  const majorEndX = Math.ceil(Math.max(worldLeft, worldRight) / majorGridSpacing) * majorGridSpacing;
  const majorStartY = Math.floor(Math.min(worldTop, worldBottom) / majorGridSpacing) * majorGridSpacing;
  const majorEndY = Math.ceil(Math.max(worldTop, worldBottom) / majorGridSpacing) * majorGridSpacing;

  ctx.strokeStyle = "rgba(148, 163, 184, 0.15)";
  ctx.lineWidth = 1 / zoomLevel;
  for (let x = majorStartX; x <= majorEndX; x += majorGridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, worldTop);
    ctx.lineTo(x, worldBottom);
    ctx.stroke();
  }

  for (let y = majorStartY; y <= majorEndY; y += majorGridSpacing) {
    ctx.beginPath();
    ctx.moveTo(worldLeft, y);
    ctx.lineTo(worldRight, y);
    ctx.stroke();
  }

  const drawLoop = (
    points: Point[],
    strokeStyle: string,
    fillStyle: string,
    closed: boolean,
    selected: SelectedPoint = null,
    showHandles = false,
  ) => {
    if (points.length === 0) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }

    if (closed) {
      ctx.closePath();
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.stroke();

    if (closed) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }

    if (!showHandles) {
      return;
    }

    points.forEach((point, index) => {
      const isSelected =
        selected &&
        ((selected.type === "outer" && selected.index === index) ||
          (selected.type === "hole" && selected.index === index));

      ctx.beginPath();
      ctx.arc(point.x, point.y, isSelected ? 7 : POINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? "#f8fafc" : strokeStyle;
      ctx.fill();
      ctx.strokeStyle = "#020617";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };

  drawLoop(
    outerLoop,
    "#38bdf8",
    "rgba(56, 189, 248, 0.12)",
    true,
    selectedPoint?.type === "outer" ? selectedPoint : null,
    activeTool === "select",
  );

  holeLoops.forEach((loop, holeIndex) => {
    drawLoop(
      loop,
      "#f87171",
      "rgba(248, 113, 113, 0.1)",
      true,
      selectedPoint?.type === "hole" && selectedPoint.holeIndex === holeIndex
        ? selectedPoint
        : null,
      activeTool === "select",
    );
  });

  draftStrokes.forEach((stroke) => {
    drawLoop(
      stroke,
      draftType === "outer" ? "#38bdf8" : "#f97316",
      "transparent",
      false,
    );
  });

  if (hasMesh) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    meshEdges.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    meshNodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#34d399";
      ctx.fill();
    });
  }

  ctx.restore();

  if (activeTool === "eraser") {
    const screenMouse = {
      x: centerX + panOffset.x + (mousePos.x - centerX) * zoomLevel,
      y: centerY + panOffset.y + (mousePos.y - centerY) * zoomLevel,
    };

    ctx.beginPath();
    ctx.arc(screenMouse.x, screenMouse.y, ERASER_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(248, 113, 113, 0.12)";
    ctx.fill();
    ctx.strokeStyle = "rgba(248, 113, 113, 0.9)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
