import type { WorkspaceCommandResult, WorkspaceGeometry } from "../types";

export function undoCommand({
  draftStrokes,
  draftType,
  holeLoops,
  outerLoop,
}: WorkspaceGeometry): WorkspaceCommandResult {
  if (draftStrokes.length > 0) {
    return {
      draftStrokes: draftStrokes.slice(0, -1),
      draftType,
      holeLoops,
      logMessage: "Removed the most recent draft stroke.",
      outerLoop,
    };
  }

  if (holeLoops.length > 0) {
    return {
      draftStrokes,
      draftType,
      holeLoops: holeLoops.slice(0, -1),
      logMessage: "Removed the most recent hole.",
      outerLoop,
    };
  }

  if (outerLoop.length > 0) {
    return {
      draftStrokes,
      draftType: "outer",
      holeLoops,
      logMessage: "Removed the outer boundary.",
      nextDraftType: "outer",
      nextTool: "boundary",
      outerLoop: [],
    };
  }

  return {
    draftStrokes,
    draftType,
    holeLoops,
    logMessage: "Nothing to undo.",
    outerLoop,
  };
}
