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
  PSLGValidationState,
  SelectedPoint,
  Tool,
  WorkspaceViewModel,
} from "./types";
import type { ElementType } from "../../meshing/domain/types";

function createCircleLoop(
  center: Point,
  radius: number,
  segments: number,
  clockwise = false,
) {
  return Array.from({ length: segments }, (_, index) => {
    const t = (index / segments) * Math.PI * 2 * (clockwise ? -1 : 1);
    return {
      x: Math.round(center.x + Math.cos(t) * radius),
      y: Math.round(center.y + Math.sin(t) * radius),
    };
  });
}

function createSampleWrenchGeometry() {
  return {
    holeLoops: [
      createCircleLoop({ x: 300, y: 320 }, 58, 24, true),
      createCircleLoop({ x: 705, y: 318 }, 47, 22, true),
    ],
    outerLoop: [
      { x: 145, y: 325 },
      { x: 158, y: 262 },
      { x: 198, y: 214 },
      { x: 258, y: 196 },
      { x: 324, y: 214 },
      { x: 392, y: 255 },
      { x: 486, y: 255 },
      { x: 600, y: 196 },
      { x: 778, y: 196 },
      { x: 838, y: 260 },
      { x: 758, y: 266 },
      { x: 680, y: 300 },
      { x: 758, y: 346 },
      { x: 838, y: 354 },
      { x: 778, y: 418 },
      { x: 600, y: 418 },
      { x: 486, y: 374 },
      { x: 392, y: 374 },
      { x: 324, y: 414 },
      { x: 258, y: 430 },
      { x: 198, y: 410 },
      { x: 158, y: 372 },
    ],
  };
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
  const [pslgValidation, setPslgValidation] = useState<PSLGValidationState>({
    message: "PSLG has not been validated.",
    status: "idle",
  });

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
    markPSLGDirty();
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
    setPslgValidation({
      message: "PSLG has not been validated.",
      status: "idle",
    });
    dispatchMachine({ type: "RESET" });
    addLog("Geometry workspace cleared.");
  };

  const cancelCurrentSketch = () => {
    if (draftPointCount === 0 && !isSketching) {
      return;
    }

    setDraftStrokes([]);
    dispatchMachine({ type: "POINTER_RELEASED" });
    markPSLGDirty();
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
      markPSLGDirty();
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
    markPSLGDirty();
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
    markPSLGDirty();
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
      markPSLGDirty();
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
      markPSLGDirty();
      addLog("Starting a new outer boundary. Existing holes were cleared.");
    }

    setDraftStrokes((current) => [...current, [point]]);
    clearMeshPreview();
    markPSLGDirty();
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
      markPSLGDirty();
    }

    if (machine.mode === "erasing") {
      setDraftStrokes((current) => eraseStrokeCommand(current, point));
      clearMeshPreview();
      markPSLGDirty();
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

  const handleImportSample = () => {
    const sample = createSampleWrenchGeometry();
    setOuterLoop(sample.outerLoop);
    setHoleLoops(sample.holeLoops);
    setDraftStrokes([]);
    setSelectedPoint(null);
    setDraggingPoint(null);
    setMeshPreview(null);
    setPslgValidation({
      message: "Imported shape.dat. Validate PSLG before meshing.",
      status: "idle",
    });
    dispatchMachine({
      draftType: "hole",
      mode: "idle",
      tool: "select",
      type: "SYNC_CONTEXT",
    });
    addLog("Imported shape.dat sample: wrench model with 2 circular holes.");
    addLog("Detected 1 outer loop (CCW) and 2 inner loops (CW).");
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
    elementType,
    errorData: meshAnalysis.errorData,
    generatedSegments,
    geometryReady,
    handleExportMesh,
    handleGenerateMesh,
    handleImportSample,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleValidatePSLG,
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
    pslgValidation,
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
