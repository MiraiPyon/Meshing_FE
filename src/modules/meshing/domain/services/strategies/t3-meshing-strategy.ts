import type { MeshingStrategy } from "./meshing-strategy";

export const t3MeshingStrategy: MeshingStrategy = {
  calculateDegreesOfFreedom: (nodeCount) => nodeCount * 2,
  elementType: "T3",
};
