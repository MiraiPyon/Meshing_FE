export const computePreviewSpacing = (maxLength: number) =>
  Math.max(20, Math.round(maxLength * 520));

export const estimateTriangleCount = (nodeCount: number) =>
  Math.max(0, Math.round(nodeCount * 1.6));

export const estimateExecutionTime = (nodeCount: number) =>
  Math.max(12, Math.round(nodeCount * 0.3));
