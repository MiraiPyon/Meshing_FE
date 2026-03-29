import { Layers, Minus, Plus, Terminal } from "lucide-react";
import { CanvasViewport } from "./CanvasViewport";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardWorkspacePaneProps = Pick<
  WorkspaceViewModel,
  | "activeTool"
  | "draftPointCount"
  | "draftStrokes"
  | "draftType"
  | "geometryReady"
  | "handleMouseDown"
  | "handleMouseMove"
  | "handleMouseUp"
  | "hasMesh"
  | "holeLoops"
  | "isSketching"
  | "logs"
  | "meshEdges"
  | "meshNodes"
  | "mousePos"
  | "outerLoop"
  | "resetZoom"
  | "selectedPoint"
  | "zoomIn"
  | "zoomLevel"
  | "zoomOut"
>;

export function DashboardWorkspacePane({
  activeTool,
  draftPointCount,
  draftStrokes,
  draftType,
  geometryReady,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  hasMesh,
  holeLoops,
  isSketching,
  logs,
  meshEdges,
  meshNodes,
  mousePos,
  outerLoop,
  resetZoom,
  selectedPoint,
  zoomIn,
  zoomLevel,
  zoomOut,
}: DashboardWorkspacePaneProps) {
  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-black">
      <CanvasViewport
        activeTool={activeTool}
        draftStrokes={draftStrokes}
        draftType={draftType}
        hasMesh={hasMesh}
        holeLoops={holeLoops}
        isSketching={isSketching}
        meshEdges={meshEdges}
        meshNodes={meshNodes}
        mousePos={mousePos}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        outerLoop={outerLoop}
        selectedPoint={selectedPoint}
        zoomLevel={zoomLevel}
      >
        <div className="absolute right-6 top-6 z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#070b16]/80 p-2 backdrop-blur-xl">
          <button
            onClick={zoomOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={resetZoom}
            className="min-w-16 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/5"
            title="Reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute left-6 top-6 z-10 max-w-sm rounded-2xl border border-white/10 bg-[#070b16]/80 p-4 backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
            How to draw
          </p>
          <p className="mt-3 text-sm text-zinc-200">
            Chon <span className="font-semibold text-blue-400">Outer Boundary</span>,
            nhan giu chuot trai va keo de ve duong bao.
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Khi tha chuot, moi stroke duoc giu doc lap. Bam{" "}
            <span className="font-semibold text-emerald-400">Close Shape</span>{" "}
            khi ban muon dong hinh. Sau do chon{" "}
            <span className="font-semibold text-orange-400">Hole</span> de ve lo
            trong.
          </p>
        </div>

        {!geometryReady && draftPointCount === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-[#070b16]/70 px-8 py-6 text-center shadow-2xl backdrop-blur-md">
              <Layers className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
              <h3 className="text-lg font-medium text-zinc-200">Empty Sketch</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Hold the left mouse button and drag to sketch the first boundary.
              </p>
            </div>
          </div>
        ) : null}
      </CanvasViewport>

      <div className="flex h-40 shrink-0 flex-col border-t border-white/5 bg-[#070b16]">
        <div className="flex items-center justify-between border-b border-white/5 bg-[#050816] px-4 py-2">
          <span className="flex items-center text-[10px] font-bold uppercase text-zinc-500">
            <Terminal className="mr-2 h-3 w-3" /> Output Console
          </span>
          <span className="flex items-center text-[10px] text-zinc-600">
            <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
            Workspace Active
          </span>
        </div>
        <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs text-zinc-400">
          {logs.map((log, index) => (
            <div key={`${log}-${index}`} className="flex">
              <span className="mr-3 select-none text-zinc-600">{index + 1}</span>
              <span
                className={
                  log.includes("Generated") || log.includes("refreshed")
                    ? "text-green-400"
                    : ""
                }
              >
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
