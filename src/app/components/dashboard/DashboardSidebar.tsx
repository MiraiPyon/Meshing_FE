import { Link } from "react-router";
import {
  AlertCircle,
  Box,
  Eraser,
  MousePointer2,
  Trash2,
  Triangle,
} from "lucide-react";
import type {
  DraftType,
  Tool,
  WorkspaceViewModel,
} from "../../../modules/workspace/application/types";

type DashboardSidebarProps = Pick<
  WorkspaceViewModel,
  "activeTool" | "resetGeometry" | "setActiveTool" | "setDraftType"
>;

type ToolConfig = {
  activeClassName: string;
  icon: typeof MousePointer2;
  title: string;
  tool: Tool;
};

const TOOL_CONFIGS: ToolConfig[] = [
  {
    activeClassName: "border border-white/10 bg-white/10 text-white",
    icon: MousePointer2,
    title: "Select and move points",
    tool: "select",
  },
  {
    activeClassName: "border border-blue-500/20 bg-blue-500/10 text-blue-400",
    icon: Box,
    title: "Draw outer boundary",
    tool: "boundary",
  },
  {
    activeClassName:
      "border border-orange-500/20 bg-orange-500/10 text-orange-400",
    icon: AlertCircle,
    title: "Draw hole",
    tool: "hole",
  },
  {
    activeClassName: "border border-red-500/20 bg-red-500/10 text-red-400",
    icon: Eraser,
    title: "Erase draft strokes",
    tool: "eraser",
  },
];

function getDraftType(tool: Tool): DraftType | null {
  if (tool === "boundary") {
    return "outer";
  }

  if (tool === "hole") {
    return "hole";
  }

  return null;
}

export function DashboardSidebar({
  activeTool,
  resetGeometry,
  setActiveTool,
  setDraftType,
}: DashboardSidebarProps) {
  return (
    <div className="z-20 flex w-16 flex-col items-center space-y-4 border-r border-white/5 bg-[#070b16] py-4 shadow-xl">
      <Link to="/" className="mb-4 text-blue-400 transition-colors hover:text-blue-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
          <Triangle className="h-5 w-5" fill="currentColor" />
        </div>
      </Link>

      <div className="my-2 h-px w-8 bg-white/5"></div>

      <div className="flex w-full flex-col items-center space-y-3 px-3">
        {TOOL_CONFIGS.map(({ activeClassName, icon: Icon, title, tool }) => (
          <button
            key={tool}
            onClick={() => {
              setActiveTool(tool);
              const draftType = getDraftType(tool);
              if (draftType) {
                setDraftType(draftType);
              }
            }}
            className={`flex w-full justify-center rounded-xl p-2.5 transition-all ${
              activeTool === tool
                ? activeClassName
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            }`}
            title={title}
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      <div className="mt-auto flex w-full flex-col items-center space-y-3 px-3">
        <button
          onClick={resetGeometry}
          className="flex w-full justify-center rounded-xl p-2.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
          title="Clear workspace"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
