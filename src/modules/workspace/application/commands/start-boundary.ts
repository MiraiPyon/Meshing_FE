import type { WorkspaceEvent } from "../state/workspace-machine";

export function startBoundaryCommand(): WorkspaceEvent {
  return {
    tool: "boundary",
    type: "TOOL_SELECTED",
  };
}
