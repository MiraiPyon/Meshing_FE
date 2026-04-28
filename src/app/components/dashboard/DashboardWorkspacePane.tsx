import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronRight,
  CircleDot,
  Database,
  FileDown,
  GitBranch,
  Hexagon,
  Layers,
  Minus,
  Plus,
  Rows3,
  Spline,
  Square,
  Table2,
  Terminal,
  TriangleRight,
} from "lucide-react";
import { polygonArea } from "../../../modules/geometry/domain/services/measurements";
import type { MeshElement } from "../../../modules/meshing/domain/types";
import type {
  DraftShapeMode,
  WorkspaceViewModel,
} from "../../../modules/workspace/application/types";
import { CanvasViewport } from "./CanvasViewport";

type DataTab = "console" | "nodes" | "edges" | "elements" | "quality" | "export";

type DashboardWorkspacePaneProps = Pick<
  WorkspaceViewModel,
  | "activeTool"
  | "draftPointCount"
  | "draftShapeMode"
  | "draftStrokes"
  | "draftType"
  | "eraserRadius"
  | "geometryReady"
  | "handleMouseDown"
  | "handleMouseMove"
  | "handleMouseUp"
  | "hasMesh"
  | "holeLoops"
  | "isPanningCanvas"
  | "isSketching"
  | "logs"
  | "meshEdges"
  | "meshNodes"
  | "meshPreview"
  | "mousePos"
  | "outerLoop"
  | "panOffset"
  | "pslgValidation"
  | "polygonSides"
  | "resetZoom"
  | "selectedPoint"
  | "setDraftShapeMode"
  | "setEraserRadius"
  | "setPolygonSides"
  | "zoomIn"
  | "zoomLevel"
  | "zoomOut"
>;

const DATA_TABS: Array<{ icon: typeof Terminal; id: DataTab; label: string }> = [
  { icon: Terminal, id: "console", label: "Console Logs" },
  { icon: Database, id: "nodes", label: "Nodes Matrix" },
  { icon: Rows3, id: "edges", label: "Edges Matrix" },
  { icon: Table2, id: "elements", label: "Elements Matrix" },
  { icon: GitBranch, id: "quality", label: "Quality Table" },
  { icon: FileDown, id: "export", label: "Export Preview" },
];

const DRAW_MODES: Array<{
  icon: typeof Spline;
  id: DraftShapeMode;
  label: string;
}> = [
  { icon: Spline, id: "freehand", label: "Freehand" },
  { icon: CircleDot, id: "circle", label: "Circle" },
  { icon: TriangleRight, id: "triangle", label: "Triangle" },
  { icon: Square, id: "square", label: "Square" },
  { icon: Hexagon, id: "polygon", label: "Polygon" },
];

function formatNumber(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "Inf";
}

function getOrientationLabel(points: WorkspaceViewModel["outerLoop"], hole = false) {
  if (points.length < 3) {
    return "Open";
  }

  const area = polygonArea(points);
  const label = area >= 0 ? "CCW" : "CW";
  const expected = hole ? "CW" : "CCW";
  return label === expected ? `${label}, Valid` : `${label}, Normalized`;
}

function PanelHeader({
  right,
  title,
}: {
  right?: string;
  title: string;
}) {
  return (
    <div className="flex h-10 items-center justify-between border-b border-slate-700/70 bg-[#0b1522] px-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
        {title}
      </h2>
      {right ? (
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {right}
        </span>
      ) : null}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "red" | "slate";
}) {
  const className = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    red: "border-red-500/30 bg-red-500/10 text-red-300",
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  }[tone];

  return (
    <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${className}`}>
      {label}
    </span>
  );
}

function MatrixTable({
  children,
  headers,
}: {
  children: ReactNode;
  headers: string[];
}) {
  return (
    <div className="h-full overflow-auto">
      <table className="min-w-full border-collapse font-mono text-xs">
        <thead className="sticky top-0 bg-[#111b2a] text-slate-300">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="border-b border-r border-slate-700/70 px-3 py-2 text-left font-semibold"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-300">{children}</tbody>
      </table>
    </div>
  );
}

export function DashboardWorkspacePane({
  activeTool,
  draftPointCount,
  draftShapeMode,
  draftStrokes,
  draftType,
  eraserRadius,
  geometryReady,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  hasMesh,
  holeLoops,
  isPanningCanvas,
  isSketching,
  logs,
  meshEdges,
  meshNodes,
  meshPreview,
  mousePos,
  outerLoop,
  panOffset,
  pslgValidation,
  polygonSides,
  resetZoom,
  selectedPoint,
  setDraftShapeMode,
  setEraserRadius,
  setPolygonSides,
  zoomIn,
  zoomLevel,
  zoomOut,
}: DashboardWorkspacePaneProps) {
  const [activeDataTab, setActiveDataTab] = useState<DataTab>("console");

  const worstElement = useMemo<MeshElement | null>(() => {
    if (!meshPreview?.elements.length) {
      return null;
    }

    return [...meshPreview.elements].sort((a, b) => a.minAngle - b.minAngle)[0];
  }, [meshPreview]);

  const exportPreview = useMemo(() => {
    if (!meshPreview) {
      return "{\n  \"mesh\": null\n}";
    }

    return JSON.stringify(
      {
        elements: meshPreview.elements.slice(0, 3),
        nodes: meshPreview.nodes.slice(0, 5),
        summary: {
          edges: meshPreview.edgeRecords.length,
          elementType: meshPreview.elementType,
          elements: meshPreview.elements.length,
          nodes: meshPreview.nodes.length,
        },
      },
      null,
      2,
    );
  }, [meshPreview]);

  const validationTone =
    pslgValidation.status === "valid"
      ? "emerald"
      : pslgValidation.status === "invalid"
        ? "red"
        : "slate";

  const renderDataTab = () => {
    if (activeDataTab === "console") {
      return (
        <div className="h-full overflow-auto p-4 font-mono text-xs">
          {logs.map((log, index) => (
            <div key={`${log}-${index}`} className="flex gap-3 py-1">
              <span className="w-7 shrink-0 text-right text-slate-600">
                {index + 1}
              </span>
              <span
                className={
                  log.includes("failed")
                    ? "text-red-300"
                    : log.includes("valid") ||
                        log.includes("Generated") ||
                        log.includes("refreshed")
                      ? "text-emerald-300"
                      : log.includes("Refinement") || log.includes("Starting")
                        ? "text-amber-300"
                        : "text-slate-300"
                }
              >
                {log}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (!meshPreview) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Generate mesh to populate this matrix.
        </div>
      );
    }

    if (activeDataTab === "nodes") {
      return (
        <MatrixTable headers={["Node ID", "X", "Y", "Boundary"]}>
          {meshPreview.nodes.slice(0, 250).map((node) => (
            <tr key={node.id} className="hover:bg-blue-500/10">
              <td className="border-r border-slate-800 px-3 py-1.5">{node.id}</td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(node.x, 2)}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(node.y, 2)}
              </td>
              <td className="px-3 py-1.5">{node.boundary ? "Yes" : "No"}</td>
            </tr>
          ))}
        </MatrixTable>
      );
    }

    if (activeDataTab === "edges") {
      return (
        <MatrixTable
          headers={[
            "Edge ID",
            "Node 1",
            "Node 2",
            "Length",
            "Bdry Flag",
            "Adj Elem 1",
            "Adj Elem 2",
          ]}
        >
          {meshPreview.edgeRecords.slice(0, 250).map((edge) => (
            <tr key={edge.id} className="hover:bg-blue-500/10">
              <td className="border-r border-slate-800 px-3 py-1.5">{edge.id}</td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {edge.nodeIds[0]}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {edge.nodeIds[1]}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(edge.length, 3)}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {edge.boundary ? "Yes" : "No"}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {edge.adjacentElementIds[0] ?? "-"}
              </td>
              <td className="px-3 py-1.5">{edge.adjacentElementIds[1] ?? "-"}</td>
            </tr>
          ))}
        </MatrixTable>
      );
    }

    if (activeDataTab === "elements") {
      return (
        <MatrixTable headers={["Element ID", "Type", "Node IDs", "Area", "Status"]}>
          {meshPreview.elements.slice(0, 250).map((element) => (
            <tr key={element.id} className="hover:bg-blue-500/10">
              <td className="border-r border-slate-800 px-3 py-1.5">
                {element.id}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {element.type}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                [{element.nodeIds.join(", ")}]
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(element.area, 3)}
              </td>
              <td className="capitalize">{element.status}</td>
            </tr>
          ))}
        </MatrixTable>
      );
    }

    if (activeDataTab === "quality") {
      return (
        <MatrixTable
          headers={["Element ID", "Min Angle", "r/l", "Area", "Quality"]}
        >
          {meshPreview.elements.slice(0, 250).map((element) => (
            <tr key={element.id} className="hover:bg-blue-500/10">
              <td className="border-r border-slate-800 px-3 py-1.5">
                {element.id}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(element.minAngle, 2)}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(element.circumradiusToShortestEdge, 3)}
              </td>
              <td className="border-r border-slate-800 px-3 py-1.5">
                {formatNumber(element.area, 3)}
              </td>
              <td className="capitalize">{element.status}</td>
            </tr>
          ))}
        </MatrixTable>
      );
    }

    return (
      <div className="h-full overflow-hidden p-4">
        <pre className="h-full overflow-auto rounded-lg border border-slate-700/70 bg-[#07101b] p-4 font-mono text-xs text-slate-300">
          {exportPreview}
        </pre>
      </div>
    );
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-2">
        <aside className="overflow-hidden rounded-lg border border-slate-700/70 bg-[#101a28]">
          <PanelHeader title="Hierarchy Tree" />
          <div className="h-[calc(100%-2.5rem)] overflow-auto p-4 font-mono text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">[Root]</span>
              <span className="text-slate-100">shape.dat</span>
            </div>

            {outerLoop.length ? (
              <div className="mt-4 border-l border-slate-700 pl-4">
                <div className="flex items-center justify-between gap-3">
                  <span>Outer Loop</span>
                  <StatusPill label={getOrientationLabel(outerLoop)} tone="emerald" />
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500">
                  <div>Segments: {outerLoop.length}</div>
                  <div>Boundary: Wrench</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-l border-slate-700 pl-4 text-slate-500">
                Outer Loop: empty
              </div>
            )}

            <div className="mt-4 border-l border-slate-700 pl-4">
              {holeLoops.length ? (
                holeLoops.map((loop, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex items-center justify-between gap-3">
                      <span>Hole {index + 1}</span>
                      <StatusPill
                        label={getOrientationLabel(loop, true)}
                        tone="red"
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Segments: {loop.length}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">Inner loops: none</div>
              )}
            </div>

            {draftPointCount ? (
              <div className="mt-4 border-l border-blue-500/40 pl-4 text-blue-200">
                Draft {draftType}: {draftPointCount} points
              </div>
            ) : null}

            <div className="mt-6 rounded-lg border border-slate-700/70 bg-[#07101b] p-3 text-xs leading-relaxed text-slate-400">
              {pslgValidation.message}
            </div>
          </div>
        </aside>

        <div className="relative overflow-hidden rounded-lg border border-blue-500/35 bg-[#101a28]">
          <PanelHeader
            right="Interactive Canvas"
            title={hasMesh ? "Mesh Preview: Current Model" : "Geometry Preview"}
          />
          <div className="relative h-[calc(100%-2.5rem)] min-h-0">
            <CanvasViewport
              activeTool={activeTool}
              draftShapeMode={draftShapeMode}
              draftStrokes={draftStrokes}
              draftType={draftType}
              eraserRadius={eraserRadius}
              hasMesh={hasMesh}
              holeLoops={holeLoops}
              isPanningCanvas={isPanningCanvas}
              isSketching={isSketching}
              meshEdges={meshEdges}
              meshElements={meshPreview?.elements ?? []}
              meshNodes={meshNodes}
              mousePos={mousePos}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              outerLoop={outerLoop}
              panOffset={panOffset}
              selectedPoint={selectedPoint}
              zoomLevel={zoomLevel}
            >
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border border-slate-700/70 bg-[#07101b]/90 p-1 backdrop-blur">
                <button
                  onClick={zoomOut}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10"
                  title="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="h-8 min-w-14 rounded-md px-2 font-mono text-xs text-slate-200 hover:bg-white/10"
                  title="Reset zoom"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10"
                  title="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {activeTool === "boundary" || activeTool === "hole" ? (
                <div className="absolute bottom-4 left-4 z-10 rounded-lg border border-slate-700/70 bg-[#07101b]/95 p-2 shadow-xl backdrop-blur">
                  <div className="flex items-center gap-1">
                    {DRAW_MODES.map(({ icon: Icon, id, label }) => (
                      <button
                        key={id}
                        onClick={() => setDraftShapeMode(id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md border transition ${
                          draftShapeMode === id
                            ? "border-blue-500/50 bg-blue-500/20 text-blue-100"
                            : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                        title={label}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>

                  {draftShapeMode === "polygon" ? (
                    <div className="mt-2 w-48 border-t border-slate-700/70 pt-2">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                          Polygon Points
                        </span>
                        <span className="font-mono text-xs text-slate-200">
                          {polygonSides}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={12}
                        step={1}
                        value={polygonSides}
                        onChange={(event) =>
                          setPolygonSides(Number.parseInt(event.target.value, 10))
                        }
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-400"
                        title="Polygon points"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTool === "eraser" ? (
                <div className="absolute right-4 top-16 z-10 w-52 rounded-lg border border-slate-700/70 bg-[#07101b]/95 p-3 shadow-xl backdrop-blur">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Eraser Size
                    </span>
                    <span className="font-mono text-xs text-slate-200">
                      {eraserRadius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={56}
                    step={2}
                    value={eraserRadius}
                    onChange={(event) =>
                      setEraserRadius(Number.parseInt(event.target.value, 10))
                    }
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-red-400"
                    title="Eraser size"
                  />
                </div>
              ) : null}

              {worstElement ? (
                <div className="pointer-events-none absolute left-6 top-6 z-10 rounded-lg border border-slate-600 bg-[#07101b]/90 p-3 font-mono text-xs text-slate-200 shadow-xl">
                  <div className="font-semibold text-white">
                    Element ID: {worstElement.id}
                  </div>
                  <div>Nodes: [{worstElement.nodeIds.join(", ")}]</div>
                  <div>Area: {formatNumber(worstElement.area, 4)}</div>
                  <div>Min angle: {formatNumber(worstElement.minAngle, 2)} deg</div>
                  <div>r/l: {formatNumber(worstElement.circumradiusToShortestEdge, 3)}</div>
                </div>
              ) : null}

              {hasMesh ? (
                <div className="pointer-events-none absolute bottom-5 right-6 z-10 w-72">
                  <div className="mb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Mesh Quality (r/l ratio)
                  </div>
                  <div
                    className="h-4 rounded"
                    style={{
                      background:
                        "linear-gradient(90deg, #3b82f6 0%, #10b981 45%, #facc15 72%, #ef4444 100%)",
                    }}
                  />
                  <div className="mt-1 flex justify-between text-xs text-slate-300">
                    <span>Good</span>
                    <span>Bad</span>
                  </div>
                </div>
              ) : null}

              {!geometryReady && draftPointCount === 0 ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg border border-slate-700/70 bg-[#07101b]/85 px-8 py-6 text-center shadow-xl backdrop-blur">
                    <Layers className="mx-auto mb-3 h-9 w-9 text-slate-500" />
                    <h3 className="text-base font-semibold text-slate-200">
                      Empty Geometry
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Import shape.dat or draw an outer loop.
                    </p>
                  </div>
                </div>
              ) : null}
            </CanvasViewport>
          </div>
        </div>
      </div>

      <div className="h-36 shrink-0 overflow-hidden rounded-lg border border-slate-700/70 bg-[#101a28]">
        <div className="flex h-10 items-center justify-between border-b border-slate-700/70 bg-[#0b1522]">
          <div className="flex h-full min-w-0 overflow-x-auto">
            {DATA_TABS.map(({ icon: Icon, id, label }) => (
              <button
                key={id}
                onClick={() => setActiveDataTab(id)}
                className={`flex h-full items-center gap-2 border-r border-slate-700/70 px-3 text-xs transition ${
                  activeDataTab === id
                    ? "bg-blue-500/15 text-blue-200"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2 px-4 md:flex">
            <StatusPill
              label={pslgValidation.status === "valid" ? "PSLG Validated" : "PSLG Pending"}
              tone={validationTone}
            />
          </div>
        </div>
        <div className="h-[calc(100%-2.5rem)]">{renderDataTab()}</div>
      </div>
    </section>
  );
}
