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
  DraftType,
  SelectedPoint,
  Tool,
  WorkspaceViewModel,
} from "./types";
import type { ElementType } from "../../meshing/domain/types";

export function useDashboardWorkspace(): WorkspaceViewModel {
  const [machine, dispatchMachine] = useReducer(
    transitionWorkspace,
    undefined,
    createInitialWorkspaceMachine,
  );

  const [thetaMin, setThetaMin] = useState(20.7);
  const [rlRatio, setRlRatio] = useState(1.414);
  const [maxLength, setMaxLength] = useState(0.18);
  const [elementType, setElementType] = useState<ElementType>("T3");
  const [outerLoop, setOuterLoop] = useState<Point[]>([]);
  const [holeLoops, setHoleLoops] = useState<Point[][]>([]);
  const [draftStrokes, setDraftStrokes] = useState<Point[][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>(null);
  const [draggingPoint, setDraggingPoint] = useState<SelectedPoint>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [meshPreview, setMeshPreview] = useState<ReturnType<typeof generateMesh> | null>(null);
  const [logs, setLogs] = useState<string[]>(DEFAULT_WORKSPACE_LOGS);

  const draftStrokesRef = useRef<Point[][]>(draftStrokes);

  useEffect(() => {
    draftStrokesRef.current = draftStrokes;
  }, [draftStrokes]);

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

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-GB");
    setLogs((current) => [...current.slice(-11), `[${timestamp}] ${message}`]);
  };

  const getCanvasPoint = (
    event: ReactMouseEvent<HTMLCanvasElement>,
  ): Point | null => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();

    return screenToCanvasPoint(
      {
        x: Math.round(event.clientX - rect.left),
        y: Math.round(event.clientY - rect.top),
      },
      canvas.width,
      canvas.height,
      zoomLevel,
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
  };

  const setActiveTool = (tool: Tool) => {
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

    window.setTimeout(() => {
      try {
        const nextPreview = generateMesh({
          elementType,
          holeLoops,
          maxLength,
          outerLoop,
        });
        setMeshPreview(nextPreview);
        addLog(`Generated ${nextPreview.nodes.length} nodes from the current sketch.`);
        addLog("Interactive mesh preview refreshed.");
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
    elementType,
    errorData: meshAnalysis.errorData,
    generatedSegments,
    geometryReady,
    handleGenerateMesh,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    hasDraft,
    hasMesh,
    holeLoops,
    isMeshing,
    isSketching,
    logs,
    maxLength,
    meshEdges,
    meshNodes,
    meshPreview,
    meshStats: meshAnalysis.stats,
    mousePos,
    outerLoop,
    removeLastStep,
    resetGeometry,
    resetZoom,
    rlRatio,
    selectedPoint,
    setActiveTool,
    setDraftType: setWorkspaceDraftType,
    setElementType,
    setMaxLength,
    setRlRatio,
    setThetaMin,
    thetaMin,
    zoomIn,
    zoomLevel,
    zoomOut,
  };
}
