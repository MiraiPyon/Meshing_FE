import { Suspense, lazy, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { DashboardFooter } from "../components/dashboard/DashboardFooter";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { DashboardWorkspacePane } from "../components/dashboard/DashboardWorkspacePane";
import { BooleanDialog } from "../components/dashboard/BooleanDialog";
import { Skeleton } from "../components/ui/skeleton";
import {
  clearAuthentication,
  getAuthProfile,
  getRefreshToken,
} from "../../infrastructure/auth/local-storage-auth";
import { apiClient } from "../../services/apiClient";
import { useDashboardWorkspace } from "../../modules/workspace/application/use-dashboard-workspace";

const DashboardPanels = lazy(async () => {
  const module = await import("../components/dashboard/DashboardPanels");
  return { default: module.DashboardPanels };
});

function DashboardPanelsFallback() {
  return (
    <div className="z-20 flex w-80 shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-[#050816] shadow-2xl">
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
  const [booleanOpen, setBooleanOpen] = useState(false);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiClient.logout(refreshToken);
    }
    clearAuthentication();
    navigate("/login", { replace: true });
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-[#020617] font-sans text-zinc-300">
      <div className="flex h-full">
        <DashboardSidebar
          activeTool={dashboard.activeTool}
          onOpenBoolean={() => setBooleanOpen(true)}
          resetGeometry={dashboard.resetGeometry}
          setActiveTool={dashboard.setActiveTool}
          setDraftType={dashboard.setDraftType}
        />

        <BooleanDialog
          open={booleanOpen}
          onClose={() => setBooleanOpen(false)}
          outerLoop={dashboard.outerLoop}
          holeLoops={dashboard.holeLoops}
          onResult={dashboard.applyBooleanResult}
          addLog={dashboard.addLog}
        />

        <div className="flex min-w-0 flex-1 flex-col bg-[#050816]">
          <DashboardHeader
            cancelCurrentSketch={dashboard.cancelCurrentSketch}
            canUndo={dashboard.canUndo}
            closeCurrentShape={dashboard.closeCurrentShape}
            deleteSelectedShape={dashboard.deleteSelectedShape}
            draftReadyToClose={dashboard.draftReadyToClose}
            handleGenerateMesh={dashboard.handleGenerateMesh}
            hasDraft={dashboard.hasDraft}
            hasMesh={dashboard.hasMesh}
            isMeshing={dashboard.isMeshing}
            isSketching={dashboard.isSketching}
            onLogout={handleLogout}
            profile={profile}
            removeLastStep={dashboard.removeLastStep}
            resetGeometry={dashboard.resetGeometry}
            selectedPoint={dashboard.selectedPoint}
          />

          <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
            <DashboardWorkspacePane
              activeTool={dashboard.activeTool}
              draftPointCount={dashboard.draftPointCount}
              draftStrokes={dashboard.draftStrokes}
              draftType={dashboard.draftType}
              geometryReady={dashboard.geometryReady}
              handleMouseDown={dashboard.handleMouseDown}
              handleMouseMove={dashboard.handleMouseMove}
              handleMouseUp={dashboard.handleMouseUp}
              handleWheel={dashboard.handleWheel}
              hasMesh={dashboard.hasMesh}
              holeLoops={dashboard.holeLoops}
              isPanning={dashboard.isPanning}
              isSketching={dashboard.isSketching}
              logs={dashboard.logs}
              meshEdges={dashboard.meshEdges}
              meshNodes={dashboard.meshNodes}
              mousePos={dashboard.mousePos}
              panOffset={dashboard.panOffset}
              outerLoop={dashboard.outerLoop}
              resetZoom={dashboard.resetZoom}
              selectedPoint={dashboard.selectedPoint}
              zoomIn={dashboard.zoomIn}
              zoomLevel={dashboard.zoomLevel}
              zoomOut={dashboard.zoomOut}
            />

            <Suspense fallback={<DashboardPanelsFallback />}>
              <DashboardPanels
                activeTool={dashboard.activeTool}
                circleInput={dashboard.circleInput}
                draftPointCount={dashboard.draftPointCount}
                draftStrokes={dashboard.draftStrokes}
                deleteGeometryRecord={dashboard.deleteGeometryRecord}
                elementType={dashboard.elementType}
                errorData={dashboard.errorData}
                generateMeshFromShapeDat={dashboard.generateMeshFromShapeDat}
                geometryError={dashboard.geometryError}
                geometryRecords={dashboard.geometryRecords}
                isGeometryBusy={dashboard.isGeometryBusy}
                loadGeometryRecord={dashboard.loadGeometryRecord}
                polygonInputText={dashboard.polygonInputText}
                primitiveName={dashboard.primitiveName}
                primitiveType={dashboard.primitiveType}
                rectangleInput={dashboard.rectangleInput}
                refreshGeometryRecords={dashboard.refreshGeometryRecords}
                selectedGeometryId={dashboard.selectedGeometryId}
                deleteProjectSnapshot={dashboard.deleteProjectSnapshot}
                feaInput={dashboard.feaInput}
                feaSummary={dashboard.feaSummary}
                generatedSegments={dashboard.generatedSegments}
                hasMesh={dashboard.hasMesh}
                hasProjectData={dashboard.hasProjectData}
                holeLoops={dashboard.holeLoops}
                isProjectBusy={dashboard.isProjectBusy}
                isRunningFEA={dashboard.isRunningFEA}
                isShapeDatMeshing={dashboard.isShapeDatMeshing}
                loadProjectSnapshot={dashboard.loadProjectSnapshot}
                maxLength={dashboard.maxLength}
                meshStats={dashboard.meshStats}
                outerLoop={dashboard.outerLoop}
                projectName={dashboard.projectName}
                projectNotes={dashboard.projectNotes}
                projectSnapshots={dashboard.projectSnapshots}
                refreshProjectSnapshots={dashboard.refreshProjectSnapshots}
                runQuickFEA={dashboard.runQuickFEA}
                saveProjectSnapshot={dashboard.saveProjectSnapshot}
                rlRatio={dashboard.rlRatio}
                selectedPoint={dashboard.selectedPoint}
                setCircleInput={dashboard.setCircleInput}
                setElementType={dashboard.setElementType}
                setFeaInput={dashboard.setFeaInput}
                setMaxLength={dashboard.setMaxLength}
                setPolygonInputText={dashboard.setPolygonInputText}
                setPrimitiveName={dashboard.setPrimitiveName}
                setPrimitiveType={dashboard.setPrimitiveType}
                setProjectName={dashboard.setProjectName}
                setProjectNotes={dashboard.setProjectNotes}
                setRectangleInput={dashboard.setRectangleInput}
                setRlRatio={dashboard.setRlRatio}
                setShapeDatText={dashboard.setShapeDatText}
                setThetaMin={dashboard.setThetaMin}
                shapeDatText={dashboard.shapeDatText}
                submitPrimitiveForm={dashboard.submitPrimitiveForm}
                thetaMin={dashboard.thetaMin}
                zoomLevel={dashboard.zoomLevel}
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
