export type Point = { x: number; y: number };

export type Loop = Point[];

export type Edge = [Point, Point];

export type PSLG = {
  holeLoops: Loop[];
  outerLoop: Loop;
  totalSegments: number;
};
