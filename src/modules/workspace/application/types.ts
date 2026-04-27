import type { ErrorBar, MeshStats } from "../../analysis/domain/types";
import type { Loop, Point } from "../../geometry/domain/types";
import type { ElementType, MeshEdge, MeshPreview } from "../../meshing/domain/types";

export type ProjectSnapshotItem = {
  id: string;
  name: string;
  geometry_id: string | null;
  mesh_id: string | null;
  element_type: string | null;
  meshing_params: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PrimitiveType = "rectangle" | "circle" | "polygon";

export type RectanglePrimitiveInput = {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
};

export type CirclePrimitiveInput = {
  centerX: number;
  centerY: number;
  radius: number;
};

export type GeometryRecordItem = {
  id: string;
  name: string;
  geometry_type: PrimitiveType;
  created_at: string;
};

export type QuickFEAInput = {
  E: number;
  nu: number;
  thickness: number;
  totalForceFy: number;
  analysisType: "plane_stress" | "plane_strain";
};

export type QuickFEASummary = {
  message: string;
  maxDisplacement: number;
  maxVonMises: number;
  sumReactionX: number | null;
  sumReactionY: number | null;
  nodeCount: number;
  elementCount: number;
};

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
  addLog: (message: string) => void;
  applyBooleanResult: (outer: Point[], holes: Point[][]) => void;
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
  geometryError: string | null;
  geometryRecords: GeometryRecordItem[];
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
  hasProjectData: boolean;
  holeLoops: Loop[];
  isGeometryBusy: boolean;
  isMeshing: boolean;
  isProjectBusy: boolean;
  isRunningFEA: boolean;
  isShapeDatMeshing: boolean;
  isSketching: boolean;
  logs: string[];
  maxLength: number;
  meshEdges: MeshEdge[];
  meshNodes: Point[];
  meshPreview: MeshPreview | null;
  meshStats: MeshStats;
  mousePos: Point;
  outerLoop: Loop;
  polygonInputText: string;
  primitiveName: string;
  primitiveType: PrimitiveType;
  projectName: string;
  projectNotes: string;
  projectSnapshots: ProjectSnapshotItem[];
  removeLastStep: () => void;
  resetGeometry: () => void;
  resetZoom: () => void;
  runQuickFEA: () => void;
  rlRatio: number;
  selectedGeometryId: string | null;
  selectedPoint: SelectedPoint;
  setCircleInput: (input: CirclePrimitiveInput) => void;
  setFeaInput: (input: QuickFEAInput) => void;
  setActiveTool: (tool: Tool) => void;
  setPolygonInputText: (text: string) => void;
  setPrimitiveName: (name: string) => void;
  setPrimitiveType: (primitiveType: PrimitiveType) => void;
  setRectangleInput: (input: RectanglePrimitiveInput) => void;
  setDraftType: (draftType: DraftType) => void;
  setElementType: (elementType: ElementType) => void;
  setMaxLength: (value: number) => void;
  setProjectName: (name: string) => void;
  setProjectNotes: (notes: string) => void;
  setRlRatio: (value: number) => void;
  setShapeDatText: (text: string) => void;
  setThetaMin: (value: number) => void;
  circleInput: CirclePrimitiveInput;
  rectangleInput: RectanglePrimitiveInput;
  shapeDatText: string;
  submitPrimitiveForm: () => void;
  generateMeshFromShapeDat: () => void;
  loadGeometryRecord: (geometryId: string) => void;
  deleteGeometryRecord: (geometryId: string) => void;
  refreshGeometryRecords: () => void;
  saveProjectSnapshot: () => void;
  loadProjectSnapshot: (projectId: string) => void;
  deleteProjectSnapshot: (projectId: string) => void;
  refreshProjectSnapshots: () => void;
  feaInput: QuickFEAInput;
  feaSummary: QuickFEASummary | null;
  thetaMin: number;
  zoomIn: () => void;
  zoomLevel: number;
  zoomOut: () => void;
};
