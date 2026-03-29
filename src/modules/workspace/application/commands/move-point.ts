import type { Point } from "../../../geometry/domain/types";
import type { SelectedPoint, WorkspaceGeometry } from "../types";

type MovePointCommandInput = Pick<WorkspaceGeometry, "holeLoops" | "outerLoop"> & {
  point: Point;
  selection: SelectedPoint;
};

export function movePointCommand({
  holeLoops,
  outerLoop,
  point,
  selection,
}: MovePointCommandInput) {
  if (!selection) {
    return { holeLoops, outerLoop };
  }

  if (selection.type === "outer") {
    return {
      holeLoops,
      outerLoop: outerLoop.map((item, index) =>
        index === selection.index ? point : item,
      ),
    };
  }

  return {
    holeLoops: holeLoops.map((loop, holeIndex) =>
      holeIndex === selection.holeIndex
        ? loop.map((item, index) =>
            index === selection.index ? point : item,
          )
        : loop,
    ),
    outerLoop,
  };
}
