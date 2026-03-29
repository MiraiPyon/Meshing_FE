import type { SelectedPoint } from "../types";

export function getPointLabel(selection: SelectedPoint) {
  if (!selection) {
    return "No point selected";
  }

  if (selection.type === "outer") {
    return `Outer boundary point ${selection.index + 1}`;
  }

  return `Hole ${selection.holeIndex + 1}, point ${selection.index + 1}`;
}
