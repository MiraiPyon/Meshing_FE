import {
  CheckCircle2,
  Download,
  Loader2,
  Play,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardPanelsProps = Pick<
  WorkspaceViewModel,
  | "elementType"
  | "errorData"
  | "handleExportMesh"
  | "handleGenerateMesh"
  | "hasMesh"
  | "isMeshing"
  | "maxLength"
  | "meshPreview"
  | "meshStats"
  | "pslgValidation"
  | "rlRatio"
  | "setElementType"
  | "setMaxLength"
  | "setRlRatio"
  | "setThetaMin"
  | "thetaMin"
>;

const QUALITY_COLORS = ["#3b82f6", "#10b981", "#facc15", "#ef4444"];

function formatMetric(value: number, digits = 0) {
  if (!Number.isFinite(value)) {
    return "Inf";
  }

  return digits > 0 ? value.toFixed(digits) : value.toLocaleString();
}

function DashboardSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="border-b border-slate-700/70 p-5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SliderControl({
  label,
  max,
  min,
  onChange,
  step,
  suffix = "",
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  suffix?: string;
  value: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-200">{label}</label>
        <span className="font-mono text-sm text-slate-100">
          {value.toFixed(step < 0.1 ? 2 : 1)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number.parseFloat(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
      />
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 font-mono text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100">{value}</span>
    </div>
  );
}

export function DashboardPanels({
  elementType,
  errorData,
  handleExportMesh,
  handleGenerateMesh,
  hasMesh,
  isMeshing,
  maxLength,
  meshStats,
  pslgValidation,
  rlRatio,
  setElementType,
  setMaxLength,
  setRlRatio,
  setThetaMin,
  thetaMin,
}: DashboardPanelsProps) {
  const convergenceData = [
    { elements: 50, error: 0.023 },
    { elements: 120, error: 0.014 },
    { elements: 260, error: 0.008 },
    { elements: 420, error: 0.0046 },
    { elements: 700, error: 0.003 },
    { elements: Math.max(900, meshStats.elements || 900), error: hasMesh ? 0.002 : 0.0026 },
  ];

  return (
    <aside className="z-20 flex w-[320px] shrink-0 flex-col overflow-hidden rounded-lg border border-blue-500/35 bg-[#101a28] shadow-2xl">
      <div className="flex h-14 items-center justify-between border-b border-slate-700/70 bg-[#0b1522] px-5">
        <h2 className="text-base font-semibold text-slate-100">
          Meshing & Analysis Dashboard
        </h2>
        {pslgValidation.status === "valid" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <DashboardSection title="Configurations">
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-200">
                Element Type
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(["T3", "Q4"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setElementType(type)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      elementType === type
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-700 bg-[#07101b] text-slate-400 hover:border-slate-500 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-lg border border-slate-700/70 bg-[#07101b] px-3 py-2 text-xs text-slate-400">
                Strategy: {elementType === "T3" ? "Delaunay Refinement" : "Mapped Q4"}
              </div>
            </div>

            <SliderControl
              label="Min Angle theta_min"
              min={15}
              max={35}
              step={0.1}
              suffix=" deg"
              value={thetaMin}
              onChange={setThetaMin}
            />

            <SliderControl
              label="Circumradius / Edge r/l"
              min={1}
              max={2.5}
              step={0.01}
              value={rlRatio}
              onChange={setRlRatio}
            />

            <SliderControl
              label="MAX_LENGTH"
              min={0.04}
              max={0.18}
              step={0.01}
              value={maxLength}
              onChange={setMaxLength}
            />

            <div className="space-y-2 text-sm text-slate-200">
              {[
                "Remove Outside Edges",
                "Encroachment Refinement",
                "Validate InCircle",
              ].map((label) => (
                <label key={label} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked
                    readOnly
                    className="h-4 w-4 rounded border-slate-600 bg-[#07101b] accent-blue-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handleGenerateMesh}
              disabled={isMeshing}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {isMeshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
              {isMeshing ? "Generating" : "Generate Mesh"}
            </button>
          </div>
        </DashboardSection>

        <DashboardSection title="Analysis">
          <div className="mb-4 rounded-lg border border-slate-700/70 bg-[#07101b] p-3">
            <div className="mb-2 text-xs font-bold uppercase text-slate-400">
              Degrees of Freedom (DOF)
            </div>
            <MetricRow label={`${elementType} Elements`} value={formatMetric(meshStats.elements)} />
            <MetricRow label="Nodes" value={formatMetric(meshStats.nodes)} />
            <MetricRow label="Total DOFs" value={formatMetric(meshStats.dof)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-700/70 bg-[#07101b] p-3">
              <div className="text-[10px] uppercase text-slate-500">Edges</div>
              <div className="font-mono text-lg text-slate-100">
                {formatMetric(meshStats.edges)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700/70 bg-[#07101b] p-3">
              <div className="text-[10px] uppercase text-slate-500">Bad Elem</div>
              <div className="font-mono text-lg text-red-300">
                {formatMetric(meshStats.badElements)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700/70 bg-[#07101b] p-3">
              <div className="text-[10px] uppercase text-slate-500">Min Angle</div>
              <div className="font-mono text-lg text-slate-100">
                {formatMetric(meshStats.minAngle, 1)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-700/70 bg-[#07101b] p-3">
              <div className="text-[10px] uppercase text-slate-500">Max r/l</div>
              <div className="font-mono text-lg text-slate-100">
                {formatMetric(meshStats.maxRatio, 2)}
              </div>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Mesh Quality Distribution">
          <div className="h-52">
            {hasMesh ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={meshStats.qualityDistribution}
                    cx="45%"
                    cy="50%"
                    dataKey="count"
                    innerRadius={0}
                    outerRadius={66}
                    stroke="#0f172a"
                  >
                    {meshStats.qualityDistribution.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={QUALITY_COLORS[index % QUALITY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#07101b",
                      borderColor: "rgba(148,163,184,0.35)",
                      borderRadius: 8,
                      color: "#e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
                Awaiting mesh
              </div>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {meshStats.qualityDistribution.map((slice, index) => (
              <div key={slice.name} className="flex items-center gap-2 text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: QUALITY_COLORS[index] }}
                />
                <span>
                  {slice.name}: {slice.value}%
                </span>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection title="Min Angle Histogram">
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={errorData} margin={{ bottom: 0, left: -25, right: 4, top: 4 }}>
                <CartesianGrid
                  stroke="rgba(148,163,184,0.12)"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="size"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#07101b",
                    borderColor: "rgba(148,163,184,0.35)",
                    borderRadius: 8,
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardSection>

        <DashboardSection title="Convergence Plot">
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergenceData} margin={{ bottom: 0, left: -25, right: 8, top: 4 }}>
                <CartesianGrid
                  stroke="rgba(148,163,184,0.12)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="elements"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#07101b",
                    borderColor: "rgba(148,163,184,0.35)",
                    borderRadius: 8,
                    color: "#e2e8f0",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="error"
                  dot={false}
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardSection>

        <section className="p-5">
          <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
            <Download className="h-4 w-4" />
            Export
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleExportMesh("dat")}
              className="rounded-lg border border-slate-600 bg-[#07101b] px-3 py-2 text-sm text-slate-200 hover:border-blue-500/60"
            >
              DAT
            </button>
            <button
              onClick={() => handleExportMesh("json")}
              className="rounded-lg border border-slate-600 bg-[#07101b] px-3 py-2 text-sm text-slate-200 hover:border-blue-500/60"
            >
              JSON
            </button>
            <button
              onClick={() => handleExportMesh("csv")}
              className="rounded-lg border border-slate-600 bg-[#07101b] px-3 py-2 text-sm text-slate-200 hover:border-blue-500/60"
            >
              CSV
            </button>
          </div>
        </section>
      </div>
    </aside>
  );
}
