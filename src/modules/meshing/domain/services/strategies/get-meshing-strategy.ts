import type { ElementType } from "../../types";
import type { MeshingStrategy } from "./meshing-strategy";
import { q4MeshingStrategy } from "./q4-meshing-strategy";
import { t3MeshingStrategy } from "./t3-meshing-strategy";

const STRATEGIES: Record<ElementType, MeshingStrategy> = {
  Q4: q4MeshingStrategy,
  T3: t3MeshingStrategy,
};

export function getMeshingStrategy(elementType: ElementType) {
  return STRATEGIES[elementType];
}
