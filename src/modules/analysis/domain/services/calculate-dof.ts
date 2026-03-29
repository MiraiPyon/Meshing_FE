import type { ElementType } from "../../../meshing/domain/types";
import { getMeshingStrategy } from "../../../meshing/domain/services/strategies/get-meshing-strategy";

export function calculateDegreesOfFreedom(
  elementType: ElementType,
  nodeCount: number,
) {
  return getMeshingStrategy(elementType).calculateDegreesOfFreedom(nodeCount);
}
