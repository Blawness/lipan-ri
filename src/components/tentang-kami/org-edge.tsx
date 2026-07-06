"use client";

import { BaseEdge, type EdgeProps } from "@xyflow/react";

// Orthogonal org-chart edge. Siblings that share a `busY` produce one clean
// horizontal bus (down → across at busY → down into each child). `toTargetY`
// routes straight into a side handle (used for the Penasehat branch).
export function OrgEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  style,
}: EdgeProps) {
  const busY = typeof data?.busY === "number" ? (data.busY as number) : undefined;
  const toTargetY = data?.toTargetY === true;

  let path: string;
  if (toTargetY) {
    path = `M ${sourceX},${sourceY} L ${sourceX},${targetY} L ${targetX},${targetY}`;
  } else {
    const y = busY ?? (sourceY + targetY) / 2;
    path = `M ${sourceX},${sourceY} L ${sourceX},${y} L ${targetX},${y} L ${targetX},${targetY}`;
  }
  return <BaseEdge path={path} style={style} />;
}
