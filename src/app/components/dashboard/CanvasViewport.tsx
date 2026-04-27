import {
  useEffect,
  useRef,
  type MouseEventHandler,
  type ReactNode,
  type WheelEventHandler,
} from "react";
import {
  renderDashboardCanvas,
  type DashboardCanvasModel,
} from "../../../infrastructure/canvas/dashboard-renderer";
import { cn } from "../ui/utils";

type CanvasViewportProps = DashboardCanvasModel & {
  children?: ReactNode;
  className?: string;
  isPanning: boolean;
  isSketching: boolean;
  onMouseDown: MouseEventHandler<HTMLCanvasElement>;
  onMouseLeave: MouseEventHandler<HTMLCanvasElement>;
  onMouseMove: MouseEventHandler<HTMLCanvasElement>;
  onMouseUp: MouseEventHandler<HTMLCanvasElement>;
  onWheel: WheelEventHandler<HTMLCanvasElement>;
};

export function CanvasViewport({
  children,
  className,
  isPanning,
  isSketching,
  onMouseDown,
  onMouseLeave,
  onMouseMove,
  onMouseUp,
  onWheel,
  ...model
}: CanvasViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const resizeCanvas = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderDashboardCanvas(canvas, model);
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);
    resizeCanvas();

    return () => resizeObserver.disconnect();
  }, [
    model.activeTool,
    model.draftStrokes,
    model.draftType,
    model.hasMesh,
    model.holeLoops,
    model.meshEdges,
    model.meshNodes,
    model.mousePos,
    model.panOffset,
    model.outerLoop,
    model.selectedPoint,
    model.zoomLevel,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.7),_rgba(2,6,23,1))]",
        className,
      )}
    >
      {children}
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        className={`block h-full w-full ${
          model.activeTool === "eraser"
            ? "cursor-none"
            : isPanning
              ? "cursor-grabbing"
              : model.activeTool === "select"
                ? "cursor-grab"
              : isSketching
                ? "cursor-crosshair"
                : "cursor-default"
        }`}
      />
    </div>
  );
}
