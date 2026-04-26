import type { PSLG } from "../../domain/types";
import { pointInPolygon } from "../../domain/services/point-in-polygon";
import { polygonArea } from "../../domain/services/measurements";

export type GeometryValidationResult = {
  message?: string;
  valid: boolean;
};

const EPSILON = 1e-6;

function samePoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;
}

function orientation(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  return (
    Math.min(a.x, c.x) - EPSILON <= b.x &&
    b.x <= Math.max(a.x, c.x) + EPSILON &&
    Math.min(a.y, c.y) - EPSILON <= b.y &&
    b.y <= Math.max(a.y, c.y) + EPSILON
  );
}

function segmentsIntersect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
) {
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

function hasSelfIntersection(loop: PSLG["outerLoop"]) {
  for (let i = 0; i < loop.length; i += 1) {
    const a = loop[i];
    const b = loop[(i + 1) % loop.length];

    for (let j = i + 1; j < loop.length; j += 1) {
      const adjacent =
        Math.abs(i - j) <= 1 || (i === 0 && j === loop.length - 1);
      if (adjacent) {
        continue;
      }

      const c = loop[j];
      const d = loop[(j + 1) % loop.length];
      if (segmentsIntersect(a, b, c, d)) {
        return true;
      }
    }
  }

  return false;
}

function loopsIntersect(aLoop: PSLG["outerLoop"], bLoop: PSLG["outerLoop"]) {
  return aLoop.some((a, index) => {
    const b = aLoop[(index + 1) % aLoop.length];
    return bLoop.some((c, otherIndex) => {
      const d = bLoop[(otherIndex + 1) % bLoop.length];
      return segmentsIntersect(a, b, c, d);
    });
  });
}

export function validateGeometry({
  holeLoops,
  outerLoop,
}: PSLG): GeometryValidationResult {
  if (outerLoop.length < 3) {
    return {
      message: "Create and close an outer boundary before generating mesh.",
      valid: false,
    };
  }

  if (Math.abs(polygonArea(outerLoop)) < EPSILON) {
    return {
      message: "Outer loop area is too small or degenerate.",
      valid: false,
    };
  }

  if (hasSelfIntersection(outerLoop)) {
    return {
      message: "Outer loop has a self-intersection.",
      valid: false,
    };
  }

  const invalidHole = holeLoops.findIndex((loop) => loop.length < 3);
  if (invalidHole !== -1) {
    return {
      message: `Hole ${invalidHole + 1} needs at least 3 points.`,
      valid: false,
    };
  }

  const degenerateHole = holeLoops.findIndex(
    (loop) => Math.abs(polygonArea(loop)) < EPSILON,
  );
  if (degenerateHole !== -1) {
    return {
      message: `Hole ${degenerateHole + 1} area is too small or degenerate.`,
      valid: false,
    };
  }

  const selfIntersectingHole = holeLoops.findIndex(hasSelfIntersection);
  if (selfIntersectingHole !== -1) {
    return {
      message: `Hole ${selfIntersectingHole + 1} has a self-intersection.`,
      valid: false,
    };
  }

  const outsideHole = holeLoops.findIndex((loop) => !pointInPolygon(loop[0], outerLoop));
  if (outsideHole !== -1) {
    return {
      message: `Hole ${outsideHole + 1} is outside the outer loop.`,
      valid: false,
    };
  }

  const boundaryCrossingHole = holeLoops.findIndex((loop) =>
    loopsIntersect(outerLoop, loop),
  );
  if (boundaryCrossingHole !== -1) {
    return {
      message: `Hole ${boundaryCrossingHole + 1} intersects the outer loop.`,
      valid: false,
    };
  }

  for (let index = 0; index < holeLoops.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < holeLoops.length; otherIndex += 1) {
      if (
        loopsIntersect(holeLoops[index], holeLoops[otherIndex]) ||
        pointInPolygon(holeLoops[index][0], holeLoops[otherIndex]) ||
        pointInPolygon(holeLoops[otherIndex][0], holeLoops[index])
      ) {
        return {
          message: `Hole ${index + 1} intersects or contains hole ${otherIndex + 1}.`,
          valid: false,
        };
      }
    }
  }

  return { valid: true };
}
