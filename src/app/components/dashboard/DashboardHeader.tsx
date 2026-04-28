import { useState } from "react";
import { CircleUserRound, Download, Loader2, LogOut, Play } from "lucide-react";
import { LogoutConfirmDialog } from "../auth/LogoutConfirmDialog";
import type { AuthProfile } from "../../../infrastructure/auth/local-storage-auth";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardHeaderProps = {
  onLogout: () => void;
  profile: AuthProfile | null;
} & Pick<WorkspaceViewModel, "holeLoops" | "outerLoop" | "pslgValidation">;

type DashboardHeaderActions = Pick<
  WorkspaceViewModel,
  "handleExportMesh" | "handleGenerateMesh" | "hasMesh" | "isMeshing"
>;

type DashboardHeaderPropsWithActions = DashboardHeaderProps & DashboardHeaderActions;

function StatusChip({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  tone?: "blue" | "emerald" | "red" | "slate";
  value: string | number;
}) {
  const toneClass = {
    blue: "border-blue-500/25 bg-blue-500/10 text-blue-200",
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    red: "border-red-500/25 bg-red-500/10 text-red-200",
    slate: "border-white/10 bg-white/5 text-zinc-200",
  }[tone];

  return (
    <div className={`flex h-8 items-center gap-2 rounded-lg border px-3 ${toneClass}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <span className="font-mono text-xs font-semibold">{value}</span>
    </div>
  );
}

export function DashboardHeader({
  handleExportMesh,
  handleGenerateMesh,
  hasMesh,
  holeLoops,
  isMeshing,
  onLogout,
  outerLoop,
  profile,
  pslgValidation,
}: DashboardHeaderPropsWithActions) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const pslgTone =
    pslgValidation.status === "valid"
      ? "emerald"
      : pslgValidation.status === "invalid"
        ? "red"
        : "blue";

  return (
    <>
      <header className="z-10 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-white/5 bg-[#070b16] px-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-mono text-sm text-zinc-200">
            interactive_geom.dat
          </span>
          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Sketch Mode
          </span>
        </div>

        <div className="hidden min-w-0 items-center gap-2 xl:flex">
          <div className="flex items-center gap-2">
            <StatusChip label="Outer" value={outerLoop.length || "--"} />
            <StatusChip label="Holes" value={holeLoops.length} />
            <StatusChip
              label="PSLG"
              tone={pslgTone}
              value={pslgValidation.status.toUpperCase()}
            />
          </div>

          <div className="ml-2 flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
            <button
              onClick={handleGenerateMesh}
              disabled={isMeshing}
              className="flex h-8 items-center gap-2 rounded-md bg-blue-600 px-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-65"
              title="Generate Mesh"
            >
              {isMeshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" fill="currentColor" />
              )}
              <span>{isMeshing ? "Generating" : "Generate Mesh"}</span>
            </button>

            {(["dat", "json", "csv"] as const).map((format) => (
              <button
                key={format}
                onClick={() => handleExportMesh(format)}
                disabled={!hasMesh}
                className="flex h-8 items-center gap-1.5 rounded-md border border-slate-600/80 bg-[#07101b] px-2.5 text-xs font-semibold uppercase text-slate-200 transition hover:border-blue-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                title={`Export ${format.toUpperCase()}`}
              >
                <Download className="h-3.5 w-3.5" />
                {format}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 md:flex">
            {profile?.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
                <CircleUserRound className="h-4 w-4" />
              </div>
            )}
            <div className="max-w-52 leading-tight">
              <div className="truncate text-xs font-semibold text-white">
                {profile?.name ?? "Nguoi dung Google"}
              </div>
              <div className="truncate text-[10px] text-zinc-500">
                {profile?.email ?? "Da dang nhap thanh cong"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
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
