import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { EMPTY_MESH_ANALYSIS, analyzeMesh } from "../../analysis/application/use-cases/analyze-mesh";
import type { Point } from "../../geometry/domain/types";
import { buildPSLG } from "../../geometry/application/use-cases/build-pslg";
import { distance } from "../../geometry/domain/services/measurements";
import { generateMesh } from "../../meshing/application/use-cases/generate-mesh";
import { screenToCanvasPoint } from "../../../infrastructure/canvas/coordinates";
import {
  DEFAULT_WORKSPACE_LOGS,
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
  CirclePrimitiveInput,
  DraftType,
  GeometryRecordItem,
  PrimitiveType,
  ProjectSnapshotItem,
  QuickFEAInput,
  QuickFEASummary,
  RectanglePrimitiveInput,
  SelectedPoint,
  TrianglePrimitiveInput,
  Tool,
  WorkspaceViewModel,
} from "./types";
import type { ElementType } from "../../meshing/domain/types";
import { useMeshAPI } from "../../../hooks/useMeshAPI";
import { meshStore } from "../../../store/meshStore";
import type { GeometryResponse } from "../../../services/apiClient";

const CIRCLE_SEGMENT_COUNT = 64;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

function buildRectangleOuterLoop(
  xMin: number,
  yMin: number,
  width: number,
  height: number,
): Point[] {
  return [
    { x: xMin, y: yMin },
    { x: xMin + width, y: yMin },
    { x: xMin + width, y: yMin + height },
    { x: xMin, y: yMin + height },
  ];
}

function buildCircleOuterLoop(
  centerX: number,
  centerY: number,
  radius: number,
  sampleCount = CIRCLE_SEGMENT_COUNT,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const angle = (2 * Math.PI * i) / sampleCount;
    points.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return points;
}

function geometryToOuterLoop(geometry: GeometryResponse): Point[] {
  if (geometry.geometry_type === "rectangle") {
    if (
      geometry.x_min == null ||
      geometry.y_min == null ||
      geometry.width == null ||
      geometry.height == null
    ) {
      throw new Error("Rectangle geometry payload is missing required fields.");
    }
    return buildRectangleOuterLoop(
      geometry.x_min,
      geometry.y_min,
      geometry.width,
      geometry.height,
    );
  }

  if (geometry.geometry_type === "circle") {
    if (
      geometry.center_x == null ||
      geometry.center_y == null ||
      geometry.radius == null
    ) {
      throw new Error("Circle geometry payload is missing required fields.");
    }
    return buildCircleOuterLoop(
      geometry.center_x,
      geometry.center_y,
      geometry.radius,
    );
  }

  const points = geometry.points ?? [];
  if (!Array.isArray(points) || points.length < 3) {
  throw new Error("Polygon/Triangle geometry payload must contain at least 3 points.");
  }

  return points.map(([x, y]) => ({ x, y }));
}

function parsePolygonInputText(input: string): {
  points: number[][] | null;
  validationError: string | null;
} {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 3) {
    return {
      points: null,
      validationError: "Polygon requires at least 3 points (one point per line).",
    };
  }

  const points: number[][] = [];
  for (const line of lines) {
    const tokens = line.split(/[,\s]+/).filter((token) => token.length > 0);
    if (tokens.length !== 2) {
      return {
        points: null,
        validationError: `Invalid point format: "${line}". Use "x,y" or "x y".`,
      };
    }

    const x = Number(tokens[0]);
    const y = Number(tokens[1]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return {
        points: null,
        validationError: `Invalid numeric coordinates: "${line}".`,
      };
    }

    points.push([x, y]);
  }

  return { points, validationError: null };
}

export function useDashboardWorkspace(): WorkspaceViewModel {
  const [machine, dispatchMachine] = useReducer(
    transitionWorkspace,
    undefined,
    createInitialWorkspaceMachine,
  );
  const meshAPI = useMeshAPI();

  const [thetaMin, setThetaMin] = useState(20.7);
  const [rlRatio, setRlRatioState] = useState(Math.SQRT2);
  const [maxLength, setMaxLength] = useState(0.18);
  const [quadNx, setQuadNx] = useState(10);
  const [quadNy, setQuadNy] = useState(10);
  const [elementType, setElementType] = useState<ElementType>("T3");
  const [outerLoop, setOuterLoop] = useState<Point[]>([]);
  const [holeLoops, setHoleLoops] = useState<Point[][]>([]);
  const [draftStrokes, setDraftStrokes] = useState<Point[][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>(null);
  const [draggingPoint, setDraggingPoint] = useState<SelectedPoint>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [meshPreview, setMeshPreview] = useState<ReturnType<typeof generateMesh> | null>(null);
  const [logs, setLogs] = useState<string[]>(DEFAULT_WORKSPACE_LOGS);
  const [shapeDatText, setShapeDatText] = useState(
    "OUTER\n0 0\n4 0\n4 2\n0 2\nEND\nHOLE\n1.2 0.6\n2.0 0.6\n2.0 1.4\n1.2 1.4\nEND",
  );
  const [projectName, setProjectName] = useState("Sketch Snapshot");
  const [projectNotes, setProjectNotes] = useState("");
  const [projectSnapshots, setProjectSnapshots] = useState<ProjectSnapshotItem[]>([]);
  const [isProjectBusy, setIsProjectBusy] = useState(false);
  const [isShapeDatMeshing, setIsShapeDatMeshing] = useState(false);
  const [isRunningFEA, setIsRunningFEA] = useState(false);
  const [feaSummary, setFeaSummary] = useState<QuickFEASummary | null>(null);
  const [feaInput, setFeaInputState] = useState<QuickFEAInput>({
    E: 210e9,
    nu: 0.3,
    thickness: 0.01,
    totalForceFy: -1000,
    analysisType: "plane_stress",
  });
  const [primitiveType, setPrimitiveType] = useState<PrimitiveType>("rectangle");
  const [primitiveName, setPrimitiveName] = useState("");
  const [rectangleInput, setRectangleInput] = useState<RectanglePrimitiveInput>({
    xMin: 100,
    yMin: 100,
    width: 320,
    height: 180,
  });
  const [circleInput, setCircleInput] = useState<CirclePrimitiveInput>({
    centerX: 320,
    centerY: 240,
    radius: 120,
  });
  const [triangleInput, setTriangleInput] = useState<TrianglePrimitiveInput>({
    points: [
      { x: 180, y: 340 },
      { x: 340, y: 120 },
      { x: 520, y: 340 },
    ],
  });
  const [polygonInputText, setPolygonInputText] = useState(
    "120,120\n520,120\n520,320\n120,320",
  );
  const [geometryRecords, setGeometryRecords] = useState<GeometryRecordItem[]>([]);
  const [selectedGeometryId, setSelectedGeometryId] = useState<string | null>(null);
  const [isGeometryBusy, setIsGeometryBusy] = useState(false);
  const [geometryError, setGeometryError] = useState<string | null>(null);

  const draftStrokesRef = useRef<Point[][]>(draftStrokes);
  const panDragStartRef = useRef<{ screen: Point; offset: Point } | null>(null);

  useEffect(() => {
    draftStrokesRef.current = draftStrokes;
  }, [draftStrokes]);

  const draftType = machine.draftType;
  const activeTool = machine.activeTool;
  const isSketching = machine.mode === "drawing";
  const isMeshing = machine.mode === "meshing";
  const hasMesh = meshPreview !== null;
  const hasProjectData = projectSnapshots.length > 0;

  const geometryReady = outerLoop.length >= 3;
  const draftPointCount = draftStrokes.reduce(
    (total, stroke) => total + stroke.length,
    0,
  );
  const draftLoop = draftStrokes.flat();
  const draftReadyToClose = draftLoop.length >= 3;
  const hasDraft = draftPointCount > 0;
  const canUndo =
    draftStrokes.length > 0 || holeLoops.length > 0 || outerLoop.length > 0;
  const generatedSegments = useMemo(() => {
    return outerLoop.length + holeLoops.reduce((total, loop) => total + loop.length, 0);
  }, [holeLoops, outerLoop]);

  const meshAnalysis = useMemo(() => {
    return meshPreview ? analyzeMesh(meshPreview) : EMPTY_MESH_ANALYSIS;
  }, [meshPreview]);

  const meshNodes = meshPreview?.nodes ?? [];
  const meshEdges = meshPreview?.edges ?? [];
  const meshQuality =
    (meshPreview?.dashboard?.mesh_quality as Record<string, unknown> | undefined) ?? null;
  const meshConnectivityMatrices = meshPreview?.connectivityMatrices ?? null;

  const setRlRatio = (value: number) => {
    setRlRatioState(Math.min(Math.max(value, 1.0), Math.SQRT2));
  };

  const clearMeshPreview = () => {
    setMeshPreview(null);
    setFeaSummary(null);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-GB");
    setLogs((current) => [...current.slice(-11), `[${timestamp}] ${message}`]);
  };

  const applyGeometryToWorkspace = (geometry: GeometryResponse, source: "created" | "loaded") => {
    const nextOuterLoop = geometryToOuterLoop(geometry);
    setOuterLoop(nextOuterLoop);
    setHoleLoops([]);
    setDraftStrokes([]);
    setSelectedPoint(null);
    setDraggingPoint(null);
    clearMeshPreview();
    dispatchMachine({ type: "SYNC_CONTEXT", mode: "idle" });
    meshStore.clear();
    meshStore.setGeometryId(geometry.id);
    setSelectedGeometryId(geometry.id);
    setGeometryError(null);
    addLog(
      `[Geometry] ${source === "created" ? "Created" : "Loaded"} ${geometry.geometry_type} "${geometry.name}".`,
    );
  };

  const getScreenPoint = (
    event: ReactMouseEvent<HTMLCanvasElement>,
  ): Point => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(event.clientX - rect.left),
      y: Math.round(event.clientY - rect.top),
    };
  };

  const getCanvasPoint = (
    event: ReactMouseEvent<HTMLCanvasElement>,
  ): Point | null => {
    const canvas = event.currentTarget;
    const screenPoint = getScreenPoint(event);

    return screenToCanvasPoint(
      screenPoint,
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
    setIsPanning(false);
    panDragStartRef.current = null;
  };

  const handleWheel = (event: ReactWheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    if (event.deltaY < 0) {
      zoomIn();
      return;
    }

    if (event.deltaY > 0) {
      zoomOut();
    }
  };

  const setActiveTool = (tool: Tool) => {
    setIsPanning(false);
    panDragStartRef.current = null;

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
    clearMeshPreview();
    addLog(result.logMessage);

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
    setOuterLoop([]);
    setHoleLoops([]);
    setDraftStrokes([]);
    setSelectedPoint(null);
    setDraggingPoint(null);
    setSelectedGeometryId(null);
    setGeometryError(null);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
    panDragStartRef.current = null;
    meshStore.clear();
    clearMeshPreview();
    dispatchMachine({ type: "RESET" });
    addLog("Geometry workspace cleared.");
  };

  const cancelCurrentSketch = () => {
    if (draftPointCount === 0 && !isSketching) {
      return;
    }

    setDraftStrokes([]);
    dispatchMachine({ type: "POINTER_RELEASED" });
    addLog("Current sketch stroke canceled.");
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

    if (selectedPoint.type === "outer") {
      setOuterLoop([]);
      setHoleLoops([]);
      setSelectedPoint(null);
      clearMeshPreview();
      dispatchMachine({
        draftType: "outer",
        tool: "boundary",
        type: "SYNC_CONTEXT",
      });
      addLog("Outer boundary deleted.");
      return;
    }

    setHoleLoops((current) =>
      current.filter((_, holeIndex) => holeIndex !== selectedPoint.holeIndex),
    );
    setSelectedPoint(null);
    clearMeshPreview();
    addLog(`Hole ${selectedPoint.holeIndex + 1} deleted.`);
  };

  const removeLastStep = () => {
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
    addLog(result.logMessage);

    if (result.nextTool || result.nextDraftType) {
      dispatchMachine({
        draftType: result.nextDraftType,
        tool: result.nextTool,
        type: "SYNC_CONTEXT",
      });
    }
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) {
      return;
    }

    const screenPoint = getScreenPoint(event);
    const point = getCanvasPoint(event);
    if (!point) {
      return;
    }

    setMousePos(point);

    if (activeTool === "eraser") {
      dispatchMachine({ type: "ERASER_STARTED" });
      setDraftStrokes((current) => eraseStrokeCommand(current, point));
      clearMeshPreview();
      addLog(`Eraser applied at (${point.x}, ${point.y}).`);
      return;
    }

    if (activeTool === "select") {
      const found = findNearbyPoint({ holeLoops, outerLoop, point });
      setSelectedPoint(found);
      if (found) {
        setDraggingPoint(found);
        setIsPanning(false);
        panDragStartRef.current = null;
      } else {
        setDraggingPoint(null);
        setIsPanning(true);
        panDragStartRef.current = {
          screen: screenPoint,
          offset: panOffset,
        };
      }
      return;
    }

    const targetType: DraftType = activeTool === "boundary" ? "outer" : "hole";
    if (draftPointCount > 0 && targetType !== draftType) {
      addLog("Close or cancel the current stroke before switching shape type.");
      return;
    }

    if (targetType === "outer" && outerLoop.length >= 3) {
      setOuterLoop([]);
      setHoleLoops([]);
      addLog("Starting a new outer boundary. Existing holes were cleared.");
    }

    setDraftStrokes((current) => [...current, [point]]);
    clearMeshPreview();
    dispatchMachine({ draftType: targetType, type: "SKETCH_STARTED" });
    addLog(
      `${targetType === "outer" ? "Outer boundary" : "Hole"} sketch started at (${point.x}, ${point.y}).`,
    );
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const screenPoint = getScreenPoint(event);

    if (isPanning && panDragStartRef.current) {
      const nextOffset = {
        x:
          panDragStartRef.current.offset.x +
          (screenPoint.x - panDragStartRef.current.screen.x),
        y:
          panDragStartRef.current.offset.y +
          (screenPoint.y - panDragStartRef.current.screen.y),
      };
      const nextPoint = screenToCanvasPoint(
        screenPoint,
        canvas.width,
        canvas.height,
        zoomLevel,
        nextOffset,
      );
      setPanOffset(nextOffset);
      setMousePos(nextPoint);
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
    }

    if (machine.mode === "erasing") {
      setDraftStrokes((current) => eraseStrokeCommand(current, point));
      clearMeshPreview();
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
    if (isPanning) {
      setIsPanning(false);
      panDragStartRef.current = null;
    }

    if (draggingPoint) {
      addLog(
        `${
          draggingPoint.type === "outer"
            ? `Updated outer boundary point ${draggingPoint.index + 1}.`
            : `Updated hole ${draggingPoint.holeIndex + 1}, point ${draggingPoint.index + 1}.`
        }`,
      );
    }

    setDraggingPoint(null);

    if (machine.mode === "drawing") {
      const strokes = draftStrokesRef.current;
      const activeStroke = strokes[strokes.length - 1] ?? [];
      if (activeStroke.length < 2) {
        addLog("Sketch too short. Hold and drag a bit longer to create a stroke.");
        setDraftStrokes((current) => current.slice(0, -1));
      } else {
        addLog(
          `Stroke captured with ${activeStroke.length} points. Use Close Shape when you want to connect the ends.`,
        );
      }
    }

    dispatchMachine({ type: "POINTER_RELEASED" });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && key === "z") {
        event.preventDefault();
        removeLastStep();
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (key === "1") {
        event.preventDefault();
        setActiveTool("select");
        return;
      }

      if (key === "2") {
        event.preventDefault();
        setActiveTool("boundary");
        setWorkspaceDraftType("outer");
        return;
      }

      if (key === "3") {
        event.preventDefault();
        setActiveTool("hole");
        setWorkspaceDraftType("hole");
        return;
      }

      if (key === "4") {
        event.preventDefault();
        setActiveTool("eraser");
        return;
      }

      if (key === "escape") {
        event.preventDefault();
        cancelCurrentSketch();
        return;
      }

      if ((key === "enter" || key === "c") && draftLoop.length >= 3) {
        event.preventDefault();
        closeDraftLoop(draftLoop);
        return;
      }

      if (key === "delete" || key === "backspace") {
        if (draftLoop.length > 0 || isSketching) {
          event.preventDefault();
          cancelCurrentSketch();
          return;
        }

        if (selectedPoint) {
          event.preventDefault();
          deleteSelectedShape();
        }
        return;
      }

      if (key === "r") {
        event.preventDefault();
        resetGeometry();
        return;
      }

      if (key === "m") {
        event.preventDefault();
        handleGenerateMesh();
        return;
      }

      if (key === "+" || key === "=") {
        event.preventDefault();
        zoomIn();
        return;
      }

      if (key === "-" || key === "_") {
        event.preventDefault();
        zoomOut();
        return;
      }

      if (key === "0") {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

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

    dispatchMachine({ type: "MESH_STARTED" });
    setMeshPreview(null);
    addLog("Sampling user-defined geometry...");
    addLog(
      `Boundary summary: 1 outer loop, ${pslg.holeLoops.length} holes, ${pslg.totalSegments} total segments.`,
    );

    if (meshAPI.isLoggedIn) {
      // ---- Backend path ----
      meshAPI
        .generateMeshFromSketch(outerLoop, holeLoops, elementType, {
          maxLength,
          nx: quadNx,
          ny: quadNy,
          rlRatio,
          thetaMin,
        })
        .then((result) => {
          setMeshPreview(result.preview);
          setSelectedGeometryId(result.geometryId);
          const pslg = result.rawMesh.pslg;
          if (pslg?.outer_boundary && pslg?.holes) {
            setOuterLoop(pslg.outer_boundary.map(([x, y]) => ({ x, y })));
            setHoleLoops(pslg.holes.map((loop) => loop.map(([x, y]) => ({ x, y }))));
          }
          addLog(
            `[BE] Generated ${result.nodeCount} nodes, ${result.elementCount} elements (${elementType}).`,
          );
          addLog("Backend mesh ready. Use Export to download.");
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Backend mesh failed";
          addLog(`[BE Error] ${msg} — falling back to local preview.`);
          // Fallback to local
          try {
            const nextPreview = generateMesh({ elementType, holeLoops, maxLength, outerLoop });
            setMeshPreview(nextPreview);
            addLog(`[Local] Generated ${nextPreview.nodes.length} nodes (preview only).`);
          } catch (localErr) {
            addLog(localErr instanceof Error ? localErr.message : "Local preview also failed.");
          }
        })
        .finally(() => dispatchMachine({ type: "MESH_FINISHED" }));
    } else {
      // ---- Local fallback (not logged in) ----
      window.setTimeout(() => {
        try {
          const nextPreview = generateMesh({ elementType, holeLoops, maxLength, outerLoop });
          setMeshPreview(nextPreview);
          addLog(`[Local] Generated ${nextPreview.nodes.length} nodes from the current sketch.`);
          addLog("Login to generate full mesh via Backend.");
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
    }
  };

  const refreshGeometryRecords = () => {
    if (!meshAPI.isLoggedIn) {
      setGeometryRecords([]);
      setSelectedGeometryId(null);
      return;
    }

    setIsGeometryBusy(true);
    setGeometryError(null);
    meshAPI
      .listGeometryRecords()
      .then((records) => {
        const nextRecords: GeometryRecordItem[] = records.map((record) => ({
          id: record.id,
          name: record.name,
          geometry_type: record.geometry_type,
          created_at: record.created_at,
        }));
        setGeometryRecords(nextRecords);

        setSelectedGeometryId((current) => {
          if (current && nextRecords.some((record) => record.id === current)) {
            return current;
          }
          return null;
        });
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Cannot fetch geometry records.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
      })
      .finally(() => {
        setIsGeometryBusy(false);
      });
  };

  const submitPrimitiveForm = () => {
    if (!meshAPI.isLoggedIn) {
      const message = "Login required to create geometry primitives.";
      setGeometryError(message);
      addLog(`[Geometry Error] ${message}`);
      return;
    }

    const name = primitiveName.trim() || undefined;

    let request: Promise<GeometryResponse>;
    if (primitiveType === "rectangle") {
      const { xMin, yMin, width, height } = rectangleInput;
      if (
        !Number.isFinite(xMin) ||
        !Number.isFinite(yMin) ||
        !Number.isFinite(width) ||
        !Number.isFinite(height)
      ) {
        const message = "Rectangle input must contain valid numeric values.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
        return;
      }
      if (width <= 0 || height <= 0) {
        const message = "Rectangle width and height must be > 0.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
        return;
      }

      request = meshAPI.createRectangle({ name, xMin, yMin, width, height });
    } else if (primitiveType === "circle") {
      const { centerX, centerY, radius } = circleInput;
      if (
        !Number.isFinite(centerX) ||
        !Number.isFinite(centerY) ||
        !Number.isFinite(radius)
      ) {
        const message = "Circle input must contain valid numeric values.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
        return;
      }
      if (radius <= 0) {
        const message = "Circle radius must be > 0.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
        return;
      }

      request = meshAPI.createCircle({ name, centerX, centerY, radius });
    } else if (primitiveType === "triangle") {
      const points = triangleInput.points.map((point) => [point.x, point.y]);
      if (
        points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))
      ) {
        const message = "Triangle input must contain valid numeric coordinates.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
        return;
      }

      request = meshAPI.createTriangle({ name, points });
    } else {
      const parsed = parsePolygonInputText(polygonInputText);
      if (!parsed.points) {
        const message = parsed.validationError ?? "Polygon input is invalid.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
        return;
      }

      request = meshAPI.createPolygon({
        name,
        points: parsed.points,
        closed: true,
      });
    }

    setIsGeometryBusy(true);
    setGeometryError(null);
    request
      .then((createdGeometry) => {
        applyGeometryToWorkspace(createdGeometry, "created");
        setGeometryRecords((current) => [
          {
            id: createdGeometry.id,
            name: createdGeometry.name,
            geometry_type: createdGeometry.geometry_type,
            created_at: createdGeometry.created_at,
          },
          ...current.filter((item) => item.id !== createdGeometry.id),
        ]);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Create geometry failed.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
      })
      .finally(() => {
        setIsGeometryBusy(false);
      });
  };

  const loadGeometryRecord = (geometryId: string) => {
    if (!meshAPI.isLoggedIn) {
      const message = "Login required to load geometry records.";
      setGeometryError(message);
      addLog(`[Geometry Error] ${message}`);
      return;
    }

    setIsGeometryBusy(true);
    setGeometryError(null);
    meshAPI
      .getGeometryRecord(geometryId)
      .then((geometry) => {
        applyGeometryToWorkspace(geometry, "loaded");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Load geometry failed.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
      })
      .finally(() => {
        setIsGeometryBusy(false);
      });
  };

  const deleteGeometryRecord = (geometryId: string) => {
    if (!meshAPI.isLoggedIn) {
      const message = "Login required to delete geometry records.";
      setGeometryError(message);
      addLog(`[Geometry Error] ${message}`);
      return;
    }

    setIsGeometryBusy(true);
    setGeometryError(null);
    meshAPI
      .deleteGeometryRecord(geometryId)
      .then(() => {
        setGeometryRecords((current) =>
          current.filter((item) => item.id !== geometryId),
        );
        addLog(`[Geometry] Deleted geometry ${geometryId}.`);

        if (
          selectedGeometryId === geometryId ||
          meshStore.getGeometryId() === geometryId
        ) {
          setOuterLoop([]);
          setHoleLoops([]);
          setDraftStrokes([]);
          setSelectedPoint(null);
          setDraggingPoint(null);
          clearMeshPreview();
          dispatchMachine({ type: "SYNC_CONTEXT", mode: "idle" });
          meshStore.clear();
          setSelectedGeometryId(null);
          addLog("[Geometry] Active geometry was removed and canvas was reset.");
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Delete geometry failed.";
        setGeometryError(message);
        addLog(`[Geometry Error] ${message}`);
      })
      .finally(() => {
        setIsGeometryBusy(false);
      });
  };

  const refreshProjectSnapshots = () => {
    if (!meshAPI.isLoggedIn) {
      setProjectSnapshots([]);
      return;
    }

    setIsProjectBusy(true);
    meshAPI
      .listProjectSnapshots()
      .then((projects) => {
        setProjectSnapshots(projects);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Cannot fetch project snapshots";
        addLog(`[Project Error] ${msg}`);
      })
      .finally(() => {
        setIsProjectBusy(false);
      });
  };

  const saveProjectSnapshot = () => {
    if (!meshAPI.isLoggedIn) {
      addLog("Login required to save project snapshots.");
      return;
    }

    const trimmedName = projectName.trim();
    if (!trimmedName) {
      addLog("Enter a project name before saving.");
      return;
    }

    setIsProjectBusy(true);
    meshAPI
      .createProjectSnapshot({
        name: trimmedName,
        notes: projectNotes.trim() || undefined,
        elementType,
        meshingParams: {
          thetaMin,
          rlRatio,
          maxLength,
          elementType,
          hasMesh,
        },
      })
      .then((project) => {
        setProjectSnapshots((current) => [project, ...current.filter((item) => item.id !== project.id)]);
        addLog(`[Project] Saved snapshot \"${project.name}\".`);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Save project snapshot failed";
        addLog(`[Project Error] ${msg}`);
      })
      .finally(() => {
        setIsProjectBusy(false);
      });
  };

  const loadProjectSnapshot = (projectId: string) => {
    if (!meshAPI.isLoggedIn) {
      addLog("Login required to load saved snapshots.");
      return;
    }

    setIsProjectBusy(true);
    meshAPI
      .loadProjectSnapshot(projectId)
      .then((loaded) => {
        setProjectName(loaded.project.name);
        setProjectNotes(loaded.project.notes ?? "");

        if (loaded.preview) {
          setMeshPreview(loaded.preview);
          addLog(`[Project] Loaded mesh ${loaded.meshId} from snapshot \"${loaded.project.name}\".`);
        } else {
          setMeshPreview(null);
          addLog(`[Project] Snapshot \"${loaded.project.name}\" has no mesh yet.`);
        }

        if (loaded.elementType) {
          setElementType(loaded.elementType);
        }

        setOuterLoop(loaded.outerLoop ?? []);
        setHoleLoops(loaded.holeLoops ?? []);

        setDraftStrokes([]);
        setSelectedPoint(null);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Load project snapshot failed";
        addLog(`[Project Error] ${msg}`);
      })
      .finally(() => {
        setIsProjectBusy(false);
      });
  };

  const deleteProjectSnapshot = (projectId: string) => {
    if (!meshAPI.isLoggedIn) {
      addLog("Login required to delete saved snapshots.");
      return;
    }

    setIsProjectBusy(true);
    meshAPI
      .deleteProjectSnapshot(projectId)
      .then(() => {
        setProjectSnapshots((current) => current.filter((item) => item.id !== projectId));
        addLog(`[Project] Deleted snapshot ${projectId}.`);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Delete project snapshot failed";
        addLog(`[Project Error] ${msg}`);
      })
      .finally(() => {
        setIsProjectBusy(false);
      });
  };

  const generateMeshFromShapeDat = () => {
    if (!meshAPI.isLoggedIn) {
      addLog("Login required to generate mesh from shape.dat.");
      return;
    }
    if (!shapeDatText.trim()) {
      addLog("shape.dat content is empty.");
      return;
    }

    setIsShapeDatMeshing(true);
    dispatchMachine({ type: "MESH_STARTED" });
    addLog("Submitting shape.dat to backend...");
    meshAPI
      .generateMeshFromShapeDat(shapeDatText, {
        maxLength,
        rlRatio,
        thetaMin,
      })
      .then((result) => {
        setMeshPreview(result.preview);
        setElementType("T3");
        setSelectedGeometryId(result.geometryId);

        const pslg = result.rawMesh.pslg;
        if (pslg?.outer_boundary && pslg?.holes) {
          setOuterLoop(pslg.outer_boundary.map(([x, y]) => ({ x, y })));
          setHoleLoops(pslg.holes.map((loop) => loop.map(([x, y]) => ({ x, y }))));
          setDraftStrokes([]);
          setSelectedPoint(null);
        }

        addLog(`[BE] shape.dat meshed: ${result.nodeCount} nodes, ${result.elementCount} elements.`);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "shape.dat meshing failed";
        addLog(`[BE Error] ${msg}`);
      })
      .finally(() => {
        setIsShapeDatMeshing(false);
        dispatchMachine({ type: "MESH_FINISHED" });
      });
  };

  const runQuickFEA = () => {
    if (!meshAPI.isLoggedIn) {
      addLog("Login required to run FEA.");
      return;
    }

    setIsRunningFEA(true);
    addLog("Running quick cantilever FEA setup...");
    meshAPI
      .solveQuickCantilever(feaInput)
      .then((response) => {
        setFeaSummary({
          message: response.message,
          maxDisplacement: response.result.max_displacement,
          maxVonMises: response.result.max_von_mises_stress,
          sumReactionX: response.result.sum_reaction_x ?? null,
          sumReactionY: response.result.sum_reaction_y ?? null,
          nodeCount: response.result.node_count,
          elementCount: response.result.element_count,
        });
        addLog(
          `[FEA] Solved. max|u|=${response.result.max_displacement.toExponential(3)}, max_vm=${response.result.max_von_mises_stress.toExponential(3)}.`,
        );
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "FEA solve failed";
        addLog(`[FEA Error] ${msg}`);
      })
      .finally(() => {
        setIsRunningFEA(false);
      });
  };

  useEffect(() => {
    refreshGeometryRecords();
  }, [meshAPI.isLoggedIn]);

  useEffect(() => {
    refreshProjectSnapshots();
  }, [meshAPI.isLoggedIn]);

  useEffect(() => {
    if (!meshAPI.isLoggedIn) {
      return;
    }

    const unsubscribe = meshAPI.subscribeDashboardEvents(
      (event) => {
        const meshId = typeof event.data?.mesh_id === "string" ? event.data.mesh_id : "n/a";
        addLog(`[WS] ${event.event}: mesh_id=${meshId}`);
      },
      () => {
        addLog("[WS Error] Dashboard realtime channel disconnected.");
      },
    );

    return () => {
      unsubscribe();
    };
  }, [meshAPI.isLoggedIn]);

  const setFeaInput = (input: QuickFEAInput) => {
    setFeaInputState(input);
  };

  const applyBooleanResult = (outer: Point[], holes: Point[][]) => {
    setOuterLoop(outer);
    setHoleLoops(holes);
    setDraftStrokes([]);
    setSelectedPoint(null);
    setMeshPreview(null);
    dispatchMachine({ type: "SHAPE_CLOSED", closedDraftType: "outer" });
  };

  return {
    activeTool,
    addLog,
    applyBooleanResult,
    cancelCurrentSketch,
    canUndo,
    closeCurrentShape,
    deleteSelectedShape,
    draftPointCount,
    draftReadyToClose,
    draftStrokes,
    draftType,
    elementType,
    errorData: meshAnalysis.errorData,
    generatedSegments,
    geometryError,
    geometryRecords,
    geometryReady,
    handleGenerateMesh,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    hasDraft,
    hasMesh,
    hasProjectData,
    holeLoops,
    isGeometryBusy,
    isMeshing,
    isProjectBusy,
    isRunningFEA,
    isShapeDatMeshing,
    isPanning,
    isSketching,
    logs,
    maxLength,
    meshEdges,
    meshNodes,
    meshPreview,
    meshQuality,
    meshStats: meshAnalysis.stats,
    meshConnectivityMatrices,
    mousePos,
    outerLoop,
    polygonInputText,
    primitiveName,
    primitiveType,
    projectName,
    projectNotes,
    projectSnapshots,
    quadNx,
    quadNy,
    removeLastStep,
    runQuickFEA,
    resetGeometry,
    resetZoom,
    rlRatio,
    panOffset,
    selectedGeometryId,
    selectedPoint,
    setCircleInput,
    setFeaInput,
    setActiveTool,
    setPolygonInputText,
    setPrimitiveName,
    setPrimitiveType,
    setRectangleInput,
    setTriangleInput,
    setDraftType: setWorkspaceDraftType,
    setElementType,
    setMaxLength,
    setProjectName,
    setProjectNotes,
    setQuadNx,
    setQuadNy,
    setRlRatio,
    setShapeDatText,
    setThetaMin,
    circleInput,
    rectangleInput,
    triangleInput,
    shapeDatText,
    submitPrimitiveForm,
    generateMeshFromShapeDat,
    loadGeometryRecord,
    deleteGeometryRecord,
    refreshGeometryRecords,
    saveProjectSnapshot,
    loadProjectSnapshot,
    deleteProjectSnapshot,
    refreshProjectSnapshots,
    feaInput,
    feaSummary,
    thetaMin,
    zoomIn,
    zoomLevel,
    zoomOut,
  };
}
