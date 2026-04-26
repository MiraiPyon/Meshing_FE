import { buildPSLG } from "../../../geometry/application/use-cases/build-pslg";
import { validateGeometry } from "../../../geometry/application/use-cases/validate-geometry";
import type { Loop } from "../../../geometry/domain/types";
import { previewRefinement } from "../../domain/services/preview-refinement";
import type { ElementType } from "../../domain/types";

type GenerateMeshInput = {
  elementType: ElementType;
  holeLoops: Loop[];
  maxLength: number;
  minAngle: number;
  outerLoop: Loop;
};

export function generateMesh(input: GenerateMeshInput) {
  const pslg = buildPSLG(input);
  const validation = validateGeometry(pslg);

  if (!validation.valid) {
    throw new Error(validation.message);
  }

  return previewRefinement({
    elementType: input.elementType,
    maxLength: input.maxLength,
    minAngle: input.minAngle,
    pslg,
  });
}
