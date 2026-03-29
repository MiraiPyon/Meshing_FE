import { pointInPolygon } from "../../../geometry/domain/services/point-in-polygon";
import type { Point, PSLG } from "../../../geometry/domain/types";
import type { ElementType, MeshEdge, MeshPreview } from "../types";
import {
  computePreviewSpacing,
  estimateExecutionTime,
  estimateTriangleCount,
} from "./quality-rules";
import { distance } from "../../../geometry/domain/services/measurements";

type PreviewRefinementInput = {
  elementType: ElementType;
  maxLength: number;
  pslg: PSLG;
};

export function previewRefinement({
  elementType,
  maxLength,
  pslg,
}: PreviewRefinementInput): MeshPreview {
  const bounds = pslg.outerLoop.reduce(
    (acc, point) => ({
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
    }),
    {
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
    },
  );

  const spacing = computePreviewSpacing(maxLength);
  const nodes: Point[] = [];

  for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
    for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
      const sample = { x, y };
      if (!pointInPolygon(sample, pslg.outerLoop)) {
        continue;
      }

      if (pslg.holeLoops.some((loop) => pointInPolygon(sample, loop))) {
        continue;
      }

      nodes.push(sample);
    }
  }

  const edges: MeshEdge[] = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const current = nodes[index];
    for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
      const other = nodes[otherIndex];
      const sameRow = Math.abs(current.y - other.y) < 1;
      const sameCol = Math.abs(current.x - other.x) < 1;
      const near = Math.abs(distance(current, other) - spacing) < 2;

      if ((sameRow || sameCol) && near) {
        edges.push([current, other]);
      }
    }
  }

  return {
    boundarySegments: pslg.totalSegments,
    edges,
    elementType,
    executionTime: estimateExecutionTime(nodes.length),
    nodes,
    tris: estimateTriangleCount(nodes.length),
  };
}
