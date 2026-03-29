import type { PSLG } from "../../domain/types";

export type GeometryValidationResult = {
  message?: string;
  valid: boolean;
};

export function validateGeometry({
  holeLoops,
  outerLoop,
}: PSLG): GeometryValidationResult {
  if (outerLoop.length < 3) {
    return {
      message: "Create and close an outer boundary before generating mesh.",
      valid: false,
    };
  }

  const invalidHole = holeLoops.findIndex((loop) => loop.length < 3);
  if (invalidHole !== -1) {
    return {
      message: `Hole ${invalidHole + 1} needs at least 3 points.`,
      valid: false,
    };
  }

  return { valid: true };
}
