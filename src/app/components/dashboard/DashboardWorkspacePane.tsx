import { useEffect, useState } from "react";
import {
  BookOpen,
  Keyboard,
  Layers,
  Minus,
  Plus,
  Terminal,
  X,
} from "lucide-react";
import { CanvasViewport } from "./CanvasViewport";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

const KEYBINDINGS = [
  ["1", "Select / pan"],
  ["2", "Outer Boundary"],
  ["3", "Hole"],
  ["4", "Eraser"],
  ["Enter / C", "Close Shape"],
  ["Ctrl/Cmd + Z", "Undo one step"],
  ["Esc", "Cancel Stroke"],
  ["Del / Backspace", "Delete selection"],
  ["R", "Reset drawing"],
  ["M", "Generate Mesh"],
  ["Wheel", "Zoom in/out"],
  ["+ / - / 0", "Zoom in / out / reset"],
  ["H", "Toggle this guide"],
];

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
  | "handleWheel"
  | "hasMesh"
  | "holeLoops"
  | "isPanning"
  | "isSketching"
  | "logs"
  | "meshEdges"
  | "meshNodes"
  | "mousePos"
  | "panOffset"
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
  handleWheel,
  hasMesh,
  holeLoops,
  isPanning,
  isSketching,
  logs,
  meshEdges,
  meshNodes,
  mousePos,
  panOffset,
  outerLoop,
  resetZoom,
  selectedPoint,
  zoomIn,
  zoomLevel,
  zoomOut,
}: DashboardWorkspacePaneProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "h" || event.key === "?") {
        event.preventDefault();
        setGuideOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative flex min-w-0 flex-1 flex-col bg-black">
      <CanvasViewport
        activeTool={activeTool}
        draftStrokes={draftStrokes}
        draftType={draftType}
        hasMesh={hasMesh}
        holeLoops={holeLoops}
        isSketching={isSketching}
        isPanning={isPanning}
        meshEdges={meshEdges}
        meshNodes={meshNodes}
        mousePos={mousePos}
        panOffset={panOffset}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
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

        <div className="absolute left-6 top-6 z-10">
          <button
            onClick={() => setGuideOpen((current) => !current)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070b16]/80 px-3 py-2 text-sm font-semibold text-zinc-200 shadow-xl backdrop-blur-xl transition-colors hover:bg-white/10 hover:text-white"
            title="Toggle drawing guide (H)"
          >
            <BookOpen className="h-4 w-4" />
            <span>Guide</span>
          </button>

          {guideOpen ? (
            <div className="mt-3 max-w-md rounded-2xl border border-white/10 bg-[#070b16]/90 p-4 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">
                  How to draw
                </p>
                <button
                  onClick={() => setGuideOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                  title="Hide guide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-sm text-zinc-200">
                Choose{" "}
                <span className="font-semibold text-blue-400">Outer Boundary</span>,
                then hold the left mouse button and drag to draw the boundary.
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                When you release the mouse, each stroke is saved independently.
                Click{" "}
                <span className="font-semibold text-emerald-400">Close Shape</span>{" "}
                when you want to close the figure. Then select{" "}
                <span className="font-semibold text-orange-400">Hole</span> to draw
                internal holes.
              </p>
              <p className="mt-2 text-sm text-zinc-400">
                In <span className="font-semibold text-zinc-200">Select</span> mode,
                drag empty space with the left mouse button to pan the canvas.
              </p>

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <Keyboard className="h-3.5 w-3.5" />
                  Keybindings
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {KEYBINDINGS.map(([keys, action]) => (
                    <div
                      key={`${keys}-${action}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2"
                    >
                      <span className="text-xs text-zinc-400">{action}</span>
                      <kbd className="shrink-0 rounded border border-white/10 bg-black/30 px-2 py-1 font-mono text-[10px] font-semibold text-zinc-200">
                        {keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
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
                  log.includes("[BE] ") || log.includes("[Boolean]") || log.includes("Generated") || log.includes("refreshed")
                    ? "text-green-400"
                    : log.includes("[BE Error]") || log.includes("[Boolean Error]")
                      ? "text-red-400"
                      : log.includes("[Local]")
                        ? "text-yellow-400"
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
