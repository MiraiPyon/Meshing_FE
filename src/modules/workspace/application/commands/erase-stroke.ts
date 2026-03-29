import { distance } from "../../../geometry/domain/services/measurements";
import type { Loop, Point } from "../../../geometry/domain/types";
import { ERASER_RADIUS } from "../constants";

export function eraseStrokeCommand(strokes: Loop[], center: Point): Loop[] {
  return strokes.flatMap((stroke) => {
    const segments: Loop[] = [];
    let currentSegment: Loop = [];

    stroke.forEach((point) => {
      if (distance(point, center) <= ERASER_RADIUS) {
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [];
        return;
      }

      currentSegment.push(point);
    });

    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }

    return segments;
  });
}
