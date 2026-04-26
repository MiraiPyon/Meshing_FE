import { Suspense, lazy, useMemo } from "react";
import { useNavigate } from "react-router";
import { DashboardFooter } from "../components/dashboard/DashboardFooter";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { DashboardWorkspacePane } from "../components/dashboard/DashboardWorkspacePane";
import { Skeleton } from "../components/ui/skeleton";
import {
  clearAuthentication,
  getAuthProfile,
} from "../../infrastructure/auth/local-storage-auth";
import { useDashboardWorkspace } from "../../modules/workspace/application/use-dashboard-workspace";

const DashboardPanels = lazy(async () => {
  const module = await import("../components/dashboard/DashboardPanels");
  return { default: module.DashboardPanels };
});

function DashboardPanelsFallback() {
  return (
    <div className="z-20 flex w-[320px] shrink-0 flex-col overflow-y-auto rounded-lg border border-blue-500/35 bg-[#050816] shadow-2xl">
      <div className="space-y-6 p-6">
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="h-24 w-full bg-white/10" />
        <Skeleton className="h-24 w-full bg-white/10" />
        <Skeleton className="h-40 w-full bg-white/10" />
        <Skeleton className="h-52 w-full bg-white/10" />
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  const dashboard = useDashboardWorkspace();
  const profile = useMemo(() => getAuthProfile(), []);

  const handleLogout = () => {
    clearAuthentication();
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617] font-sans text-zinc-300">
      <div className="flex h-full">
        <DashboardSidebar
          resetGeometry={dashboard.resetGeometry}
        />

        <div className="flex min-w-0 flex-1 flex-col bg-[#050816]">
          <DashboardHeader
            onLogout={handleLogout}
            profile={profile}
          />

          <div className="relative flex min-h-0 flex-1 gap-3 p-3">
            <DashboardWorkspacePane
              activeTool={dashboard.activeTool}
              cancelCurrentSketch={dashboard.cancelCurrentSketch}
              closeCurrentShape={dashboard.closeCurrentShape}
              deleteSelectedShape={dashboard.deleteSelectedShape}
              draftPointCount={dashboard.draftPointCount}
              draftReadyToClose={dashboard.draftReadyToClose}
              draftStrokes={dashboard.draftStrokes}
              draftType={dashboard.draftType}
              geometryReady={dashboard.geometryReady}
              handleExportMesh={dashboard.handleExportMesh}
              handleImportSample={dashboard.handleImportSample}
              handleMouseDown={dashboard.handleMouseDown}
              handleMouseMove={dashboard.handleMouseMove}
              handleMouseUp={dashboard.handleMouseUp}
              handleValidatePSLG={dashboard.handleValidatePSLG}
              hasDraft={dashboard.hasDraft}
              hasMesh={dashboard.hasMesh}
              holeLoops={dashboard.holeLoops}
              isMeshing={dashboard.isMeshing}
              isSketching={dashboard.isSketching}
              logs={dashboard.logs}
              meshEdges={dashboard.meshEdges}
              meshNodes={dashboard.meshNodes}
              meshPreview={dashboard.meshPreview}
              mousePos={dashboard.mousePos}
              outerLoop={dashboard.outerLoop}
              pslgValidation={dashboard.pslgValidation}
              removeLastStep={dashboard.removeLastStep}
              resetZoom={dashboard.resetZoom}
              selectedPoint={dashboard.selectedPoint}
              setActiveTool={dashboard.setActiveTool}
              setDraftType={dashboard.setDraftType}
              zoomIn={dashboard.zoomIn}
              zoomLevel={dashboard.zoomLevel}
              zoomOut={dashboard.zoomOut}
            />

            <Suspense fallback={<DashboardPanelsFallback />}>
              <DashboardPanels
                elementType={dashboard.elementType}
                errorData={dashboard.errorData}
                handleExportMesh={dashboard.handleExportMesh}
                handleGenerateMesh={dashboard.handleGenerateMesh}
                hasMesh={dashboard.hasMesh}
                isMeshing={dashboard.isMeshing}
                maxLength={dashboard.maxLength}
                meshPreview={dashboard.meshPreview}
                meshStats={dashboard.meshStats}
                pslgValidation={dashboard.pslgValidation}
                rlRatio={dashboard.rlRatio}
                setElementType={dashboard.setElementType}
                setMaxLength={dashboard.setMaxLength}
                setRlRatio={dashboard.setRlRatio}
                setThetaMin={dashboard.setThetaMin}
                thetaMin={dashboard.thetaMin}
              />
            </Suspense>
          </div>

          <DashboardFooter
            draftPointCount={dashboard.draftPointCount}
            holeLoops={dashboard.holeLoops}
            mousePos={dashboard.mousePos}
            outerLoop={dashboard.outerLoop}
          />
        </div>
      </div>
    </div>
  );
}
