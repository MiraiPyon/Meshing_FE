import type { MeshingStrategy } from "./meshing-strategy";

export const q4MeshingStrategy: MeshingStrategy = {
  calculateDegreesOfFreedom: (nodeCount) => nodeCount * 4,
  elementType: "Q4",
};
