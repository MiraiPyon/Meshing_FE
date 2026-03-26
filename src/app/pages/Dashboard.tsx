import { useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router";
import {
  Activity,
  AlertCircle,
  CircleUserRound,
  BarChart3,
  Box,
  CheckCircle2,
  Download,
  Eraser,
  Layers,
  Map,
  Minus,
  MousePointer2,
  LogOut,
  Plus,
  Play,
  RotateCcw,
  Settings,
  Terminal,
  Trash2,
  Triangle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useDashboardCanvas } from "./dashboard/use-dashboard-canvas";
import { useDashboardDrawing } from "./dashboard/use-dashboard-drawing";
import { getPointLabel } from "./dashboard/utils";
import { clearAuthentication, getAuthProfile } from "../lib/auth";

export function Dashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const dashboard = useDashboardDrawing(canvasRef);
  const profile = useMemo(() => getAuthProfile(), []);

  const handleLogout = () => {
    clearAuthentication();
    navigate("/login", { replace: true });
  };

  useDashboardCanvas({
    activeTool: dashboard.activeTool,
    canvasRef,
    containerRef,
    draftStrokes: dashboard.draftStrokes,
    draftType: dashboard.draftType,
    hasMesh: dashboard.hasMesh,
    holeLoops: dashboard.holeLoops,
    meshEdges: dashboard.meshEdges,
    meshNodes: dashboard.meshNodes,
    mousePos: dashboard.mousePos,
    outerLoop: dashboard.outerLoop,
    selectedPoint: dashboard.selectedPoint,
    zoomLevel: dashboard.zoomLevel,
  });

  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617] font-sans text-zinc-300">
      <div className="flex h-full">
        <div className="z-20 flex w-16 flex-col items-center space-y-4 border-r border-white/5 bg-[#070b16] py-4 shadow-xl">
          <Link to="/" className="mb-4 text-blue-400 transition-colors hover:text-blue-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
              <Triangle className="h-5 w-5" fill="currentColor" />
            </div>
          </Link>

          <div className="my-2 h-px w-8 bg-white/5"></div>

          <div className="flex w-full flex-col items-center space-y-3 px-3">
            <button
              onClick={() => dashboard.setActiveTool("select")}
              className={`flex w-full justify-center rounded-xl p-2.5 transition-all ${
                dashboard.activeTool === "select"
                  ? "border border-white/10 bg-white/10 text-white"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
              title="Select and move points"
            >
              <MousePointer2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                dashboard.setActiveTool("boundary");
                dashboard.setDraftType("outer");
              }}
              className={`flex w-full justify-center rounded-xl p-2.5 transition-all ${
                dashboard.activeTool === "boundary"
                  ? "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
              title="Draw outer boundary"
            >
              <Box className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                dashboard.setActiveTool("hole");
                dashboard.setDraftType("hole");
              }}
              className={`flex w-full justify-center rounded-xl p-2.5 transition-all ${
                dashboard.activeTool === "hole"
                  ? "border border-orange-500/20 bg-orange-500/10 text-orange-400"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
              title="Draw hole"
            >
              <AlertCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => dashboard.setActiveTool("eraser")}
              className={`flex w-full justify-center rounded-xl p-2.5 transition-all ${
                dashboard.activeTool === "eraser"
                  ? "border border-red-500/20 bg-red-500/10 text-red-400"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
              title="Erase draft strokes"
            >
              <Eraser className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-auto flex w-full flex-col items-center space-y-3 px-3">
            <button
              onClick={dashboard.resetGeometry}
              className="flex w-full justify-center rounded-xl p-2.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              title="Clear workspace"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col bg-[#050816]">
          <header className="z-10 flex h-14 items-center justify-between border-b border-white/5 bg-[#070b16] px-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <span className="font-mono text-sm text-zinc-200">interactive_geom.dat</span>
              <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Sketch Mode
              </span>
              <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
                    <CircleUserRound className="h-4 w-4" />
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-white">{profile?.name ?? "Nguoi dung Google"}</div>
                  <div className="text-[10px] text-zinc-500">{profile?.email ?? "Da dang nhap thanh cong"}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={dashboard.cancelCurrentSketch}
                disabled={!dashboard.hasDraft && !dashboard.isSketching}
                className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                <span>Cancel Stroke</span>
              </button>
              <button
                onClick={dashboard.closeCurrentShape}
                disabled={!dashboard.draftReadyToClose}
                className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Close Shape</span>
              </button>
              <button
                onClick={dashboard.removeLastStep}
                className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Undo</span>
              </button>
              <button
                onClick={dashboard.deleteSelectedShape}
                disabled={!dashboard.selectedPoint}
                className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Shape</span>
              </button>
              <button className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-500">
                <Download className="h-4 w-4" />
                <span>Export Later</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span>Dang xuat</span>
              </button>
              <div className="mx-2 h-6 w-px bg-white/10"></div>
              <button
                onClick={dashboard.handleGenerateMesh}
                disabled={dashboard.isMeshing}
                className="flex items-center space-x-2 rounded-lg border border-blue-500/50 bg-blue-600 px-5 py-1.5 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
              >
                {dashboard.isMeshing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Play className="h-4 w-4" fill="currentColor" />
                )}
                <span>{dashboard.isMeshing ? "Sampling..." : "Generate Mesh"}</span>
              </button>
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
            <div className="relative flex min-w-0 flex-1 flex-col bg-black">
              <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.7),_rgba(2,6,23,1))]"
              >
                <div className="absolute right-6 top-6 z-10 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#070b16]/80 p-2 backdrop-blur-xl">
                  <button
                    onClick={dashboard.zoomOut}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                    title="Zoom out"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={dashboard.resetZoom}
                    className="min-w-16 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-white/5"
                    title="Reset zoom"
                  >
                    {Math.round(dashboard.zoomLevel * 100)}%
                  </button>
                  <button
                    onClick={dashboard.zoomIn}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                    title="Zoom in"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute left-6 top-6 z-10 max-w-sm rounded-2xl border border-white/10 bg-[#070b16]/80 p-4 backdrop-blur-xl">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500">How to draw</p>
                  <p className="mt-3 text-sm text-zinc-200">
                    Chon <span className="font-semibold text-blue-400">Outer Boundary</span>, nhan giu chuot trai va keo de ve duong bao.
                  </p>
                  <p className="mt-2 text-sm text-zinc-400">
                    Khi tha chuot, moi stroke duoc giu doc lap. Bam <span className="font-semibold text-emerald-400">Close Shape</span> khi ban muon dong hinh. Sau do chon <span className="font-semibold text-orange-400">Hole</span> de ve lo trong.
                  </p>
                </div>

                <canvas
                  ref={canvasRef}
                  onMouseDown={dashboard.handleMouseDown}
                  onMouseMove={dashboard.handleMouseMove}
                  onMouseUp={dashboard.handleMouseUp}
                  onMouseLeave={dashboard.handleMouseUp}
                  className={`block h-full w-full ${
                    dashboard.activeTool === "eraser"
                      ? "cursor-none"
                      : dashboard.activeTool === "select"
                        ? "cursor-default"
                        : dashboard.isSketching
                          ? "cursor-crosshair"
                          : "cursor-default"
                  }`}
                />

                {!dashboard.geometryReady && dashboard.draftPointCount === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-2xl border border-white/10 bg-[#070b16]/70 px-8 py-6 text-center shadow-2xl backdrop-blur-md">
                      <Layers className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
                      <h3 className="text-lg font-medium text-zinc-200">Empty Sketch</h3>
                      <p className="mt-2 text-sm text-zinc-500">Hold the left mouse button and drag to sketch the first boundary.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex h-40 shrink-0 flex-col border-t border-white/5 bg-[#070b16]">
                <div className="flex items-center justify-between border-b border-white/5 bg-[#050816] px-4 py-2">
                  <span className="flex items-center text-[10px] font-bold uppercase text-zinc-500">
                    <Terminal className="mr-2 h-3 w-3" /> Output Console
                  </span>
                  <span className="flex items-center text-[10px] text-zinc-600">
                    <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span> Workspace Active
                  </span>
                </div>
                <div className="flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-xs text-zinc-400">
                  {dashboard.logs.map((log, index) => (
                    <div key={`${log}-${index}`} className="flex">
                      <span className="mr-3 select-none text-zinc-600">{index + 1}</span>
                      <span className={log.includes("Generated") || log.includes("refreshed") ? "text-green-400" : ""}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="z-20 flex w-80 shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-[#050816] shadow-2xl">
              <div className="border-b border-white/5 p-6">
                <h3 className="mb-6 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  Interactive Sketch
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">Mode</div>
                    <div className="mt-2 font-medium text-zinc-200">
                      {dashboard.activeTool === "boundary" && "Drawing outer boundary"}
                      {dashboard.activeTool === "hole" && "Drawing hole"}
                      {dashboard.activeTool === "eraser" && "Erasing draft strokes"}
                      {dashboard.activeTool === "select" && "Selecting and moving points"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">Selection</div>
                    <div className="mt-2 font-medium text-zinc-200">{getPointLabel(dashboard.selectedPoint)}</div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">Erase Shortcuts</div>
                    <div className="mt-2 space-y-1 text-xs text-zinc-300">
                      <div>`Esc`: cancel current stroke</div>
                      <div>`Delete`: remove selected shape</div>
                      <div>`Enter`: close current shape</div>
                      <div>`Eraser`: remove draft stroke segments</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-[#070b16] p-4">
                    <div className="text-xs uppercase tracking-widest text-zinc-500">Geometry Summary</div>
                    <div className="mt-3 space-y-2 font-mono text-xs text-zinc-300">
                      <div className="flex justify-between">
                        <span>Zoom</span>
                        <span>{Math.round(dashboard.zoomLevel * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Outer points</span>
                        <span>{dashboard.outerLoop.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draft strokes</span>
                        <span>{dashboard.draftStrokes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Draft points</span>
                        <span>{dashboard.draftPointCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Holes</span>
                        <span>{dashboard.holeLoops.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Segments</span>
                        <span>{dashboard.generatedSegments}</span>
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
                      <label className="text-xs font-semibold text-zinc-300">Min Angle Constraint</label>
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                        {dashboard.thetaMin.toFixed(1)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="35"
                      step="0.1"
                      value={dashboard.thetaMin}
                      onChange={(event) => dashboard.setThetaMin(Number.parseFloat(event.target.value))}
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Circumradius / Shortest Edge</label>
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                        {dashboard.rlRatio.toFixed(3)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="2.5"
                      step="0.01"
                      value={dashboard.rlRatio}
                      onChange={(event) => dashboard.setRlRatio(Number.parseFloat(event.target.value))}
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between">
                      <label className="text-xs font-semibold text-zinc-300">Grid Spacing Proxy</label>
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-xs text-blue-400">
                        {dashboard.maxLength.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.08"
                      max="0.35"
                      step="0.01"
                      value={dashboard.maxLength}
                      onChange={(event) => dashboard.setMaxLength(Number.parseFloat(event.target.value))}
                      className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-xs font-semibold text-zinc-300">Element Order</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => dashboard.setElementType("T3")}
                        className={`rounded-lg border py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                          dashboard.elementType === "T3"
                            ? "border-blue-500 bg-blue-600 text-white"
                            : "border-white/10 bg-[#070b16] text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                        }`}
                      >
                        T3
                      </button>
                      <button
                        onClick={() => dashboard.setElementType("Q4")}
                        className={`rounded-lg border py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                          dashboard.elementType === "Q4"
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

                {dashboard.hasMesh ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/5 bg-[#070b16] p-3 shadow-inner">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Total DOF</div>
                        <div className="font-mono text-lg font-bold text-white">{dashboard.meshStats.dof.toLocaleString()}</div>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-[#070b16] p-3 shadow-inner">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Preview Time</div>
                        <div className="font-mono text-lg font-bold text-blue-400">{dashboard.meshStats.executionTime}ms</div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-white/5 bg-[#070b16] p-1 text-sm font-mono">
                      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                        <span className="text-zinc-500">Nodes [N]</span>
                        <span className="text-zinc-200">{dashboard.meshStats.nodes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                        <span className="text-zinc-500">Edges [E]</span>
                        <span className="text-zinc-200">{dashboard.meshStats.edges.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-zinc-500">Tris [T]</span>
                        <span className="text-zinc-200">{dashboard.meshStats.tris.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-400">Sketch accepted</h4>
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
                <p className="mb-6 text-[10px] font-medium text-zinc-600">Bars update from the geometry currently on canvas.</p>

                <div className="relative min-h-0 w-full flex-1">
                  {dashboard.hasMesh ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboard.errorData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="size" stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525B" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#070b16",
                            borderColor: "rgba(255,255,255,0.1)",
                            fontSize: "12px",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                          itemStyle={{ color: "#60A5FA" }}
                          cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        />
                        <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-white/5 bg-white/[0.02]">
                      <span className="text-xs font-medium text-zinc-600">Awaiting interactive geometry...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <footer className="z-20 flex h-8 items-center justify-between bg-blue-600 px-4 font-mono text-[10px] tracking-wider text-white shadow-[0_-5px_20px_rgba(37,99,235,0.2)]">
            <div className="flex items-center space-x-6">
              <span className="flex items-center">
                <Activity className="mr-1.5 h-3 w-3" /> SYNC: ON
              </span>
              <span className="text-blue-100">
                LOOPS: {dashboard.outerLoop.length ? `1 + ${dashboard.holeLoops.length} holes` : "drafting"}
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="flex items-center rounded bg-blue-700/50 px-2 py-0.5">
                <Map className="mr-1.5 h-3 w-3" />
                X: {dashboard.mousePos.x} Y: {dashboard.mousePos.y}
              </span>
              <span>PTS: {dashboard.outerLoop.length + dashboard.holeLoops.flat().length + dashboard.draftPointCount}</span>
              <span>v2.5.0-interactive</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
