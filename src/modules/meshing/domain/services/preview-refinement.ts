import { pointInPolygon } from "../../../geometry/domain/services/point-in-polygon";
import { distance, polygonArea } from "../../../geometry/domain/services/measurements";
import type { Loop, Point, PSLG } from "../../../geometry/domain/types";
import type {
  ElementType,
  MeshEdge,
  MeshEdgeRecord,
  MeshElement,
  MeshNode,
  MeshPreview,
  MeshQualityStatus,
} from "../types";
import { computePreviewSpacing, estimateExecutionTime } from "./quality-rules";

type PreviewRefinementInput = {
  elementType: ElementType;
  maxLength: number;
  minAngle: number;
  pslg: PSLG;
};

type TriangleIndex = [number, number, number];

type Bounds = {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
};

const EPSILON = 1e-6;

function getBounds(points: Loop): Bounds {
  return points.reduce(
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
}

function createPointKey(point: Point) {
  return `${Math.round(point.x * 100) / 100}:${Math.round(point.y * 100) / 100}`;
}

function addNode(
  nodes: MeshNode[],
  seen: Map<string, number>,
  point: Point,
  boundary = false,
) {
  const key = createPointKey(point);
  const existingIndex = seen.get(key);
  if (existingIndex !== undefined) {
    if (boundary) {
      nodes[existingIndex].boundary = true;
    }
    return existingIndex;
  }

  const node: MeshNode = {
    boundary,
    id: nodes.length + 1,
    x: Math.round(point.x * 100) / 100,
    y: Math.round(point.y * 100) / 100,
  };

  nodes.push(node);
  seen.set(key, nodes.length - 1);
  return nodes.length - 1;
}

function addBoundaryLoop(
  nodes: MeshNode[],
  seen: Map<string, number>,
  loop: Loop,
  spacing: number,
) {
  loop.forEach((point, index) => {
    const next = loop[(index + 1) % loop.length];
    const segmentLength = distance(point, next);
    const steps = Math.max(1, Math.ceil(segmentLength / spacing));

    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      addNode(
        nodes,
        seen,
        {
          x: point.x + (next.x - point.x) * t,
          y: point.y + (next.y - point.y) * t,
        },
        true,
      );
    }
  });
}

function isInsideDomain(point: Point, pslg: PSLG) {
  return (
    pointInPolygon(point, pslg.outerLoop) &&
    !pslg.holeLoops.some((loop) => pointInPolygon(point, loop))
  );
}

function orientation(a: Point, b: Point, c: Point) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(a: Point, b: Point, c: Point) {
  return (
    Math.min(a.x, c.x) - EPSILON <= b.x &&
    b.x <= Math.max(a.x, c.x) + EPSILON &&
    Math.min(a.y, c.y) - EPSILON <= b.y &&
    b.y <= Math.max(a.y, c.y) + EPSILON
  );
}

function samePoint(a: Point, b: Point) {
  return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point) {
  if (samePoint(a, c) || samePoint(a, d) || samePoint(b, c) || samePoint(b, d)) {
    return false;
  }

  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (Math.abs(o1) < EPSILON && onSegment(a, c, b)) {
    return true;
  }
  if (Math.abs(o2) < EPSILON && onSegment(a, d, b)) {
    return true;
  }
  if (Math.abs(o3) < EPSILON && onSegment(c, a, d)) {
    return true;
  }
  if (Math.abs(o4) < EPSILON && onSegment(c, b, d)) {
    return true;
  }

  return (o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0);
}

function getBoundarySegments(pslg: PSLG) {
  const loops = [pslg.outerLoop, ...pslg.holeLoops];
  return loops.flatMap((loop) =>
    loop.map((point, index) => [point, loop[(index + 1) % loop.length]] as const),
  );
}

function edgeCrossesBoundary(a: Point, b: Point, pslg: PSLG) {
  return getBoundarySegments(pslg).some(([start, end]) => {
    const collinearWithBoundary =
      Math.abs(orientation(a, b, start)) < EPSILON &&
      Math.abs(orientation(a, b, end)) < EPSILON;

    if (collinearWithBoundary) {
      return false;
    }

    return segmentsIntersect(a, b, start, end);
  });
}

function triangleCentroid(points: Point[]): Point {
  return {
    x: points.reduce((total, point) => total + point.x, 0) / points.length,
    y: points.reduce((total, point) => total + point.y, 0) / points.length,
  };
}

function triangleArea(a: Point, b: Point, c: Point) {
  return Math.abs(polygonArea([a, b, c]));
}

function getAngle(a: number, b: number, c: number) {
  const denominator = 2 * a * b;
  if (denominator < EPSILON) {
    return 0;
  }

  const value = Math.max(-1, Math.min(1, (a * a + b * b - c * c) / denominator));
  return (Math.acos(value) * 180) / Math.PI;
}

function classifyQuality(minAngle: number, threshold: number): MeshQualityStatus {
  if (minAngle >= 35) {
    return "excellent";
  }
  if (minAngle >= 25) {
    return "good";
  }
  if (minAngle >= threshold) {
    return "fair";
  }
  return "bad";
}

function buildTriangleElement(
  id: number,
  nodeIds: number[],
  nodes: MeshNode[],
  minAngleThreshold: number,
): MeshElement {
  const [a, b, c] = nodeIds.map((nodeId) => nodes[nodeId - 1]);
  const ab = distance(a, b);
  const bc = distance(b, c);
  const ca = distance(c, a);
  const area = triangleArea(a, b, c);
  const angles = [
    getAngle(ab, ca, bc),
    getAngle(ab, bc, ca),
    getAngle(bc, ca, ab),
  ];
  const minAngle = Math.min(...angles);
  const shortestEdge = Math.min(ab, bc, ca);
  const circumradius =
    area > EPSILON ? (ab * bc * ca) / (4 * area) : Number.POSITIVE_INFINITY;
  const ratio =
    shortestEdge > EPSILON ? circumradius / shortestEdge : Number.POSITIVE_INFINITY;

  return {
    area,
    centroid: triangleCentroid([a, b, c]),
    circumradiusToShortestEdge: ratio,
    id,
    minAngle,
    nodeIds,
    status: classifyQuality(minAngle, minAngleThreshold),
    type: "T3",
  };
}

function getQuadAngles(points: Point[]) {
  return points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const a = distance(point, previous);
    const b = distance(point, next);
    const c = distance(previous, next);
    return getAngle(a, b, c);
  });
}

function buildQuadElement(
  id: number,
  nodeIds: number[],
  nodes: MeshNode[],
  minAngleThreshold: number,
): MeshElement {
  const points = nodeIds.map((nodeId) => nodes[nodeId - 1]);
  const area = Math.abs(polygonArea(points));
  const edgeLengths = points.map((point, index) =>
    distance(point, points[(index + 1) % points.length]),
  );
  const minAngle = Math.min(...getQuadAngles(points));
  const shortestEdge = Math.min(...edgeLengths);
  const longestDiagonal = Math.max(
    distance(points[0], points[2]),
    distance(points[1], points[3]),
  );
  const ratio = shortestEdge > EPSILON ? longestDiagonal / (2 * shortestEdge) : 0;

  return {
    area,
    centroid: triangleCentroid(points),
    circumradiusToShortestEdge: ratio,
    id,
    minAngle,
    nodeIds,
    status: classifyQuality(minAngle, minAngleThreshold),
    type: "Q4",
  };
}

function circumcircleContains(point: Point, triangle: TriangleIndex, nodes: Point[]) {
  const [a, b, c] = triangle.map((index) => nodes[index]);
  const ax = a.x - point.x;
  const ay = a.y - point.y;
  const bx = b.x - point.x;
  const by = b.y - point.y;
  const cx = c.x - point.x;
  const cy = c.y - point.y;

  const determinant =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);

  const orientationSign = polygonArea([a, b, c]) > 0 ? 1 : -1;
  return determinant * orientationSign > EPSILON;
}

function createSuperTriangle(bounds: Bounds): Point[] {
  const delta = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) || 1;
  const midX = (bounds.minX + bounds.maxX) / 2;
  const midY = (bounds.minY + bounds.maxY) / 2;

  return [
    { x: midX - delta * 20, y: midY - delta * 8 },
    { x: midX, y: midY + delta * 22 },
    { x: midX + delta * 20, y: midY - delta * 8 },
  ];
}

function getTriangleEdges(triangle: TriangleIndex) {
  return [
    [triangle[0], triangle[1]],
    [triangle[1], triangle[2]],
    [triangle[2], triangle[0]],
  ] as const;
}

function normalizeEdge(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function triangulateDelaunay(nodes: MeshNode[], pslg: PSLG) {
  if (nodes.length < 3) {
    return [];
  }

  const bounds = getBounds(nodes);
  const superTriangle = createSuperTriangle(bounds);
  const points: Point[] = [...nodes, ...superTriangle];
  const firstSuperIndex = nodes.length;
  let triangles: TriangleIndex[] = [
    [firstSuperIndex, firstSuperIndex + 1, firstSuperIndex + 2],
  ];

  for (let pointIndex = 0; pointIndex < nodes.length; pointIndex += 1) {
    const point = points[pointIndex];
    const badTriangles = triangles.filter((triangle) =>
      circumcircleContains(point, triangle, points),
    );
    const badSet = new Set(badTriangles.map((triangle) => triangle.join(":")));
    const edgeUseCount = new Map<string, [number, number, number]>();

    badTriangles.forEach((triangle) => {
      getTriangleEdges(triangle).forEach(([a, b]) => {
        const key = normalizeEdge(a, b);
        const current = edgeUseCount.get(key);
        if (current) {
          current[2] += 1;
        } else {
          edgeUseCount.set(key, [a, b, 1]);
        }
      });
    });

    triangles = triangles.filter((triangle) => !badSet.has(triangle.join(":")));

    edgeUseCount.forEach(([a, b, count]) => {
      if (count === 1) {
        triangles.push([a, b, pointIndex]);
      }
    });
  }

  return triangles.filter((triangle) => {
    if (triangle.some((index) => index >= firstSuperIndex)) {
      return false;
    }

    const pointsForTriangle = triangle.map((index) => nodes[index]);
    const centroid = triangleCentroid(pointsForTriangle);
    const area = triangleArea(
      pointsForTriangle[0],
      pointsForTriangle[1],
      pointsForTriangle[2],
    );

    if (area < EPSILON || !isInsideDomain(centroid, pslg)) {
      return false;
    }

    return getTriangleEdges(triangle).every(([a, b]) => {
      const start = nodes[a];
      const end = nodes[b];
      return !edgeCrossesBoundary(start, end, pslg);
    });
  });
}

function buildEdgeRecords(nodes: MeshNode[], elements: MeshElement[]) {
  const edgeMap = new Map<string, MeshEdgeRecord>();

  elements.forEach((element) => {
    element.nodeIds.forEach((nodeId, index) => {
      const nextNodeId = element.nodeIds[(index + 1) % element.nodeIds.length];
      const [a, b] =
        nodeId < nextNodeId ? [nodeId, nextNodeId] : [nextNodeId, nodeId];
      const key = `${a}:${b}`;
      const existing = edgeMap.get(key);

      if (existing) {
        existing.adjacentElementIds.push(element.id);
        existing.boundary = existing.adjacentElementIds.length === 1;
        return;
      }

      edgeMap.set(key, {
        adjacentElementIds: [element.id],
        boundary: true,
        id: 0,
        length: distance(nodes[a - 1], nodes[b - 1]),
        nodeIds: [a, b],
      });
    });
  });

  return Array.from(edgeMap.values()).map((edge, index) => ({
    ...edge,
    boundary: edge.adjacentElementIds.length === 1,
    id: index + 1,
  }));
}

function buildNodeSet(pslg: PSLG, spacing: number) {
  const nodes: MeshNode[] = [];
  const seen = new Map<string, number>();
  const bounds = getBounds(pslg.outerLoop);

  addBoundaryLoop(nodes, seen, pslg.outerLoop, spacing);
  pslg.holeLoops.forEach((loop) => addBoundaryLoop(nodes, seen, loop, spacing));

  for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
    for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
      const sample = { x, y };
      if (isInsideDomain(sample, pslg)) {
        addNode(nodes, seen, sample);
      }
    }
  }

  return nodes;
}

function buildT3Mesh(
  nodes: MeshNode[],
  pslg: PSLG,
  minAngle: number,
): MeshElement[] {
  return triangulateDelaunay(nodes, pslg).map((triangle, index) =>
    buildTriangleElement(
      index + 1,
      triangle.map((nodeIndex) => nodeIndex + 1),
      nodes,
      minAngle,
    ),
  );
}

function buildQ4Mesh(
  nodes: MeshNode[],
  pslg: PSLG,
  spacing: number,
  minAngle: number,
): MeshElement[] {
  const bounds = getBounds(pslg.outerLoop);
  const byGrid = new Map<string, number>();
  const roundGrid = (value: number) => Math.round(value / spacing);

  nodes.forEach((node) => {
    if (node.boundary) {
      return;
    }
    byGrid.set(`${roundGrid(node.x)}:${roundGrid(node.y)}`, node.id);
  });

  const elements: MeshElement[] = [];
  for (let x = bounds.minX; x <= bounds.maxX - spacing; x += spacing) {
    for (let y = bounds.minY; y <= bounds.maxY - spacing; y += spacing) {
      const center = { x: x + spacing / 2, y: y + spacing / 2 };
      if (!isInsideDomain(center, pslg)) {
        continue;
      }

      const corners = [
        byGrid.get(`${roundGrid(x)}:${roundGrid(y)}`),
        byGrid.get(`${roundGrid(x + spacing)}:${roundGrid(y)}`),
        byGrid.get(`${roundGrid(x + spacing)}:${roundGrid(y + spacing)}`),
        byGrid.get(`${roundGrid(x)}:${roundGrid(y + spacing)}`),
      ];

      if (corners.some((corner) => corner === undefined)) {
        continue;
      }

      const nodeIds = corners as number[];
      const points = nodeIds.map((nodeId) => nodes[nodeId - 1]);
      if (
        points.some((point) => !isInsideDomain(point, pslg)) ||
        points.some((point, index) =>
          edgeCrossesBoundary(point, points[(index + 1) % points.length], pslg),
        )
      ) {
        continue;
      }

      elements.push(buildQuadElement(elements.length + 1, nodeIds, nodes, minAngle));
    }
  }

  return elements;
}

export function previewRefinement({
  elementType,
  maxLength,
  minAngle,
  pslg,
}: PreviewRefinementInput): MeshPreview {
  const startedAt = performance.now();
  const spacing = computePreviewSpacing(maxLength);
  const nodes = buildNodeSet(pslg, spacing);
  const elements =
    elementType === "Q4"
      ? buildQ4Mesh(nodes, pslg, spacing, minAngle)
      : buildT3Mesh(nodes, pslg, minAngle);
  const edgeRecords = buildEdgeRecords(nodes, elements);
  const edges: MeshEdge[] = edgeRecords.map((edge) => [
    nodes[edge.nodeIds[0] - 1],
    nodes[edge.nodeIds[1] - 1],
  ]);

  return {
    boundarySegments: pslg.totalSegments,
    edgeRecords,
    edges,
    elementType,
    elements,
    executionTime: Math.max(
      estimateExecutionTime(nodes.length),
      Math.round(performance.now() - startedAt),
    ),
    nodes,
    quads: elementType === "Q4" ? elements.length : 0,
    tris: elementType === "T3" ? elements.length : 0,
  };
}
