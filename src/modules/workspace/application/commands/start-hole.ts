import type { WorkspaceEvent } from "../state/workspace-machine";

export function startHoleCommand(): WorkspaceEvent {
  return {
    tool: "hole",
    type: "TOOL_SELECTED",
  };
}
