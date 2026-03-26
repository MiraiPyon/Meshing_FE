import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import type {
  DraftType,
  ElementType,
  MeshStats,
  Point,
  SelectedPoint,
  Tool,
} from "./types";
import {
  CLOSE_DISTANCE,
  ERASER_RADIUS,
  FREEHAND_POINT_SPACING,
  distance,
  ensureOrientation,
  getPointLabel,
  pointInPolygon,
  screenToCanvasPoint,
  segmentCountToBars,
} from "./utils";

const DEFAULT_MESH_STATS: MeshStats = {
  nodes: 0,
  edges: 0,
  tris: 0,
  dof: 0,
  executionTime: 0,
  emptyCircumcircleValid: false,
};

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1];

export function useDashboardDrawing(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const draftStrokesRef = useRef<Point[][]>([]);

  const [thetaMin, setThetaMin] = useState(20.7);
  const [rlRatio, setRlRatio] = useState(1.414);
  const [maxLength, setMaxLength] = useState(0.18);
  const [elementType, setElementType] = useState<ElementType>("T3");

  const [activeTool, setActiveTool] = useState<Tool>("boundary");
  const [outerLoop, setOuterLoop] = useState<Point[]>([]);
  const [holeLoops, setHoleLoops] = useState<Point[][]>([]);
  const [draftStrokes, setDraftStrokes] = useState<Point[][]>([]);
  const [draftType, setDraftType] = useState<DraftType>("outer");
  const [meshNodes, setMeshNodes] = useState<Point[]>([]);
  const [meshEdges, setMeshEdges] = useState<[Point, Point][]>([]);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint>(null);
  const [draggingPoint, setDraggingPoint] = useState<SelectedPoint>(null);
  const [isErasing, setIsErasing] = useState(false);
  const [isSketching, setIsSketching] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMeshing, setIsMeshing] = useState(false);
  const [hasMesh, setHasMesh] = useState(false);
  const [meshStats, setMeshStats] = useState<MeshStats>(DEFAULT_MESH_STATS);
  const [errorData, setErrorData] = useState(segmentCountToBars(0));
  const [logs, setLogs] = useState<string[]>([
    "Interactive geometry workspace ready.",
    "Choose Outer Boundary, hold the left mouse button, and drag to sketch.",
  ]);

  const geometryReady = outerLoop.length >= 3;
  const draftPointCount = draftStrokes.reduce((total, stroke) => total + stroke.length, 0);
  const draftLoop = draftStrokes.flat();
  const draftReadyToClose = draftLoop.length >= 3;
  const hasDraft = draftPointCount > 0;

  useEffect(() => {
    draftStrokesRef.current = draftStrokes;
  }, [draftStrokes]);

  const clearMeshPreview = () => {
    setHasMesh(false);
    setMeshNodes([]);
    setMeshEdges([]);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-GB");
    setLogs((current) => [...current.slice(-11), `[${timestamp}] ${message}`]);
  };

  const getCanvasPoint = (event: ReactMouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

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

  const findNearbyPoint = (point: Point): SelectedPoint => {
    for (let index = 0; index < outerLoop.length; index += 1) {
      if (distance(point, outerLoop[index]) <= CLOSE_DISTANCE) {
        return { type: "outer", index };
      }
    }

    for (let holeIndex = 0; holeIndex < holeLoops.length; holeIndex += 1) {
      for (let index = 0; index < holeLoops[holeIndex].length; index += 1) {
        if (distance(point, holeLoops[holeIndex][index]) <= CLOSE_DISTANCE) {
          return { type: "hole", holeIndex, index };
        }
      }
    }

    return null;
  };

  const closeDraftLoop = (points: Point[]) => {
    if (points.length < 3) return;

    if (draftType === "outer") {
      const normalized = ensureOrientation(points, false);
      setOuterLoop(normalized);
      setHoleLoops([]);
      setActiveTool("hole");
      addLog(`Outer boundary closed with ${normalized.length} points.`);
    } else {
      const normalized = ensureOrientation(points, true);
      setHoleLoops((current) => [...current, normalized]);
      addLog(`Hole ${holeLoops.length + 1} closed with ${normalized.length} points.`);
    }

    setDraftStrokes([]);
    setDraftType(draftType === "outer" ? "hole" : draftType);
    clearMeshPreview();
  };

  const resetGeometry = () => {
    setOuterLoop([]);
    setHoleLoops([]);
    setDraftStrokes([]);
    setDraftType("outer");
    setSelectedPoint(null);
    setDraggingPoint(null);
    setIsSketching(false);
    clearMeshPreview();
    setMeshStats(DEFAULT_MESH_STATS);
    setErrorData(segmentCountToBars(0));
    setActiveTool("boundary");
    addLog("Geometry workspace cleared.");
  };

  const cancelCurrentSketch = () => {
    if (draftPointCount === 0 && !isSketching) return;
    setDraftStrokes([]);
    setIsSketching(false);
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
    if (!selectedPoint) return;

    if (selectedPoint.type === "outer") {
      setOuterLoop([]);
      setHoleLoops([]);
      setDraftType("outer");
      setActiveTool("boundary");
      addLog("Outer boundary deleted.");
    } else {
      setHoleLoops((current) =>
        current.filter((_, holeIndex) => holeIndex !== selectedPoint.holeIndex),
      );
      addLog(`Hole ${selectedPoint.holeIndex + 1} deleted.`);
    }

    setSelectedPoint(null);
    clearMeshPreview();
  };

  const removeLastStep = () => {
    if (draftStrokes.length > 0) {
      setDraftStrokes((current) => current.slice(0, -1));
      addLog("Removed the most recent draft stroke.");
      return;
    }

    if (holeLoops.length > 0) {
      setHoleLoops((current) => current.slice(0, -1));
      clearMeshPreview();
      addLog("Removed the most recent hole.");
      return;
    }

    if (outerLoop.length > 0) {
      setOuterLoop([]);
      clearMeshPreview();
      setActiveTool("boundary");
      setDraftType("outer");
      addLog("Removed the outer boundary.");
    }
  };

  const updatePoint = (selection: SelectedPoint, point: Point) => {
    if (!selection) return;

    if (selection.type === "outer") {
      setOuterLoop((current) =>
        current.map((item, index) => (index === selection.index ? point : item)),
      );
    } else {
      setHoleLoops((current) =>
        current.map((loop, holeIndex) =>
          holeIndex === selection.holeIndex
            ? loop.map((item, index) => (index === selection.index ? point : item))
            : loop,
        ),
      );
    }

    clearMeshPreview();
  };

  const eraseFromDraftStrokes = (center: Point) => {
    setDraftStrokes((current) => {
      const next = current.flatMap((stroke) => {
        const segments: Point[][] = [];
        let currentSegment: Point[] = [];

        stroke.forEach((point) => {
          if (distance(point, center) <= ERASER_RADIUS) {
            if (currentSegment.length >= 2) {
              segments.push(currentSegment);
            }
            currentSegment = [];
            return;
          }

          currentSegment.push(point);
        });

        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }

        return segments;
      });

      return next;
    });
  };

  const handleMouseDown = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    if (!point) return;

    if (activeTool === "eraser") {
      setIsErasing(true);
      eraseFromDraftStrokes(point);
      clearMeshPreview();
      addLog(`Eraser applied at (${point.x}, ${point.y}).`);
      return;
    }

    if (activeTool === "select") {
      const found = findNearbyPoint(point);
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

    setDraftType(targetType);
    setDraftStrokes((current) => [...current, [point]]);
    setIsSketching(true);
    clearMeshPreview();
    addLog(
      `${targetType === "outer" ? "Outer boundary" : "Hole"} sketch started at (${point.x}, ${point.y}).`,
    );
  };

  const handleMouseMove = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(event);
    if (!point) return;

    setMousePos(point);

    if (draggingPoint) {
      updatePoint(draggingPoint, point);
    }

    if (isErasing) {
      eraseFromDraftStrokes(point);
      clearMeshPreview();
    }

    if (isSketching) {
      setDraftStrokes((current) => {
        if (current.length === 0) return [[point]];

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
      addLog(`Updated ${getPointLabel(draggingPoint)}.`);
    }
    setDraggingPoint(null);
    setIsErasing(false);

    if (isSketching) {
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
      setIsSketching(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        cancelCurrentSketch();
      }

      if (event.key === "Enter" && draftStrokesRef.current.flat().length >= 3) {
        event.preventDefault();
        closeDraftLoop(draftStrokesRef.current.flat());
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (draftStrokesRef.current.flat().length > 0 || isSketching) {
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
  }, [draftPointCount, isSketching, selectedPoint]);

  const generatedSegments = useMemo(() => {
    const outerSegments = outerLoop.length;
    const holeSegments = holeLoops.reduce((total, loop) => total + loop.length, 0);
    return outerSegments + holeSegments;
  }, [holeLoops, outerLoop]);

  const handleGenerateMesh = () => {
    if (draftPointCount >= 3) {
      addLog("Close the current shape before generating the mesh preview.");
      return;
    }

    if (!geometryReady) {
      addLog("Create and close an outer boundary before generating mesh.");
      return;
    }

    setIsMeshing(true);
    setHasMesh(false);
    addLog("Sampling user-defined geometry...");
    addLog(
      `Boundary summary: 1 outer loop, ${holeLoops.length} holes, ${generatedSegments} total segments.`,
    );

    window.setTimeout(() => {
      const bounds = outerLoop.reduce(
        (acc, point) => ({
          minX: Math.min(acc.minX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxX: Math.max(acc.maxX, point.x),
          maxY: Math.max(acc.maxY, point.y),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );

      const spacing = Math.max(16, Math.round(maxLength * 120));
      const nodes: Point[] = [];
      for (let x = bounds.minX; x <= bounds.maxX; x += spacing) {
        for (let y = bounds.minY; y <= bounds.maxY; y += spacing) {
          const sample = { x, y };
          if (!pointInPolygon(sample, outerLoop)) continue;
          if (holeLoops.some((loop) => pointInPolygon(sample, loop))) continue;
          nodes.push(sample);
        }
      }

      const edges: [Point, Point][] = [];
      for (let index = 0; index < nodes.length; index += 1) {
        const current = nodes[index];
        for (let otherIndex = index + 1; otherIndex < nodes.length; otherIndex += 1) {
          const other = nodes[otherIndex];
          const sameRow = Math.abs(current.y - other.y) < 1;
          const sameCol = Math.abs(current.x - other.x) < 1;
          const near = Math.abs(distance(current, other) - spacing) < 2;
          if ((sameRow || sameCol) && near) {
            edges.push([current, other]);
          }
        }
      }

      const tris = Math.max(0, Math.round(nodes.length * 1.6));
      const dofMultiplier = elementType === "T3" ? 2 : 4;

      setMeshNodes(nodes);
      setMeshEdges(edges);
      setMeshStats({
        nodes: nodes.length,
        edges: edges.length + generatedSegments,
        tris,
        dof: nodes.length * dofMultiplier,
        executionTime: Math.max(12, Math.round(nodes.length * 0.3)),
        emptyCircumcircleValid: nodes.length > 0,
      });
      setErrorData(segmentCountToBars(Math.max(nodes.length, generatedSegments)));
      setIsMeshing(false);
      setHasMesh(true);
      addLog(`Generated ${nodes.length} nodes from the current sketch.`);
      addLog("Interactive mesh preview refreshed.");
    }, 700);
  };

  return {
    activeTool,
    cancelCurrentSketch,
    closeCurrentShape,
    deleteSelectedShape,
    draftLoop,
    draftPointCount,
    draftReadyToClose,
    draftStrokes,
    draftType,
    elementType,
    errorData,
    generatedSegments,
    geometryReady,
    handleGenerateMesh,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    hasDraft,
    hasMesh,
    isErasing,
    holeLoops,
    isMeshing,
    isSketching,
    logs,
    maxLength,
    meshEdges,
    meshNodes,
    meshStats,
    mousePos,
    outerLoop,
    removeLastStep,
    resetGeometry,
    resetZoom,
    rlRatio,
    selectedPoint,
    setActiveTool,
    setDraftType,
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
