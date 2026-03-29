import { ensureOrientation } from "../../../geometry/domain/services/ensure-orientation";
import type { Loop } from "../../../geometry/domain/types";
import type { DraftType, WorkspaceCommandResult, WorkspaceGeometry } from "../types";

type CloseShapeCommandInput = WorkspaceGeometry & {
  points: Loop;
};

export function closeShapeCommand({
  draftType,
  holeLoops,
  outerLoop,
  points,
}: CloseShapeCommandInput): WorkspaceCommandResult {
  if (draftType === "outer") {
    const normalizedOuterLoop = ensureOrientation(points, false);
    return {
      draftStrokes: [],
      draftType,
      holeLoops: [],
      logMessage: `Outer boundary closed with ${normalizedOuterLoop.length} points.`,
      nextDraftType: "hole",
      nextTool: "hole",
      outerLoop: normalizedOuterLoop,
    };
  }

  const normalizedHole = ensureOrientation(points, true);
  return {
    draftStrokes: [],
    draftType,
    holeLoops: [...holeLoops, normalizedHole],
    logMessage: `Hole ${holeLoops.length + 1} closed with ${normalizedHole.length} points.`,
    outerLoop,
  };
}
