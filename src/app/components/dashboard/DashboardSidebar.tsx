import { useRef } from "react";
import { useNavigate } from "react-router";
import {
  Circle,
  CircleDashed,
  Eraser,
  FolderInput,
  House,
  MousePointer2,
  PackageX,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import type { WorkspaceViewModel } from "../../../modules/workspace/application/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

type DashboardSidebarProps = Pick<
  WorkspaceViewModel,
  | "activeTool"
  | "cancelCurrentSketch"
  | "closeCurrentShape"
  | "deleteSelectedShape"
  | "draftReadyToClose"
  | "geometryReady"
  | "handleImportGeometryFile"
  | "handleValidatePSLG"
  | "hasDraft"
  | "isSketching"
  | "removeLastStep"
  | "resetGeometry"
  | "selectedPoint"
  | "setActiveTool"
  | "setDraftType"
>;

type SidebarAction = {
  active?: boolean;
  disabled?: boolean;
  icon: typeof MousePointer2;
  label: string;
  onClick: () => void;
  tone?: "blue" | "emerald" | "red" | "zinc";
};

function SidebarButton({
  active = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
  tone = "zinc",
}: SidebarAction) {
  const activeClass = {
    blue: "border-blue-500/40 bg-blue-500/15 text-blue-200",
    emerald: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200",
    red: "border-red-500/40 bg-red-500/15 text-red-200",
    zinc: "border-white/15 bg-white/10 text-white",
  }[tone];

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
        active
          ? activeClass
          : "border-transparent text-zinc-500 hover:border-white/10 hover:bg-white/5 hover:text-white"
      } disabled:cursor-not-allowed disabled:opacity-35`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function DashboardSidebar({
  activeTool,
  cancelCurrentSketch,
  closeCurrentShape,
  deleteSelectedShape,
  draftReadyToClose,
  geometryReady,
  handleImportGeometryFile,
  handleValidatePSLG,
  hasDraft,
  isSketching,
  removeLastStep,
  resetGeometry,
  selectedPoint,
  setActiveTool,
  setDraftType,
}: DashboardSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const openImportDialog = () => {
    fileInputRef.current?.click();
  };

  const deleteShapeLabel =
    selectedPoint?.type === "outer"
      ? "Delete Outer + Holes"
      : selectedPoint?.type === "hole"
        ? `Delete Hole ${selectedPoint.holeIndex + 1}`
        : "Delete Shape";

  const actions: SidebarAction[] = [
    {
      active: activeTool === "select",
      icon: MousePointer2,
      label: "Select",
      onClick: () => setActiveTool("select"),
    },
    {
      active: activeTool === "boundary",
      icon: PenLine,
      label: "Outer Loop",
      onClick: () => {
        setActiveTool("boundary");
        setDraftType("outer");
      },
      tone: "emerald",
    },
    {
      active: activeTool === "hole",
      icon: Circle,
      label: "Inner Loop",
      onClick: () => {
        setActiveTool("hole");
        setDraftType("hole");
      },
      tone: "red",
    },
    {
      active: activeTool === "eraser",
      icon: Eraser,
      label: "Eraser",
      onClick: () => setActiveTool("eraser"),
    },
    {
      disabled: !draftReadyToClose,
      icon: CircleDashed,
      label: "Close Loop",
      onClick: closeCurrentShape,
      tone: "blue",
    },
    {
      disabled: !geometryReady,
      icon: ShieldCheck,
      label: "Validate PSLG",
      onClick: handleValidatePSLG,
      tone: "blue",
    },
    {
      icon: FolderInput,
      label: "Import shape.dat",
      onClick: openImportDialog,
    },
    {
      disabled: !hasDraft && !isSketching,
      icon: XCircle,
      label: "Cancel Stroke",
      onClick: cancelCurrentSketch,
    },
    {
      icon: RotateCcw,
      label: "Undo",
      onClick: removeLastStep,
    },
    {
      disabled: !selectedPoint,
      icon: Trash2,
      label: deleteShapeLabel,
      onClick: deleteSelectedShape,
      tone: "red",
    },
  ];

  return (
    <div className="z-20 flex w-14 shrink-0 flex-col items-center border-r border-white/5 bg-[#070b16] py-3 shadow-xl">
      <input
        ref={fileInputRef}
        type="file"
        accept=".dat,.json,.csv,.txt"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) {
            return;
          }

          handleImportGeometryFile(file.name, await file.text());
        }}
      />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 transition-colors hover:text-blue-300"
            title="Home"
            aria-label="Home"
          >
            <House className="h-4 w-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-white/10 bg-[#0b1120] text-zinc-200 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Xác nhận về trang chủ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Các hành động chưa được lưu trong workspace hiện tại sẽ bị xóa.
              Bạn có muốn tiếp tục không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white">
              Ở lại
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => navigate("/")}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Về trang chủ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="my-3 h-px w-8 bg-white/5" />

      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto px-2">
        {actions.map((action) => (
          <SidebarButton key={action.label} {...action} />
        ))}
      </div>

      <div className="my-3 h-px w-8 bg-white/5" />

      <button
        onClick={resetGeometry}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
        title="Clear workspace"
      >
        <PackageX className="h-4 w-4" />
      </button>
    </div>
  );
}
