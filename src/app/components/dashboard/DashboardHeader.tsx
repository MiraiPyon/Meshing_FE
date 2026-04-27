import { useState } from "react";
import {
  CheckCircle2,
  CircleUserRound,
  ChevronDown,
  Download,
  LogOut,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { LogoutConfirmDialog } from "../auth/LogoutConfirmDialog";
import type { AuthProfile } from "../../../infrastructure/auth/local-storage-auth";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";
import { useMeshAPI } from "../../../hooks/useMeshAPI";

type DashboardHeaderProps = {
  onLogout: () => void;
  profile: AuthProfile | null;
} & Pick<
  WorkspaceViewModel,
  | "cancelCurrentSketch"
  | "closeCurrentShape"
  | "deleteSelectedShape"
  | "draftReadyToClose"
  | "handleGenerateMesh"
  | "hasDraft"
  | "hasMesh"
  | "isMeshing"
  | "isSketching"
  | "removeLastStep"
  | "selectedPoint"
>;

export function DashboardHeader({
  cancelCurrentSketch,
  closeCurrentShape,
  deleteSelectedShape,
  draftReadyToClose,
  handleGenerateMesh,
  hasDraft,
  hasMesh,
  isMeshing,
  isSketching,
  onLogout,
  profile,
  removeLastStep,
  selectedPoint,
}: DashboardHeaderProps) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const meshAPI = useMeshAPI();

  const handleExport = async (fmt: "json" | "dat" | "csv" | "csv_zip" | "shape") => {
    setExportOpen(false);
    setExporting(true);
    try {
      await meshAPI.exportCurrentMesh(fmt);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <header className="z-10 flex h-14 items-center justify-between border-b border-white/5 bg-[#070b16] px-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <span className="font-mono text-sm text-zinc-200">
            interactive_geom.dat
          </span>
          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Sketch Mode
          </span>
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
                <CircleUserRound className="h-4 w-4" />
              </div>
            )}
            <div className="leading-tight">
              <div className="text-xs font-semibold text-white">
                {profile?.name ?? "Google User"}
              </div>
              <div className="text-[10px] text-zinc-500">
                {profile?.email ?? "Successfully logged in"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={cancelCurrentSketch}
            disabled={!hasDraft && !isSketching}
            className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            <span>Cancel Stroke</span>
          </button>
          <button
            onClick={closeCurrentShape}
            disabled={!draftReadyToClose}
            className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Close Shape</span>
          </button>
          <button
            onClick={removeLastStep}
            className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Undo</span>
          </button>
          <button
            onClick={deleteSelectedShape}
            disabled={!selectedPoint}
            className="flex items-center space-x-2 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Shape</span>
          </button>
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              disabled={!hasMesh || exporting}
              className="flex items-center space-x-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-zinc-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:opacity-40"
            >
              <Download className="h-4 w-4" />
              <span>{exporting ? "Exporting..." : "Export"}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-white/10 bg-[#0d1117] py-1 shadow-xl">
                {(["json", "dat", "csv", "csv_zip", "shape"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="flex items-center space-x-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
          <div className="mx-2 h-6 w-px bg-white/10"></div>
          <button
            onClick={handleGenerateMesh}
            disabled={isMeshing}
            className="flex items-center space-x-2 rounded-lg border border-blue-500/50 bg-blue-600 px-5 py-1.5 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            {isMeshing ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Play className="h-4 w-4" fill="currentColor" />
            )}
            <span>{isMeshing ? "Sampling..." : "Generate Mesh"}</span>
          </button>
        </div>
      </header>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={onLogout}
      />
    </>
  );
}
