import type { ErrorBar, MeshStats } from "../../analysis/domain/types";
import type { Loop, Point } from "../../geometry/domain/types";
import type {
  ElementType,
  MeshEdge,
  MeshNode,
  MeshPreview,
} from "../../meshing/domain/types";

export type Tool = "select" | "boundary" | "hole" | "eraser";

export type DraftType = "outer" | "hole";

export type DraftShapeMode =
  | "circle"
  | "freehand"
  | "polygon"
  | "square"
  | "triangle";

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

export type PSLGValidationState = {
  message: string;
  status: "idle" | "invalid" | "valid";
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
  draftShapeMode: DraftShapeMode;
  elementType: ElementType;
  eraserRadius: number;
  errorData: ErrorBar[];
  generatedSegments: number;
  geometryReady: boolean;
  handleExportMesh: (format: "csv" | "dat" | "json") => void;
  handleGenerateMesh: () => void;
  handleImportGeometryFile: (fileName: string, content: string) => void;
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
  handleValidatePSLG: () => void;
  isMeshing: boolean;
  isPanningCanvas: boolean;
  isSketching: boolean;
  logs: string[];
  maxLength: number;
  meshEdges: MeshEdge[];
  meshNodes: MeshNode[];
  meshPreview: MeshPreview | null;
  meshStats: MeshStats;
  mousePos: Point;
  outerLoop: Loop;
  panOffset: Point;
  pslgValidation: PSLGValidationState;
  polygonSides: number;
  removeLastStep: () => void;
  resetGeometry: () => void;
  resetZoom: () => void;
  rlRatio: number;
  selectedPoint: SelectedPoint;
  setActiveTool: (tool: Tool) => void;
  setDraftType: (draftType: DraftType) => void;
  setDraftShapeMode: (mode: DraftShapeMode) => void;
  setElementType: (elementType: ElementType) => void;
  setEraserRadius: (value: number) => void;
  setMaxLength: (value: number) => void;
  setPolygonSides: (value: number) => void;
  setRlRatio: (value: number) => void;
  setThetaMin: (value: number) => void;
  thetaMin: number;
  zoomIn: () => void;
  zoomLevel: number;
  zoomOut: () => void;
};
