import { distance } from "../../../geometry/domain/services/measurements";
import type { Loop, Point } from "../../../geometry/domain/types";
import { CLOSE_DISTANCE } from "../constants";
import type { SelectedPoint } from "../types";

type FindNearbyPointInput = {
  holeLoops: Loop[];
  outerLoop: Loop;
  point: Point;
};

export function findNearbyPoint({
  holeLoops,
  outerLoop,
  point,
}: FindNearbyPointInput): SelectedPoint {
  for (let index = 0; index < outerLoop.length; index += 1) {
    if (distance(point, outerLoop[index]) <= CLOSE_DISTANCE) {
      return { index, type: "outer" };
    }
  }

  for (let holeIndex = 0; holeIndex < holeLoops.length; holeIndex += 1) {
    for (let index = 0; index < holeLoops[holeIndex].length; index += 1) {
      if (distance(point, holeLoops[holeIndex][index]) <= CLOSE_DISTANCE) {
        return { holeIndex, index, type: "hole" };
      }
    }
  }

  return null;
}
