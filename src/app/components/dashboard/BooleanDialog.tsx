import { useState } from "react";
import { Combine, Minus, Crosshair } from "lucide-react";
import { apiClient } from "../../../services/apiClient";
import type { Point } from "../../../modules/geometry/domain/types";

type BooleanOp = "union" | "subtract" | "intersect";

type BooleanDialogProps = {
  open: boolean;
  onClose: () => void;
  outerLoop: Point[];
  holeLoops: Point[][];
  onResult: (outer: Point[], holes: Point[][]) => void;
  addLog: (msg: string) => void;
};

const OP_CONFIG: {
  op: BooleanOp;
  label: string;
  icon: typeof Combine;
  desc: string;
  color: string;
}[] = [
  {
    op: "union",
    label: "Union (A ∪ B)",
    icon: Combine,
    desc: "Merge two shapes",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  },
  {
    op: "subtract",
    label: "Subtract (A − B)",
    icon: Minus,
    desc: "Subtract shape B from A",
    color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  },
  {
    op: "intersect",
    label: "Intersect (A ∩ B)",
    icon: Crosshair,
    desc: "Intersection of two shapes",
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
  },
];

// Simple coordinate input parser: "x1,y1; x2,y2; x3,y3"
function parseCoords(input: string): number[][] | null {
  try {
    const points = input
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const [x, y] = s.split(",").map(Number);
        if (Number.isNaN(x) || Number.isNaN(y)) throw new Error("NaN");
        return [x, y];
      });
    return points.length >= 3 ? points : null;
  } catch {
    return null;
  }
}

function pointsToString(pts: Point[]): string {
  return pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("; ");
}

export function BooleanDialog({
  open,
  onClose,
  outerLoop,
  holeLoops,
  onResult,
  addLog,
}: BooleanDialogProps) {
  const [selectedOp, setSelectedOp] = useState<BooleanOp>("union");
  const [polygonBText, setPolygonBText] = useState(
    "200,100; 400,100; 400,300; 200,300",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const polygonA =
    outerLoop.length >= 3 ? outerLoop.map((p) => [p.x, p.y]) : null;

  const handleExecute = async () => {
    if (!polygonA) {
      setError("Draw the outer boundary first (at least 3 points).");
      return;
    }
    const polygonB = parseCoords(polygonBText);
    if (!polygonB) {
      setError("Polygon B is invalid. Enter: x1,y1; x2,y2; x3,y3");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await apiClient.booleanOperation({
        polygon_a: polygonA,
        polygon_b: polygonB,
        operation: selectedOp,
        name: `boolean_${selectedOp}`,
      });

      const components =
        result.components && result.components.length > 0
          ? result.components
          : [
              {
                outer_boundary: result.outer_boundary,
                holes: result.holes,
                area: result.area,
                num_vertices: result.num_vertices,
                is_valid: result.is_valid,
              },
            ];
      const selectedComponent = components.reduce((best, current) =>
        current.area > best.area ? current : best,
      );

      const newOuter: Point[] = selectedComponent.outer_boundary.map(([x, y]) => ({
        x,
        y,
      }));
      const newHoles: Point[][] = selectedComponent.holes.map((hole) =>
        hole.map(([x, y]) => ({ x, y })),
      );

      addLog(
        `[Boolean] ${selectedOp}: ${selectedComponent.num_vertices} vertices, area=${selectedComponent.area.toFixed(2)}, components=${result.component_count ?? components.length}`,
      );
      if ((result.component_count ?? components.length) > 1) {
        addLog("[Boolean] Multi-component result detected. Using largest component for canvas update.");
      }
      onResult(newOuter, newHoles);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Boolean operation failed";
      setError(msg);
      addLog(`[Boolean Error] ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-bold text-white">
          Boolean Operations (CSG)
        </h2>
        <p className="mb-5 text-xs text-zinc-500">
          Polygon A = current outer loop on the canvas ({outerLoop.length} pts). Enter Polygon B below.
        </p>

        {/* Operation selector */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {OP_CONFIG.map(({ op, label, icon: Icon, color }) => (
            <button
              key={op}
              onClick={() => setSelectedOp(op)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                selectedOp === op
                  ? color
                  : "border-white/5 bg-white/[0.02] text-zinc-500 hover:border-white/10"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Polygon A preview */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-semibold text-zinc-400">
            Polygon A (outer loop — read-only)
          </label>
          <div className="max-h-16 overflow-y-auto rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 font-mono text-xs text-zinc-500">
            {polygonA
              ? pointsToString(outerLoop)
              : "No outer loop. Draw one first."}
          </div>
        </div>

        {/* Polygon B input */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-semibold text-zinc-400">
            Polygon B (enter coordinates: x1,y1; x2,y2; ...)
          </label>
          <textarea
            value={polygonBText}
            onChange={(e) => setPolygonBText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-zinc-200 outline-none focus:border-blue-500/50"
            placeholder="200,100; 400,100; 400,300; 200,300"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading || !polygonA}
            className="flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-600 px-5 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Combine className="h-4 w-4" />
            )}
            {loading ? "Processing..." : "Execute"}
          </button>
        </div>
      </div>
    </div>
  );
}
