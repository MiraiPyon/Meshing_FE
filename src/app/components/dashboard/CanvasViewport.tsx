import { useEffect, useRef, type MouseEventHandler, type ReactNode } from "react";
import { renderDashboardCanvas, type DashboardCanvasModel } from "../../../infrastructure/canvas/dashboard-renderer";
import { cn } from "../ui/utils";

type CanvasViewportProps = DashboardCanvasModel & {
  children?: ReactNode;
  className?: string;
  isSketching: boolean;
  onMouseDown: MouseEventHandler<HTMLCanvasElement>;
  onMouseLeave: MouseEventHandler<HTMLCanvasElement>;
  onMouseMove: MouseEventHandler<HTMLCanvasElement>;
  onMouseUp: MouseEventHandler<HTMLCanvasElement>;
};

export function CanvasViewport({
  children,
  className,
  isSketching,
  onMouseDown,
  onMouseLeave,
  onMouseMove,
  onMouseUp,
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
    model.meshElements,
    model.meshNodes,
    model.mousePos,
    model.outerLoop,
    model.selectedPoint,
    model.zoomLevel,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.7),_rgba(2,6,23,1))]",
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
        className={`block h-full w-full ${
          model.activeTool === "eraser"
            ? "cursor-none"
            : model.activeTool === "select"
              ? "cursor-default"
              : isSketching
                ? "cursor-crosshair"
                : "cursor-default"
        }`}
      />
    </div>
  );
}
