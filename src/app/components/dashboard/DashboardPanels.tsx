import {
  BarChart3,
  CheckCircle2,
  Database,
  FolderOpen,
  Shapes,
  Play,
  Save,
  Settings,
  Trash2,
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
import { getPointLabel } from "../../../modules/workspace/application/selectors/get-point-label";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardPanelsProps = Pick<
  WorkspaceViewModel,
  | "activeTool"
  | "draftPointCount"
  | "draftStrokes"
  | "circleInput"
  | "deleteGeometryRecord"
  | "elementType"
  | "errorData"
  | "generatedSegments"
  | "generateMeshFromShapeDat"
  | "geometryError"
  | "geometryRecords"
  | "isGeometryBusy"
  | "loadGeometryRecord"
  | "polygonInputText"
  | "primitiveName"
  | "primitiveType"
  | "rectangleInput"
  | "refreshGeometryRecords"
  | "selectedGeometryId"
  | "deleteProjectSnapshot"
  | "feaInput"
  | "feaSummary"
  | "hasMesh"
  | "hasProjectData"
  | "holeLoops"
  | "isProjectBusy"
  | "isRunningFEA"
  | "isShapeDatMeshing"
  | "loadProjectSnapshot"
  | "maxLength"
  | "meshStats"
  | "outerLoop"
  | "projectName"
  | "projectNotes"
  | "projectSnapshots"
  | "refreshProjectSnapshots"
  | "runQuickFEA"
  | "saveProjectSnapshot"
  | "rlRatio"
  | "selectedPoint"
  | "setElementType"
  | "setCircleInput"
  | "setFeaInput"
  | "setPolygonInputText"
  | "setPrimitiveName"
  | "setPrimitiveType"
  | "setRectangleInput"
  | "setMaxLength"
  | "setProjectName"
  | "setProjectNotes"
  | "setRlRatio"
  | "setShapeDatText"
  | "setThetaMin"
  | "shapeDatText"
  | "submitPrimitiveForm"
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
  circleInput,
  draftPointCount,
  draftStrokes,
  deleteGeometryRecord,
  elementType,
  errorData,
  generateMeshFromShapeDat,
  geometryError,
  geometryRecords,
  isGeometryBusy,
  loadGeometryRecord,
  polygonInputText,
  primitiveName,
  primitiveType,
  rectangleInput,
  refreshGeometryRecords,
  selectedGeometryId,
  deleteProjectSnapshot,
  feaInput,
  feaSummary,
  generatedSegments,
  hasMesh,
  hasProjectData,
  holeLoops,
  isProjectBusy,
  isRunningFEA,
  isShapeDatMeshing,
  loadProjectSnapshot,
  maxLength,
  meshStats,
  outerLoop,
  projectName,
  projectNotes,
  projectSnapshots,
  refreshProjectSnapshots,
  runQuickFEA,
  saveProjectSnapshot,
  rlRatio,
  selectedPoint,
  setCircleInput,
  setElementType,
  setFeaInput,
  setPolygonInputText,
  setPrimitiveName,
  setPrimitiveType,
  setRectangleInput,
  setMaxLength,
  setProjectName,
  setProjectNotes,
  setRlRatio,
  setShapeDatText,
  setThetaMin,
  shapeDatText,
  submitPrimitiveForm,
  thetaMin,
  zoomLevel,
}: DashboardPanelsProps) {
  const updateFeaInput = <K extends keyof typeof feaInput>(
    key: K,
    value: (typeof feaInput)[K],
  ) => {
    setFeaInput({ ...feaInput, [key]: value });
  };

  const updateRectangleInput = <K extends keyof typeof rectangleInput>(
    key: K,
    value: (typeof rectangleInput)[K],
  ) => {
    setRectangleInput({ ...rectangleInput, [key]: value });
  };

  const updateCircleInput = <K extends keyof typeof circleInput>(
    key: K,
    value: (typeof circleInput)[K],
  ) => {
    setCircleInput({ ...circleInput, [key]: value });
  };

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
              <div>Esc: cancel current stroke</div>
              <div>Delete: remove selected shape</div>
              <div>Enter: close current shape</div>
              <div>Eraser: remove draft stroke segments</div>
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
        <h3 className="mb-5 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Shapes className="mr-2 h-3.5 w-3.5" />
          Geometry Primitives
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(["rectangle", "circle", "polygon"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPrimitiveType(type)}
                className={`rounded-md border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  primitiveType === type
                    ? "border-blue-500/60 bg-blue-500/20 text-blue-300"
                    : "border-white/10 bg-[#070b16] text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            value={primitiveName}
            onChange={(event) => setPrimitiveName(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#070b16] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
            placeholder="Name (optional)"
          />

          {primitiveType === "rectangle" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">x_min</label>
                <input
                  type="number"
                  value={rectangleInput.xMin}
                  onChange={(event) => updateRectangleInput("xMin", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">y_min</label>
                <input
                  type="number"
                  value={rectangleInput.yMin}
                  onChange={(event) => updateRectangleInput("yMin", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">width</label>
                <input
                  type="number"
                  value={rectangleInput.width}
                  onChange={(event) => updateRectangleInput("width", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">height</label>
                <input
                  type="number"
                  value={rectangleInput.height}
                  onChange={(event) => updateRectangleInput("height", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          ) : null}

          {primitiveType === "circle" ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">center_x</label>
                <input
                  type="number"
                  value={circleInput.centerX}
                  onChange={(event) => updateCircleInput("centerX", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">center_y</label>
                <input
                  type="number"
                  value={circleInput.centerY}
                  onChange={(event) => updateCircleInput("centerY", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">radius</label>
                <input
                  type="number"
                  value={circleInput.radius}
                  onChange={(event) => updateCircleInput("radius", Number(event.target.value))}
                  className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          ) : null}

          {primitiveType === "polygon" ? (
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">
                Points (one point per line: x,y or x y)
              </label>
              <textarea
                value={polygonInputText}
                onChange={(event) => setPolygonInputText(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-[#070b16] px-3 py-2 font-mono text-xs text-zinc-200 outline-none focus:border-blue-500/50"
                placeholder={"120,120\n520,120\n520,320\n120,320"}
              />
            </div>
          ) : null}

          {geometryError ? (
            <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {geometryError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={submitPrimitiveForm}
              disabled={isGeometryBusy}
              className="rounded-lg border border-blue-500/40 bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
            >
              {isGeometryBusy ? "Working..." : "Create Primitive"}
            </button>
            <button
              onClick={refreshGeometryRecords}
              disabled={isGeometryBusy}
              className="rounded-lg border border-white/10 bg-[#070b16] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              Refresh Records
            </button>
          </div>

          {geometryRecords.length > 0 ? (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-[#070b16] p-2">
              {geometryRecords.map((record) => (
                <div
                  key={record.id}
                  className={`rounded-md border p-2 ${
                    selectedGeometryId === record.id
                      ? "border-blue-500/40 bg-blue-500/10"
                      : "border-white/5 bg-black/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-xs font-semibold text-zinc-200">
                      {record.name}
                    </div>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] uppercase text-zinc-400">
                      {record.geometry_type}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-zinc-500">
                    {new Date(record.created_at).toLocaleString("en-GB")}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => loadGeometryRecord(record.id)}
                      disabled={isGeometryBusy}
                      className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteGeometryRecord(record.id)}
                      disabled={isGeometryBusy}
                      className="flex items-center justify-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-zinc-500">
              No geometry records yet.
            </div>
          )}
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
                {thetaMin.toFixed(1)}°
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

      <div className="border-t border-white/5 p-6">
        <h3 className="mb-5 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Database className="mr-2 h-3.5 w-3.5" />
          shape.dat Meshing
        </h3>
        <textarea
          value={shapeDatText}
          onChange={(event) => setShapeDatText(event.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-[#070b16] px-3 py-2 font-mono text-xs text-zinc-200 outline-none focus:border-blue-500/50"
          placeholder="OUTER\n0 0\n4 0\n4 2\n0 2\nEND"
        />
        <button
          onClick={generateMeshFromShapeDat}
          disabled={isShapeDatMeshing}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {isShapeDatMeshing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isShapeDatMeshing ? "Meshing..." : "Generate From shape.dat"}
        </button>
      </div>

      <div className="border-t border-white/5 p-6">
        <h3 className="mb-5 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <FolderOpen className="mr-2 h-3.5 w-3.5" />
          Project Snapshots
        </h3>

        <div className="space-y-3">
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#070b16] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
            placeholder="Project name"
          />
          <textarea
            value={projectNotes}
            onChange={(event) => setProjectNotes(event.target.value)}
            rows={2}
            className="w-full rounded-lg border border-white/10 bg-[#070b16] px-3 py-2 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
            placeholder="Notes (optional)"
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={saveProjectSnapshot}
              disabled={isProjectBusy}
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button
              onClick={refreshProjectSnapshots}
              disabled={isProjectBusy}
              className="rounded-lg border border-white/10 bg-[#070b16] px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {hasProjectData ? (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-[#070b16] p-2">
              {projectSnapshots.map((project) => (
                <div key={project.id} className="rounded-lg border border-white/5 bg-black/20 p-2">
                  <div className="truncate text-xs font-semibold text-zinc-200">{project.name}</div>
                  <div className="mt-0.5 truncate text-[10px] text-zinc-500">{project.notes || "No notes"}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => loadProjectSnapshot(project.id)}
                      disabled={isProjectBusy}
                      className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => deleteProjectSnapshot(project.id)}
                      disabled={isProjectBusy}
                      className="flex items-center justify-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-xs text-zinc-500">
              No snapshots yet.
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/5 p-6">
        <h3 className="mb-5 flex items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
          <Play className="mr-2 h-3.5 w-3.5" />
          Quick FEA
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">E (Pa)</label>
              <input
                type="number"
                value={feaInput.E}
                onChange={(event) => updateFeaInput("E", Number(event.target.value))}
                className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">nu</label>
              <input
                type="number"
                step="0.01"
                value={feaInput.nu}
                onChange={(event) => updateFeaInput("nu", Number(event.target.value))}
                className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Thickness</label>
              <input
                type="number"
                step="0.001"
                value={feaInput.thickness}
                onChange={(event) => updateFeaInput("thickness", Number(event.target.value))}
                className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Total Fy (N)</label>
              <input
                type="number"
                value={feaInput.totalForceFy}
                onChange={(event) => updateFeaInput("totalForceFy", Number(event.target.value))}
                className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] uppercase tracking-wider text-zinc-500">Analysis</label>
            <select
              value={feaInput.analysisType}
              onChange={(event) =>
                updateFeaInput(
                  "analysisType",
                  event.target.value as "plane_stress" | "plane_strain",
                )
              }
              className="w-full rounded-md border border-white/10 bg-[#070b16] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500/50"
            >
              <option value="plane_stress">plane_stress</option>
              <option value="plane_strain">plane_strain</option>
            </select>
          </div>

          <button
            onClick={runQuickFEA}
            disabled={isRunningFEA || !hasMesh}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:opacity-50"
          >
            {isRunningFEA ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {isRunningFEA ? "Solving..." : "Run Quick FEA"}
          </button>

          {feaSummary ? (
            <div className="rounded-lg border border-white/10 bg-[#070b16] p-3 text-xs text-zinc-300">
              <div className="font-semibold text-emerald-300">{feaSummary.message}</div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
                <div>max|u|</div>
                <div>{feaSummary.maxDisplacement.toExponential(3)}</div>
                <div>max_vm</div>
                <div>{feaSummary.maxVonMises.toExponential(3)}</div>
                <div>Sum Rx</div>
                <div>{(feaSummary.sumReactionX ?? 0).toExponential(3)}</div>
                <div>Sum Ry</div>
                <div>{(feaSummary.sumReactionY ?? 0).toExponential(3)}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
