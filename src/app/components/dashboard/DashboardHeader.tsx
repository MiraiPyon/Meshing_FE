import { useState } from "react";
import { CircleUserRound, LogOut } from "lucide-react";
import { LogoutConfirmDialog } from "../auth/LogoutConfirmDialog";
import type { AuthProfile } from "../../../infrastructure/auth/local-storage-auth";

type DashboardHeaderProps = {
  onLogout: () => void;
  profile: AuthProfile | null;
};

export function DashboardHeader({ onLogout, profile }: DashboardHeaderProps) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  return (
    <>
      <header className="z-10 flex h-12 shrink-0 items-center justify-between border-b border-white/5 bg-[#070b16] px-4 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-mono text-sm text-zinc-200">
            interactive_geom.dat
          </span>
          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
            Sketch Mode
          </span>
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
            <span>Dang xuat</span>
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
