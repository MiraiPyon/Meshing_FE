import type {
  DraftType,
  Tool,
  WorkspaceMachine,
  WorkspaceMode,
} from "../types";

export type WorkspaceEvent =
  | { type: "ERASER_STARTED" }
  | { closedDraftType: DraftType; type: "SHAPE_CLOSED" }
  | { draftType: DraftType; type: "SKETCH_STARTED" }
  | { type: "MESH_FINISHED" }
  | { type: "MESH_STARTED" }
  | { type: "POINTER_RELEASED" }
  | { type: "RESET" }
  | { draftType?: DraftType; mode?: WorkspaceMode; tool?: Tool; type: "SYNC_CONTEXT" }
  | { tool: Tool; type: "TOOL_SELECTED" };

export function createInitialWorkspaceMachine(): WorkspaceMachine {
  return {
    activeTool: "boundary",
    draftType: "outer",
    mode: "idle",
  };
}

export function transitionWorkspace(
  machine: WorkspaceMachine,
  event: WorkspaceEvent,
): WorkspaceMachine {
  switch (event.type) {
    case "TOOL_SELECTED":
      return {
        activeTool: event.tool,
        draftType:
          event.tool === "hole"
            ? "hole"
            : event.tool === "boundary"
              ? "outer"
              : machine.draftType,
        mode: event.tool === "select" ? "selecting" : "idle",
      };
    case "SKETCH_STARTED":
      return {
        activeTool: event.draftType === "outer" ? "boundary" : "hole",
        draftType: event.draftType,
        mode: "drawing",
      };
    case "ERASER_STARTED":
      return {
        ...machine,
        activeTool: "eraser",
        mode: "erasing",
      };
    case "POINTER_RELEASED":
      return {
        ...machine,
        mode: machine.activeTool === "select" ? "selecting" : "idle",
      };
    case "SHAPE_CLOSED":
      return {
        activeTool: event.closedDraftType === "outer" ? "hole" : machine.activeTool,
        draftType: event.closedDraftType === "outer" ? "hole" : machine.draftType,
        mode: "idle",
      };
    case "MESH_STARTED":
      return {
        ...machine,
        mode: "meshing",
      };
    case "MESH_FINISHED":
      return {
        ...machine,
        mode: "idle",
      };
    case "SYNC_CONTEXT":
      return {
        activeTool: event.tool ?? machine.activeTool,
        draftType: event.draftType ?? machine.draftType,
        mode: event.mode ?? machine.mode,
      };
    case "RESET":
      return createInitialWorkspaceMachine();
    default:
      return machine;
  }
}
