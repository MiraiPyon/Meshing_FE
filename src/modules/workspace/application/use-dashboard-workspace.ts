import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { EMPTY_MESH_ANALYSIS, analyzeMesh } from "../../analysis/application/use-cases/analyze-mesh";
import type { Point } from "../../geometry/domain/types";
import { buildPSLG } from "../../geometry/application/use-cases/build-pslg";
import { validateGeometry } from "../../geometry/application/use-cases/validate-geometry";
import { distance } from "../../geometry/domain/services/measurements";
import { generateMesh } from "../../meshing/application/use-cases/generate-mesh";
import { screenToCanvasPoint } from "../../../infrastructure/canvas/coordinates";
import {
  DEFAULT_WORKSPACE_LOGS,
  ERASER_RADIUS,
  FREEHAND_POINT_SPACING,
  ZOOM_STEPS,
} from "./constants";
import { closeShapeCommand } from "./commands/close-shape";
import { eraseStrokeCommand } from "./commands/erase-stroke";
import { movePointCommand } from "./commands/move-point";
import { startBoundaryCommand } from "./commands/start-boundary";
import { startHoleCommand } from "./commands/start-hole";
import { undoCommand } from "./commands/undo";
import { findNearbyPoint } from "./selectors/find-nearby-point";
import {
  createInitialWorkspaceMachine,
  transitionWorkspace,
} from "./state/workspace-machine";
import type {
  DraftType,
  DraftShapeMode,
  PSLGValidationState,
  SelectedPoint,
  Tool,
  WorkspaceMachine,
  WorkspaceViewModel,
} from "./types";
import type { ElementType } from "../../meshing/domain/types";

type ParsedGeometryFile = {
  holeLoops: Point[][];
  outerLoop: Point[];
};

const CIRCLE_SEGMENTS = 40;
const SHAPE_MIN_SIZE = 8;

type WorkspaceUndoSnapshot = {
  draftStrokes: Point[][];
  holeLoops: Point[][];
  logMessage: string;
  machine: WorkspaceMachine;
  outerLoop: Point[];
  pslgValidation: PSLGValidationState;
  revision: number;
  selectedPoint: SelectedPoint;
};

type DraftStrokesUpdater = Point[][] | ((current: Point[][]) => Point[][]);

function cloneLoop(loop: Point[]): Point[] {
  return loop.map((point) => ({ ...point }));
}

function cloneLoops(loops: Point[][]): Point[][] {
  return loops.map(cloneLoop);
}

function getSignedSquareEnd(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const side = Math.max(Math.abs(dx), Math.abs(dy));
  const xDirection = dx === 0 ? 1 : Math.sign(dx);
  const yDirection = dy === 0 ? 1 : Math.sign(dy);

  return {
    x: start.x + xDirection * side,
    y: start.y + yDirection * side,
  };
}

function createSquareDraftLoop(start: Point, end: Point): Point[] {
  const corner = getSignedSquareEnd(start, end);

  return [
    start,
    { x: corner.x, y: start.y },
    corner,
    { x: start.x, y: corner.y },
  ];
}

function createCircleDraftLoop(start: Point, end: Point): Point[] {
  const corner = getSignedSquareEnd(start, end);
  const center = {
    x: (start.x + corner.x) / 2,
    y: (start.y + corner.y) / 2,
  };
  const radius = Math.abs(corner.x - start.x) / 2;

  return Array.from({ length: CIRCLE_SEGMENTS }, (_, index) => {
    const angle = (index / CIRCLE_SEGMENTS) * Math.PI * 2;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
}

function createTriangleDraftLoop(start: Point, end: Point): Point[] {
  const corner = getSignedSquareEnd(start, end);
  const topY = Math.min(start.y, corner.y);
  const bottomY = Math.max(start.y, corner.y);
  const leftX = Math.min(start.x, corner.x);
  const rightX = Math.max(start.x, corner.x);
  const centerX = (leftX + rightX) / 2;

  if (corner.y >= start.y) {
    return [
      { x: centerX, y: topY },
      { x: rightX, y: bottomY },
      { x: leftX, y: bottomY },
    ];
  }

  return [
    { x: centerX, y: bottomY },
    { x: leftX, y: topY },
    { x: rightX, y: topY },
  ];
}

function createRegularPolygonDraftLoop(
  start: Point,
  end: Point,
  sides: number,
): Point[] {
  const corner = getSignedSquareEnd(start, end);
  const center = {
    x: (start.x + corner.x) / 2,
    y: (start.y + corner.y) / 2,
  };
  const radius = Math.abs(corner.x - start.x) / 2;
  const safeSides = Math.max(5, Math.min(12, Math.round(sides)));

  return Array.from({ length: safeSides }, (_, index) => {
    const angle = -Math.PI / 2 + (index / safeSides) * Math.PI * 2;
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    };
  });
}

function createShapeDraftLoop({
  end,
  mode,
  polygonSides,
  start,
}: {
  end: Point;
  mode: DraftShapeMode;
  polygonSides: number;
  start: Point;
}): Point[] {
  if (distance(start, end) < SHAPE_MIN_SIZE) {
    return [];
  }

  if (mode === "circle") {
    return createCircleDraftLoop(start, end);
  }

  if (mode === "triangle") {
    return createTriangleDraftLoop(start, end);
  }

  if (mode === "square") {
    return createSquareDraftLoop(start, end);
  }

  if (mode === "polygon") {
    return createRegularPolygonDraftLoop(start, end, polygonSides);
  }

  return [];
}

function toFinitePoint(value: unknown): Point | null {
  if (Array.isArray(value) && value.length >= 2) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const x = Number(record.x ?? record.X);
    const y = Number(record.y ?? record.Y);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
  }

  return null;
}

function buildVertexMap(vertices: unknown) {
  const vertexMap = new Map<string, Point>();
  if (!Array.isArray(vertices)) {
    return vertexMap;
  }

  vertices.forEach((vertex, index) => {
    const point = toFinitePoint(vertex);
    if (!point) {
      return;
    }

    const record = vertex && typeof vertex === "object"
      ? (vertex as Record<string, unknown>)
      : {};
    const id = String(record.id ?? record.ID ?? index + 1);
    vertexMap.set(id, point);
  });

  return vertexMap;
}

function parseLoop(value: unknown, vertexMap: Map<string, Point>): Point[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const directPoint = toFinitePoint(entry);
      if (directPoint) {
        return directPoint;
      }

      return vertexMap.get(String(entry)) ?? null;
    })
    .filter((point): point is Point => point !== null);
}

function parseGeometryJson(content: string): ParsedGeometryFile {
  const source = JSON.parse(content) as Record<string, unknown>;
  const data = (source.pslg ?? source.geometry ?? source) as Record<string, unknown>;
  const vertexMap = buildVertexMap(data.vertices ?? data.nodes);
  const outerLoop = parseLoop(
    data.outerLoop ?? data.outer ?? data.boundary,
    vertexMap,
  );
  const rawHoleLoops = data.innerLoops ?? data.holeLoops ?? data.holes ?? [];
  const holeLoops = Array.isArray(rawHoleLoops)
    ? rawHoleLoops.map((loop) => parseLoop(loop, vertexMap)).filter((loop) => loop.length >= 3)
    : [];

  if (outerLoop.length < 3) {
    throw new Error("JSON file does not contain a valid outerLoop with at least 3 points.");
  }

  return { holeLoops, outerLoop };
}

function parsePointLine(line: string): Point | null {
  const numbers = line.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (numbers.length < 2) {
    return null;
  }

  const hasLeadingId = numbers.length >= 3 && Number.isInteger(numbers[0]);
  const x = hasLeadingId ? numbers[1] : numbers[0];
  const y = hasLeadingId ? numbers[2] : numbers[1];

  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function parseGeometryText(content: string): ParsedGeometryFile {
  const outerLoop: Point[] = [];
  const holeLoops: Point[][] = [];
  let currentLoop = outerLoop;
  let hasExplicitSections = false;
  let looksLikeMeshExport = false;

  content.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) {
      return;
    }

    const section = line.toLowerCase();
    if (section.includes("*node") || section.includes("[nodes]")) {
      looksLikeMeshExport = true;
    }

    if (/\bouter\b|\[outer\]|\*outer/.test(section)) {
      currentLoop = outerLoop;
      hasExplicitSections = true;
      return;
    }

    if (/\bhole\b|\binner\b|\[hole|\*hole|\*inner/.test(section)) {
      currentLoop = [];
      holeLoops.push(currentLoop);
      hasExplicitSections = true;
      return;
    }

    if (section.startsWith("[") || section.startsWith("*")) {
      return;
    }

    const point = parsePointLine(line);
    if (point) {
      currentLoop.push(point);
    }
  });

  if (!hasExplicitSections && looksLikeMeshExport) {
    throw new Error("This looks like a mesh export, not geometry input. Import a PSLG/shape file instead.");
  }

  if (outerLoop.length < 3) {
    throw new Error("Text file does not contain an outer loop with at least 3 coordinate rows.");
  }

  return {
    holeLoops: holeLoops.filter((loop) => loop.length >= 3),
    outerLoop,
  };
}

function parseGeometryFile(fileName: string, content: string): ParsedGeometryFile {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Selected file is empty.");
  }

  if (fileName.toLowerCase().endsWith(".json") || trimmed.startsWith("{")) {
    return parseGeometryJson(trimmed);
  }

  return parseGeometryText(trimmed);
}

export function useDashboardWorkspace(): WorkspaceViewModel {
  const [machine, dispatchMachine] = useReducer(
    transitionWorkspace,
    undefined,
    createInitialWorkspaceMachine,
  );

  const [thetaMin, setThetaMin] = useState(25.5);
  const [rlRatio, setRlRatio] = useState(1.15);
  const [maxLength, setMaxLength] = useState(0.06);
  const [eraserRadius, setEraserRadius] = useState(ERASER_RADIUS);
  const [draftShapeMode, setDraftShapeModeState] =
    useState<DraftShapeMode>("freehand");
  const [polygonSides, setPolygonSides] = useState(6);
  const [elementType, setElementType] = useState<ElementType>("T3");
  const [outerLoop, setOuterLoop] = useState<Point[]>([]);
  const [holeLoops, setHoleLoops] = useState<Point[][]>([]);
  const [draftStrokes, setDraftStrokesState] = useState<Point[][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>(null);
  const [draggingPoint, setDraggingPoint] = useState<SelectedPoint>(null);
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [meshPreview, setMeshPreview] = useState<ReturnType<typeof generateMesh> | null>(null);
  const [logs, setLogs] = useState<string[]>(DEFAULT_WORKSPACE_LOGS);
  const [pslgValidation, setPslgValidation] = useState<PSLGValidationState>({
    message: "PSLG has not been validated.",
    status: "idle",
  });

  const draftStrokesRef = useRef<Point[][]>(draftStrokes);
  const eraserUndoCapturedRef = useRef(false);
  const geometryRevisionRef = useRef(0);
  const lastPanScreenPointRef = useRef<Point | null>(null);
  const shapeDraftLoopRef = useRef<Point[]>([]);
  const shapeDragStartRef = useRef<Point | null>(null);
  const undoSnapshotsRef = useRef<WorkspaceUndoSnapshot[]>([]);

  useEffect(() => {
    draftStrokesRef.current = draftStrokes;
  }, [draftStrokes]);

  const setDraftStrokes = (updater: DraftStrokesUpdater) => {
    const next =
      typeof updater === "function" ? updater(draftStrokesRef.current) : updater;
    draftStrokesRef.current = next;
    setDraftStrokesState(next);
  };

  const draftType = machine.draftType;
  const activeTool = machine.activeTool;
  const isSketching = machine.mode === "drawing";
  const isMeshing = machine.mode === "meshing";
  const hasMesh = meshPreview !== null;

  const geometryReady = outerLoop.length >= 3;
  const draftPointCount = draftStrokes.reduce(
    (total, stroke) => total + stroke.length,
    0,
  );
  const draftLoop = draftStrokes.flat();
  const draftReadyToClose = draftLoop.length >= 3;
  const hasDraft = draftPointCount > 0;
  const generatedSegments = useMemo(() => {
    return outerLoop.length + holeLoops.reduce((total, loop) => total + loop.length, 0);
  }, [holeLoops, outerLoop]);

  const meshAnalysis = useMemo(() => {
    return meshPreview ? analyzeMesh(meshPreview) : EMPTY_MESH_ANALYSIS;
  }, [meshPreview]);

  const meshNodes = meshPreview?.nodes ?? [];
  const meshEdges = meshPreview?.edges ?? [];

  const clearMeshPreview = () => {
    setMeshPreview(null);
  };

  const markPSLGDirty = () => {
    setPslgValidation({
      message: "Geometry changed. Validate PSLG again.",
      status: "idle",
    });
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-GB");
    setLogs((current) => [...current.slice(-79), `[${timestamp}] ${message}`]);
  };

  const commitGeometryChange = () => {
    geometryRevisionRef.current += 1;
  };

  const pushUndoSnapshot = (logMessage: string) => {
    undoSnapshotsRef.current = [
      ...undoSnapshotsRef.current.slice(-19),
      {
        draftStrokes: cloneLoops(draftStrokes),
        holeLoops: cloneLoops(holeLoops),
        logMessage,
        machine: { ...machine },
        outerLoop: cloneLoop(outerLoop),
        pslgValidation: { ...pslgValidation },
        revision: geometryRevisionRef.current,
        selectedPoint: selectedPoint ? { ...selectedPoint } : null,
      },
    ];
  };

  const restoreUndoSnapshot = (snapshot: WorkspaceUndoSnapshot) => {
    setDraftStrokes(cloneLoops(snapshot.draftStrokes));
    setHoleLoops(cloneLoops(snapshot.holeLoops));
    setOuterLoop(cloneLoop(snapshot.outerLoop));
    setSelectedPoint(snapshot.selectedPoint ? { ...snapshot.selectedPoint } : null);
    setDraggingPoint(null);
    setIsPanningCanvas(false);
    lastPanScreenPointRef.current = null;
    clearMeshPreview();
    setPslgValidation({ ...snapshot.pslgValidation });
    dispatchMachine({
      draftType: snapshot.machine.draftType,
      mode: snapshot.machine.mode,
      tool: snapshot.machine.activeTool,
      type: "SYNC_CONTEXT",
    });
  };

  const clearUndoSnapshots = () => {
    undoSnapshotsRef.current = [];
  };

  const getScreenPoint = (event: ReactMouseEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect();

    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    };
  };

  const getCanvasPoint = (
    event: ReactMouseEvent<HTMLCanvasElement>,
  ): Point | null => {
    const canvas = event.currentTarget;
    const point = getScreenPoint(event);

    return screenToCanvasPoint(
      point,
      canvas.width,
      canvas.height,
      zoomLevel,
      panOffset,
    );
  };

  const zoomIn = () => {
    setZoomLevel((current) => {
      const nextStep = ZOOM_STEPS.find((step) => step > current);
      return nextStep ?? current;
    });
  };

  const zoomOut = () => {
    setZoomLevel((current) => {
      const previousSteps = ZOOM_STEPS.filter((step) => step < current);
      return previousSteps[previousSteps.length - 1] ?? current;
    });
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const setActiveTool = (tool: Tool) => {
    setIsPanningCanvas(false);
    lastPanScreenPointRef.current = null;

    if (tool === "boundary") {
      dispatchMachine(startBoundaryCommand());
      return;
    }

    if (tool === "hole") {
      dispatchMachine(startHoleCommand());
      return;
    }

    dispatchMachine({ tool, type: "TOOL_SELECTED" });
  };

  const setWorkspaceDraftType = (nextDraftType: DraftType) => {
    dispatchMachine({
      draftType: nextDraftType,
      tool: nextDraftType === "outer" ? "boundary" : "hole",
      type: "SYNC_CONTEXT",
    });
  };

  const setWorkspaceDraftShapeMode = (mode: DraftShapeMode) => {
    if (draftPointCount > 0 || isSketching) {
      addLog("Close or cancel the current draft before switching draw mode.");
      return;
    }

    setDraftShapeModeState(mode);
    addLog(`Draw mode set to ${mode}.`);
  };

  const closeDraftLoop = (points: Point[]) => {
    if (points.length < 3) {
      return;
    }

    const result = closeShapeCommand({
      draftStrokes,
      draftType,
      holeLoops,
      outerLoop,
      points,
    });

    setOuterLoop(result.outerLoop);
    setHoleLoops(result.holeLoops);
    setDraftStrokes(result.draftStrokes);
    shapeDraftLoopRef.current = [];
    shapeDragStartRef.current = null;
    clearMeshPreview();
    markPSLGDirty();
    addLog(result.logMessage);
    commitGeometryChange();

    if (result.nextTool || result.nextDraftType) {
      dispatchMachine({
        draftType: result.nextDraftType,
        tool: result.nextTool,
        type: "SYNC_CONTEXT",
      });
    }

    dispatchMachine({
      closedDraftType: draftType,
      type: "SHAPE_CLOSED",
    });
  };

  const resetGeometry = () => {
    if (outerLoop.length > 0 || holeLoops.length > 0 || draftPointCount > 0) {
      pushUndoSnapshot("Workspace clear undone.");
    }

    setOuterLoop([]);
    setHoleLoops([]);
    setDraftStrokes([]);
    setSelectedPoint(null);
    setDraggingPoint(null);
    setIsPanningCanvas(false);
    setPanOffset({ x: 0, y: 0 });
    shapeDraftLoopRef.current = [];
    shapeDragStartRef.current = null;
    lastPanScreenPointRef.current = null;
    clearMeshPreview();
    setPslgValidation({
      message: "PSLG has not been validated.",
      status: "idle",
    });
    dispatchMachine({ type: "RESET" });
    addLog("Geometry workspace cleared.");
    commitGeometryChange();
  };

  const cancelCurrentSketch = () => {
    if (draftPointCount === 0 && !isSketching) {
      return;
    }

    pushUndoSnapshot("Canceled stroke restored.");
    shapeDraftLoopRef.current = [];
    shapeDragStartRef.current = null;
    setDraftStrokes([]);
    dispatchMachine({ type: "POINTER_RELEASED" });
    markPSLGDirty();
    addLog("Current sketch stroke canceled.");
    commitGeometryChange();
  };

  const closeCurrentShape = () => {
    if (draftLoop.length < 3) {
      addLog("Need at least 3 points before closing the current shape.");
      return;
    }

    closeDraftLoop(draftLoop);
  };

  const deleteSelectedShape = () => {
    if (!selectedPoint) {
      return;
    }

    pushUndoSnapshot(
      selectedPoint.type === "outer"
        ? "Deleted outer boundary restored."
        : `Deleted hole ${selectedPoint.holeIndex + 1} restored.`,
    );

    if (selectedPoint.type === "outer") {
      setOuterLoop([]);
      setHoleLoops([]);
      setSelectedPoint(null);
      clearMeshPreview();
      markPSLGDirty();
      dispatchMachine({
        draftType: "outer",
        tool: "boundary",
        type: "SYNC_CONTEXT",
      });
      addLog("Outer boundary deleted.");
      commitGeometryChange();
      return;
    }

    setHoleLoops((current) =>
      current.filter((_, holeIndex) => holeIndex !== selectedPoint.holeIndex),
    );
    setSelectedPoint(null);
    clearMeshPreview();
    markPSLGDirty();
    addLog(`Hole ${selectedPoint.holeIndex + 1} deleted.`);
    commitGeometryChange();
  };

  const removeLastStep = () => {
    const lastSnapshot = undoSnapshotsRef.current[undoSnapshotsRef.current.length - 1];
    if (lastSnapshot && lastSnapshot.revision === geometryRevisionRef.current - 1) {
      undoSnapshotsRef.current = undoSnapshotsRef.current.slice(0, -1);
      restoreUndoSnapshot(lastSnapshot);
      geometryRevisionRef.current = lastSnapshot.revision;
      addLog(lastSnapshot.logMessage);
      return;
    }

    const result = undoCommand({
      draftStrokes,
      draftType,
      holeLoops,
      outerLoop,
    });

    setDraftStrokes(result.draftStrokes);
    setHoleLoops(result.holeLoops);
    setOuterLoop(result.outerLoop);
    clearMeshPreview();
    markPSLGDirty();
    addLog(result.logMessage);
    commitGeometryChange();

    if (result.nextTool || result.nextDraftType) {
      dispatchMachine({
        draftType: result.nextDraftType,
        tool: result.nextTool,
        type: "SYNC_CONTEXT",
      });
    }
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    setMousePos(point);

    if (activeTool === "eraser") {
      dispatchMachine({ type: "ERASER_STARTED" });
      if (draftPointCount > 0 && !eraserUndoCapturedRef.current) {
        pushUndoSnapshot("Erased draft stroke restored.");
        eraserUndoCapturedRef.current = true;
        commitGeometryChange();
      }
      setDraftStrokes((current) => eraseStrokeCommand(current, point, eraserRadius));
      clearMeshPreview();
      markPSLGDirty();
      addLog(`Eraser applied at (${point.x}, ${point.y}).`);
      return;
    }

    if (activeTool === "select") {
      const found = findNearbyPoint({ holeLoops, outerLoop, point });
      setSelectedPoint(found);
      if (found) {
        setDraggingPoint(found);
        setIsPanningCanvas(false);
        lastPanScreenPointRef.current = null;
        return;
      }

      setIsPanningCanvas(true);
      lastPanScreenPointRef.current = getScreenPoint(event);
      return;
    }

    const targetType: DraftType = activeTool === "boundary" ? "outer" : "hole";
    if (draftPointCount > 0 && targetType !== draftType) {
      addLog("Close or cancel the current stroke before switching shape type.");
      return;
    }

    if (targetType === "outer" && outerLoop.length >= 3) {
      pushUndoSnapshot("Previous outer boundary and holes restored.");
      setOuterLoop([]);
      setHoleLoops([]);
      markPSLGDirty();
      addLog("Starting a new outer boundary. Existing holes were cleared.");
      commitGeometryChange();
    }

    const initialStroke = [point];
    shapeDraftLoopRef.current = initialStroke;
    shapeDragStartRef.current = draftShapeMode === "freehand" ? null : point;
    setDraftStrokes((current) =>
      draftShapeMode === "freehand" ? [...current, initialStroke] : [initialStroke],
    );
    clearMeshPreview();
    markPSLGDirty();
    dispatchMachine({ draftType: targetType, type: "SKETCH_STARTED" });
    addLog(
      `${targetType === "outer" ? "Outer boundary" : "Hole"} ${draftShapeMode} sketch started at (${point.x}, ${point.y}).`,
    );
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (isPanningCanvas) {
      const screenPoint = getScreenPoint(event);
      const previous = lastPanScreenPointRef.current;

      if (previous) {
        setPanOffset((current) => ({
          x: current.x + screenPoint.x - previous.x,
          y: current.y + screenPoint.y - previous.y,
        }));
      }

      lastPanScreenPointRef.current = screenPoint;
      const canvas = event.currentTarget;
      setMousePos(
        screenToCanvasPoint(
          screenPoint,
          canvas.width,
          canvas.height,
          zoomLevel,
          panOffset,
        ),
      );
      return;
    }

    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    setMousePos(point);

    if (draggingPoint) {
      const result = movePointCommand({
        holeLoops,
        outerLoop,
        point,
        selection: draggingPoint,
      });
      setOuterLoop(result.outerLoop);
      setHoleLoops(result.holeLoops);
      clearMeshPreview();
      markPSLGDirty();
    }

    if (machine.mode === "erasing") {
      setDraftStrokes((current) => eraseStrokeCommand(current, point, eraserRadius));
      clearMeshPreview();
      markPSLGDirty();
    }

    if (machine.mode === "drawing" && draftShapeMode !== "freehand") {
      const start = shapeDragStartRef.current;
      if (!start) {
        return;
      }

      const loop = createShapeDraftLoop({
        end: point,
        mode: draftShapeMode,
        polygonSides,
        start,
      });
      shapeDraftLoopRef.current = loop;
      setDraftStrokes([loop]);
      return;
    }

    if (machine.mode === "drawing") {
      setDraftStrokes((current) => {
        if (current.length === 0) {
          return [[point]];
        }

        const next = [...current];
        const activeStroke = next[next.length - 1];
        const last = activeStroke[activeStroke.length - 1];
        if (distance(last, point) < FREEHAND_POINT_SPACING) {
          return current;
        }

        next[next.length - 1] = [...activeStroke, point];
        return next;
      });
    }
  };

  const handleMouseUp = () => {
    if (draggingPoint) {
      addLog(
        `${
          draggingPoint.type === "outer"
            ? `Updated outer boundary point ${draggingPoint.index + 1}.`
            : `Updated hole ${draggingPoint.holeIndex + 1}, point ${draggingPoint.index + 1}.`
        }`,
      );
      commitGeometryChange();
    }

    setDraggingPoint(null);
    setIsPanningCanvas(false);
    lastPanScreenPointRef.current = null;

    if (machine.mode === "drawing") {
      const strokes = draftStrokesRef.current;
      const activeStroke =
        draftShapeMode === "freehand"
          ? (strokes[strokes.length - 1] ?? [])
          : shapeDraftLoopRef.current;
      const minimumPointCount = draftShapeMode === "freehand" ? 1 : 3;
      if (activeStroke.length < minimumPointCount) {
        addLog(
          draftShapeMode === "freehand"
            ? "Sketch too short. Click on the canvas to create a point."
            : "Sketch too short. Drag farther to size the shape.",
        );
        setDraftStrokes((current) =>
          draftShapeMode === "freehand" ? current.slice(0, -1) : [],
        );
      } else {
        const capturedLabel =
          draftShapeMode === "freehand" && activeStroke.length === 1
            ? "Point"
            : draftShapeMode === "freehand"
              ? "Stroke"
              : "Shape draft";
        addLog(
          `${capturedLabel} captured with ${activeStroke.length} point${activeStroke.length === 1 ? "" : "s"}. Use Close Shape when you want to connect the ends.`,
        );
      }
      commitGeometryChange();
    }

    shapeDraftLoopRef.current = [];
    shapeDragStartRef.current = null;
    eraserUndoCapturedRef.current = false;
    dispatchMachine({ type: "POINTER_RELEASED" });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelCurrentSketch();
      }

      if (event.key === "Enter" && draftLoop.length >= 3) {
        event.preventDefault();
        closeDraftLoop(draftLoop);
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (draftLoop.length > 0 || isSketching) {
          event.preventDefault();
          cancelCurrentSketch();
          return;
        }

        if (selectedPoint) {
          event.preventDefault();
          deleteSelectedShape();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [draftLoop, isSketching, selectedPoint]);

  const handleValidatePSLG = () => {
    const pslg = buildPSLG({ holeLoops, outerLoop });
    const validation = validateGeometry(pslg);

    if (!validation.valid) {
      const message = validation.message ?? "PSLG validation failed.";
      setPslgValidation({ message, status: "invalid" });
      addLog(`PSLG validation failed: ${message}`);
      return false;
    }

    const message = `PSLG valid: 1 outer loop, ${pslg.holeLoops.length} inner loops, ${pslg.totalSegments} segments.`;
    setPslgValidation({ message, status: "valid" });
    addLog(message);
    return true;
  };

  const handleImportGeometryFile = (fileName: string, content: string) => {
    try {
      const parsedGeometry = parseGeometryFile(fileName, content);
      setOuterLoop(parsedGeometry.outerLoop);
      setHoleLoops(parsedGeometry.holeLoops);
      setDraftStrokes([]);
      setSelectedPoint(null);
      setDraggingPoint(null);
      setIsPanningCanvas(false);
      setMeshPreview(null);
      setPslgValidation({
        message: `Imported ${fileName}. Validate PSLG before meshing.`,
        status: "idle",
      });
      clearUndoSnapshots();
      commitGeometryChange();
      dispatchMachine({
        draftType: "hole",
        mode: "idle",
        tool: "select",
        type: "SYNC_CONTEXT",
      });
      addLog(`Imported ${fileName}.`);
      addLog(
        `Detected 1 outer loop and ${parsedGeometry.holeLoops.length} inner loops.`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to import geometry file.";
      setPslgValidation({ message, status: "invalid" });
      addLog(`Import failed: ${message}`);
    }
  };

  const buildExportContent = (format: "csv" | "dat" | "json") => {
    if (!meshPreview) {
      return "";
    }

    if (format === "json") {
      return JSON.stringify(
        {
          mesh: {
            edgeRecords: meshPreview.edgeRecords,
            elementType: meshPreview.elementType,
            elements: meshPreview.elements,
            nodes: meshPreview.nodes,
          },
          pslg: buildPSLG({ holeLoops, outerLoop }),
          quality: meshAnalysis.stats,
        },
        null,
        2,
      );
    }

    if (format === "csv") {
      const nodeRows = meshPreview.nodes
        .map((node) => `${node.id},${node.x},${node.y},${node.boundary ? 1 : 0}`)
        .join("\n");
      const elementRows = meshPreview.elements
        .map((element) => `${element.id},${element.type},${element.nodeIds.join(" ")},${element.area.toFixed(4)},${element.minAngle.toFixed(2)},${element.circumradiusToShortestEdge.toFixed(3)},${element.status}`)
        .join("\n");

      return [
        "[NODES]",
        "id,x,y,boundary",
        nodeRows,
        "",
        "[ELEMENTS]",
        "id,type,node_ids,area,min_angle,ratio,status",
        elementRows,
      ].join("\n");
    }

    const nodeBlock = meshPreview.nodes
      .map((node) => `${node.id} ${node.x.toFixed(4)} ${node.y.toFixed(4)}`)
      .join("\n");
    const elementBlock = meshPreview.elements
      .map((element) => `${element.id} ${element.type} ${element.nodeIds.join(" ")}`)
      .join("\n");

    return [
      "# Meshing_FE export",
      `# element_type ${meshPreview.elementType}`,
      `# nodes ${meshPreview.nodes.length}`,
      `# elements ${meshPreview.elements.length}`,
      "*NODE",
      nodeBlock,
      "*ELEMENT",
      elementBlock,
    ].join("\n");
  };

  const handleExportMesh = (format: "csv" | "dat" | "json") => {
    if (!meshPreview) {
      addLog("Generate a mesh before exporting solver data.");
      return;
    }

    const content = buildExportContent(format);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `meshing-workspace.${format}`;
    link.click();
    URL.revokeObjectURL(link.href);
    addLog(`Exported meshing-workspace.${format}.`);
  };

  const handleGenerateMesh = () => {
    if (draftPointCount >= 3) {
      addLog("Close the current shape before generating the mesh preview.");
      return;
    }

    const pslg = buildPSLG({ holeLoops, outerLoop });
    if (pslg.outerLoop.length < 3) {
      addLog("Create and close an outer boundary before generating mesh.");
      return;
    }

    const validation = validateGeometry(pslg);
    if (!validation.valid) {
      const message = validation.message ?? "PSLG validation failed.";
      setPslgValidation({ message, status: "invalid" });
      addLog(`PSLG validation failed: ${message}`);
      return;
    }

    setPslgValidation({
      message: "PSLG validation passed.",
      status: "valid",
    });
    dispatchMachine({ type: "MESH_STARTED" });
    setMeshPreview(null);
    addLog("PSLG validation passed.");
    addLog("Starting Meshing Engine (Delaunay / mapped preview)...");
    addLog(
      `Boundary summary: 1 outer loop, ${pslg.holeLoops.length} holes, ${pslg.totalSegments} total segments.`,
    );

    window.setTimeout(() => {
      try {
        const nextPreview = generateMesh({
          elementType,
          holeLoops,
          maxLength,
          minAngle: thetaMin,
          outerLoop,
        });
        setMeshPreview(nextPreview);
        addLog(`Generated ${nextPreview.nodes.length} nodes and ${nextPreview.elements.length} ${elementType} elements.`);
        addLog("Quality analysis and connectivity matrices refreshed.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to generate a mesh preview from the current sketch.";
        addLog(message);
      } finally {
        dispatchMachine({ type: "MESH_FINISHED" });
      }
    }, 700);
  };

  return {
    activeTool,
    cancelCurrentSketch,
    closeCurrentShape,
    deleteSelectedShape,
    draftPointCount,
    draftReadyToClose,
    draftStrokes,
    draftType,
    draftShapeMode,
    elementType,
    eraserRadius,
    errorData: meshAnalysis.errorData,
    generatedSegments,
    geometryReady,
    handleExportMesh,
    handleGenerateMesh,
    handleImportGeometryFile,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleValidatePSLG,
    hasDraft,
    hasMesh,
    holeLoops,
    isMeshing,
    isPanningCanvas,
    isSketching,
    logs,
    maxLength,
    meshEdges,
    meshNodes,
    meshPreview,
    meshStats: meshAnalysis.stats,
    mousePos,
    outerLoop,
    panOffset,
    pslgValidation,
    polygonSides,
    removeLastStep,
    resetGeometry,
    resetZoom,
    rlRatio,
    selectedPoint,
    setActiveTool,
    setDraftType: setWorkspaceDraftType,
    setDraftShapeMode: setWorkspaceDraftShapeMode,
    setElementType,
    setEraserRadius,
    setMaxLength,
    setPolygonSides,
    setRlRatio,
    setThetaMin,
    thetaMin,
    zoomIn,
    zoomLevel,
    zoomOut,
  };
}
