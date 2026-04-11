import { ensureOrientation } from "../../domain/services/ensure-orientation";
import type { Loop, PSLG } from "../../domain/types";

type BuildPSLGInput = {
  holeLoops: Loop[];
  outerLoop: Loop;
};

export function buildPSLG({ holeLoops, outerLoop }: BuildPSLGInput): PSLG {
  const normalizedOuterLoop = ensureOrientation(outerLoop, false);
  const normalizedHoleLoops = holeLoops.map((loop) =>
    ensureOrientation(loop, true),
  );

  const totalSegments =
    normalizedOuterLoop.length +
    normalizedHoleLoops.reduce((total, loop) => total + loop.length, 0);

  return {
    holeLoops: normalizedHoleLoops,
    outerLoop: normalizedOuterLoop,
    totalSegments,
  };
}
