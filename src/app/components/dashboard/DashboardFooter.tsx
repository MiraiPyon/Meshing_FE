import { Activity, Map } from "lucide-react";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";

type DashboardFooterProps = Pick<
  WorkspaceViewModel,
  "draftPointCount" | "holeLoops" | "mousePos" | "outerLoop"
>;

export function DashboardFooter({
  draftPointCount,
  holeLoops,
  mousePos,
  outerLoop,
}: DashboardFooterProps) {
  return (
    <footer className="z-20 flex h-8 items-center justify-between bg-blue-600 px-4 font-mono text-[10px] tracking-wider text-white shadow-[0_-5px_20px_rgba(37,99,235,0.2)]">
      <div className="flex items-center space-x-6">
        <span className="flex items-center">
          <Activity className="mr-1.5 h-3 w-3" /> SYNC: ON
        </span>
        <span className="text-blue-100">
          LOOPS: {outerLoop.length ? `1 + ${holeLoops.length} holes` : "drafting"}
        </span>
      </div>
      <div className="flex items-center space-x-6">
        <span className="flex items-center rounded bg-blue-700/50 px-2 py-0.5">
          <Map className="mr-1.5 h-3 w-3" />
          X: {mousePos.x} Y: {mousePos.y}
        </span>
        <span>
          PTS: {outerLoop.length + holeLoops.flat().length + draftPointCount}
        </span>
        <span>v2.5.0-interactive</span>
      </div>
    </footer>
  );
}
