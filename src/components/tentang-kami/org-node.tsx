"use client";

import { createContext, useContext } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { NODE_W, NODE_H, type OrgNodeData } from "./org-flow";

// Hover/selection path (set of ancestor ids), read by each node so the `nodes`
// array passed to React Flow never has to change on hover — see org-flow.ts.
export const OrgPathContext = createContext<Set<string>>(new Set());

// The currently clicked node, and the setter. Both live in context for the same
// reason as the path: node data must stay referentially stable.
export const OrgSelectedContext = createContext<string | null>(null);
export const OrgSelectContext = createContext<(id: string) => void>(() => {});

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
  const selected = useContext(OrgSelectedContext) === id;
  const select = useContext(OrgSelectContext);
  const kosong = member.kosong === true;
  return (
    <div style={{ width: NODE_W, height: NODE_H }}>
      <Handle id="tt" type="target" position={Position.Top} style={hiddenHandle} />
      <Handle id="tr" type="target" position={Position.Right} style={hiddenHandle} />
      <Handle id="sb" type="source" position={Position.Bottom} style={hiddenHandle} />
      {/* org-card class drives the scroll-reveal animation */}
      {kosong ? (
        <div className="org-card flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/70 px-3 text-center shadow-sm ring-1 ring-navy-100/70">
          <p className="text-[11px] font-bold uppercase leading-[1.15] tracking-wide text-navy-400">
            {member.role}
          </p>
          <p className="mt-0.5 text-[10px] leading-[1.15] text-navy-300">
            {member.nama}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => select(id)}
          aria-pressed={selected}
          aria-label={`${member.role} — ${member.nama}`}
          data-highlighted={highlighted ? "" : undefined}
          data-selected={selected ? "" : undefined}
          // Ring state is resolved here rather than with data-[…] variants: selected
          // and highlighted would otherwise emit two same-specificity ring rules and
          // the winner would depend on Tailwind's class ordering.
          className={[
            "org-card flex h-full w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-white px-3 text-center transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-500",
            selected
              ? "shadow-xl ring-4 ring-[hsl(var(--gold))]"
              : highlighted
                ? "shadow-lg ring-2 ring-[hsl(var(--gold))]"
                : "shadow-sm ring-1 ring-navy-100/70",
          ].join(" ")}
        >
          <p className="text-[11px] font-bold uppercase leading-[1.15] tracking-wide text-navy-800">
            {member.role}
          </p>
          <p className="mt-0.5 text-[10px] leading-[1.15] text-navy-500">
            {member.nama}
          </p>
        </button>
      )}
    </div>
  );
}
