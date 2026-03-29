import { BarChart3, CheckCircle2, Settings } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getPointLabel } from "../../../modules/workspace/application/selectors/get-point-label";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardPanelsProps = Pick<
  WorkspaceViewModel,
  | "activeTool"
  | "draftPointCount"
  | "draftStrokes"
  | "elementType"
  | "errorData"
  | "generatedSegments"
  | "hasMesh"
  | "holeLoops"
  | "maxLength"
  | "meshStats"
  | "outerLoop"
  | "rlRatio"
  | "selectedPoint"
  | "setElementType"
  | "setMaxLength"
  | "setRlRatio"
  | "setThetaMin"
  | "thetaMin"
  | "zoomLevel"
>;

function getModeLabel(activeTool: WorkspaceViewModel["activeTool"]) {
  if (activeTool === "boundary") {
    return "Drawing outer boundary";
  }

  if (activeTool === "hole") {
    return "Drawing hole";
  }

  if (activeTool === "eraser") {
    return "Erasing draft strokes";
  }

  return "Selecting and moving points";
}

export function DashboardPanels({
  activeTool,
  draftPointCount,
  draftStrokes,
  elementType,
  errorData,
  generatedSegments,
  hasMesh,
  holeLoops,
  maxLength,
  meshStats,
  outerLoop,
  rlRatio,
  selectedPoint,
  setElementType,
  setMaxLength,
  setRlRatio,
  setThetaMin,
  thetaMin,
  zoomLevel,
}: DashboardPanelsProps) {
  return (
    <div className="z-20 flex w-80 shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-[#050816] shadow-2xl">
      <div className="border-b border-white/5 p-6">
        <h3 className="mb-6 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Settings className="mr-2 h-3.5 w-3.5" />
          Interactive Sketch
        </h3>

        <div className="space-y-4 text-sm">
          <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Mode
            </div>
            <div className="mt-2 font-medium text-zinc-200">
              {getModeLabel(activeTool)}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Selection
            </div>
            <div className="mt-2 font-medium text-zinc-200">
              {getPointLabel(selectedPoint)}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Erase Shortcuts
            </div>
            <div className="mt-2 space-y-1 text-xs text-zinc-300">
              <div>`Esc`: cancel current stroke</div>
              <div>`Delete`: remove selected shape</div>
              <div>`Enter`: close current shape</div>
              <div>`Eraser`: remove draft stroke segments</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
            <div className="text-xs uppercase tracking-widest text-zinc-500">
              Geometry Summary
            </div>
            <div className="mt-3 space-y-2 font-mono text-xs text-zinc-300">
              <div className="flex justify-between">
                <span>Zoom</span>
                <span>{Math.round(zoomLevel * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Outer points</span>
                <span>{outerLoop.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Draft strokes</span>
                <span>{draftStrokes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Draft points</span>
                <span>{draftPointCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Holes</span>
                <span>{holeLoops.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Segments</span>
                <span>{generatedSegments}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-white/5 p-6">
        <h3 className="mb-6 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Settings className="mr-2 h-3.5 w-3.5" />
          Mesh Parameters
        </h3>

        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-end justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Min Angle Constraint
              </label>
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                {thetaMin.toFixed(1)}ﾂｰ
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="35"
              step="0.1"
              value={thetaMin}
              onChange={(event) => setThetaMin(Number.parseFloat(event.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
            />
          </div>

          <div>
            <div className="mb-2 flex items-end justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Circumradius / Shortest Edge
              </label>
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                {rlRatio.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.01"
              value={rlRatio}
              onChange={(event) => setRlRatio(Number.parseFloat(event.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
            />
          </div>

          <div>
            <div className="mb-2 flex items-end justify-between">
              <label className="text-xs font-semibold text-zinc-300">
                Grid Spacing Proxy
              </label>
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                {maxLength.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.08"
              max="0.35"
              step="0.01"
              value={maxLength}
              onChange={(event) => setMaxLength(Number.parseFloat(event.target.value))}
              className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
            />
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold text-zinc-300">
              Element Order
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setElementType("T3")}
                className={`rounded-lg border py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  elementType === "T3"
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-white/10 bg-[#070b16] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                T3
              </button>
              <button
                onClick={() => setElementType("Q4")}
                className={`rounded-lg border py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  elementType === "Q4"
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-white/10 bg-[#070b16] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                }`}
              >
                Q4
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 border-b border-white/5 p-6">
        <h3 className="mb-5 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          Topology Snapshot
        </h3>

        {hasMesh ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/5 bg-[#070b16] p-3 shadow-inner">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Total DOF
                </div>
                <div className="font-mono text-lg font-bold text-white">
                  {meshStats.dof.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#070b16] p-3 shadow-inner">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Preview Time
                </div>
                <div className="font-mono text-lg font-bold text-blue-400">
                  {meshStats.executionTime}ms
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/5 bg-[#070b16] p-1 text-sm font-mono">
              <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                <span className="text-zinc-500">Nodes [N]</span>
                <span className="text-zinc-200">
                  {meshStats.nodes.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                <span className="text-zinc-500">Edges [E]</span>
                <span className="text-zinc-200">
                  {meshStats.edges.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-zinc-500">Tris [T]</span>
                <span className="text-zinc-200">
                  {meshStats.tris.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-400">
                  Sketch accepted
                </h4>
                <p className="mt-1 font-mono text-[10px] text-emerald-500/70">
                  Geometry sampled from the interactive canvas.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <p className="text-center text-xs font-medium text-zinc-600">
              Draw geometry first,
              <br />
              then generate the preview mesh
            </p>
          </div>
        )}
      </div>

      <div className="flex h-72 flex-col p-6">
        <h3 className="mb-2 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <BarChart3 className="mr-2 h-3.5 w-3.5" />
          Distribution Preview
        </h3>
        <p className="mb-6 text-[10px] font-medium text-zinc-600">
          Bars update from the geometry currently on canvas.
        </p>

        <div className="relative min-h-0 w-full flex-1">
          {hasMesh ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="size"
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#070b16",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  itemStyle={{ color: "#60A5FA" }}
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
              <span className="text-xs font-medium text-zinc-600">
                Awaiting interactive geometry...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
