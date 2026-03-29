import type { ElementType } from "../../types";

export type MeshingStrategy = {
  calculateDegreesOfFreedom: (nodeCount: number) => number;
  elementType: ElementType;
};
