import { Link } from "react-router";
import { Trash2, Triangle } from "lucide-react";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardSidebarProps = Pick<WorkspaceViewModel, "resetGeometry">;

export function DashboardSidebar({ resetGeometry }: DashboardSidebarProps) {
  return (
    <div className="z-20 flex w-12 shrink-0 flex-col items-center border-r border-white/5 bg-[#070b16] py-3 shadow-xl">
      <Link
        to="/"
        className="text-blue-400 transition-colors hover:text-blue-300"
        title="Home"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
          <Triangle className="h-4 w-4" fill="currentColor" />
        </div>
      </Link>

      <div className="my-4 h-px w-7 bg-white/5" />

      <button
        onClick={resetGeometry}
        className="mt-auto flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
        title="Clear workspace"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
