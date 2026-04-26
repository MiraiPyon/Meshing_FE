import type { MeshPreview } from "../../../meshing/domain/types";
import type { MeshStats } from "../types";
import { calculateDegreesOfFreedom } from "./calculate-dof";

export function buildMeshSummary(preview: MeshPreview): MeshStats {
  const qualityCounts = {
    bad: 0,
    excellent: 0,
    fair: 0,
    good: 0,
  };

  preview.elements.forEach((element) => {
    qualityCounts[element.status] += 1;
  });

  const totalElements = preview.elements.length;
  const boundaryEdges = preview.edgeRecords.filter((edge) => edge.boundary).length;
  const ratioValues = preview.elements.map(
    (element) => element.circumradiusToShortestEdge,
  );
  const angleValues = preview.elements.map((element) => element.minAngle);
  const areaValues = preview.elements.map((element) => element.area);

  return {
    averageArea: areaValues.length
      ? areaValues.reduce((total, value) => total + value, 0) / areaValues.length
      : 0,
    badElements: qualityCounts.bad,
    boundaryEdges,
    dof: calculateDegreesOfFreedom(preview.elementType, preview.nodes.length),
    edges: preview.edgeRecords.length,
    elements: totalElements,
    emptyCircumcircleValid: preview.nodes.length > 0,
    executionTime: preview.executionTime,
    interiorEdges: Math.max(0, preview.edgeRecords.length - boundaryEdges),
    maxRatio: ratioValues.length ? Math.max(...ratioValues) : 0,
    minAngle: angleValues.length ? Math.min(...angleValues) : 0,
    nodes: preview.nodes.length,
    quads: preview.quads,
    qualityDistribution: [
      { count: qualityCounts.excellent, name: "Excellent", value: totalElements ? Math.round((qualityCounts.excellent / totalElements) * 100) : 0 },
      { count: qualityCounts.good, name: "Good", value: totalElements ? Math.round((qualityCounts.good / totalElements) * 100) : 0 },
      { count: qualityCounts.fair, name: "Fair", value: totalElements ? Math.round((qualityCounts.fair / totalElements) * 100) : 0 },
      { count: qualityCounts.bad, name: "Bad", value: totalElements ? Math.round((qualityCounts.bad / totalElements) * 100) : 0 },
    ],
    tris: preview.tris,
  };
}
