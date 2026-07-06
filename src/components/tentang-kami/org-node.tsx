"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { OrgCard } from "./org-card";
import { NODE_W, type OrgNodeData } from "./org-flow";

// Handles carry the edge endpoints but must be invisible on a static chart.
const hiddenHandle = {
  opacity: 0,
  width: 6,
  height: 6,
  minWidth: 0,
  minHeight: 0,
  border: "none",
  background: "transparent",
  pointerEvents: "none",
} as const;

export function OrgNode({ data }: NodeProps<Node<OrgNodeData>>) {
  return (
    <div className="flex justify-center" style={{ width: NODE_W }}>
      <Handle id="tt" type="target" position={Position.Top} style={hiddenHandle} />
      <Handle id="tr" type="target" position={Position.Right} style={hiddenHandle} />
      <Handle id="sr" type="source" position={Position.Right} style={hiddenHandle} />
      <Handle id="sb" type="source" position={Position.Bottom} style={hiddenHandle} />
      <OrgCard member={data.member} highlighted={data.highlighted} />
    </div>
  );
}
