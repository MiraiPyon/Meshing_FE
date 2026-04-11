import type { ErrorBar, MeshStats } from "../../analysis/domain/types";
import type { Loop, Point } from "../../geometry/domain/types";
import type { ElementType, MeshEdge, MeshPreview } from "../../meshing/domain/types";

export type Tool = "select" | "boundary" | "hole" | "eraser";

export type DraftType = "outer" | "hole";

export type SelectedPoint =
  | { type: "outer"; index: number }
  | { holeIndex: number; index: number; type: "hole" }
  | null;

export type WorkspaceMode =
  | "idle"
  | "drawing"
  | "selecting"
  | "erasing"
  | "meshing";

export type WorkspaceMachine = {
  activeTool: Tool;
  draftType: DraftType;
  mode: WorkspaceMode;
};

export type WorkspaceGeometry = {
  draftStrokes: Loop[];
  draftType: DraftType;
  holeLoops: Loop[];
  outerLoop: Loop;
};

export type WorkspaceCommandResult = WorkspaceGeometry & {
  logMessage: string;
  nextDraftType?: DraftType;
  nextTool?: Tool;
};

export type WorkspaceViewModel = {
  activeTool: Tool;
  cancelCurrentSketch: () => void;
  closeCurrentShape: () => void;
  deleteSelectedShape: () => void;
  draftPointCount: number;
  draftReadyToClose: boolean;
  draftStrokes: Loop[];
  draftType: DraftType;
  elementType: ElementType;
  errorData: ErrorBar[];
  generatedSegments: number;
  geometryReady: boolean;
  handleGenerateMesh: () => void;
  handleMouseDown: (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => void;
  handleMouseMove: (
    event: React.MouseEvent<HTMLCanvasElement>,
  ) => void;
  handleMouseUp: () => void;
  hasDraft: boolean;
  hasMesh: boolean;
  holeLoops: Loop[];
  isMeshing: boolean;
  isSketching: boolean;
  logs: string[];
  maxLength: number;
  meshEdges: MeshEdge[];
  meshNodes: Point[];
  meshPreview: MeshPreview | null;
  meshStats: MeshStats;
  mousePos: Point;
  outerLoop: Loop;
  removeLastStep: () => void;
  resetGeometry: () => void;
  resetZoom: () => void;
  rlRatio: number;
  selectedPoint: SelectedPoint;
  setActiveTool: (tool: Tool) => void;
  setDraftType: (draftType: DraftType) => void;
  setElementType: (elementType: ElementType) => void;
  setMaxLength: (value: number) => void;
  setRlRatio: (value: number) => void;
  setThetaMin: (value: number) => void;
  thetaMin: number;
  zoomIn: () => void;
  zoomLevel: number;
  zoomOut: () => void;
};
