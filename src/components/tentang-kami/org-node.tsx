"use client";

import { createContext, useContext } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NODE_W, NODE_H, type OrgNodeData } from "./org-flow";

// Hover-highlight path (set of ancestor ids), read by each node so the `nodes`
// array passed to React Flow never has to change on hover — see org-flow.ts.
export const OrgPathContext = createContext<Set<string>>(new Set());

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

export function OrgNode({ id, data }: NodeProps<Node<OrgNodeData>>) {
  const { member } = data;
  const highlighted = useContext(OrgPathContext).has(id);
  return (
    <div style={{ width: NODE_W, height: NODE_H }}>
      <Handle id="tt" type="target" position={Position.Top} style={hiddenHandle} />
      <Handle id="tr" type="target" position={Position.Right} style={hiddenHandle} />
      <Handle id="sb" type="source" position={Position.Bottom} style={hiddenHandle} />
      {/* org-card class drives the scroll-reveal animation */}
      <div
        data-highlighted={highlighted ? "" : undefined}
        className="org-card flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-3 text-center shadow-sm ring-1 ring-navy-100/70 transition data-[highlighted]:shadow-lg data-[highlighted]:ring-2 data-[highlighted]:ring-[hsl(var(--gold))]"
      >
        <p className="text-[11px] font-bold uppercase leading-[1.15] tracking-wide text-navy-800">
          {member.role}
        </p>
        <p className="mt-0.5 text-[10px] leading-[1.15] text-navy-500">
          {member.nama}
        </p>
      </div>
    </div>
  );
}
